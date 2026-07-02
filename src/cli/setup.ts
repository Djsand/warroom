import chalk from "chalk";
import {
  storeSetupToken,
  hasStoredCredentials,
  clearCredentials,
  loginInteractive,
} from "../auth/oauth.js";
import { isCodexAvailable, codexAccountLabel, loginCodex } from "../auth/codex.js";
import { glmAccountLabel, storeGlmKey } from "../auth/glm.js";

export async function handleSetup(): Promise<void> {
  console.log(chalk.bold("\nwarroom setup\n"));

  const codexLabel = isCodexAvailable() ? codexAccountLabel() : null;
  const glmLabel = glmAccountLabel();
  const hasClaude = hasStoredCredentials();

  if (hasClaude || codexLabel || glmLabel) {
    if (hasClaude) console.log(chalk.green("Claude: authenticated."));
    if (glmLabel) console.log(chalk.green(`GLM:    ${glmLabel}`));
    if (codexLabel) console.log(chalk.green(`Codex:  ${codexLabel}`));
    console.log(chalk.dim("\nRun `warroom run <task>` to start, or re-auth with `warroom setup --reset`.\n"));
    return;
  }

  console.log("Authenticate with Claude, GLM, ChatGPT/Codex, or any mix:\n");

  console.log(chalk.bold("  Claude — setup token (recommended)"));
  console.log(chalk.dim("    Run `claude setup-token`, then:"));
  console.log(`    ${chalk.cyan("warroom setup --token sk-ant-oat01-...")}\n`);

  console.log(chalk.bold("  Claude — browser login"));
  console.log(`    ${chalk.cyan("warroom setup --login")}\n`);

  console.log(chalk.bold("  Z.ai GLM coding plan"));
  console.log(`    ${chalk.cyan("warroom setup --glm-key <your Z.ai API key>")}\n`);

  console.log(chalk.bold("  ChatGPT / Codex"));
  console.log(chalk.dim("    Reuse your Codex CLI login (`codex login`), or:"));
  console.log(`    ${chalk.cyan("warroom setup --codex-login")}\n`);
}

export async function handleGlmKey(key: string): Promise<void> {
  storeGlmKey(key);
  console.log(chalk.green("\nStored Z.ai GLM key in ~/.warroom/glm.json"));
  console.log(chalk.dim(`  ${glmAccountLabel()}`));
  console.log(chalk.dim("  Run with: warroom run <task> --provider glm\n"));
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
