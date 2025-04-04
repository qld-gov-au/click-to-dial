export function validatePhoneNumber() {
  const urlParams = new URLSearchParams(window.location.search);
  const phone = urlParams.get('num') || urlParams.get('state');
  if (!phone) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Phone number is missing in the URL. Using a default number for development.');
      return '+61400000000'; // Default phone number for development
    }
    console.warn('Phone number is missing in the URL. Defaulting to a placeholder.');
    return null; // Return null in production
  }
  return phone;
}

export function formatPhoneNumber(phone) {
  return decodeURIComponent(phone)
    .replace(/\s|\(|\)|-/g, '')
    .replace(/^tel:/i, '');
}
