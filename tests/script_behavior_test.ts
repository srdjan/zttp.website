// Behavioral tests for the scroll spy in static/script.js. Like the playground
// harness, this evaluates the shipped source against the parsed homepage with
// in-memory doubles for the globals it touches. The IntersectionObserver double
// records its options and lets a test report which sections are in the band.
import { DOMParser, type Element } from "@b-fuze/deno-dom";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const PAGE = await Deno.readTextFile(
  new URL("../static/index.html", import.meta.url),
);
const SOURCE = await Deno.readTextFile(
  new URL("../static/script.js", import.meta.url),
);
const evaluateScript = new Function(
  "env",
  `const {\ndocument, IntersectionObserver, navigator, setTimeout, globalThis\n} = env;\n${SOURCE}`,
) as unknown as (env: Record<string, unknown>) => void;

type Entry = { target: Element; isIntersecting: boolean };
type Observer = {
  options: { threshold?: number | number[]; rootMargin?: string };
  report: (entries: Entry[]) => void;
};

function boot() {
  const document = new DOMParser().parseFromString(PAGE, "text/html");
  const observers: Observer[] = [];
  class FakeIntersectionObserver {
    constructor(
      callback: (entries: Entry[]) => void,
      options: Observer["options"],
    ) {
      observers.push({ options, report: callback });
    }
    observe() {}
  }
  evaluateScript({
    document,
    IntersectionObserver: FakeIntersectionObserver,
    navigator: {},
    setTimeout,
    globalThis: { IntersectionObserver: FakeIntersectionObserver },
  });
  assert(observers.length === 1, "the spy must create one observer");
  const section = (id: string) => {
    const node = document.getElementById(id);
    assert(node, `the page must carry #${id}`);
    return node;
  };
  const active = () =>
    document.querySelector(".z-nav-links a.active")?.getAttribute("href") ??
      null;
  return { spy: observers[0], section, active };
}

Deno.test("the spy fires on any overlap, so tall sections still count", () => {
  const { spy } = boot();
  const threshold = spy.options.threshold ?? 0;
  assert(
    threshold === 0,
    `a ratio threshold misses sections taller than the band; got ${threshold}`,
  );
});

Deno.test("a section in the band marks its nav link", () => {
  const { spy, section, active } = boot();
  spy.report([{ target: section("playground"), isIntersecting: true }]);
  assert(active() === "#playground", `expected #playground, got ${active()}`);
});

Deno.test("the link clears when its section leaves the band", () => {
  const { spy, section, active } = boot();
  spy.report([{ target: section("playground"), isIntersecting: true }]);
  spy.report([{ target: section("playground"), isIntersecting: false }]);
  assert(active() === null, `expected no active link, got ${active()}`);
});

Deno.test("with two sections in the band, the earlier one wins", () => {
  const { spy, section, active } = boot();
  spy.report([{ target: section("install"), isIntersecting: true }]);
  spy.report([{ target: section("playground"), isIntersecting: true }]);
  assert(active() === "#playground", `expected #playground, got ${active()}`);
  spy.report([{ target: section("playground"), isIntersecting: false }]);
  assert(active() === "#install", `expected #install, got ${active()}`);
});
