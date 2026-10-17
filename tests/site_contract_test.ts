import { handleRequest } from "../main.ts";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function source(path: string): Promise<string> {
  return await Deno.readTextFile(new URL(`../${path}`, import.meta.url));
}

Deno.test("unknown routes return a dedicated recovery page", async () => {
  const response = await handleRequest(
    new Request("https://zigttp.timok.com/outside-the-fence"),
  );
  const body = await response.text();

  assert(response.status === 404, "unknown routes must retain status 404");
  assert(
    response.headers.get("content-type") === "text/html; charset=utf-8",
    "the recovery page must be served as HTML",
  );
  assert(
    body.includes("That path is outside the fence"),
    "the 404 response must explain what happened",
  );
  assert(body.includes('href="/"'), "the 404 response must link home");
});

Deno.test("canonical routes retain redirect, cache, and security contracts", async () => {
  for (const removed of ["/deck", "/deck.html"]) {
    const redirect = await handleRequest(
      new Request(`https://zigttp.timok.com${removed}`),
    );
    assert(
      responseIsRedirectTo(redirect, "/"),
      `${removed} must redirect home now that the deck is gone`,
    );
  }

  const home = await handleRequest(new Request("https://zigttp.timok.com/"));
  assert(home.status === 200, "the homepage must remain available");
  assert(
    home.headers.get("cache-control") === "no-cache",
    "HTML must retain the no-cache policy",
  );
  assert(
    home.headers.get("content-security-policy")?.includes(
      "frame-ancestors 'none'",
    ),
    "the homepage must retain its anti-framing policy",
  );

  const csp = home.headers.get("content-security-policy") ?? "";
  assert(
    !csp.includes("'unsafe-inline'"),
    "the policy must not grant inline script execution",
  );
  assert(
    !csp.includes("jsdelivr"),
    "the policy must not grant a CDN the site does not load from",
  );
  assert(
    !csp.includes("'wasm-unsafe-eval'"),
    "the site loads no WebAssembly",
  );
  assert(
    !csp.includes("media-src"),
    "the policy must not grant media the site does not serve",
  );
});

Deno.test("html revalidates with a 304 instead of resending the body", async () => {
  const first = await handleRequest(new Request("https://zigttp.timok.com/"));
  const etag = first.headers.get("etag");
  await first.text();

  assert(
    etag !== null && etag.startsWith('"'),
    "html must carry a quoted etag",
  );

  const second = await handleRequest(
    new Request("https://zigttp.timok.com/", {
      headers: { "if-none-match": etag },
    }),
  );

  assert(second.status === 304, "a matching validator must produce a 304");
  assert(second.body === null, "a 304 must not carry a body");
  assert(
    second.headers.get("cache-control") === "no-cache",
    "a 304 must repeat the cache policy",
  );
  assert(
    second.headers.get("content-security-policy") !== null,
    "a 304 must still carry the security headers",
  );
  assert(
    second.headers.get("etag") === etag,
    "a 304 must repeat the validator it matched",
  );
});

Deno.test("a stale validator still gets the full body", async () => {
  const response = await handleRequest(
    new Request("https://zigttp.timok.com/", {
      headers: { "if-none-match": '"0000000000000000"' },
    }),
  );
  const body = await response.text();

  assert(response.status === 200, "a mismatched validator must not 304");
  assert(body.length > 0, "a 200 must carry the body");
});

Deno.test("every static image is referenced by a document", async () => {
  const documents = (await Promise.all([
    source("static/index.html"),
    source("static/404.html"),
    source("static/manifest.json"),
  ])).join("\n");

  for await (
    const entry of Deno.readDir(new URL("../static", import.meta.url))
  ) {
    if (!/\.(png|jpe?g|ico)$/.test(entry.name)) continue;
    assert(
      documents.includes(entry.name),
      `static/${entry.name} is not referenced by any document`,
    );
  }
});

function responseIsRedirectTo(response: Response, location: string): boolean {
  return response.status === 301 &&
    response.headers.get("location") === location;
}

Deno.test("homepage is usable before enhancement", async () => {
  const [home, script, css] = await Promise.all([
    source("static/index.html"),
    source("static/script.js"),
    source("static/style.css"),
  ]);

  assert(home.includes('<html class="no-js"'), "homepage needs a no-js root");
  assert(
    !home.includes('classList.replace("no-js", "js")'),
    "the document must not claim enhancement before the controller loads",
  );
  assert(
    script.includes('classList.replace("no-js", "js")'),
    "the shared controller must activate enhanced navigation",
  );
  assert(
    css.includes(".js .z-menu-button"),
    "homepage must expose the mobile menu button only after enhancement",
  );
});

Deno.test("labelled regions use a role that can carry a name", async () => {
  const home = await source("static/index.html");

  assert(
    !/<div\s+class="z-code-card"\s+aria-label=/.test(home),
    "the product shot must be named by its figure, not by a role-less div",
  );
  assert(
    home.includes("<figcaption"),
    "the product shot must carry a figcaption",
  );
  assert(
    home.match(/class="z-install-card"\s+role="group"/g)?.length === 2,
    "both install cards must group their command under one nameable role",
  );
});

Deno.test("every in-page link has a target", async () => {
  const home = await source("static/index.html");
  const ids = new Set(
    [...home.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]),
  );
  const targets = [...home.matchAll(/href="#([^"]+)"/g)].map((match) =>
    match[1]
  );

  assert(targets.length > 0, "the homepage must link to its own sections");
  for (const target of targets) {
    assert(ids.has(target), `href="#${target}" has no element with that id`);
  }
});

Deno.test("the homepage advertises no removed zttp feature", async () => {
  const home = await source("static/index.html");

  for (
    const removed of [
      "zttp:tool",
      "durable-workflows",
      "hypermedia-explainer",
      "playground.js",
      ".wasm",
    ]
  ) {
    assert(!home.includes(removed), `the homepage still mentions ${removed}`);
  }
});
