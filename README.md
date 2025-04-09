# Chincol

<img src="./image.png" alt="Chincol" width="200" height="auto">

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![npm version](https://badge.fury.io/js/chincol.svg)](https://badge.fury.io/js/chincol)
[![npm downloads](https://img.shields.io/npm/dm/chincol.svg)](https://www.npmjs.com/package/chincol)

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

```bash
npm install -g chincol
```

## Usage

1. Create a CSV file named `issues.csv` with the following columns:
   - title: The issue title
   - body: The issue description
   - labels: Comma-separated labels

Example `issues.csv`:

```csv
title,body,labels
"Bug Report","This needs to be fixed","bug,urgent"
"Feature Request","Add new feature","enhancement"
```

2. Run the tool:

```bash
chincol --repo "username/repository"
```

## Options

--repo: GitHub repository in format "username/repository"
--file: Path to CSV file (default: "./issues.csv")

### From Source

Clone the repository and install dependencies:

```bash
git clone <your-repository-url>
cd <your-repository-folder>
npm install
```

git remote add origin <your-repository-url>
