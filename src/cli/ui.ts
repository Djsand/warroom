import chalk, { type ChalkInstance } from "chalk";
import type { AgentRole } from "../types.js";
import { AGENT_TAG, AGENT_LABEL } from "../types.js";

const AGENT_CHALK: Readonly<Record<AgentRole, ChalkInstance>> = {
  architect: chalk.blue,
  challenger: chalk.red,
  builder: chalk.green,
  reviewer: chalk.magenta,
  breaker: chalk.yellow,
};

export function agentTag(role: AgentRole): string {
  const color = AGENT_CHALK[role];
  return color.bold(`[${AGENT_TAG[role]}]`);
}

export function agentName(role: AgentRole): string {
  const color = AGENT_CHALK[role];
  return color(AGENT_LABEL[role]);
}

export function agentLine(role: AgentRole, content: string): string {
  const short = content.replace(/\n/g, " ").slice(0, 72);
  const suffix = content.length > 72 ? chalk.dim("...") : "";
  return `  ${agentTag(role)} ${chalk.bold(AGENT_LABEL[role])}  ${chalk.dim(short)}${suffix}`;
}

export function phaseHeader(name: string): string {
  const line = chalk.dim("\u2500".repeat(44));
  return `\n  ${line}\n  ${chalk.bold.white(name)}\n  ${line}`;
}

/** A dim \u27E8model\u27E9 marker, shown next to agents in cross-model debates. */
export function modelTag(label: string): string {
  return chalk.dim(`\u27E8${label}\u27E9`);
}

export function waitingFor(role: AgentRole, tag?: string): string {
  const suffix = tag ? ` ${modelTag(tag)}` : "";
  return `  ${chalk.dim("\u25CB")} Waiting for ${agentName(role)}${suffix}${chalk.dim("...")}`;
}

export function doneAgent(role: AgentRole, content: string, tag?: string): string {
  const suffix = tag ? ` ${modelTag(tag)}` : "";
  return `  ${chalk.white("\u25CF")} ${agentTag(role)} ${chalk.bold(AGENT_LABEL[role])}${suffix}  ${chalk.dim(content.replace(/\n/g, " ").slice(0, 60))}${content.length > 60 ? chalk.dim("...") : ""}`;
}

export function banner(subtitle?: string): string {
  const title = chalk.bold.white("warroom");
  const sub = chalk.dim(subtitle ?? "5 agents. 1 task. Let the debate begin.");
  return `\n  ${title}\n  ${sub}\n`;
}

export function missionComplete(): string {
  return chalk.bold.green("  DONE");
}

export function statsLine(parts: string[]): string {
  return `  ${parts.join(chalk.dim(" \u00B7 "))}`;
}

export function fileLine(filePath: string): string {
  return `  ${chalk.dim("\u2192")} ${chalk.cyan(filePath)}`;
}
