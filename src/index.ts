#!/usr/bin/env node
import { Command } from "commander";
import { handleRun } from "./cli/run.js";
import { handleRead } from "./cli/read.js";
import { handleStatus } from "./cli/status.js";
import { handleSetup, handleSetupLogin, handleSetupWithToken, handleSetupReset } from "./cli/setup.js";

const program = new Command();

program
  .name("gaps")
  .description("AI agents that debate, build, and review your code.")
  .version("0.1.0");

program
  .command("run")
  .description("Assign a task to the agent team")
  .argument("<task>", "The task to accomplish")
  .action(async (task: string) => {
    try {
      await handleRun(task);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Error: ${message}`);
      process.exit(1);
    }
  });

program
  .command("setup")
  .description("Authenticate with your Claude subscription or API key")
  .option("--login", "Login via browser (opens Anthropic OAuth)")
  .option("--token <token>", "Provide a setup token from `claude setup-token`")
  .option("--reset", "Clear stored credentials")
  .action(async (opts: { login?: boolean; token?: string; reset?: boolean }) => {
    try {
      if (opts.reset) return await handleSetupReset();
      if (opts.login) return await handleSetupLogin();
      if (opts.token) return await handleSetupWithToken(opts.token);
      await handleSetup();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Error: ${message}`);
      process.exit(1);
    }
  });

program.command("read").description("Read the latest conversation").action(() => handleRead());
program.command("status").description("List all conversations").action(() => handleStatus());

program.parse();
