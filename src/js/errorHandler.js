export function handleError(error) {
  console.error('Error:', error);
  const userFriendlyMessage = 'An error occurred while initializing the application. Please try again or contact support if the issue persists.';
  const errorDiv = document.getElementById('csa_msg');
  if (errorDiv) {
    errorDiv.innerHTML = `<div class="tel_pwa_err">${userFriendlyMessage}</div>`;
    errorDiv.style.display = 'flex';
  }
}
