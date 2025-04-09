import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import csv from "csv-parser";
import ora from "ora";
import { Command } from 'commander';
import { Issue, GithubIssue, CommandResult } from "./types/index.js";

const execAsync = promisify(exec);

const program = new Command();

program
  .name('chincol')
  .description('CLI to create GitHub issues from CSV file')
  .version('1.0.0')
  .option('-r, --repo <repository>', 'GitHub repository (username/repository)')
  .option('-f, --file <path>', 'Path to CSV file', './issues.csv');

program.parse();

const options = program.opts();

async function ensureLabelExists(
  label: string,
  repo: string
): Promise<boolean> {
  const spinner = ora(`Checking label: ${label}`).start();
  try {
    await execAsync(`gh label view "${label}" --repo ${repo}`);
    spinner.succeed(`✅ Label exists: ${label}`);
    return true;
  } catch {
    spinner.text = `Creating missing label: ${label}`;
    try {
      await execAsync(
        `gh label create "${label}" --color "0000FF" --repo ${repo} --force`
      );
      spinner.succeed(`✅ Label created: ${label}`);
      return true;
    } catch (error) {
      spinner.fail(`❌ Failed to create label: ${label}`);
      console.error(
        `   ❌ Error details: ${error instanceof Error ? error.message : String(error)}`
      );
      return false;
    }
  }
}

async function issueExists(title: string, repo: string): Promise<boolean> {
  const spinner = ora(`Checking if issue exists: ${title}`).start();
  try {
    const { stdout } = (await execAsync(
      `gh issue list --repo ${repo} --search "${title}" --json title,url`
    )) as CommandResult;
    const issues = JSON.parse(stdout) as GithubIssue[];
    const exists = issues.some((issue) => issue.title === title);

    if (exists) {
      spinner.info(`📝 Issue already exists: ${title}`);
      return true;
    }
    spinner.succeed(`✨ Issue is new: ${title}`);
    return false;
  } catch (error) {
    spinner.fail(`❌ Error checking issue existence: ${title}`);
    console.error(
      `   ❌ Error details: ${error instanceof Error ? error.message : String(error)}`
    );
    return false;
  }
}

async function createIssuesFromCSV(): Promise<void> {
  try {
    const csvFilePath = path.resolve(process.cwd(), options.file || 'issues.csv');
    const issues: Issue[] = [];
    const repo = options.repo;  // Use provided repo or default

    const spinner = ora("Parsing CSV file...").start();
    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on("data", (row: Issue) => {
          issues.push(row);
        })
        .on("end", () => resolve())
        .on("error", reject);
    });
    spinner.succeed(`✅ Found ${issues.length} issues to create.`);

    for (const [index, issue] of issues.entries()) {
      const title = issue.title;
      const body = issue.body;
      const labels = issue.labels
        .split(",")
        .map((label: string) => label.trim());

      const issueSpinner = ora(
        `Processing issue ${index + 1}/${issues.length}: ${title}`
      ).start();

      try {
        if (await issueExists(title, repo)) {
          issueSpinner.info(`📝 Skipping existing issue: ${title}`);
          continue;
        }

        const labelResults = await Promise.all(
          labels.map((label: string) => ensureLabelExists(label, repo))
        );

        if (labelResults.every(Boolean)) {
          const command = `gh issue create --title "${title}" --body "${body}" --label "${labels.join(
            ","
          )}" --repo ${repo}`;
          const { stdout } = (await execAsync(command)) as CommandResult;

          issueSpinner.succeed(`✅ Created new issue: ${title}`);
          console.log(`   🌐 Issue URL: ${stdout.trim()}`);
        } else {
          issueSpinner.fail(
            `❌ Skipped issue: ${title} due to label creation failure`
          );
        }
      } catch (error) {
        issueSpinner.fail(`❌ Error creating issue: ${title}`);
        console.error(
          `   ❌ Error details: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    console.log("\n🎉 All issues have been processed!");
  } catch (error) {
    console.error(
      "❌ Failed to read or process the CSV file:",
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
}

createIssuesFromCSV().catch((error) => {
  console.error(
    "❌ Fatal error:",
    error instanceof Error ? error.message : String(error)
  );
  process.exit(1);
});
