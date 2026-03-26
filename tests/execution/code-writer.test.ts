import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { writeCodeChanges } from "../../src/execution/code-writer.js";
import { mkdtempSync, rmSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("writeCodeChanges", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "gaps-test-"));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("creates files from code changes", () => {
    writeCodeChanges(tempDir, [
      { filePath: "src/auth.ts", content: "export const auth = true;", action: "create" },
    ]);
    const content = readFileSync(join(tempDir, "src/auth.ts"), "utf-8");
    expect(content).toBe("export const auth = true;");
  });

  it("creates nested directories", () => {
    writeCodeChanges(tempDir, [
      { filePath: "src/deep/nested/file.ts", content: "hello", action: "create" },
    ]);
    expect(existsSync(join(tempDir, "src/deep/nested/file.ts"))).toBe(true);
  });

  it("handles multiple files", () => {
    writeCodeChanges(tempDir, [
      { filePath: "a.ts", content: "a", action: "create" },
      { filePath: "b.ts", content: "b", action: "create" },
    ]);
    expect(readFileSync(join(tempDir, "a.ts"), "utf-8")).toBe("a");
    expect(readFileSync(join(tempDir, "b.ts"), "utf-8")).toBe("b");
  });
});
