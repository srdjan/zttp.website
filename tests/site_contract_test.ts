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
    csp.includes("'wasm-unsafe-eval'"),
    "the playground needs wasm compilation to stay permitted",
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

Deno.test("the playground has one content-addressed WASM artifact", async () => {
  const wasmFiles: string[] = [];
  for await (
    const entry of Deno.readDir(new URL("../static", import.meta.url))
  ) {
    if (entry.name.endsWith(".wasm")) {
      wasmFiles.push(entry.name);
    }
  }
  assert(
    wasmFiles.length === 1,
    "static must contain exactly one analyzer WASM",
  );

  const wasmName = wasmFiles[0];
  assert(
    /^zts-analyzer\.[0-9a-f]{12}\.wasm$/.test(wasmName),
    "the only website WASM must be the content-addressed analyzer",
  );
  const wasm = await Deno.readFile(
    new URL(`../static/${wasmName}`, import.meta.url),
  );
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", wasm));
  const hashPrefix = Array.from(digest)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 12);
  assert(
    wasmName === `zts-analyzer.${hashPrefix}.wasm`,
    "the analyzer filename must match its SHA-256 prefix",
  );

  const wasmResponse = await handleRequest(
    new Request(`https://zigttp.timok.com/${wasmName}`),
  );
  assert(wasmResponse.status === 200, "the selected analyzer must be served");
  assert(
    wasmResponse.headers.get("content-type") === "application/wasm",
    "the selected analyzer must retain its WASM content type",
  );
  assert(
    wasmResponse.headers.get("cache-control") ===
      "public, max-age=31536000, immutable",
    "the content-addressed analyzer must be served with immutable caching",
  );
  const servedWasm = new Uint8Array(await wasmResponse.arrayBuffer());
  assert(
    servedWasm.length === wasm.length &&
      servedWasm.every((byte, index) => byte === wasm[index]),
    "the served analyzer bytes must match the checked-in artifact",
  );

  const module = await WebAssembly.compile(wasm);
  const env: Record<string, () => number> = {};
  for (const entry of WebAssembly.Module.imports(module)) {
    if (entry.module === "env" && entry.kind === "function") {
      env[entry.name] = () => 0;
    }
  }
  const instance = await WebAssembly.instantiate(module, { env });
  const analyzer = instance.exports as unknown as {
    memory: WebAssembly.Memory;
    alloc: (length: bigint) => bigint;
    free: (pointer: bigint, length: bigint) => void;
    analyze: (pointer: bigint, length: bigint, isTsx: number) => bigint;
  };
  assert(
    analyzer.memory instanceof WebAssembly.Memory,
    "analyzer must export memory",
  );
  assert(typeof analyzer.alloc === "function", "analyzer must export alloc");
  assert(typeof analyzer.free === "function", "analyzer must export free");
  assert(
    typeof analyzer.analyze === "function",
    "analyzer must export analyze",
  );

  function analyzeSource(sourceText: string): {
    success: boolean;
    diagnostics?: Array<{ code?: string }>;
  } {
    const sourceBytes = new TextEncoder().encode(sourceText);
    const sourcePointer = analyzer.alloc(BigInt(sourceBytes.length));
    assert(sourcePointer !== 0n, "analyzer must allocate source input");
    new Uint8Array(analyzer.memory.buffer).set(
      sourceBytes,
      Number(sourcePointer),
    );
    const resultPointer = analyzer.analyze(
      sourcePointer,
      BigInt(sourceBytes.length),
      0,
    );
    analyzer.free(sourcePointer, BigInt(sourceBytes.length));
    assert(resultPointer !== 0n, "analyzer must return a result envelope");
    const resultOffset = Number(resultPointer);
    const resultLength = new DataView(analyzer.memory.buffer).getUint32(
      resultOffset,
      true,
    );
    return JSON.parse(
      new TextDecoder().decode(
        new Uint8Array(analyzer.memory.buffer, resultOffset + 4, resultLength),
      ),
    );
  }

  const accepted = analyzeSource(
    `// All guarantees are enforced by default. This Proof<T, P>
// narrows enforcement to these three; break one and the card flips red.
structural Guardrails<T> = Proof<T,
  | "deterministic"
  | "no_secret_leakage"
  | "injection_safe"
>;

function handler(req: Request): Guardrails<Response> {
  return Response.json({ ok: true });
}
`,
  );
  assert(accepted.success === true, "analyzer must prove the accepted fixture");
  const rejected = analyzeSource("class Bad {}\n");
  assert(
    rejected.success === false,
    "analyzer must reject the blocked fixture",
  );
  assert(
    rejected.diagnostics?.some((diagnostic) => diagnostic.code === "ZTS001"),
    "the rejected fixture must report ZTS001",
  );

  const playground = await source("static/playground.js");
  const references = [
    ...playground.matchAll(
      /^const WASM_URL = "(\/zts-analyzer\.[0-9a-f]{12}\.wasm)";$/gm,
    ),
  ];
  assert(references.length === 1, "playground.js must declare one WASM_URL");
  assert(
    references[0][1] === `/${wasmName}`,
    "playground.js must reference a checked-in analyzer WASM",
  );
});

function responseIsRedirectTo(response: Response, location: string): boolean {
  return response.status === 301 &&
    response.headers.get("location") === location;
}

Deno.test("homepage is usable before enhancement", async () => {
  const [home, script, homeCss] = await Promise.all([
    source("static/index.html"),
    source("static/script.js"),
    source("static/home.css"),
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
    homeCss.includes(".js .z-menu-button"),
    "homepage must expose the mobile menu button only after enhancement",
  );
  assert(
    homeCss.includes(".z-playground:not(.zp-js) .zp-tabs"),
    "playground controls must stay hidden until their controller loads",
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
  assert(
    /class="z-calm-strip"\s+role="group"/.test(home),
    "the calm strip must carry a role that permits its name",
  );
});

Deno.test("a failed analysis cannot retain a proven verdict", async () => {
  const playground = await source("static/playground.js");

  assert(
    /function runAnalysis\(\)[\s\S]*?if \(!result\) \{\s*setPlaygroundState\("unavailable"\);/
      .test(playground),
    "a null analyzer result must drive the card to the unavailable state",
  );
  assert(
    /function runAnalysis\(\)[\s\S]*?catch \(err\) \{/.test(playground),
    "a throwing analyzer call must be caught rather than left uncaught",
  );
});

Deno.test("the editor registers no keydown handler at all", async () => {
  const playground = await source("static/playground.js");

  assert(
    !/editor\.addEventListener\(\s*"keydown"/.test(playground),
    "intercepting keys in the editor risks a keyboard trap; leave Tab alone",
  );
});

// The source-order half of this contract now lives in
// tests/playground_behavior_test.ts, which boots the section for real. What
// remains is a stylesheet rule, and there is no mechanism here for computed
// layout, so it stays a source contract.
Deno.test("hidden diagnostics stay out of layout", async () => {
  const homeCss = await source("static/home.css");

  assert(
    /\.zp-why\[hidden\]\s*\{[^}]*display:\s*none;?[^}]*\}/.test(homeCss),
    "hidden diagnostics must remain out of layout after a proven rerender",
  );
});
