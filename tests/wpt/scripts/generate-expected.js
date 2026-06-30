import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const reportPath = path.join(__dirname, '..', 'report', 'data.json');
const outputPath = path.join(__dirname, '..', 'expected.txt');

try {
  console.log(`Reading report from ${reportPath}...`);
  const rawData = fs.readFileSync(reportPath, 'utf8');
  console.log('Parsing JSON...');
  const data = JSON.parse(rawData);

  let output = '';
  let passCount = 0;
  let failCount = 0;
  let totalCount = 0;

  if (data && Array.isArray(data.results)) {
    console.log(`Processing ${data.results.length} results...`);
    
    // Sort results by test path to ensure deterministic output order
    const sortedResults = [...data.results].sort((a, b) => {
      const pathA = a.test || '';
      const pathB = b.test || '';
      return pathA.localeCompare(pathB);
    });

    for (const result of sortedResults) {
      // Parent test
      const testPath = result.test;
      const status = result.status;
      output += `${status}\t${testPath}\n`;

      if (!result.subtests || result.subtests.length === 0) {
        totalCount++;
        if (status === 'OK') {
          passCount++;
        } else {
          failCount++;
        }
      }

      // Subtests
      if (Array.isArray(result.subtests)) {
        // Sort subtests by name to ensure deterministic output order
        const sortedSubtests = [...result.subtests].sort((a, b) => {
          const nameA = a.name || '';
          const nameB = b.name || '';
          return nameA.localeCompare(nameB);
        });
        for (const subtest of sortedSubtests) {
          const subtestName = subtest.name;
          const subtestStatus = subtest.status;
          output += `- ${subtestStatus}\t${subtestName}\n`;

          totalCount++;
          if (subtestStatus === 'PASS') {
            passCount++;
          } else {
            failCount++;
          }
        }
      }
    }
  } else {
    console.error('Invalid data format: "results" array not found.');
    process.exit(1);
  }

  console.log(`Writing output to ${outputPath}...`);
  fs.writeFileSync(outputPath, output, 'utf8');

  // Update README.md
  const readmePath = path.join(__dirname, '..', '..', '..', 'README.md');
  console.log(`Updating README.md at ${readmePath}...`);
  if (fs.existsSync(readmePath)) {
    let readmeContent = fs.readFileSync(readmePath, 'utf8');
    const startTag = '<!-- WPT_STATUS_START -->';
    const endTag = '<!-- WPT_STATUS_END -->';
    
    const startIndex = readmeContent.indexOf(startTag);
    const endIndex = readmeContent.indexOf(endTag);
    
    if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
      const before = readmeContent.substring(0, startIndex + startTag.length);
      const after = readmeContent.substring(endIndex);
      const replacement = `\n- PASS: ${passCount} / ${totalCount}\n- FAIL: ${failCount} / ${totalCount}\n`;
      
      readmeContent = before + replacement + after;
      fs.writeFileSync(readmePath, readmeContent, 'utf8');
      console.log('README.md updated successfully.');
    } else {
      console.warn('Could not find WPT_STATUS tags in README.md');
    }
  } else {
    console.warn(`README.md not found at ${readmePath}`);
  }

  console.log('Done!');

} catch (error) {
  console.error('Error processing WPT report:', error);
  process.exit(1);
}

