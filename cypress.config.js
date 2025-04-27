const { defineConfig } = require('cypress');
const { startDevServer } = require('@cypress/webpack-dev-server');
const webpackPreprocessor = require('@cypress/webpack-preprocessor');
const fs = require('fs');
const path = require('path');

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // Register tasks
      on('task', {
        debugTask() {
          process.stdout.write('Debug task triggered.\n');
          return null;
        },
        logCoverage(coverage) {
          process.stdout.write('logCoverage task triggered.\n');
          process.stdout.write(`Coverage data received:\n${JSON.stringify(coverage, null, 2)}\n`);
          return null;
        },
        writeCoverage(coverage) {
          process.stdout.write('writeCoverage task triggered.\n');
          const nycOutputDir = path.resolve('.nyc_output');

          if (!fs.existsSync(nycOutputDir)) {
            fs.mkdirSync(nycOutputDir, { recursive: true });
            process.stdout.write('.nyc_output directory created.\n');
          }

          const coverageFile = path.join(nycOutputDir, 'out.json');
          try {
            fs.writeFileSync(coverageFile, JSON.stringify(coverage, null, 2));
            process.stdout.write(`Coverage data written to: ${coverageFile}\n`);
          } catch (err) {
            console.error('Error writing coverage data:', err);
          }

          return null;
        },
      });

      process.stdout.write('Tasks registered successfully.\n');

      // Use custom Webpack dev server
      on('dev-server:start', async (options) => {
        console.log('Starting custom Webpack dev server...');
        const webpackConfig = {
          resolve: {
            extensions: ['.js', '.jsx', '.ts', '.tsx'],
          },
          module: {
            rules: [
              {
                test: /\.(js|jsx|ts|tsx)$/,
                exclude: /node_modules/,
                use: {
                  loader: 'babel-loader',
                  options: {
                    presets: ['@babel/preset-env', '@babel/preset-react'],
                    plugins: ['istanbul'], // Add instrumentation for coverage
                  },
                },
              },
            ],
          },
        };

        console.log('Custom Webpack dev server configured with Babel plugin for Istanbul.');

        return startDevServer({
          options,
          webpackConfig,
        });
      });

      return config;
    },
    baseUrl: process.env.CYPRESS_baseUrl || 'http://127.0.0.1:8000', // Use the dynamically set baseUrl
    defaultCommandTimeout: 10000, // Increase timeout to 10 seconds
    responseTimeout: 10000, // Increase response timeout to 10 seconds
    supportFile: 'cypress/support/index.js', // Path to the support file
    specPattern: 'src/**/*.spec.js', // Updated to include spec files in the `src/js` folder
  },
  video: false, // Disable video recording for faster test runs
  screenshotsFolder: 'cypress/screenshots', // Folder for screenshots
  videosFolder: 'cypress/videos', // Folder for videos
  reporter: 'spec', // Use the "spec" reporter for test output
});
