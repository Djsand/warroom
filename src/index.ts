#!/usr/bin/env node
import { Command } from "commander";
import { handleRun } from "./cli/run.js";
import { handleRead } from "./cli/read.js";
import { handleStatus } from "./cli/status.js";

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

program.command("read").description("Read the latest conversation").action(() => handleRead());
program.command("status").description("List all conversations").action(() => handleStatus());

program.parse();
