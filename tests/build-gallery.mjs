// Builds the examples gallery: the same demo bundle render-examples.mjs checks, as a static site with an index page.
// CI publishes it to GitHub Pages (.github/workflows/gallery.yml), so people can see the kit's standard without code.
// Run: node tests/build-gallery.mjs [out-dir]   (default: gallery/)
import { build } from "esbuild";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const out = resolve(process.argv[2] || "gallery");
mkdirSync(out, { recursive: true });
await build({ entryPoints: ["tests/examples/demo.tsx"], bundle: true, minify: true, outfile: join(out, "demo.js"), format: "esm", jsx: "automatic", logLevel: "error", define: { "process.env.NODE_ENV": '"production"' } });
writeFileSync(join(out, "index.html"), '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Fluent kit examples</title><link rel="icon" href="data:,"></head><body><div id="root"></div><script type="module" src="demo.js"></script></body></html>\n');
writeFileSync(join(out, ".nojekyll"), "");
console.log(`gallery: wrote ${out}`);
