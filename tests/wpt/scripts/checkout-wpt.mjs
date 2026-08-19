#!/usr/bin/env node

import path from 'path';
import { fileURLToPath } from 'url';
import { exit } from 'node:process';
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, mkdirSync } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoUrl = 'https://github.com/web-platform-tests/wpt.git';
const wptDir = path.resolve(__dirname, '..');
const checkoutDir = path.join(wptDir, 'src');
const commitFilePath = path.join(wptDir, 'wpt-commit.txt');
const execEnv = { stdio: [0, 1, 2] };

if (!existsSync(commitFilePath)) {
  console.error(`Error: Commit file not found at ${commitFilePath}`);
  exit(1);
}

const targetCommit = readFileSync(commitFilePath, 'utf8').trim();
if (!targetCommit) {
  console.error(`Error: Commit file ${commitFilePath} is empty`);
  exit(1);
}

function getCurrentCommit() {
  try {
    return execSync('git rev-parse HEAD', { cwd: checkoutDir, stdio: 'pipe' }).toString().trim();
  } catch (e) {
    return null;
  }
}

function isAtTargetCommit(current, target) {
  if (!current) return false;
  return current === target || current.startsWith(target) || target.startsWith(current);
}

if (existsSync(checkoutDir)) {
  const current = getCurrentCommit();
  if (isAtTargetCommit(current, targetCommit)) {
    console.log(`WPT checkout is already at commit ${targetCommit} (${current.slice(0, 9)})`);
    exit(0);
  }

  console.log(`Switching WPT checkout to commit ${targetCommit}...`);
  try {
    execSync(`git checkout --force ${targetCommit}`, { ...execEnv, cwd: checkoutDir });
    console.log(`Checked out WPT commit ${targetCommit}`);
    exit(0);
  } catch (e) {
    console.log(`Commit ${targetCommit} not found locally, fetching...`);
  }
} else {
  console.log(`Cloning WPT at commit ${targetCommit}...`);
  mkdirSync(checkoutDir, { recursive: true });
  execSync('git init', { cwd: checkoutDir, stdio: 'pipe' });
  execSync(`git remote add origin ${repoUrl}`, { cwd: checkoutDir, stdio: 'pipe' });
}

// Fetch target commit
let fetched = false;
try {
  execSync(`git fetch --depth 1 origin ${targetCommit}`, { cwd: checkoutDir, stdio: 'pipe' });
  fetched = true;
} catch (e) {
  // Direct fetch by SHA failed (e.g. short SHA or server restriction)
}

if (!fetched) {
  console.log('Fetching master shallowly...');
  execSync(`git fetch --depth 50 origin master`, { ...execEnv, cwd: checkoutDir });
  let hasCommit = false;
  try {
    execSync(`git rev-parse --verify ${targetCommit}`, { cwd: checkoutDir, stdio: 'pipe' });
    hasCommit = true;
  } catch (e) {}

  if (!hasCommit) {
    console.log('Deepening fetch to find commit...');
    execSync(`git fetch --depth 500 origin master`, { ...execEnv, cwd: checkoutDir });
  }
}

execSync(`git checkout --force ${targetCommit}`, { ...execEnv, cwd: checkoutDir });
console.log(`Checked out WPT commit ${targetCommit}`);
exit(0);
