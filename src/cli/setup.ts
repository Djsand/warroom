import chalk from "chalk";
import {
  storeSetupToken,
  hasStoredCredentials,
  clearCredentials,
  loginInteractive,
} from "../auth/oauth.js";
import { isCodexAvailable, codexAccountLabel, loginCodex } from "../auth/codex.js";

export async function handleSetup(): Promise<void> {
  console.log(chalk.bold("\nwarroom setup\n"));

  const codexLabel = isCodexAvailable() ? codexAccountLabel() : null;
  const hasClaude = hasStoredCredentials();

  if (hasClaude || codexLabel) {
    if (hasClaude) console.log(chalk.green("Claude: authenticated."));
    if (codexLabel) console.log(chalk.green(`Codex:  ${codexLabel}`));
    console.log(chalk.dim("\nRun `warroom run <task>` to start, or re-auth with `warroom setup --reset`.\n"));
    return;
  }

  console.log("Authenticate with Claude, ChatGPT/Codex, or both:\n");

  console.log(chalk.bold("  Claude — setup token (recommended)"));
  console.log(chalk.dim("    Run `claude setup-token`, then:"));
  console.log(`    ${chalk.cyan("warroom setup --token sk-ant-oat01-...")}\n`);

  console.log(chalk.bold("  Claude — browser login"));
  console.log(`    ${chalk.cyan("warroom setup --login")}\n`);

  console.log(chalk.bold("  ChatGPT / Codex"));
  console.log(chalk.dim("    Reuse your Codex CLI login (`codex login`), or:"));
  console.log(`    ${chalk.cyan("warroom setup --codex-login")}\n`);
}

export async function handleSetupLogin(): Promise<void> {
  console.log(chalk.bold("\nwarroom login\n"));
  console.log("Opening browser for Anthropic authentication...\n");

  try {
    await loginInteractive();
    console.log(chalk.green("\nAuthenticated successfully.\n"));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(chalk.red(`\nLogin failed: ${msg}\n`));
  }
}

export async function handleCodexLogin(): Promise<void> {
  console.log(chalk.bold("\nwarroom codex login\n"));
  console.log("Opening browser for ChatGPT authentication...\n");

  try {
    await loginCodex();
    const label = codexAccountLabel();
    console.log(chalk.green(`\nAuthenticated with ChatGPT${label ? ` (${label})` : ""}.\n`));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(chalk.red(`\nCodex login failed: ${msg}\n`));
  }
}

export async function handleSetupWithToken(token: string): Promise<void> {
  storeSetupToken(token);
  console.log(chalk.green("\nAuthenticated. Token stored in ~/.warroom/credentials.json\n"));
}

export async function handleSetupReset(): Promise<void> {
  clearCredentials();
  console.log(chalk.dim("\nClaude credentials cleared. Codex CLI login (if any) is untouched.\n"));
}
