const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const jestCoveragePath = path.resolve('coverage/coverage-final.json');
const cypressCoveragePath = path.resolve('.nyc_output/out.json');
const outputPath = path.resolve('.nyc_output/merged-coverage.json');

if (!fs.existsSync(jestCoveragePath)) {
  console.error('Jest coverage report is missing:', jestCoveragePath);
  process.exit(1);
}

if (!fs.existsSync(cypressCoveragePath)) {
  console.error('Cypress coverage report is missing:', cypressCoveragePath);
  process.exit(1);
}

// Merge coverage reports
console.log('Merging coverage reports...');
const jestCoverage = JSON.parse(fs.readFileSync(jestCoveragePath, 'utf8'));
const cypressCoverage = JSON.parse(fs.readFileSync(cypressCoveragePath, 'utf8'));

const mergedCoverage = { ...jestCoverage, ...cypressCoverage };
fs.writeFileSync(outputPath, JSON.stringify(mergedCoverage, null, 2));

console.log('Merged coverage report created at:', outputPath);

// Generate the final report
console.log('Generating final coverage report...');
execSync('nyc report --reporter=html', { stdio: 'inherit' });
