import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertMobileOpenApiContract,
  renderGeneratedApiDocument,
  renderOpenApiDocument,
} from "./openapi-contract.mjs";

const mobileRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const backendRoot = path.resolve(
  process.env.TOUTCI_BACKEND_DIR ?? path.join(mobileRoot, "..", "restau-platform"),
);
const jsonPath = path.join(mobileRoot, "openapi", "openapi-v1.json");
const generatedPath = path.join(mobileRoot, "src", "generated", "api-v1.ts");
const checkOnly = process.argv.includes("--check");
const temporaryDirectory = await mkdtemp(
  path.join(os.tmpdir(), "toutci-openapi-sync-"),
);
const exportedJsonPath = path.join(temporaryDirectory, "openapi-v1.json");

try {
  const exported = spawnSync(
    "npm",
    ["run", "api:openapi:export", "--", "--output", exportedJsonPath],
    { cwd: backendRoot, stdio: "inherit" },
  );
  if (exported.status !== 0) {
    process.exitCode = exported.status ?? 1;
  } else {
    const document = JSON.parse(await readFile(exportedJsonPath, "utf8"));
    assertMobileOpenApiContract(document);

    const openApiSource = renderOpenApiDocument(document);
    const generatedSource = renderGeneratedApiDocument(document);

    if (checkOnly) {
      const [currentOpenApi, currentGenerated] = await Promise.all([
        readFile(jsonPath, "utf8"),
        readFile(generatedPath, "utf8"),
      ]);
      const drift = [];
      if (currentOpenApi !== openApiSource) drift.push(jsonPath);
      if (currentGenerated !== generatedSource) drift.push(generatedPath);
      if (drift.length > 0) {
        throw new Error(
          `Artefacts OpenAPI désynchronisés: ${drift.join(", ")}. Exécutez npm run api:sync.`,
        );
      }
      console.log("Contrat OpenAPI mobile synchronisé avec le backend.");
    } else {
      await Promise.all([
        mkdir(path.dirname(jsonPath), { recursive: true }),
        mkdir(path.dirname(generatedPath), { recursive: true }),
      ]);
      await Promise.all([
        writeFile(jsonPath, openApiSource, "utf8"),
        writeFile(generatedPath, generatedSource, "utf8"),
      ]);
      console.log(`Contrat mobile généré dans ${generatedPath}`);
    }
  }
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
