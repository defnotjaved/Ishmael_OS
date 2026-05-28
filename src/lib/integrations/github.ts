import { getToken } from "@/lib/integrations/token-store";

export type GitHubIssue = {
  id: number;
  number: number;
  title: string;
  url: string;
  repoName: string;
  state: "open" | "closed";
  updatedAt: string;
  labels: string[];
};

type RawIssue = {
  id: number;
  number: number;
  title: string;
  html_url: string;
  repository_url?: string;
  state: string;
  updated_at: string;
  labels: { name: string }[];
};

export async function fetchAssignedIssues(userId: string, max = 15): Promise<GitHubIssue[]> {
  const token = await getToken(userId, "github");
  if (!token) return [];

  const res = await fetch(
    `https://api.github.com/issues?filter=assigned&state=open&per_page=${max}`,
    {
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      next: { revalidate: 300 },
    }
  );

  if (!res.ok) return [];

  const issues = (await res.json()) as RawIssue[];

  return issues.map((i) => {
    const repoName = i.repository_url
      ? i.repository_url.replace("https://api.github.com/repos/", "")
      : "unknown/repo";
    return {
      id: i.id,
      number: i.number,
      title: i.title,
      url: i.html_url,
      repoName,
      state: i.state === "open" ? "open" : "closed",
      updatedAt: i.updated_at,
      labels: i.labels.map((l) => l.name),
    };
  });
}
