import fs from "fs";
import path from "path";
import chalk from "chalk";
import { runGaps, slugify, formatDate } from "../orchestrator/run.js";
import { loadConfig, type ProviderChoice } from "../config.js";
import type { ConversationStats, ConversationMessage, Provider, VersusConfig } from "../types.js";
import { banner, missionComplete, statsLine, fileLine } from "./ui.js";

export interface RunOptions {
  provider?: ProviderChoice;
  versus?: boolean;
}

export function formatStats(stats: ConversationStats, messages: readonly ConversationMessage[]): string {
  const agentCount = new Set(messages.map((m) => m.role)).size;
  const durationSec = Math.round(stats.durationMs / 1000);

  const parts = [
    `${agentCount} agents`,
    `${stats.totalMessages} messages`,
    `${stats.designRevisions} revisions`,
    `${stats.bugsCaught} bugs caught`,
    `${stats.filesChanged} files`,
    `${durationSec}s`,
  ];

  return statsLine(parts);
}

const PROVIDER_LABEL: Record<Provider, string> = {
  anthropic: "Claude",
  codex: "GPT (Codex)",
};

export function bannerSubtitle(
  provider: Provider,
  versus: VersusConfig | null | undefined,
  model: string,
): string {
  if (versus) {
    const opponent = provider === "anthropic" ? PROVIDER_LABEL.codex : PROVIDER_LABEL.anthropic;
    return `Cross-model debate: ${PROVIDER_LABEL[provider]} vs ${opponent}.`;
  }
  return `5 agents on ${PROVIDER_LABEL[provider]} (${model}).`;
}

export async function handleRun(task: string, options: RunOptions = {}): Promise<void> {
  const config = await loadConfig({ provider: options.provider, versus: options.versus });
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

  console.log(banner(bannerSubtitle(config.provider, config.versus, config.agentModel)));
  console.log(`  ${chalk.bold("Task:")} ${task}`);
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
    versus: config.versus,
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
  console.log("");
  console.log(missionComplete());
  console.log("");
  console.log(formatStats(result.stats, result.messages));
  console.log("");
  console.log(fileLine(conversationPath));
  console.log(fileLine(summaryPath));
  console.log("");
}
