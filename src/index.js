// Entry point for the application
import './styles/tel_pwa.css';

// Register the service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./service-worker.js')
    .then(() => console.log('Service Worker registered successfully.'))
    .catch((error) => console.error('Service Worker registration failed:', error));
}
