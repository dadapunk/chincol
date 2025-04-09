import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { exec } from "child_process";
import { promisify } from "util";
import csv from "csv-parser";
import ora from "ora";

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function ensureLabelExists(label, repo) {
  const spinner = ora(`Checking label: ${label}`).start();
  try {
    // Check if the label exists
    await execAsync(`gh label view "${label}" --repo ${repo}`);
    spinner.succeed(`✅ Label exists: ${label}`);
    return true;
  } catch {
    // Create the label if it doesn't exist
    spinner.text = `Creating missing label: ${label}`;
    try {
      await execAsync(
        `gh label create "${label}" --color "0000FF" --repo ${repo} --force`
      );
      spinner.succeed(`✅ Label created: ${label}`);
      return true;
    } catch (error) {
      spinner.fail(`❌ Failed to create label: ${label}`);
      console.error(`   ❌ Error details: ${error.message}`);
      return false;
    }
  }
}

async function issueExists(title, repo) {
  const spinner = ora(`Checking if issue exists: ${title}`).start();
  try {
    const { stdout } = await execAsync(
      `gh issue list --repo ${repo} --search "${title}" --json title,url`
    );
    const issues = JSON.parse(stdout);
    const exists = issues.some((issue) => issue.title === title);

    if (exists) {
      spinner.info(`📝 Issue already exists: ${title}`);
      return true;
    }
    spinner.succeed(`✨ Issue is new: ${title}`);
    return false;
  } catch (error) {
    spinner.fail(`❌ Error checking issue existence: ${title}`);
    console.error(`   ❌ Error details: ${error.message}`);
    return false;
  }
}

async function createIssuesFromCSV() {
  try {
    const csvFilePath = path.resolve(__dirname, "issues.csv");
    const issues = [];
    const repo = "irep-spain/irep-tts";

    // Parse the CSV file
    const spinner = ora("Parsing CSV file...").start();
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on("data", (row) => {
          issues.push(row);
        })
        .on("end", resolve)
        .on("error", reject);
    });
    spinner.succeed(`✅ Found ${issues.length} issues to create.`);

    for (const [index, issue] of issues.entries()) {
      const title = issue.title;
      const body = issue.body;
      const labels = issue.labels.split(",").map((label) => label.trim());

      const issueSpinner = ora(
        `Processing issue ${index + 1}/${issues.length}: ${title}`
      ).start();

      try {
        // Check if issue already exists
        if (await issueExists(title, repo)) {
          issueSpinner.info(`📝 Skipping existing issue: ${title}`);
          continue;
        }

        // Ensure all labels exist
        const labelResults = await Promise.all(
          labels.map((label) => ensureLabelExists(label, repo))
        );

        if (labelResults.every(Boolean)) {
          const command = `gh issue create --title "${title}" --body "${body}" --label "${labels.join(
            ","
          )}" --repo ${repo}`;
          const { stdout } = await execAsync(command);

          issueSpinner.succeed(`✅ Created new issue: ${title}`);
          console.log(`   🌐 Issue URL: ${stdout.trim()}`);
        } else {
          issueSpinner.fail(
            `❌ Skipped issue: ${title} due to label creation failure`
          );
        }
      } catch (error) {
        issueSpinner.fail(`❌ Error creating issue: ${title}`);
        console.error(`   ❌ Error details: ${error.message}`);
      }
    }

    console.log("\n🎉 All issues have been processed!");
  } catch (error) {
    console.error("❌ Failed to read or process the CSV file:", error);
    process.exit(1);
  }
}

createIssuesFromCSV().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
