# Local Development Guide

This document provides details on setting up and running the application locally for development purposes.

---

## Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd genesys-click-to-dial
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   - This will start the development server and serve the application locally.
   - The browser will automatically open to the application URL (e.g., `http://127.0.0.1:8000`).

4. Build the project for production (if needed):
   ```bash
   npm run build
   ```

5. Serve the production build using `http-server`:
   ```bash
   npm run http-serve
   ```
   - This will serve the `dist` directory at a local address (e.g., `http://127.0.0.1:8080`).

---

## Testing

For details on testing the application, including unit tests and manual testing scenarios, refer to the [Testing Guide](./TESTING.md).

---

## Notes on File Watching

### Files Not Watched by `npm run dev`
1. **Static Files**:
   - Changes to static files like images, icons, or the `manifest.json` file are not automatically watched.
   - Restart the development server or manually copy these files to the `dist` directory.

2. **Service Worker**:
   - Changes to `sw.js` require unregistering the old service worker in the browser and refreshing the page.

3. **Configuration Files**:
   - Changes to `vite.config.js` or `esbuild.config.js` require restarting the development server.

4. **HTML Files**:
   - Changes to `index.html` may not trigger a full reload. Restart the development server if changes are ignored.

5. **Dependencies**:
   - Updates to `node_modules` require restarting the development server.

---

For more details on the PWA's functionality, refer to the [README.md](./readme.md).
