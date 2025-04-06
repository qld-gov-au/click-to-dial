const { spawn } = require('child_process');
const cypress = require('cypress');
const treeKill = require('tree-kill');
const { execSync } = require('child_process');
const os = require('os');

function killStuckProcess(port) {
  try {
    console.log(`Checking for processes using port ${port}...`);
    let command;

    // Use platform-specific commands
    if (os.platform() === 'win32') {
      command = `netstat -ano | findstr :${port}`;
    } else {
      command = `lsof -i :${port} -t`;
    }

    const result = execSync(command, { stdio: 'pipe' }).toString().trim();
    if (result) {
      const pids = result.split('\n').map((pid) => pid.trim());
      pids.forEach((pid) => {
        console.log(`Killing process with PID: ${pid}`);
        treeKill(pid, 'SIGTERM', (err) => {
          if (err) {
            console.error(`Failed to kill process ${pid}:`, err);
          } else {
            console.log(`Process ${pid} killed successfully.`);
          }
        });
      });
    } else {
      console.log(`No processes found using port ${port}.`);
    }
  } catch (error) {
    if (error.status === 1) {
      console.log(`No processes found using port ${port}.`);
    } else {
      console.error(`Error checking or killing processes on port ${port}:`, error);
    }
  }
}

async function startViteAndRunCypress() {
  const port = 8000; // Port to check and use for Vite
  killStuckProcess(port);

  console.log('Starting Vite server...');
  const viteProcess = spawn('npm', ['run', 'dev'], { shell: true });

  console.log(`Vite process started with PID: ${viteProcess.pid}`);

  let viteStarted = false;
  let viteUrl = null;

  try {
    // Wait for Vite to start with a timeout
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timed out waiting for Vite server to start.'));
      }, 60000); // Increase timeout to 60 seconds

      viteProcess.stdout?.on('data', (data) => {
        const output = data.toString();
        console.log(`[Vite] ${output}`); // Log Vite output for debugging

        const match = output.match(/Local:\s+(http:\/\/127\.0\.0\.1:\d+)/);
        if (match) {
          viteUrl = match[1]; // Extract the URL (e.g., http://127.0.0.1:8000)
          viteStarted = true;
          clearTimeout(timeout); // Clear the timeout
          resolve();
        }
      });

      viteProcess.stderr?.on('data', (data) => {
        console.error(`[Vite Error] ${data.toString()}`);
      });

      viteProcess.on('error', (error) => {
        console.error('Failed to start Vite server:', error);
        clearTimeout(timeout); // Clear the timeout
        reject(error);
      });

      viteProcess.on('close', (code) => {
        if (code !== 0 && !viteStarted) {
          clearTimeout(timeout); // Clear the timeout
          reject(new Error(`Vite server exited with code ${code}`));
        }
      });
    });

    console.log(`Vite server is running at ${viteUrl}. Starting Cypress tests...`);

    // Update Cypress configuration dynamically
    process.env.CYPRESS_baseUrl = viteUrl;

    console.log('Running Cypress tests...');
    await cypress.run(); // Add log to confirm Cypress is being executed
    console.log('Cypress tests completed.');
  } catch (error) {
    console.error('Error occurred during Cypress tests:', error);
    process.exitCode = 1; // Set exit code to indicate failure
  } finally {
    console.log('Shutting down Vite server...');
    await new Promise((resolve) => {
      treeKill(viteProcess.pid, 'SIGTERM', (err) => {
        if (err) {
          console.error('Failed to kill Vite server:', err);
        } else {
          console.log('Vite server shut down successfully.');
        }
        resolve();
      });
    });
  }
}

startViteAndRunCypress();
