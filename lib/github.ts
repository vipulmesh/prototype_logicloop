export interface CandidateProfileLinks {
  githubUrl: string | null;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
}

export interface GitHubProfileInsights {
  username: string;
  repositoryCount: number;
  followers: number;
  following: number;
  primaryLanguages: string[];
  pinnedRepositories: Array<{ name: string; description: string | null; url: string; language: string | null }>;
  totalContributions: number | null;
}

const stripTrailingPunctuation = (url: string) => url.replace(/[),.;]+$/, '');

function normalizedUrl(value: string) {
  const url = stripTrailingPunctuation(value.trim());
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function firstMatch(text: string, expression: RegExp) {
  const match = text.match(expression);
  return match?.[0] ? normalizedUrl(match[0]) : null;
}

export function extractCandidateProfileLinks(text: string): CandidateProfileLinks {
  const githubUrl = firstMatch(text, /(?:https?:\/\/)?(?:www\.)?github\.com\/[A-Za-z0-9-]+\/?/i);
  const linkedinUrl = firstMatch(text, /(?:https?:\/\/)?(?:[a-z]{2,3}\.)?linkedin\.com\/in\/[A-Za-z0-9-_%]+\/?/i);
  const urls = text.match(/(?:https?:\/\/)?(?:www\.)?(?:[A-Za-z0-9-]+\.)+[A-Za-z]{2,}(?:\/[^\s<>()]*)?/gi) ?? [];
  const portfolioUrl = urls
    .map((url) => normalizedUrl(url))
    .find((url) => {
      try {
        const host = new URL(url).hostname.replace(/^www\./, '').toLowerCase();
        return host !== 'github.com' && host !== 'linkedin.com' && !host.endsWith('.linkedin.com');
      } catch {
        return false;
      }
    }) ?? null;

  return { githubUrl, linkedinUrl, portfolioUrl };
}

function githubHeaders() {
  const token = process.env.GITHUB_TOKEN;
  return {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'TalentAI',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function githubUsername(githubUrl: string) {
  try {
    const pathname = new URL(githubUrl).pathname.split('/').filter(Boolean)[0];
    return pathname && /^[A-Za-z0-9-]+$/.test(pathname) ? pathname : null;
  } catch {
    return null;
  }
}

export async function fetchGitHubProfileInsights(githubUrl: string): Promise<GitHubProfileInsights | null> {
  const username = githubUsername(githubUrl);
  if (!username) return null;

  try {
    const headers = githubHeaders();
    const [profileResponse, repositoriesResponse] = await Promise.all([
      fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, { headers, cache: 'no-store' }),
      fetch(`https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`, { headers, cache: 'no-store' }),
    ]);
    if (!profileResponse.ok || !repositoriesResponse.ok) return null;

    const profile = await profileResponse.json() as { login?: string; public_repos?: number; followers?: number; following?: number };
    const repositories = await repositoriesResponse.json() as Array<{ name?: string; description?: string | null; html_url?: string; language?: string | null; fork?: boolean }>;
    const languages = Array.from(new Set(repositories.filter((repo) => !repo.fork).map((repo) => repo.language).filter((language): language is string => Boolean(language)))).slice(0, 8);

    const insights: GitHubProfileInsights = {
      username: profile.login || username,
      repositoryCount: profile.public_repos ?? repositories.length,
      followers: profile.followers ?? 0,
      following: profile.following ?? 0,
      primaryLanguages: languages,
      pinnedRepositories: [],
      totalContributions: null,
    };

    if (!process.env.GITHUB_TOKEN) return insights;

    const graphResponse = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: `query($login: String!) { user(login: $login) { pinnedItems(first: 6, types: REPOSITORY) { nodes { ... on Repository { name description url primaryLanguage { name } } } } contributionsCollection { contributionCalendar { totalContributions } } } }`, variables: { login: insights.username } }),
      cache: 'no-store',
    });
    if (!graphResponse.ok) return insights;

    const graph = await graphResponse.json() as { data?: { user?: { pinnedItems?: { nodes?: Array<{ name?: string; description?: string | null; url?: string; primaryLanguage?: { name?: string | null } | null }> }; contributionsCollection?: { contributionCalendar?: { totalContributions?: number } } } } };
    const user = graph.data?.user;
    insights.pinnedRepositories = (user?.pinnedItems?.nodes ?? []).filter((repo) => repo.name && repo.url).map((repo) => ({ name: repo.name as string, description: repo.description ?? null, url: repo.url as string, language: repo.primaryLanguage?.name ?? null }));
    insights.totalContributions = user?.contributionsCollection?.contributionCalendar?.totalContributions ?? null;
    return insights;
  } catch (error) {
    console.warn('GitHub profile enrichment unavailable', { githubUrl, error: error instanceof Error ? error.message : 'Unknown error' });
    return null;
  }
}
