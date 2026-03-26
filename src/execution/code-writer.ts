import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import type { CodeChange } from "../types.js";

export function writeCodeChanges(baseDir: string, changes: CodeChange[]): void {
  for (const change of changes) {
    const fullPath = join(baseDir, change.filePath);
    mkdirSync(dirname(fullPath), { recursive: true });
    writeFileSync(fullPath, change.content, "utf-8");
  }
}
