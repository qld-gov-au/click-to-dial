export async function manageWindow() {
  const isBrowser = matchMedia('(display-mode: browser)').matches;
  if (!isBrowser) {
    window.open('', '_self');
    window.resizeTo(1000, 500);
  } else {
    if (process.env.NODE_ENV === 'production') {
      await finish("See Tech Support for installing this click-to-dial funtion",
        PWA_WIN_TIMEOUT_DEBUG,true);
    } else {
      console.warn('Running in browser mode during development.');
    }
  }
}
