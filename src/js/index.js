import { initGenesys, genesysLogin } from './genesys/genesysClient.js';
import { getGenesysOrgName, consult } from './genesys/genesysApi.js';
import { getPhoneNumber } from './utils/phoneUtils.js';
import { initDivs, displayMessage } from './utils/domUtils.js';
import { manageWindow } from './utils/windowUtils.js';
import { handleError } from './errorHandler.js';

// Expose functions to the window object for Cypress tests
if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
  (async () => {
    try {
      window.getPhoneNumber = getPhoneNumber; // Expose getPhoneNumber to the window object

      // Log coverage data for debugging
      if (window.__coverage__) {
        console.log('Coverage data is available on window.__coverage__:', window.__coverage__);
        handleError('Coverage data is available on window.__coverage__:', window.__coverage__);
      } else {
        console.warn('No coverage data found on window.__coverage__.');
        handleError('Coverage data is available on window.__coverage__:', window.__coverage__);
      }
    } catch (error) {
      console.error('Error initializing phone number:', error);
    }
  })();
}

window.addEventListener('load', async () => {
  try {
    console.log("ctd_pwajs::inititialise: windows event: loaded");
    console.log('Initializing application...');
    initDivs(); // Ensure divs are initialized

    await manageWindow();

    const phoneNumber = await getPhoneNumber(); // Get the phone number from URL parameters
    if (!phoneNumber) { 
      console.error('No phone number provided. Exiting application.');
      return; // Exit early if no phone number is provided
    }

    const client = initGenesys(); // This will throw an error if the SDK is not initialized

    const genesysClientId = document.querySelector("meta[name='genesys-env']").content;

    await genesysLogin(client, formattedPhoneNumber, genesysClientId);

    const orgName = await getGenesysOrgName();

    displayMessage('gen_msg', orgName); // Only update the UI with meaningful data

    await consult(formattedPhoneNumber);
  } catch (error) {
    console.error('Error during initialization:', error);
    handleError(error); // Ensure the error is handled and displayed in the UI
  }
});
