#!/usr/bin/env node

import path from 'path';
import { fileURLToPath } from 'url';
import { exit } from 'node:process';
import { execSync } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoUrl = 'https://github.com/web-platform-tests/wpt.git';
const wptDir = path.resolve(__dirname, '..');
const checkoutDir = path.join(wptDir, 'src');
const commitFilePath = path.join(wptDir, 'wpt-commit.txt');
const execEnv = { stdio: [0, 1, 2] };

if (!existsSync(checkoutDir)) {
  console.log('WPT not checked out yet. Cloning master...');
  execSync(`git clone --depth 50 --branch master --single-branch ${repoUrl} ${checkoutDir}`, { ...execEnv });
} else {
  console.log('Updating WPT to latest master...');
  try {
    execSync('git checkout master', { ...execEnv, cwd: checkoutDir });
  } catch (e) {
    execSync('git checkout -B master origin/master', { ...execEnv, cwd: checkoutDir });
  }
  execSync('git pull --ff-only', { ...execEnv, cwd: checkoutDir });
}

const newCommit = execSync('git rev-parse --short=9 HEAD', { cwd: checkoutDir, stdio: 'pipe' }).toString().trim();
writeFileSync(commitFilePath, `${newCommit}\n`, 'utf8');

console.log(`Updated WPT to commit ${newCommit} and saved to ${commitFilePath}`);
exit(0);
