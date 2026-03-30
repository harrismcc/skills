#!/usr/bin/env bun
/**
 * Fetch all open PRs for the authenticated user on a given repo,
 * then output a structured summary + per-PR details.
 *
 * Usage: bun scripts/fetch-and-summarize.ts <repo>
 * Example: bun scripts/fetch-and-summarize.ts Infilla/infilla-app
 */
import { $ } from 'bun';

const repo = process.argv[2];
if (!repo) {
  console.error('Usage: bun fetch-and-summarize.ts <repo>');
  process.exit(1);
}

interface PrData {
  number: number;
  title: string;
  createdAt: string;
  updatedAt: string;
  isDraft: boolean;
  headRefName: string;
  body: string;
  labels: { name: string }[];
}

const raw =
  await $`gh pr list --repo ${repo} --author @me --state open --json number,title,createdAt,updatedAt,isDraft,headRefName,body,labels --limit 50`.text();

const prs: PrData[] = JSON.parse(raw).sort(
  (a: PrData, b: PrData) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
);

if (prs.length === 0) {
  console.log('No open PRs found.');
  process.exit(0);
}

const drafts = prs.filter((pr) => pr.isDraft);
const ready = prs.filter((pr) => !pr.isDraft);

function ago(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days < 1) return 'today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months === 1) return '1 month ago';
  return `${months} months ago`;
}

function truncateBody(body: string, maxLen = 200): string {
  if (!body?.trim()) return 'No description';
  const cleaned = body.replace(/<!--[\s\S]*?-->/g, '').trim();
  const firstChunk = cleaned.split('\n\n').slice(0, 2).join(' ').trim();
  if (firstChunk.length <= maxLen) return firstChunk;
  return `${firstChunk.slice(0, maxLen)}...`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// --- Summary ---
console.log('## PR Summary\n');
console.log(`- **Total open PRs**: ${prs.length}`);
console.log(`- **Drafts**: ${drafts.length}`);
console.log(`- **Ready for review**: ${ready.length}`);
console.log(`- **Oldest**: #${prs[0].number} ${prs[0].title} (${ago(prs[0].createdAt)})`);

const mostRecent = [...prs].sort(
  (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
)[0];
console.log(
  `- **Most recently updated**: #${mostRecent.number} ${mostRecent.title} (${ago(mostRecent.updatedAt)})`,
);

// --- Per-PR details ---
console.log('\n---\n');
console.log('## PRs (oldest first)\n');

for (const pr of prs) {
  const status = pr.isDraft ? 'Draft' : 'Ready for review';
  const labels = pr.labels.map((l) => l.name).join(', ') || 'none';
  console.log(`### PR #${pr.number}: ${pr.title}`);
  console.log(`- **Status**: ${status}`);
  console.log(`- **Branch**: \`${pr.headRefName}\``);
  console.log(`- **Created**: ${ago(pr.createdAt)} (${formatDate(pr.createdAt)})`);
  console.log(`- **Last updated**: ${ago(pr.updatedAt)} (${formatDate(pr.updatedAt)})`);
  console.log(`- **Labels**: ${labels}`);
  console.log(`- **Description**: ${truncateBody(pr.body)}`);
  console.log();
}
