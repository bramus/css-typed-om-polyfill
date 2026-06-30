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
        }
      }
    }
  } else {
    console.error('Invalid data format: "results" array not found.');
    process.exit(1);
  }

  console.log(`Writing output to ${outputPath}...`);
  fs.writeFileSync(outputPath, output, 'utf8');
  console.log('Done!');

} catch (error) {
  console.error('Error processing WPT report:', error);
  process.exit(1);
}
