import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "src", "app", "api");
const snippet = 'export const runtime = "edge";\n\n';
const runtimeRe = /export\s+const\s+runtime\s*=/;

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p);
    else if (name === "route.ts") patch(p);
  }
}

function patch(file) {
  let text = fs.readFileSync(file, "utf8");
  if (/export\s+const\s+runtime\s*=\s*["']edge["']/.test(text)) return;
  if (/export\s+const\s+runtime\s*=\s*["']nodejs["']/.test(text)) {
    text = text.replace(
      /export\s+const\s+runtime\s*=\s*["']nodejs["'];?\s*\n/,
      'export const runtime = "edge";\n'
    );
    fs.writeFileSync(file, text);
    return;
  }
  if (runtimeRe.test(text)) return;
  const lines = text.split("\n").map((line, i, arr) => line + (i < arr.length - 1 ? "\n" : ""));
  let i = 0;
  while (i < lines.length && lines[i].trimStart().startsWith("import")) i += 1;
  fs.writeFileSync(file, lines.slice(0, i).join("") + snippet + lines.slice(i).join(""));
}

walk(root);
console.log("add-edge-runtime-api-routes: done");
