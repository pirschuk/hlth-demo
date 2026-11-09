// Сборка прототипа: src/*.js и src/*.css → assets/index-<hash>.{js,css} + обновление index.html.
// Модули из src/modules/ вставляются перед финальным вызовом render() основного файла.
import { build, transform } from "esbuild";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, readdirSync, unlinkSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const read = (p) => readFileSync(join(root, p), "utf8");
const RENDER = 'Op.createRoot(document.getElementById("root")).render(';

const app = read("src/app.js");
const at = app.lastIndexOf(RENDER);
if (at < 0) throw new Error("Не найден вызов render() в src/app.js");
const modules = readdirSync(join(root, "src/modules")).sort();
const js =
  app.slice(0, at) +
  modules.filter((f) => f.endsWith(".js")).map((f) => `\n/* ${f} */\n` + read(`src/modules/${f}`)).join("\n") +
  "\n" +
  app.slice(at);
const css =
  read("src/app.css") +
  modules.filter((f) => f.endsWith(".css")).map((f) => `\n/* ${f} */\n` + read(`src/modules/${f}`)).join("\n");

const outJs = (await transform(js, { loader: "js", minify: true, format: "esm", target: "es2022", legalComments: "inline" })).code;
const outCss = (await transform(css, { loader: "css", minify: true })).code;
const hash = (s) => createHash("sha256").update(s).digest("base64url").slice(0, 8);
const jsName = `index-${hash(outJs)}.js`;
const cssName = `index-${hash(outCss)}.css`;

for (const f of readdirSync(join(root, "assets")))
  if (/^index-[\w-]+\.(js|css)$/.test(f)) unlinkSync(join(root, "assets", f));
writeFileSync(join(root, "assets", jsName), outJs);
writeFileSync(join(root, "assets", cssName), outCss);

const html = read("index.html")
  .replace(/\.\/assets\/index-[\w-]+\.js/, `./assets/${jsName}`)
  .replace(/\.\/assets\/index-[\w-]+\.css/, `./assets/${cssName}`);
writeFileSync(join(root, "index.html"), html);
console.log(`assets/${jsName} (${outJs.length} B), assets/${cssName} (${outCss.length} B)`);
void build;
