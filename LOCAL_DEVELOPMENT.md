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

## Testing Locally

When testing the application locally, keep the following in mind:

### Running in Browser Mode
- The application is designed to run as a PWA. If it is not installed as a PWA, the `manageWindow` function will throw an error in production mode.
- During development (`npm run dev`), the application will log a warning instead of throwing an error, allowing you to test in a browser tab.

### Query Parameters
- The application expects a `num` or `state` query parameter in the URL to provide the phone number.
- Example URL for testing:
  ```
  http://127.0.0.1:8000/index.html?num=+61400000000
  ```
- If the `num` or `state` parameter is missing, the application will log a warning and exit gracefully without throwing an error.

### Service Worker
- The service worker (`service-worker.js`) will cache the necessary files (`index.html`, `bundle.js`, `styles/tel_pwa.css`) for offline functionality.
- Ensure the service worker is registered successfully in the browser console.

### Development Mode
- Use `npm run dev` to start the development server. This will serve the application locally and watch for changes.
- The application will bypass certain production checks (e.g., PWA installation requirement) to facilitate testing.

### Production Mode
- Use `npm run build` to build the application for production.
- Serve the production build using `npm run http-serve`. The application will enforce PWA installation in this mode.

### Error Handling
- Errors are displayed in the `csa_msg` div on the page. Check the browser console for detailed error logs.

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

## Testing Scenarios

1. **Basic Functionality**:
   - Click on one of the phone numbers on the PWA page, or any website that has clickable phone numbers.
   - Verify that the PWA is launched and handles the `tel:` protocol correctly.

2. **Cross-Browser Testing**:
   - Test the PWA in multiple browsers (e.g., Chrome, Edge, Firefox) to ensure compatibility.

3. **Offline Functionality**:
   - Test the PWA's behavior offline by disabling the network in the browser's developer tools.
   - Ensure that cached resources (e.g., `index.html`, CSS, JS) load correctly.

4. **Responsive Design**:
   - Test the PWA on devices with different screen sizes (e.g., desktop, tablet, mobile) to ensure it is responsive.

5. **Error Handling**:
   - Test edge cases, such as invalid `tel:` links or missing resources, to ensure the PWA handles errors gracefully.

---

For more details on the PWA's functionality, refer to the [README.md](./readme.md).
