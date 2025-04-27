//       10        20        30        40        50        60        70        8
import { initGenesys, genesysLogin, getGenesysOrgName, consult } from './genesys/genesysUtils.js';
import { initDivs } from './utils/domUtils.js';
import { getWindow, finish } from './utils/windowUtils.js';
import { getPhoneNumber } from './utils/phoneUtils.js';
import { handleError } from './errorHandler.js';



/* =============================================================================

  Click to Dial Integration with Genesys Cloud

  Supports click-to-dial using tel: links on any web site

  tel protocol handler in manifest.json tells windows to call
        <web site>/click-to-dial/gccx/progressive_web_app/telbph.html?num=%s"
  %s is the phone number clicked
  telbph.html runs ctd_pwa_consult.js (this script)

  See "Click-To-Dial PWA Architecture and Design - Consult Only.docx" for
    more info

============================================================================= */


/* -----------------------------------------------------------------------------
                           INITIALISATION
----------------------------------------------------------------------------- */

/*jslint es6 */

// timeout, in ms, to close PWA window
export const PWA_WIN_TIMEOUT = 5000;

// increase time to allow time to copy error message before closing PWA window
export const PWA_WIN_TIMEOUT_ERR = 120000;

// increase time to before displaying click ok to exit in debug mode
//const PWA_WIN_TIMEOUT_DEBUG = 600000;
export const PWA_WIN_TIMEOUT_DEBUG = 600000;

export var DEBUG;

if (window.location.hostname === "localhost") {DEBUG=true;} else {DEBUG=false;}
//DEBUG = true;

if (DEBUG) { alert(`Open Dev Tools (F12) for now full debuging`); }


/* -----------------------------------------------------------------------------
  Note, In a browser extension DOMContentLoaded has already fired. Hence the
  wait for load event below.
  This code is common with my browser extension code.
----------------------------------------------------------------------------- */

//       10        20        30        40        50        60        70        8

/* -----------------------------------------------------------------------------
  get org and id and OAuth client id  for that Genesys org
----------------------------------------------------------------------------- */

function getGenesysClientId() {

  let oauthId;

  oauthId = document.querySelector("meta[name='genesys-env']");
  oauthId = oauthId ? oauthId.getAttribute("content") : "no-clientId-found";

  if (DEBUG) {
    console.log(`ctd_pwajs::getGenesysClientId() OAuth clientId ${oauthId}`);
  }

  return oauthId;
}



window.addEventListener("load", async () => {
 try {
      console.log("ctd_pwajs::inititialise: windows event: loaded");
      initDivs();

      let isPwa = await getWindow();
      if (!isPwa) return;	// exit
      let phoneNumber = await getPhoneNumber();
      if (!phoneNumber) { 
        console.error('No phone number provided. Exiting application.');
        return; // Exit early if no phone number is provided
      }

      let client = initGenesys();
      
      console.log('Genesys SDK initialized:', client);
      let genesysClientId = getGenesysClientId();
      
      console.log('Logging in to Genesys...');
      await genesysLogin(client, phoneNumber,genesysClientId);
      console.log('Genesys login completed.');

      let orgName = await getGenesysOrgName();
      document.getElementById("gen_msg").innerHTML=orgName;
      await consult(phoneNumber);

  } catch (error) {

      console.log(`"ctd_pwajs::global error handler caught error:`,error);
      handleError(error); // Ensure the error is handled and displayed in the UI

      // genesys errors don't return a stack trace, so use e.message for Genesys
      let errMsg = 'stack' in error ? error.stack :  error.message;

      let msg = `<div class="tel_pwa_err">Referral unsuccessful.<br><br>An error has occurred. Please report this to your Team Leader. 
                <br><br>${errMsg.replace(/\n/g, "<br>")}</div>`;

      await finish(msg, PWA_WIN_TIMEOUT_ERR);
  }
});
