// Sets the site version in four places. The version follows zttp.
// Usage: deno task sync-version [X.Y.Z]
// With no argument, the version comes from ../ZTTP/VERSION.

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

const SEMVER = /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/;

type Target = { file: string; label: string; pattern: RegExp };

// Each pattern captures the text before the version and the text after it.
const targets: Target[] = [
  {
    file: "deno.json",
    label: 'deno.json "version"',
    pattern: /("version":\s*")[^"]*(")/g,
  },
  {
    file: "static/index.html",
    label: "nav label",
    pattern: /(<small>v)[^<]*(<\/small>)/g,
  },
  {
    file: "static/index.html",
    label: "download href",
    pattern: /(releases\/tag\/v)[^"]*(")/g,
  },
  {
    file: "static/index.html",
    label: "download text",
    pattern: /(>Download v)[^<]*(<\/a>)/g,
  },
];

// Pure step: rewrite every target in `files`, or report the first failure.
export function applyVersion(
  version: string,
  files: Record<string, string>,
): Result<Record<string, string>> {
  if (!SEMVER.test(version)) {
    return { ok: false, error: `invalid version "${version}": expected X.Y.Z` };
  }
  const next = { ...files };
  for (const target of targets) {
    const text = next[target.file];
    const count = text === undefined
      ? 0
      : [...text.matchAll(target.pattern)].length;
    if (text === undefined || count !== 1) {
      return {
        ok: false,
        error:
          `${target.label} in ${target.file}: found ${count} times, expected 1`,
      };
    }
    next[target.file] = text.replace(target.pattern, `$1${version}$2`);
  }
  return { ok: true, value: next };
}

async function run(args: string[]): Promise<Result<string>> {
  const version = args[0] ??
    (await Deno.readTextFile(new URL("../../ZTTP/VERSION", import.meta.url)))
      .trim();
  const files: Record<string, string> = {};
  for (const name of new Set(targets.map((t) => t.file))) {
    files[name] = await Deno.readTextFile(
      new URL(`../${name}`, import.meta.url),
    );
  }
  const result = applyVersion(version, files);
  if (!result.ok) return result;
  for (const [name, text] of Object.entries(result.value)) {
    await Deno.writeTextFile(new URL(`../${name}`, import.meta.url), text);
  }
  return { ok: true, value: version };
}

if (import.meta.main) {
  try {
    const result = await run(Deno.args);
    if (!result.ok) {
      console.error(`sync-version: ${result.error}`);
      Deno.exit(1);
    }
    console.log(`sync-version: site is now ${result.value}`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`sync-version: ${message}`);
    Deno.exit(1);
  }
}
