import { initGenesys, genesysLogin } from './genesys/genesysClient.js';
import { getGenesysOrgName, consult } from './genesys/genesysApi.js';
import { validatePhoneNumber, formatPhoneNumber } from './utils/phoneUtils.js';
import { initDivs, displayMessage } from './utils/domUtils.js';
import { manageWindow } from './utils/windowUtils.js';
import { handleError } from './errorHandler.js';

window.addEventListener('load', async () => {
  try {
    console.log('Initializing application...');
    initDivs(); // Ensure divs are initialized

    await manageWindow();

    const phoneNumber = validatePhoneNumber();
    if (!phoneNumber) {
      console.error('No phone number provided. Exiting application.');
      return; // Exit early if no phone number is provided
    }

    const formattedPhoneNumber = formatPhoneNumber(phoneNumber);

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
