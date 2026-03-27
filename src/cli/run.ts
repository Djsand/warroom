import fs from "fs";
import path from "path";
import chalk from "chalk";
import { runGaps, slugify, formatDate } from "../orchestrator/run.js";
import { loadConfig } from "../config.js";

const BANNER = `
  ${chalk.bold.red("W A R R O O M")}
  ${chalk.dim("5 agents. 1 task. Let the debate begin.")}
`;

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

  console.log(BANNER);
  console.log(chalk.bold(`  Task: ${task}`));
  console.log(chalk.dim(`  Dir:  ${projectDir}`));
  console.log("");

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

  // Write conversation.md and summary.md
  const slug = `${slugify(task)}-${formatDate(result.startedAt)}`;
  const convDir = path.join(projectDir, ".warroom", "conversations", slug);
  fs.mkdirSync(convDir, { recursive: true });

  const conversationPath = path.join(convDir, "conversation.md");
  const summaryPath = path.join(convDir, "summary.md");

  fs.writeFileSync(conversationPath, result.conversationMd, "utf-8");
  fs.writeFileSync(summaryPath, result.summaryMd, "utf-8");

  // Results
  const { stats } = result;
  const durationSec = (stats.durationMs / 1000).toFixed(0);

  console.log("");
  console.log(chalk.bold.green("  MISSION COMPLETE"));
  console.log("");
  console.log(`  ${chalk.white("Messages")}     ${stats.totalMessages}`);
  console.log(`  ${chalk.white("Revisions")}    ${stats.designRevisions}`);
  console.log(`  ${chalk.white("Bugs caught")}  ${stats.bugsCaught}`);
  console.log(`  ${chalk.white("Files")}        ${stats.filesChanged}`);
  console.log(`  ${chalk.white("Duration")}     ${durationSec}s`);
  console.log("");
  console.log(`  ${chalk.cyan(conversationPath)}`);
  console.log(`  ${chalk.cyan(summaryPath)}`);
  console.log("");
}
