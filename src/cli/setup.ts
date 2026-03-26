import chalk from "chalk";
import {
  storeSetupToken,
  hasStoredCredentials,
  clearCredentials,
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

  console.log(chalk.bold("  Option 1: Setup token (recommended)"));
  console.log(chalk.dim("    Run `claude setup-token`, then:\n"));
  console.log(`    ${chalk.cyan("gaps setup --token sk-ant-oat01-...")}\n`);

  console.log(chalk.bold("  Option 2: Browser login"));
  console.log(`    ${chalk.cyan("gaps setup --login")}\n`);
}

export async function handleSetupLogin(): Promise<void> {
  console.log(chalk.bold("\ngaps login\n"));
  console.log("Opening browser for Anthropic authentication...\n");

  try {
    await loginInteractive();
    console.log(chalk.green("\nAuthenticated successfully.\n"));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(chalk.red(`\nLogin failed: ${msg}\n`));
  }
}

export async function handleSetupWithToken(token: string): Promise<void> {
  storeSetupToken(token);
  console.log(chalk.green("\nAuthenticated. Token stored in ~/.gaps/credentials.json\n"));
}

export async function handleSetupReset(): Promise<void> {
  clearCredentials();
  console.log(chalk.dim("\nCredentials cleared. Run `gaps setup` to re-authenticate.\n"));
}
