export async function manageWindow() {
  const isBrowser = matchMedia('(display-mode: browser)').matches;
  if (!isBrowser) {
    window.open('', '_self');
    window.resizeTo(1000, 500);
  } else {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('This app must be installed as a PWA.');
    } else {
      console.warn('Running in browser mode during development.');
    }
  }
}
