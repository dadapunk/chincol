# Chincol

A simple CLI tool to create GitHub issues from a CSV file using the GitHub CLI (`gh`).  
This tool imports issues defined in a CSV file into a GitHub repository. It also ensures that required labels exist (creating them if missing).

## Features

- Reads a CSV file with columns: `title`, `body`, and `labels`
- Uses the GitHub CLI to create issues in a specified repository
- Checks for and creates missing labels automatically
- Uses Ora for progress spinners and emoticons for log output

## Prerequisites

- [Node.js](https://nodejs.org/) (v14 or above recommended)
- [GitHub CLI (gh)](https://cli.github.com/) installed and authenticated (run `gh auth login`)
- An existing GitHub repository where issues will be created

## Installation

### From Source

Clone the repository and install dependencies:

```bash
git clone <your-repository-url>
cd <your-repository-folder>
npm install
```

git remote add origin <your-repository-url>
