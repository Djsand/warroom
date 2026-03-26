import fs from "fs";
import path from "path";

export function handleStatus(): void {
  const convBase = path.join(process.cwd(), ".warroom", "conversations");

  if (!fs.existsSync(convBase)) {
    console.log("No conversations yet.");
    return;
  }

  const entries = fs.readdirSync(convBase, { withFileTypes: true });
  const dirs = entries
    .filter((e) => e.isDirectory())
    .map((e) => {
      const dirPath = path.join(convBase, e.name);
      const stat = fs.statSync(dirPath);
      return { name: e.name, mtime: stat.mtime };
    })
    .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

  if (dirs.length === 0) {
    console.log("No conversations yet.");
    return;
  }

  const shown = dirs.slice(0, 10);
  for (const dir of shown) {
    const dateStr = dir.mtime.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    console.log(`✓ ${dir.name}  (${dateStr})`);
  }
}
