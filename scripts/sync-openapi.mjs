import { spawnSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const mobileRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const backendRoot = path.resolve(
  process.env.TOUTCI_BACKEND_DIR ?? path.join(mobileRoot, "..", "restau-platform"),
);
const jsonPath = path.join(mobileRoot, "openapi", "openapi-v1.json");
const generatedPath = path.join(mobileRoot, "src", "generated", "api-v1.ts");

const exported = spawnSync(
  "npm",
  ["run", "api:openapi:export", "--", "--output", jsonPath],
  { cwd: backendRoot, stdio: "inherit" },
);
if (exported.status !== 0) {
  process.exit(exported.status ?? 1);
}

const document = JSON.parse(await readFile(jsonPath, "utf8"));
const generated = `// Généré par npm run api:sync. Ne pas modifier manuellement.\n` +
  `export const apiV1Document = ${JSON.stringify(document, null, 2)} as const;\n\n` +
  `export type ApiV1Path = keyof typeof apiV1Document.paths;\n` +
  `export type ApiV1Method<Path extends ApiV1Path> = keyof typeof apiV1Document.paths[Path];\n`;

await mkdir(path.dirname(generatedPath), { recursive: true });
await writeFile(generatedPath, generated, "utf8");
console.log(`Contrat mobile généré dans ${generatedPath}`);
