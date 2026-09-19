#!/usr/bin/env node
/**
 * Migration ponctuelle : remplace les hexadécimaux du palette par les tokens
 * de `src/constants/theme.ts` et ajoute l'import manquant. One-shot, lancé
 * via `node scripts/migrate-theme-tokens.mjs`.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

const MAPPING = {
  "#14532d": "theme.green900",
  "#166534": "theme.green800",
  "#386b2a": "theme.green700",
  "#457b3b": "theme.green500",
  "#183c2a": "theme.brandDark",
  "#111827": "theme.ink900",
  "#4b5563": "theme.ink600",
  "#6b7280": "theme.ink500",
  "#9ca3af": "theme.ink400",
  "#f3f4f6": "theme.ink100",
  "#dc2626": "theme.danger700",
  "#e51818": "theme.danger600",
  "#3b82f6": "theme.info",
  "#f59e0b": "theme.warning",
  "#374151": "theme.ink700",
  "#777772": "theme.inkMuted",
  "#64748b": "theme.slate500",
  "#f0fdf4": "theme.green50",
  "#ca8a04": "theme.warning600",
};

const files = execSync(
  `grep -rlE '#[0-9A-Fa-f]{6}' src --include='*.tsx' --include='*.ts'`,
  { encoding: "utf8" },
)
  .trim()
  .split("\n")
  .filter((f) => !f.includes("constants/theme"));

let touched = 0;
for (const file of files) {
  const original = readFileSync(file, "utf8");
  const lower = original.toLowerCase();
  const used = Object.keys(MAPPING).filter((hex) => lower.includes(hex));
  if (used.length === 0) continue;

  let content = original;
  for (const hex of used) {
    const re = new RegExp(hex, "gi");
    content = content.replace(re, MAPPING[hex]);
  }

  const hasImport = /from\s+["']@\/constants\/theme["']/.test(content);
  if (!hasImport) {
    const lines = content.split("\n");
    let lastImport = -1;
    lines.forEach((line, i) => {
      if (/from\s+["'][^"']+["'];\s*$/.test(line)) lastImport = i;
    });
    lines.splice(lastImport + 1, 0, 'import { theme } from "@/constants/theme";');
    content = lines.join("\n");
  }

  writeFileSync(file, content);
  touched += 1;
  console.log(`${file} : ${used.join(", ")}`);
}
console.log(`\n${touched} fichiers migrés.`);
