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
    .replace('tel:', '')
    .replace('TEL:', '');

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
