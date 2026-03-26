import fs from "fs";
import path from "path";
import chalk from "chalk";
import { runGaps, slugify, formatDate } from "../orchestrator/run.js";
import { loadConfig } from "../config.js";

export async function handleRun(task: string): Promise<void> {
  const config = loadConfig();
  const projectDir = process.cwd();

  // Read package.json for basic project context if it exists
  let projectContext = "";
  const pkgPath = path.join(projectDir, "package.json");
  if (fs.existsSync(pkgPath)) {
    try {
      const pkgRaw = fs.readFileSync(pkgPath, "utf-8");
      const pkg = JSON.parse(pkgRaw) as Record<string, unknown>;
      const name = typeof pkg.name === "string" ? pkg.name : "";
      const description = typeof pkg.description === "string" ? pkg.description : "";
      const deps = pkg.dependencies ? Object.keys(pkg.dependencies as Record<string, string>) : [];
      const devDeps = pkg.devDependencies
        ? Object.keys(pkg.devDependencies as Record<string, string>)
        : [];
      const lines: string[] = [];
      if (name) lines.push(`Project: ${name}`);
      if (description) lines.push(`Description: ${description}`);
      if (deps.length > 0) lines.push(`Dependencies: ${deps.join(", ")}`);
      if (devDeps.length > 0) lines.push(`Dev dependencies: ${devDeps.join(", ")}`);
      projectContext = lines.join("\n");
    } catch {
      // Ignore parse errors
    }
  }

  console.log(chalk.bold.green("warroom starting..."));
  console.log(chalk.dim(`Task:        ${task}`));
  console.log(chalk.dim(`Project dir: ${projectDir}`));

  const result = await runGaps({
    task,
    auth: config.auth,
    projectDir,
    projectContext,
    architectModel: config.architectModel,
    agentModel: config.agentModel,
    maxDesignRounds: config.maxDesignRounds,
    maxReviewRounds: config.maxReviewRounds,
  });

  // Write conversation.md and summary.md to .warroom/conversations/<slug>/
  const slug = `${slugify(task)}-${formatDate(result.startedAt)}`;
  const convDir = path.join(projectDir, ".warroom", "conversations", slug);
  fs.mkdirSync(convDir, { recursive: true });

  const conversationPath = path.join(convDir, "conversation.md");
  const summaryPath = path.join(convDir, "summary.md");

  fs.writeFileSync(conversationPath, result.conversationMd, "utf-8");
  fs.writeFileSync(summaryPath, result.summaryMd, "utf-8");

  // Print results
  const { stats } = result;
  const durationSec = (stats.durationMs / 1000).toFixed(1);

  console.log("");
  console.log(chalk.bold.green("Done!"));
  console.log(chalk.dim(`Messages:      ${stats.totalMessages}`));
  console.log(chalk.dim(`Revisions:     ${stats.designRevisions}`));
  console.log(chalk.dim(`Bugs found:    ${stats.bugsCaught}`));
  console.log(chalk.dim(`Files changed: ${stats.filesChanged}`));
  console.log(chalk.dim(`Duration:      ${durationSec}s`));
  console.log("");
  console.log(chalk.dim(`Conversation:  ${conversationPath}`));
  console.log(chalk.dim(`Summary:       ${summaryPath}`));
}
