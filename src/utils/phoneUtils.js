import { finish } from './windowUtils.js';
import { PWA_WIN_TIMEOUT_ERR } from '../index.js';

/* -----------------------------------------------------------------------------

  Agent does not have token (but logged in Genesys eg cookie)
  * First invoke of this page, num=%s is passed by windows tel protocol launcher
  * Second invoke occurs after redirect from GenesyLogin(redirect_uri) num
    in state paramter

  Agent has token eg previously got token from genesyslogin()
  * num=%s is passed by windows tel protocol launcher.
  * no redirect occurs

  Don't log OAUth token eg console.log(window.href)

  Check its at least a numeric only string - too hard to check for all valid
    phone number patterns if international is included.

----------------------------------------------------------------------------- */

// Extract the phone number from URL parameters
export function extractPhoneNumberFromURL() {
  const URLParams = new URLSearchParams(window.location.search);

  if (URLParams.get('code')) {
    const phone = URLParams.get('state');
    console.log(
      "ctd_pwajs::initialise: page invoked via OAuth redirect:",
      window.location.origin + window.location.pathname,
      "with number:",
      phone
    );
    return phone;
  } else {
    const phone = URLParams.get('num');
    console.log(
      "ctd_pwajs::initialise: page invoked directly:",
      window.location.origin + window.location.pathname,
      "with number:",
      phone
    );
    return phone;
  }
}

// Validate the extracted phone number
export function validatePhoneNumber(phone) {
  if (phone === null || phone.length === 0 || phone === undefined) {
    console.log(
      `ctd_pwajs::checkPhoneNumber() phone number is invalid, empty or null string passed`
    );
    throw new Error("Invalid phone number - empty or null string passed");
  }

  const phoneNumber = decodeURIComponent(phone)
    .replaceAll(' ', '')
    .replaceAll('(', '')
    .replaceAll(')', '')
    .replaceAll('-', '')
    .replace('tel://', '')
    .replace('TEL://', '');

  if (phoneNumber.length === 0) {
    console.log(
      `ctd_pwajs::checkPhoneNumber() phone number does not contain any useful characters and is invalid: ${phone}`
    );
    throw new Error("Invalid phone number - does not contain dialable numbers");
  }

  return phoneNumber;
}

// Check if the phone number is valid
export function isPhoneNumberValid(phoneNumber) {
  const re = /^\+[0-9]*$|^[0-9]*$/;
  const regex = new RegExp(re);

  if (regex.test(phoneNumber)) {
    console.log(
      `ctd_pwajs::checkPhoneNumber() appears to be a valid number: ${phoneNumber}`
    );
    return true;
  } else {
    console.log(
      `ctd_pwajs::checkPhoneNumber() NOT a valid number: ${phoneNumber}`
    );
    finish("Referral unsuccessful.<br><br>The referral selected does not " +
                 "contain a valid phone number.<br><br>If the referral was " +
                 "initiated from Service Assist, report this to your Team Leader. ",      
                  PWA_WIN_TIMEOUT_ERR);

    throw new Error(`Invalid phone number: ${phoneNumber}`);
  }
}

// Main function to get and validate the phone number
export async function getPhoneNumber() {
  const phone = extractPhoneNumberFromURL();
  const phoneNumber = validatePhoneNumber(phone);
  isPhoneNumberValid(phoneNumber);
  return phoneNumber;
}
