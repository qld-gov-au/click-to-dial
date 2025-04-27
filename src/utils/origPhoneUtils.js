import { finish } from './windowUtils.js';

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

export async function getPhoneNumber(){

  let phone;

  let URLParams = new URLSearchParams(window.location.search);

  if (URLParams.get('code')) {
      phone = new URLSearchParams(window.location.search).get('state');
      console.log("ctd_pwajs::initialise: page invoked via OAuth redirect:",
        window.location.origin + window.location.pathname,"with number:",phone);
  } else {
      phone = new URLSearchParams(window.location.search).get('num')
      console.log("ctd_pwajs::initialise: page invoked directly:",
        window.location.origin + window.location.pathname,"with number:",phone);
  }


  if ( phone === null || phone.length === 0 || phone === undefined) {
      console.log(`ctd_pwajs::checkPhoneNumber() phone number is invalid,
        empty or null string passed`);

      await finish("Referral unsuccessful.<br><br>The referral selected does not " +
                   "contain a valid phone number. <br><br>If the referral was " +
                   "initiated from Service Assist, report this to your Team Leader.",
                    PWA_WIN_TIMEOUT);
  }

  let phoneNumber = decodeURIComponent(phone).replaceAll(' ','')
                      .replaceAll('(','').replaceAll(')','').replaceAll('-','')
                      .replace('tel:','').replace('TEL:','');

  if ( phoneNumber.length === 0 ) {
      console.log(`ctd_pwajs::checkPhoneNumber() phone number does not ` +
        `contain any usefull characters and is invalid: ${phone}`);
      await finish("Referral unsuccessful.<br><br>The referral selected does not " +
                   "contain a valid phone number.<br><br>If the referral was " +
                   "initiated from Service Assist, report this to your Team Leader. ",
         PWA_WIN_TIMEOUT);
      return false;
  }

  const re = /^\+[0-9]*$|^[0-9]*$/
  const regex = new RegExp(re);

  if (regex.test(phoneNumber)) {
      console.log("ctd_pwajs::checkPhoneNumber() ${phone} appears to be a" +
        `valid number: ${phoneNumber}`);
      return phoneNumber;
  } else {
      console.log(`ctd_pwajs::checkPhoneNumber() ${phone} NOT a valid number`);
      await finish("Referral unsuccessful.<br><br>The referral selected does not " +
                   "contain a valid phone number.<br><br>If the referral was " +
                   "initiated from Service Assist, report this to your Team Leader. ",      
                    PWA_WIN_TIMEOUT_ERR);
  }

}

