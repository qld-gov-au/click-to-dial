const { startDevServer } = require('@cypress/webpack-dev-server');
const findReactScriptsWebpackConfig = require('@cypress/react/plugins/react-scripts/findReactScriptsWebpackConfig');

module.exports = (on, config) => {
  console.log('Initializing Cypress plugins...');

  // Temporarily disable code coverage
  // require('@cypress/code-coverage/task')(on, config);

  // Merge process.env with config.env without overwriting existing values
  config.env = {
    ...process.env, // Add environment variables from process.env
    ...config.env,  // Preserve existing config.env values, including `codeCoverageTasksRegistered`
  };

  // Debug coverage task
  on('task', {
    logCoverage(coverage) {
      console.log('logCoverage task triggered.');
      console.log('Coverage data received:', JSON.stringify(coverage, null, 2));
      return null;
    },
    writeCoverage(coverage) {
      console.log('writeCoverage task triggered.');
      const fs = require('fs');
      const path = require('path');
      const nycOutputDir = path.resolve('.nyc_output');

      if (!fs.existsSync(nycOutputDir)) {
        fs.mkdirSync(nycOutputDir, { recursive: true });
        console.log('.nyc_output directory created.');
      }

      const coverageFile = path.join(nycOutputDir, 'out.json');
      try {
        fs.writeFileSync(coverageFile, JSON.stringify(coverage, null, 2));
        console.log(`Coverage data written to: ${coverageFile}`);
      } catch (err) {
        console.error('Error writing coverage data:', err);
      }

      return null;
    },
    checkRemoteEnvironment() {
      // Simulate checking the remote environment connection
      const isConnected = process.env.REMOTE_ENV_CONNECTED === 'true'; // Use an environment variable
      console.log(`Remote environment connected: ${isConnected}`);
      return isConnected;
    },
  });

  console.log('Configuring custom Webpack dev server...');
  on('dev-server:start', async (options) => {
    const webpackConfig = findReactScriptsWebpackConfig(config, {
      webpackConfigPath: 'react-scripts/config/webpack.config',
    });

    // Add babel-plugin-istanbul to the Babel loader
    const rules = webpackConfig.module.rules.find((rule) => !!rule.oneOf).oneOf;
    const babelRule = rules.find((rule) => /babel-loader/.test(rule.loader));
    babelRule.options.plugins.push(require.resolve('babel-plugin-istanbul'));

    console.log('Custom Webpack dev server configured with Babel plugin for Istanbul.');

    return startDevServer({
      options,
      webpackConfig,
    });
  });

  return config;
};