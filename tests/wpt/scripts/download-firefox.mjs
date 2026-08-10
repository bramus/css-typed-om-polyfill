#!/usr/bin/env node

import path from 'path';
import { fileURLToPath } from 'url';
import { exit, argv } from 'node:process';
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const version = argv[2] || '150.0';
const targetDir = path.resolve(__dirname, '../firefox');
const appDir = path.join(targetDir, `Firefox ${version}.app`);
const dmgFile = path.join(targetDir, `Firefox ${version}.dmg`);
const execEnv = { stdio: [0, 1, 2] };

mkdirSync(targetDir, { recursive: true });

if (existsSync(appDir)) {
  console.log(`ℹ The file "Firefox ${version}.app" already exists, no need to download :)`);
} else {
  console.log(`${new Date().toISOString()}: Downloading Firefox ${version}...`);
  if (existsSync(dmgFile)) {
    console.log('✔ File already exists on disk, using that.');
  } else {
    try {
      execSync(`curl -L -s --fail-with-body -o "${dmgFile}" "https://ftp.mozilla.org/pub/firefox/releases/${version}/mac/en-US/Firefox%20${version}.dmg"`, execEnv);
      console.log('✔ done');
    } catch (err) {
      if (existsSync(dmgFile)) {
        rmSync(dmgFile, { force: true });
      }
      console.error(`✗ Could not find specified version: ${version}`);
      exit(1);
    }
  }

  console.log(`${new Date().toISOString()}: Mounting...`);
  try {
    execSync(`hdiutil attach "${dmgFile}" -noverify -nobrowse -quiet`, execEnv);
    console.log('✔ done');
  } catch (err) {
    console.error("✗ Could not mount. Please check if 'Disk Images' are being 'Allowed' within the Restriction profile.");
    exit(1);
  }

  console.log(`${new Date().toISOString()}: Copying Firefox.app...`);
  execSync(`cp -rf "/Volumes/Firefox/Firefox.app" "${appDir}"`, execEnv);

  console.log(`${new Date().toISOString()}: Unmounting...`);
  try {
    execSync(`hdiutil detach "$(/bin/df | /usr/bin/grep "/Volumes/Firefox" | awk '{print $1}')" -quiet`, execEnv);
  } catch (err) {
    // Ignore unmount warning if already detached
  }

  console.log(`${new Date().toISOString()}: Cleaning up`);
  rmSync(dmgFile, { force: true });
}

const profileDir = path.join(targetDir, `.profiles/${version}`);
const userJs = path.join(profileDir, 'user.js');

if (!existsSync(userJs)) {
  console.log(`${new Date().toISOString()}: Creating Profile...`);
  mkdirSync(profileDir, { recursive: true });
  const prefs = `user_pref("app.update.auto", false);
user_pref("app.update.enabled", false);
user_pref("browser.shell.checkDefaultBrowser", false);
user_pref("browser.tabs.remote.autostart", false);
`;
  writeFileSync(userJs, prefs, 'utf8');
  console.log('✔ done');
}
