import chalk from "chalk";
import {
  storeSetupToken,
  hasStoredCredentials,
  clearCredentials,
  resolveApiKeyFromSetupToken,
  loginInteractive,
} from "../auth/oauth.js";

export async function handleSetup(): Promise<void> {
  console.log(chalk.bold("\ngaps setup\n"));

  if (hasStoredCredentials()) {
    console.log(chalk.green("Already authenticated."));
    console.log(chalk.dim("To re-authenticate: gaps setup --reset\n"));
    return;
  }

  console.log("Two ways to authenticate:\n");

  console.log(chalk.bold("  Option 1: Login with browser (recommended)"));
  console.log(chalk.dim("    gaps setup --login\n"));

  console.log(chalk.bold("  Option 2: Paste a setup token"));
  console.log(chalk.dim("    Run `claude setup-token` then:"));
  console.log(chalk.dim("    gaps setup --token sk-ant-oat01-...\n"));
}

export async function handleSetupLogin(): Promise<void> {
  console.log(chalk.bold("\ngaps login\n"));
  console.log("Opening browser for Anthropic authentication...\n");

  try {
    await loginInteractive();
    console.log(chalk.green("\nAuthenticated successfully."));
    console.log(chalk.dim("Credentials stored in ~/.gaps/credentials.json\n"));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(chalk.red(`\nLogin failed: ${msg}\n`));
    console.log("Try using a setup token instead:");
    console.log(chalk.dim("  claude setup-token"));
    console.log(chalk.dim("  gaps setup --token sk-ant-oat01-...\n"));
  }
}

export async function handleSetupWithToken(token: string): Promise<void> {
  if (!token.startsWith("sk-ant-oat")) {
    console.log(chalk.yellow("\nThat doesn't look like a setup token (should start with sk-ant-oat)."));
    console.log(chalk.dim("If it's an API key, use: export ANTHROPIC_API_KEY=...\n"));
    return;
  }

  console.log(chalk.dim("Exchanging setup token for API access..."));

  try {
    await resolveApiKeyFromSetupToken(token);
    storeSetupToken(token);
    console.log(chalk.green("\nAuthenticated successfully."));
    console.log(chalk.dim("Credentials stored in ~/.gaps/credentials.json\n"));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(chalk.red(`\nToken exchange failed: ${msg}`));
    console.log(chalk.dim("Make sure the token is valid. Generate a new one with: claude setup-token\n"));
  }
}

export async function handleSetupReset(): Promise<void> {
  clearCredentials();
  console.log(chalk.dim("\nCredentials cleared. Run `gaps setup` to re-authenticate.\n"));
}
