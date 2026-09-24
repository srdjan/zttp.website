// Behavioral tests for static/playground.js. The file ships to the browser as
// one IIFE with no exports, so the harness below evaluates its source against a
// parsed homepage and a set of in-memory doubles for the globals it touches:
// document, fetch, WebAssembly, IntersectionObserver, matchMedia, performance,
// navigator, setTimeout and clearTimeout. Every double is a seam the real
// browser owns; keeping them here makes that coupling visible.
import { DOMParser, type Element } from "@b-fuze/deno-dom";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

// What the stubbed analyzer hands back: a JSON envelope, or null for "the
// analyzer produced no result". A stub that throws models a failing call.
type Analyzer = (source: string) => string | null;

type Editor = Element & {
  value: string;
  readOnly: boolean;
  selectionStart: number;
  selectionEnd: number;
};

type Options = {
  analyzer?: Analyzer;
  clipboard?: "missing" | "reject";
  reduceMotion?: boolean;
  wasmLoads?: boolean;
};

const PAGE = await Deno.readTextFile(
  new URL("../static/index.html", import.meta.url),
);
const SOURCE = await Deno.readTextFile(
  new URL("../static/playground.js", import.meta.url),
);
const evaluatePlayground = new Function(
  "env",
  `const {\ndocument, fetch, WebAssembly, IntersectionObserver,\nperformance, navigator, setTimeout, clearTimeout, globalThis\n} = env;\n${SOURCE}`,
) as unknown as (env: Record<string, unknown>) => void;

const PROOF_SEED_SPECS = [
  "deterministic",
  "no_secret_leakage",
  "injection_safe",
];

const PROVEN_ENVELOPE = JSON.stringify({
  success: true,
  proof: {
    declared_specs: PROOF_SEED_SPECS,
    spec_diagnostics: [],
    properties: {
      deterministic: true,
      read_only: true,
      state_isolated: true,
      injection_safe: true,
    },
  },
  diagnostics: [],
});

const DATE_NOW_ENVELOPE = JSON.stringify({
  success: false,
  proof: {
    declared_specs: PROOF_SEED_SPECS,
    spec_diagnostics: [{ spec_name: "deterministic" }],
    properties: {
      deterministic: false,
      read_only: true,
      state_isolated: true,
      injection_safe: true,
    },
    proofTrace: {
      deterministic: {
        holds: false,
        summary: "Date.now() makes the handler nondeterministic.",
        counterexample: {
          kind: "offending-node",
          location: { line: 8 },
          snippet: "Date.now()",
          fix: "Take the timestamp from the request.",
        },
      },
    },
  },
  diagnostics: [{
    code: "ZTS500",
    severity: "error",
    message:
      "declared Proof capsule was not discharged by handler proof (failing spec: deterministic)",
    line: 7,
    suggestion: "remove Date.now() or take the timestamp from the request.",
  }],
});

const STRICT_GUIDANCE =
  "this handler returns no Proof<T, P> capsule, so the compiler must prove the full default profile, but it does not hold: fault_covered.";
const STRICT_DEFAULT_ENVELOPE = JSON.stringify({
  success: false,
  proof: {
    declared_specs: ["deterministic", "fault_covered"],
    spec_diagnostics: [{ spec_name: "fault_covered" }],
    properties: {
      deterministic: true,
      read_only: true,
      state_isolated: true,
      injection_safe: true,
      retry_safe: true,
      idempotent: true,
      fault_covered: false,
    },
  },
  diagnostics: [{
    code: "ZTS500",
    severity: "error",
    message:
      "handler returns no Proof<T, P> capsule; the default proof profile demands a property this handler does not hold",
    line: 3,
    suggestion: STRICT_GUIDANCE,
  }],
});

const sourceAwareAnalyzer: Analyzer = (source) => {
  if (source.includes("Date.now()")) return DATE_NOW_ENVELOPE;
  if (!source.includes("structural Guardrails")) {
    return STRICT_DEFAULT_ENVELOPE;
  }
  return PROVEN_ENVELOPE;
};

// The analyzer's pointer protocol, backed by a plain ArrayBuffer: alloc hands
// out a fixed slot, analyze writes a length-prefixed JSON envelope at
// RESULT_PTR, and a zero return means "no result", exactly as the wasm does.
function analyzerExports(analyzer: Analyzer) {
  const memory = { buffer: new ArrayBuffer(65536) };
  const RESULT_PTR = 4096;
  return {
    memory,
    alloc: () => 16n,
    free: () => {},
    analyze: (ptr: bigint, length: bigint) => {
      const source = new TextDecoder().decode(
        new Uint8Array(memory.buffer, Number(ptr), Number(length)),
      );
      const json = analyzer(source);
      if (json === null) return 0n;
      const bytes = new TextEncoder().encode(json);
      new DataView(memory.buffer).setUint32(RESULT_PTR, bytes.length, true);
      new Uint8Array(memory.buffer).set(bytes, RESULT_PTR + 4);
      return BigInt(RESULT_PTR);
    },
  };
}

// deno-dom parses markup but implements no form-control behavior, so the four
// textarea properties the editor drives are installed here.
function asEditor(node: Element | null): Editor {
  assert(node, "the page must carry the playground editor");
  let value = node.textContent ?? "";
  Object.defineProperties(node, {
    value: { get: () => value, set: (next: string) => value = next },
    readOnly: { get: () => node.hasAttribute("readonly") },
    selectionStart: { value: 0, writable: true },
    selectionEnd: { value: 0, writable: true },
  });
  return node as Editor;
}

function load(options: Options = {}) {
  const analyzer = options.analyzer ?? (() => PROVEN_ENVELOPE);
  const doc = new DOMParser().parseFromString(PAGE, "text/html");
  assert(doc, "the homepage must parse");
  const editor = asEditor(doc.getElementById("zp-src"));
  let intersect:
    | ((entries: Array<{ isIntersecting: boolean }>) => void)
    | null = null;
  let scheduledCount = 0;
  const promptCalls: Array<{ label: string; value: string }> = [];

  class TestObserver {
    constructor(
      callback: (entries: Array<{ isIntersecting: boolean }>) => void,
    ) {
      intersect = callback;
    }
    observe() {}
    disconnect() {}
  }

  const clipboard = options.clipboard === "reject"
    ? { writeText: () => Promise.reject(new Error("clipboard denied")) }
    : undefined;

  evaluatePlayground({
    document: doc,
    fetch: () =>
      options.wasmLoads === false
        ? Promise.reject(new Error("offline"))
        : Promise.resolve({
          ok: true,
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
        }),
    WebAssembly: {
      compile: () => Promise.resolve({}),
      Module: { imports: () => [] },
      instantiate: () =>
        Promise.resolve({ exports: analyzerExports(analyzer) }),
    },
    IntersectionObserver: TestObserver,
    performance: { now: () => 0 },
    navigator: clipboard ? { clipboard } : {},
    // Scheduled demo beats are recorded and never run, so every assertion below
    // reads a settled card instead of racing an animation.
    setTimeout: () => ++scheduledCount,
    clearTimeout: () => {},
    globalThis: {
      IntersectionObserver: TestObserver,
      matchMedia: () => ({ matches: options.reduceMotion === true }),
      prompt: (label: string, value: string) => {
        promptCalls.push({ label, value });
      },
    },
  });

  const text = (selector: string): string =>
    doc.querySelector(selector)?.textContent ?? "";
  const hidden = (selector: string): boolean =>
    (doc.querySelector(selector) as (Element & { hidden?: boolean }) | null)
      ?.hidden === true;

  return {
    doc,
    editor,
    text,
    hidden,
    click: (selector: string) => {
      const element = doc.querySelector(selector);
      assert(element, `the page must carry ${selector}`);
      element.dispatchEvent(
        new Event("click", { bubbles: true, cancelable: true }),
      );
    },
    input: (value: string) => {
      editor.value = value;
      editor.dispatchEvent(new Event("input", { cancelable: true }));
    },
    promptCalls,
    scheduledCount: () => scheduledCount,
    state: () => doc.getElementById("playground")?.getAttribute("data-state"),
    keydown: (key: string, shiftKey: boolean) => {
      const event = Object.assign(new Event("keydown", { cancelable: true }), {
        key,
        shiftKey,
      });
      editor.dispatchEvent(event);
      return event;
    },
    boot: async () => {
      assert(intersect, "the playground must observe its section to lazy boot");
      intersect([{ isIntersecting: true }]);
      await new Promise((resolve) => setTimeout(resolve, 0));
    },
  };
}

Deno.test("a successful analysis renders a proven card", async () => {
  const page = load();
  await page.boot();

  assert(
    page.state() === "live",
    "a loaded analyzer must reach the live state",
  );
  assert(
    page.text(".zp-verdict") === "PROVEN",
    "a successful envelope must render PROVEN",
  );
  assert(
    page.text(".zp-status").includes("proved in"),
    "a successful analysis must report how long the proof took",
  );
  assert(
    page.doc.querySelectorAll(".zp-chip.on").length === 4,
    "the proven chip count must match the properties in the envelope",
  );
  assert(
    page.text(".zp-count") === "3/3 declared specs proven",
    "the verdict scope must name the declared specs it proves",
  );
  assert(
    page.text(".zp-scope") === "4/7 analyzed properties hold",
    "the wider property result must stay separate from the verdict scope",
  );
});

Deno.test("boot leaves the proven source still until a sample is requested", async () => {
  const page = load();
  const initialSource = page.editor.value;

  await page.boot();

  assert(
    page.editor.value === initialSource,
    "loading the analyzer must not rewrite the editor",
  );
  assert(
    page.text(".zp-demo-state") === "proof engine ready",
    "the loaded playground must wait in a ready state",
  );
  assert(
    page.scheduledCount() === 0,
    "boot must not schedule an unsolicited sample replay",
  );
});

Deno.test("the sample replay returns to the Proof seed before it starts", async () => {
  const page = load({ analyzer: sourceAwareAnalyzer });
  await page.boot();

  page.click('[data-seed="default"]');
  assert(
    !page.editor.value.includes("structural Guardrails"),
    "the strict-default tab must show its own seed",
  );

  page.click(".zp-demo-replay");

  assert(
    page.editor.value.includes("structural Guardrails"),
    "the sample replay must return to the declared Proof seed",
  );
  assert(
    page.doc.querySelector('[data-seed="proof"]')?.getAttribute(
      "aria-selected",
    ) === "true",
    "the Proof tab must match the replayed source",
  );
  assert(
    page.scheduledCount() === 4,
    "an explicit sample request must schedule the proof and repair sequence",
  );
});

Deno.test("reduced motion keeps the explicit sample replay available", async () => {
  const page = load({ reduceMotion: true });
  await page.boot();

  page.click(".zp-demo-replay");

  assert(
    page.scheduledCount() === 4,
    "reduced motion must not disable a replay the visitor requested",
  );
  assert(
    page.text(".zp-demo-state") ===
      "replaying sample flip without animation",
    "the replay must report its reduced-motion state",
  );
});

Deno.test("a perturbation can be reset to its proven seed", async () => {
  const page = load({ analyzer: sourceAwareAnalyzer });
  await page.boot();
  const seed = page.editor.value;

  page.input(seed + "// visitor edit\n");
  assert(!page.hidden(".zp-reset"), "a direct edit must reveal Reset");
  page.click(".zp-reset");
  assert(
    page.editor.value === seed,
    "Reset must undo a direct editor change",
  );

  page.click('[data-perturb="datenow"]');

  assert(
    page.editor.value.includes("stamp: stamp"),
    "the Date.now sample must use syntax accepted by zts",
  );
  assert(
    !page.editor.value.includes("ok: true, stamp }"),
    "the Date.now sample must not use object shorthand",
  );
  assert(
    page.text(".zp-verdict") === "BLOCKED",
    "the perturbed sample must show the analyzer's blocked verdict",
  );
  assert(!page.hidden(".zp-reset"), "a changed source must reveal Reset");
  assert(
    page.text(".zp-repair") === "Replay this example's known repair",
    "the repair action must identify itself as a replay before activation",
  );

  page.click(".zp-reset");

  assert(
    !page.editor.value.includes("Date.now()"),
    "Reset must restore the selected seed source",
  );
  assert(
    page.text(".zp-verdict") === "PROVEN",
    "Reset must restore the seed verdict",
  );
  assert(page.hidden(".zp-reset"), "Reset must hide after source restoration");
  assert(
    page.doc.querySelector('[data-perturb="datenow"]')?.getAttribute(
      "aria-pressed",
    ) === "false",
    "Reset must clear the active perturbation",
  );
});

Deno.test("strict-default guidance is concise and keeps analyzer text", async () => {
  const page = load({ analyzer: sourceAwareAnalyzer });
  await page.boot();

  page.click('[data-seed="default"]');

  assert(
    page.editor.value.includes("strict default") &&
      page.editor.value.includes("starts blocked"),
    "the strict-default source must explain its initial state",
  );
  assert(
    page.text(".zp-why-msg") ===
      "Strict default could not prove every required guarantee.",
    "the visible strict-default diagnostic must be concise",
  );
  assert(
    page.text(".zp-guidance").includes(STRICT_GUIDANCE),
    "the disclosure must preserve the analyzer's exact suggestion",
  );
  assert(
    page.text(".zp-count") === "strict default: full proof profile required",
    "the blocked verdict must name the strict default scope",
  );
});

Deno.test("certificate copy falls back when Clipboard access fails", async () => {
  for (const clipboard of ["missing", "reject"] as const) {
    const page = load({ clipboard });
    await page.boot();
    page.click('[data-lens="handover"]');

    page.click(".zp-copy");
    await Promise.resolve();
    await Promise.resolve();

    assert(
      page.promptCalls.length === 1,
      `${clipboard} Clipboard access must open the manual copy fallback`,
    );
    assert(
      page.promptCalls[0].label === "Copy proof certificate",
      "the fallback must identify the copied certificate",
    );
    assert(
      page.promptCalls[0].value.includes("zttp proof certificate"),
      "the fallback must provide the rendered certificate",
    );
    assert(
      page.text(".zp-copy") === "Copy manually",
      "the copy control must report the fallback state",
    );
  }
});

Deno.test("a null analyzer result cannot leave a proven verdict", async () => {
  const page = load({ analyzer: () => null });
  await page.boot();

  assert(
    page.text(".zp-verdict") === "UNAVAILABLE",
    "an analyzer that returns nothing must drive the card to UNAVAILABLE",
  );
  assert(page.state() === "unavailable", "the section must fail closed");
});

Deno.test("a blocked result without proof data reports no property count", async () => {
  const page = load({
    analyzer: () =>
      JSON.stringify({
        success: false,
        proof: null,
        diagnostics: [{
          code: "ZTS001",
          severity: "error",
          message: "source could not be analyzed",
        }],
      }),
  });
  await page.boot();

  assert(
    page.text(".zp-scope") === "properties were not evaluated",
    "a pre-property failure must not report a zero property score",
  );
});

Deno.test("a throwing analyzer call cannot leave a proven verdict", async () => {
  const page = load({
    analyzer: () => {
      throw new Error("analyzer trapped");
    },
  });
  await page.boot();

  assert(
    page.text(".zp-verdict") === "UNAVAILABLE",
    "a throwing analyzer must drive the card to UNAVAILABLE",
  );
});

Deno.test("malformed analyzer output cannot leave a proven verdict", async () => {
  const page = load({ analyzer: () => "{not json" });
  await page.boot();

  assert(
    page.text(".zp-verdict") === "UNAVAILABLE",
    "unparseable analyzer output must drive the card to UNAVAILABLE",
  );
});

Deno.test("a load failure clears the pre-rendered verdict", async () => {
  const page = load({ wasmLoads: false });
  await page.boot();

  assert(
    page.text(".zp-verdict") === "UNAVAILABLE",
    "a failed load must replace the pre-rendered proven verdict",
  );
  assert(!page.hidden(".zp-retry"), "the retry control must become visible");
  assert(
    page.hidden(".zp-lensbar") && page.hidden(".zp-lens"),
    "stale proof details must be hidden while no proof has run",
  );
});

Deno.test("Tab moves focus onward before the analyzer boots", () => {
  const page = load();
  const before = page.editor.value;

  assert(page.editor.readOnly, "the pre-boot editor must ship read-only");
  const event = page.keydown("Tab", false);

  assert(
    !event.defaultPrevented,
    "Tab must reach the browser so focus can leave the editor",
  );
  assert(
    page.editor.value === before,
    "a read-only editor must not be written through",
  );
  assert(
    page.text(".zp-demo-state") !== "manual control",
    "a keystroke the page ignores must not count as taking manual control",
  );
});

Deno.test("Tab moves focus onward once the playground is live", async () => {
  const page = load();
  await page.boot();
  const before = page.editor.value;

  for (const shift of [false, true]) {
    const event = page.keydown("Tab", shift);
    assert(
      !event.defaultPrevented,
      `Tab${shift ? " with Shift" : ""} must always leave the editor`,
    );
  }

  assert(
    page.editor.value === before,
    "Tab must not write to the editor in any direction",
  );
});
