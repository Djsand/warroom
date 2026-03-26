import fs from "fs";
import path from "path";

export function handleRead(): void {
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
      return { name: e.name, dirPath, mtime: stat.mtimeMs };
    })
    .sort((a, b) => b.mtime - a.mtime);

  if (dirs.length === 0) {
    console.log("No conversations yet.");
    return;
  }

  const latest = dirs[0];
  const convFile = path.join(latest.dirPath, "conversation.md");

  if (!fs.existsSync(convFile)) {
    console.log("No conversations yet.");
    return;
  }

  const content = fs.readFileSync(convFile, "utf-8");
  console.log(content);
}
