import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_DIR = path.join(ROOT, "src");
const CHECK_EXTENSIONS = [".js", ".jsx", ".json", ".css"];
const SOURCE_EXTENSIONS = new Set([".js", ".jsx"]);

const walk = (dir) => {
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    return CHECK_EXTENSIONS.includes(path.extname(entry.name)) ? [fullPath] : [];
  });
};

const existsAsModule = (specifierPath) => {
  const candidates = [
    specifierPath,
    ...CHECK_EXTENSIONS.map((extension) => `${specifierPath}${extension}`),
    ...CHECK_EXTENSIONS.map((extension) => path.join(specifierPath, `index${extension}`)),
  ];

  return candidates.some((candidate) => fs.existsSync(candidate));
};

const files = [path.join(ROOT, "i18n.js"), ...walk(SOURCE_DIR)];
const errors = [];

for (const file of files) {
  const content = fs.readFileSync(file, "utf8");

  if (path.extname(file) === ".json") {
    try {
      JSON.parse(content);
    } catch (error) {
      errors.push(`${path.relative(ROOT, file)}: invalid JSON: ${error.message}`);
    }
    continue;
  }

  if (!SOURCE_EXTENSIONS.has(path.extname(file))) continue;

  const importPattern = /(?:import\s+(?:[^'"]+\s+from\s+)?|import\s*\()\s*["']([^"']+)["']/g;
  for (const match of content.matchAll(importPattern)) {
    const specifier = match[1];
    if (!specifier.startsWith(".")) continue;

    const resolved = path.resolve(path.dirname(file), specifier);
    if (!existsAsModule(resolved)) {
      errors.push(`${path.relative(ROOT, file)}: unresolved import "${specifier}"`);
    }
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Checked ${files.length} frontend source files.`);
