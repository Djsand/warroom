import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { execFileSync } from "node:child_process";
import chalk from "chalk";

const GAPS_DIR = join(homedir(), ".gaps");
const CREDS_PATH = join(GAPS_DIR, "credentials.json");

export async function handleSetup(): Promise<void> {
  console.log(chalk.bold("\ngaps setup\n"));

  // Check if already authenticated
  if (existsSync(CREDS_PATH)) {
    try {
      const creds = JSON.parse(readFileSync(CREDS_PATH, "utf-8"));
      if (creds.token) {
        console.log(chalk.green("Already authenticated."));
        console.log(chalk.dim(`  Method: ${creds.method}`));
        console.log(chalk.dim(`  Token:  ${creds.token.slice(0, 20)}...`));
        console.log(chalk.dim(`\nTo re-authenticate, run: gaps setup --reset\n`));
        return;
      }
    } catch {
      // continue to setup
    }
  }

  // Try to read from Claude Code's credential store first
  const claudeToken = tryReadClaudeCredentials();
  if (claudeToken) {
    saveCredentials("claude-credentials", claudeToken);
    console.log(chalk.green("Found Claude Code credentials."));
    console.log(chalk.dim("Using your existing Claude subscription.\n"));
    return;
  }

  // Try `claude setup-token` command
  const hasClaudeCLI = checkClaudeCLI();
  if (hasClaudeCLI) {
    console.log("Claude Code CLI found. Generating a setup token...\n");
    console.log(chalk.yellow("Run this command and paste the token:"));
    console.log(chalk.bold("\n  claude setup-token\n"));
    console.log(
      "Then set it as an environment variable:\n" +
      chalk.bold("  export CLAUDE_CODE_OAUTH_TOKEN=sk-ant-oat01-...\n") +
      "\nOr paste it when prompted by running:\n" +
      chalk.bold("  gaps setup --token <your-token>\n")
    );
    return;
  }

  // Fallback: tell user their options
  console.log(chalk.yellow("No Claude Code installation found.\n"));
  console.log("Options:\n");
  console.log(chalk.bold("  Option 1: Claude Code setup token (recommended)"));
  console.log("  On a machine with Claude Code installed, run:");
  console.log(chalk.dim("    claude setup-token"));
  console.log("  Then:");
  console.log(chalk.dim("    gaps setup --token sk-ant-oat01-...\n"));
  console.log(chalk.bold("  Option 2: API key"));
  console.log("  Get a key at https://console.anthropic.com/settings/keys");
  console.log(chalk.dim("    export ANTHROPIC_API_KEY=sk-ant-...\n"));
}

export async function handleSetupWithToken(token: string): Promise<void> {
  const method = token.startsWith("sk-ant-oat01-") ? "oauth-token" : "api-key";
  saveCredentials(method, token);
  console.log(chalk.green(`\nAuthenticated successfully.`));
  console.log(chalk.dim(`  Method: ${method}`));
  console.log(chalk.dim(`  Stored: ~/.gaps/credentials.json\n`));
}

export async function handleSetupReset(): Promise<void> {
  if (existsSync(CREDS_PATH)) {
    writeFileSync(CREDS_PATH, "{}", "utf-8");
    console.log(chalk.dim("\nCredentials cleared. Run `gaps setup` to re-authenticate.\n"));
  } else {
    console.log(chalk.dim("\nNo credentials to clear.\n"));
  }
}

function tryReadClaudeCredentials(): string | null {
  // Try ~/.claude/.credentials.json
  const claudeCredsPath = join(homedir(), ".claude", ".credentials.json");
  if (existsSync(claudeCredsPath)) {
    try {
      const creds = JSON.parse(readFileSync(claudeCredsPath, "utf-8"));
      if (creds.accessToken) return creds.accessToken;
    } catch {
      // ignore
    }
  }
  return null;
}

function checkClaudeCLI(): boolean {
  try {
    execFileSync("claude", ["--version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function saveCredentials(method: string, token: string): void {
  mkdirSync(GAPS_DIR, { recursive: true });
  writeFileSync(
    CREDS_PATH,
    JSON.stringify({ method, token, savedAt: new Date().toISOString() }, null, 2),
    { encoding: "utf-8", mode: 0o600 }
  );
}
