import fs from "fs";
import path from "path";
import { renderConversationHtml } from "../conversation/html-renderer.js";
import { Thread } from "../conversation/thread.js";

export type ReadFormat = "md" | "html";

export function handleRead(format: ReadFormat = "md"): void {
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

  if (format === "html") {
    const threadFile = path.join(latest.dirPath, "thread.json");
    if (fs.existsSync(threadFile)) {
      const data = JSON.parse(fs.readFileSync(threadFile, "utf-8")) as {
        task: string;
        startedAt: string;
        messages: Array<Record<string, unknown>>;
      };
      const thread = Object.assign(new Thread(data.task), {
        messages: data.messages.map((m) => ({
          ...m,
          timestamp: new Date(m.timestamp as string),
        })),
        startedAt: new Date(data.startedAt),
      });
      console.log(renderConversationHtml(thread));
      return;
    }
    // Fallback: read conversation.md and wrap in minimal HTML
    const convFile = path.join(latest.dirPath, "conversation.md");
    if (!fs.existsSync(convFile)) {
      console.log("No conversations yet.");
      return;
    }
    const content = fs.readFileSync(convFile, "utf-8");
    console.log(wrapMarkdownInHtml(content));
    return;
  }

  const convFile = path.join(latest.dirPath, "conversation.md");

  if (!fs.existsSync(convFile)) {
    console.log("No conversations yet.");
    return;
  }

  const content = fs.readFileSync(convFile, "utf-8");
  console.log(content);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapMarkdownInHtml(markdown: string): string {
  const lines = markdown.split("\n");
  const bodyLines = lines.map((line) => {
    if (line.startsWith("# ")) {
      return `<h1>${escapeHtml(line.slice(2))}</h1>`;
    }
    if (line.startsWith("## ")) {
      return `<h2>${escapeHtml(line.slice(3))}</h2>`;
    }
    if (line.startsWith("- ")) {
      return `<li>${escapeHtml(line.slice(2))}</li>`;
    }
    if (line.startsWith("---")) {
      return "<hr>";
    }
    if (line.trim() === "") {
      return "";
    }
    return `<p>${escapeHtml(line)}</p>`;
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>warroom conversation</title>
<style>
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;max-width:48rem;margin:2rem auto;padding:0 1rem;color:#1e293b;line-height:1.6}
h1{font-size:1.5rem}h2{font-size:1.125rem;margin-top:1.5rem}
hr{border:none;border-top:2px solid #e2e8f0;margin:1.5rem 0}
li{margin-left:1.5rem}
</style>
</head>
<body>
${bodyLines.join("\n")}
</body>
</html>`;
}
