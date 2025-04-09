export interface Issue {
  title: string;
  body: string;
  labels: string;
}

export interface GithubIssue {
  title: string;
  url: string;
}

export interface CommandResult {
  stdout: string;
  stderr: string;
}

export interface CSVRow {
  title: string;
  body: string;
  labels: string;
}
