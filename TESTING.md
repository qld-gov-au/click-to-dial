# Testing Guide

This document provides details on how to run and organize tests for the `genesys-click-to-dial` project.

---

## Unit Tests

### Framework
- **Jest** is used for unit testing.
- Unit tests are located alongside the code they test, with filenames following the pattern `*.test.js`.

### Running Unit Tests
To run all unit tests:
```bash
npm run test
```

To run tests in watch mode:
```bash
npm run test:watch
```

To generate a coverage report:
```bash
npm run test:coverage
```

### Coverage
- Jest coverage reports are generated in the `coverage/` directory.
- Coverage includes all JavaScript files except:
  - Files in `node_modules/`
  - Build output in `dist/`
  - Test files themselves (`*.test.js` and `*.spec.js`)

---

## Integration and End-to-End Tests

### Framework
- **Cypress** is used for integration and end-to-end testing.
- Cypress spec files are located alongside the code they test, with filenames following the pattern `*.spec.js`.

### Spec File Organization
- Spec files are placed in the same directory as the code they test. For example:
  - Code: `src/js/utils/phoneUtils.js`
  - Test: `src/js/utils/phoneUtils.spec.js`

### Running Cypress Tests
To run all Cypress tests:
```bash
npm run cypress:run
```

To open the Cypress Test Runner:
```bash
npm run cypress:open
```

### Configuration
- The `cypress.config.js` file specifies the test configuration.
- The `specPattern` is set to `src/js/**/*.spec.js` to include spec files in the `src/js` directory.

---

## Coverage Merging

### Overview
- Jest and Cypress coverage reports are merged using the `merge-coverage.js` script.
- The merged report is generated in `.nyc_output/merged-coverage.json`.

### Running Coverage Merge
To merge coverage reports and generate the final report:
```bash
npm run coverage:merge
```

### Coverage Report Location
- The final coverage report is available in the `coverage/` directory as an HTML file.

---

## Example Test Locations

| Code File                          | Unit Test File                     | Cypress Spec File                  |
|------------------------------------|------------------------------------|------------------------------------|
| `src/js/utils/phoneUtils.js`       | `src/js/utils/phoneUtils.test.js`  | `src/js/utils/phoneUtils.spec.js` |
| `src/js/genesys/genesysApi.js`     | `src/js/genesys/genesysApi.test.js`| N/A                                |

---

## Notes
- Cypress tests are designed to run in a browser-like environment and may require the application to be served locally.
- Jest tests simulate a browser environment using `jsdom`.
