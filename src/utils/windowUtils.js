import { putCTDmsg } from './domUtils.js';
import { DEBUG, PWA_WIN_TIMEOUT_DEBUG } from '../index.js';

/* -----------------------------------------------------------------------------

 Adjust accordingly depending on business or testing requirements: either
   immediately minimise window, leave it up there etc

 Note
   * we can resize a window only if we are not in a browser's tab eg the
     separate PWA pop-up window -> the isBrowser test
   * we can only resize or close if we opened the window
   * So we window.open self (current url) in the current window, then we can
     resize it, and close it later in finish function

 The PWA will sets display-mode in manifest eg display-mode: standalone
----------------------------------------------------------------------------- */

export async function getWindow() {
    let isBrowser = matchMedia("(display-mode: browser)").matches;
    console.log(`ctd_pwajs::begin() PWA window ${!isBrowser}`)
    if (!isBrowser) {
       window.open("", "_self");         // get control by re-opening window
       window.resizeTo(1000, 500);       // x,y size
       return true;			// its a pwa invocation
    } else {
       await finish("If you require support installing click-to-dial, please see your Team Leader.",
         PWA_WIN_TIMEOUT_DEBUG,true);
       return false;			// direct invocation for install purposes
    }
}


/* -----------------------------------------------------------------------------
  close the PWA Browser Window

  DOM refresh isn't sync, an alert will block it, hence
    timeout PWA_WIN_TIMEOUT_DEBUG

  See: https://macarthur.me/posts/when-dom-updates-appear-to-be-asynchronous/
----------------------------------------------------------------------------- */

export async function finish(msg,timeout,justMsg) {

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function closeWin() {

    if (DEBUG) {

        console.log("ctd_pwajs::finish() entry, timeout:",PWA_WIN_TIMEOUT_DEBUG,
          "msg:",msg);
        putCTDmsg(msg,PWA_WIN_TIMEOUT_DEBUG, justMsg)

        // Give time for DOM repaint, as alert("Click ok to close PWA") blocks
        await sleep(PWA_WIN_TIMEOUT_DEBUG);

    } else {

        console.log("ctd_pwajs::finish() entry, timeout:", timeout, "msg:",msg);
        putCTDmsg(msg,timeout,justMsg);
        await sleep(timeout);

    }

    if (DEBUG) alert ("Click ok to close PWA");
    await sleep(PWA_WIN_TIMEOUT_DEBUG);
    if (DEBUG) alert ("Click ok to close PWA");
    console.log("ctd_pwajs::finish() exiting progressive web app tel handler");    
    window.close();

  }

  await closeWin();
}




