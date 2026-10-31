export interface GitHubUser {
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
  bio: string | null;
  public_repos: number;
  followers: number;
  created_at: string;
}

export interface GitHubRepo {
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  fork: boolean;
  archived: boolean;
  stargazers_count: number;
  forks_count: number;
  pushed_at: string | null;
  updated_at: string | null;
  topics?: string[];
  language: string | null;
  default_branch: string;
  open_issues_count: number;
}

export interface GitHubIssueItem {
  id: number;
  number: number;
  title: string;
  body: string | null;
  html_url: string;
  labels: Array<string | { name?: string }>;
  comments: number;
  created_at: string;
  updated_at: string;
  repository_url: string;
  pull_request?: unknown;
  state: string;
}

export interface GitHubTreeEntry {
  path: string;
  type: "blob" | "tree" | "commit";
}

export interface GitHubTree {
  tree: GitHubTreeEntry[];
  truncated: boolean;
}

export interface IssueSearchResult {
  items: GitHubIssueItem[];
  totalCount: number;
}
