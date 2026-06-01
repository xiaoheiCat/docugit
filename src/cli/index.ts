#!/usr/bin/env bun
import { Command } from "commander";
import { passthroughToGit } from "../utils/git.ts";
import { DOCUGIT_VERSION } from "../version.ts";
import { runInit, runNew, runExport } from "./commands/init.ts";
import { runOpen } from "./commands/open.ts";
import { runDiff, runStatus, runLog } from "./commands/diff.ts";
import { runCommit, runMerge } from "./commands/commit.ts";
import { runName, runRename } from "./commands/name.ts";
import { runRepair } from "./commands/repair.ts";
import { runRestore } from "./commands/restore.ts";

const DOCUGIT_COMMANDS = new Set([
  "init",
  "new",
  "open",
  "restore",
  "export",
  "name",
  "rename",
  "repair",
  "diff",
  "status",
  "log",
  "commit",
  "merge",
  "help",
  "version",
]);

async function main(): Promise<void> {
  const rawArgs = process.argv.slice(2);
  const first = rawArgs[0];

  if (first && !first.startsWith("-") && !DOCUGIT_COMMANDS.has(first)) {
    process.exit(passthroughToGit(rawArgs));
  }

  const program = new Command();

  program
    .name("docugit")
    .description("Git-based version control for Office OpenXML documents")
    .version(DOCUGIT_VERSION);

  program
    .command("init")
    .description("Initialize a DocuGit repository from an existing Office file")
    .argument("<file>", "Office file path (.docx/.xlsx/.pptx)")
    .option("-d, --dir <dir>", "Target directory", ".")
    .action(async (file: string, opts: { dir: string }) => {
      process.exit(await runInit(file, opts.dir));
    });

  program
    .command("new")
    .description("Create a new document repository from a blank template")
    .argument("<type>", "Document type: docx | xlsx | pptx")
    .argument("<name>", "Document name")
    .option("-d, --dir <dir>", "Target directory", ".")
    .action(async (type: string, name: string, opts: { dir: string }) => {
      if (!["docx", "xlsx", "pptx"].includes(type)) {
        console.error("Type must be docx, xlsx, or pptx");
        process.exit(1);
      }
      process.exit(await runNew(type as "docx" | "xlsx" | "pptx", name, opts.dir));
    });

  program
    .command("open")
    .description("Open the document in Office for editing")
    .action(async () => {
      process.exit(await runOpen());
    });

  program
    .command("restore")
    .description("Discard the open-session file")
    .option("-y", "Discard without confirmation")
    .action(async (opts: { y?: boolean }) => {
      process.exit(await runRestore(Boolean(opts.y)));
    });

  program
    .command("repair")
    .description("Repair broken OOXML links and content types in the repository")
    .action(async () => {
      process.exit(await runRepair());
    });

  program
    .command("export")
    .description("Export as an Office file")
    .argument("[output]", "Output path (default: ../<document>)")
    .action(async (output?: string) => {
      process.exit(await runExport(output));
    });

  program
    .command("name")
    .description("Show the document filename")
    .action(async () => {
      process.exit(await runName());
    });

  program
    .command("rename")
    .description("Rename the document filename")
    .argument("<name>", "New document filename")
    .action(async (name: string) => {
      process.exit(await runRename(name));
    });

  program
    .command("diff")
    .description("Semantic diff")
    .option("--html", "Generate an HTML report and open it")
    .option("--json", "Output structured JSON diff")
    .option("--ref <ref>", "Compare against the given ref")
    .action(async (opts: { html?: boolean; json?: boolean; ref?: string }) => {
      process.exit(await runDiff(opts));
    });

  program
    .command("status")
    .description("Repository status with semantic summary")
    .action(async () => {
      process.exit(await runStatus());
    });

  program
    .command("log")
    .description("Commit history")
    .allowUnknownOption(true)
    .action(async () => {
      const args = rawArgs.slice(1);
      process.exit(await runLog(args));
    });

  program
    .command("commit")
    .description("Commit changes with a semantic summary")
    .option("-m, --message <message>", "Commit message")
    .allowUnknownOption(true)
    .allowExcessArguments(true)
    .action(async (opts: { message?: string }) => {
      const message = opts.message ? [opts.message] : [];
      process.exit(await runCommit(message));
    });

  program
    .command("merge")
    .description("Three-way semantic merge")
    .argument("<branch>", "Branch to merge")
    .option("--html", "Open an HTML conflict report")
    .action(async (branch: string, opts: { html?: boolean }) => {
      process.exit(await runMerge(branch, opts.html));
    });

  await program.parseAsync(process.argv);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
