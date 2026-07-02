import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.resolve(__dirname, '../src/data');

const files = {
  'Properties.json': 'https://raw.githubusercontent.com/LadybirdBrowser/ladybird/refs/heads/master/Libraries/LibWeb/CSS/Properties.json',
  'Units.json': 'https://raw.githubusercontent.com/LadybirdBrowser/ladybird/refs/heads/master/Libraries/LibWeb/CSS/Units.json',
  'TransformFunctions.json': 'https://raw.githubusercontent.com/LadybirdBrowser/ladybird/refs/heads/master/Libraries/LibWeb/CSS/TransformFunctions.json'
};

async function downloadFile(name, url) {
  const outputPath = path.join(outputDir, name);
  console.log(`Downloading ${url} -> ${outputPath}`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }
  const text = await response.text();
  fs.writeFileSync(outputPath, text, 'utf-8');
}

async function main() {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const [name, url] of Object.entries(files)) {
    try {
      await downloadFile(name, url);
    } catch (error) {
      console.error(`Error downloading ${name}:`, error);
      process.exit(1);
    }
  }
  console.log('All files downloaded successfully.');
}

main();
