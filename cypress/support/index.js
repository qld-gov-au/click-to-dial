import '@cypress/code-coverage/support';

// Log and write coverage data for debugging
Cypress.on('window:before:unload', (win) => {
  console.log('window:before:unload event triggered.');
  if (win.__coverage__) {
    console.log('Coverage data found on window.__coverage__:');
    console.log(JSON.stringify(win.__coverage__, null, 2)); // Log coverage data for debugging
    cy.task('logCoverage', win.__coverage__).then(() => {
      console.log('logCoverage task completed.');
    }).catch((err) => {
      console.error('Error in logCoverage task:', err);
    });
    cy.task('writeCoverage', win.__coverage__).then(() => {
      console.log('writeCoverage task completed.');
    }).catch((err) => {
      console.error('Error in writeCoverage task:', err);
    });
  } else {
    console.warn('No coverage data found on window.__coverage__ during unload.');
  }
});