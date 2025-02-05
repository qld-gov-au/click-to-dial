//       10        20        30        40        50        60        70        8

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
const PWA_WIN_TIMEOUT = 5000;

// increase time to allow time to copy error message before closing PWA window
const PWA_WIN_TIMEOUT_ERR = 30000;

// increase time to before displaying click ok to exit in debug mode
const PWA_WIN_TIMEOUT_DEBUG = 600000;

var DEBUG;

if (window.location.hostname === "localhost") {DEBUG=true;} else {DEBUG=false;}

if (DEBUG) { alert(`Open Dev Tools (F12) for now full debuging`); }

var platformClient = require('platformClient');


/* -----------------------------------------------------------------------------
  Note, In a browser extension DOMContentLoaded has already fired. Hence the
  wait for load event below.
  This code is common with my browser extension code.
----------------------------------------------------------------------------- */

//       10        20        30        40        50        60        70        8
window.addEventListener("load", async () => {

 try {

      console.log("ctd_pwajs::inititialise: windows event: loaded");
      initDivs();
      await getWindow();
      let phoneNumber = await getPhoneNumber();
      let client = initGenesys();
      let genesysClientId = getGenesysClientId();
      await genesysLogin(client, phoneNumber,genesysClientId);
      let orgName = await getGenesysOrgName();
      document.getElementById("gen_msg").innerHTML=orgName;
      await consult(phoneNumber);

  } catch (e) {

      console.log(`"ctd_pwajs::global error handler caught error:`,e);

      // genesys errors don't return a stack trace, so use e.message for Genesys
      let errMsg = 'stack' in e ? e.stack :  e.message;

      let msg = `<div class="tel_pwa_err">The following error has occured,
                please screenshot this into an email if you wish to log a job:
                <br><br>${errMsg.replace(/\n/g, "<br>")}</div>`;

      await finish(msg, PWA_WIN_TIMEOUT_ERR);
  }

});



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

async function getWindow() {
   let isBrowser = matchMedia("(display-mode: browser)").matches;
   console.log(`ctd_pwajs::begin() PWA window ${!isBrowser}`)
   if (!isBrowser) {
      window.open("", "_self");         // get control by re-opening window
      window.resizeTo(1000, 500);       // x,y size
   } else {
      await finish("See Tech Support for installing this click-to-dial funtion",
        PWA_WIN_TIMEOUT_DEBUG,true);
   }
}


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

async function getPhoneNumber(){

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
      await finish("Invalid phone number - empty or null string passed",
        PWA_WIN_TIMEOUT);
  }

  let phoneNumber = decodeURIComponent(phone).replaceAll(' ','')
                      .replaceAll('(','').replaceAll(')','').replaceAll('-','')
                      .replace('tel:','').replace('TEL:','');

  if ( phoneNumber.length === 0 ) {
      console.log(`ctd_pwajs::checkPhoneNumber() phone number does not ` +
        `contain any usefull characters and is invalid: ${phone}`);
      await finish("Invalid phone number - does not contain dialable numbers",
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
      await finish(`Invalid phone number: ${phone}`, PWA_WIN_TIMEOUT_ERR);
  }

}

/* -----------------------------------------------------------------------------
  Get Genesys Cloud Organization name for display. Usefull for troubleshooting
------------------------------------------------------------------------------*/

async function getGenesysOrgName() {

  let apiInstance = new platformClient.OrganizationApi();
  let orgDetails = await apiInstance.getOrganizationsMe();
  console.log("ctd_pwajs::getGenesysOrgName() org name:",orgDetails.domain);
  return orgDetails.domain;

}

/* -----------------------------------------------------------------------------
  Setup div for Agent Messages
----------------------------------------------------------------------------- */

function initDivs() {

  let newGenEnv = document.createElement("div");
  newGenEnv.className="container_gen_msg";
  newGenEnv.id="gen_msg";
  newGenEnv.innerHTML="unknown organization";
  document.body.append(newGenEnv);

  let newDivResult = document.createElement("div");
  newDivResult.className="container_csa_msg";
  newDivResult.id="csa_msg";
  newDivResult.innerHTML=``

  document.body.append(newDivResult);

  console.log("ctd_pwajs::initGetCTDTypeDiv() agent(CSA) message div created");

}


/* ----------------------------------------------------------------------------
  init Genesys - load SDK/Libraries
----------------------------------------------------------------------------- */

function initGenesys() {

  // This seems to pull the local storage token - console.log(client)
  let client = platformClient.ApiClient.instance;

  // Persist token in on local storage
  client.setPersistSettings(true, 'optional_prefix');

  client.setEnvironment(platformClient.PureCloudRegionHosts.ap_southeast_2);

  return client;

}


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


/* -----------------------------------------------------------------------------
  close the PWA Browser Window

  DOM refresh isn't sync, an alert will block it, hence
    timeout PWA_WIN_TIMEOUT_DEBUG

  See: https://macarthur.me/posts/when-dom-updates-appear-to-be-asynchronous/
----------------------------------------------------------------------------- */

async function finish(msg,timeout,justMsg) {

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
    console.log("ctd_pwajs::finish() exiting progressive web app tel handler");
    window.close();

  }

  await closeWin();
}

/* -----------------------------------------------------------------------------
  Display result of consult actions or error mesages to agent
----------------------------------------------------------------------------- */

function putCTDmsg(msg,timeout,justMsg) {
    if (justMsg) {

      document.getElementById("csa_msg").innerHTML=
        `<div class="tel_pwa_msg">${msg}<br><br></div>`

    } else {

      document.getElementById("csa_msg").innerHTML=
        `<div class="tel_pwa_msg">${msg}<br><br>
         Please return to Genesys<br><br>
         This window will automatically close in ${timeout/1000} seconds</div>`
    }

    document.getElementById("csa_msg").style.display = "flex";
}


/* =============================================================================

  GENESYS CLOUD TELEPHONY APIs SECTION

  The API scenarios in transfer, consult and conference were taken from GCCX
    browser client F12 traces with an agent performing transfer,
    consult and conference.

==============================================================================*/



/* -----------------------------------------------------------------------------

  Get current calls conversation object for the logged in user.
  The JSON object returned is used by all get id type calls.
  If no conversation, JSON strings with some info returned
    with empty entities[] array

----------------------------------------------------------------------------- */

async function getConversationObj() {

  let conversationObj = null;

  try {

    let apiConversationsInstance = new platformClient.ConversationsApi();

    conversationObj = await apiConversationsInstance.getConversationsCalls();

    console.log("ctd_pwajs::getConversationObj: \n", conversationObj);

    return conversationObj;

  }

  catch (err) {

    console.log("ctd_pwajs::getConversationObj() There was a failure " +
      "calling getConversationsCalls:\n",err);

    // Global error handler in window.load will catch
    throw err;

  }

}

/* -----------------------------------------------------------------------------
  get current conversationId from the conversation object

  there's a bug in the /conversations/calls API whereby it returns emails on
    queue as entries in the conversation object. hence the filtering for
    participants below
----------------------------------------------------------------------------- */

async function getConversationId(convObj) {

  if ( convObj === undefined || convObj === null || convObj === "")
  {
    console.log("ctd_pwajs::getConversationId() Error: null conversation" +
                "object passed to getConversationId()");
    await finish("no or null conversation object passed to getConversationId()",
                 PWA_WIN_TIMEOUT_ERR);
    return null;
  }


  if (convObj.entities.length === 0) {
    console.log("ctd_pwajs::getConversationId() Error: no conversations " +
                "detected, alerting user");
    await finish("Cannot do consult, you are not currently on a phone call",
                  PWA_WIN_TIMEOUT_ERR);
    return null;
  }

  let countId=0;
  let convId=0;
  for (let index1 = 0; index1 < convObj.entities.length; ++index1) {
    if ( convObj.entities[index1].participants.length > 0) {
       countId++
       convId=convObj.entities[index1].id
    }
  }

  if ( countId > 1) { await finish("Cannot do consult, you are on more than " +
                                   "one interaction", PWA_WIN_TIMEOUT_ERR) }
  if ( convId === 0) { await finish("Cannot do consult, you are not " +
                            "currently on a phone call", PWA_WIN_TIMEOUT_ERR) }

  console.log('ctd_pwajs::getConversationId() conversation found:',convId);

  // Only one voice conversation ID if we get here
  return convId;

}


/* -----------------------------------------------------------------------------
  could use JSONPath-plus
  previously consulted parties, on the same call, show up in the conversation
    object. These show up with a disconnectionType="endpoint" etc.
  null disconnectType means active
----------------------------------------------------------------------------- */

async function getCustomerId (convObj) {

  let customerId = null;              // caller must check for null

  if ( convObj === undefined || convObj === null || convObj === "")
  {
    console.log("ctd_pwajs::getAgentId() no or null conversation object" +
                "passed to getAgentId()");
    return null;
  }

  /* need to add abort if more than one entity */

  for (let index1 = 0; index1 < convObj.entities.length; ++index1) {
    for (let index2 = 0;
            index2 < convObj.entities[index1].participants.length; ++index2) {

      console.log(`ctd_pwajs::getcustomerId() participant purpose:` +
             `${convObj.entities[index1].participants[index2].purpose}` +
             `disconnect` +
             `${convObj.entities[index1].participants[index2].disconnectType}`);

      if ( convObj.entities[index1].participants[index2].purpose === "customer"
           && convObj.entities[index1].participants[index2].disconnectType
               === undefined)
      {
           customerId=convObj.entities[index1].participants[index2].id;
      }

      if ( convObj.entities[index1].participants[index2].purpose === "user"
           && convObj.entities[index1].participants[index2].direction
              === "outbound")
      {
           await finish("Cannot do consult for manually dialled keypad calls",
                         PWA_WIN_TIMEOUT_ERR);
      }
    }
  }

  if ( customerId === null ) {
     await finish("Cannot do consult, there are no customers on the call",
     PWA_WIN_TIMEOUT_ERR);
  }

  console.log('ctd_pwajs::getCustomerId() customer id found:',customerId);

  return customerId;
}



/* -----------------------------------------------------------------------------

  Consult scenario: agent logged in, customer calls queue and customer is now
    talking to agent, agent selects consult

  POST
  https://api.mypurecloud.com.au/api/v2/conversations/calls/<guid1>/participants
  /<guid2>/consult

  first GUID : conv id, second GUID: inbound mobile participant (wierd, don't
    understand why not agent as they are doing the consult. maybe its the
    participant to put on hold)

  payload: {"speakTo":"DESTINATION","destination":{"address":"0737119394"}}
  -- likley so customer gets put on hold not agent

  Notes
  * the customer gets hold music as soon as transfer initiated and only the
      agent and transfer number can talk. The agent has conf, transfer options

----------------------------------------------------------------------------- */

async function consult(phoneNumber) {

  console.log("ctd_pwajs::consult() entry, with phone number:",phoneNumber);

  try {

    let apiInstance = new platformClient.ConversationsApi();

    let body =
      {
        "speakTo":"DESTINATION",
        "destination": {
          "address": phoneNumber
        }
    };

    let conversationObject = await getConversationObj();
    if (conversationObject === null ) {
       console.log("ctd_pwajs::consult() exiting, conversationObject is null");
       throw new Error("conversationObject is null");
    }

    let conversationId = await getConversationId(conversationObject);
    if (conversationId === null ) {
       console.log("ctd_pwajs::consult() exiting, conversationId is null");
       return;
    }

    let customerId = await getCustomerId(conversationObject);
    if (customerId === null ) {
       console.log("ctd_pwajs::consult() exiting, customerId is null");
       return;
    }

    /* Initiate and update consult transfer */

//       10        20        30        40        50        60        70        8
    console.log(`ctd_pwajs::consult() initiating consult with customer id: ` +
                `${customerId}, conversation id: ${conversationId} `);

    let data = await apiInstance.postConversationsCallParticipantConsult(
                                              conversationId, customerId, body)

    console.log(`ctd_pwajs::consult() success! data: ` +
                     `${JSON.stringify(data, null, 2)}`);

    await finish(`Dialing ${phoneNumber} for now, please return to Genesys` ,
                 PWA_WIN_TIMEOUT);

  }

  catch (err) {
    console.log("ctd_pwajs::consult() error: ",err);

    // Global error handler in window.load will catch throw
    throw err;
  }

}


/* =============================================================================

  Genesys Cloud Login/Logout functions

  Requirements:
  1. CTD will only work if agent logins into Genesys. The Agent Genesys session
     and this apps Genenesys login must be the same
  2. https://help.mypurecloud.com/articles/allow-apps-to-place-calls must be
     enabled. This can be done by agent, or hopefully API (see later)
     -- actually, not sure if needed, need to test

============================================================================= */



/* -----------------------------------------------------------------------------
  get the redirect URL. These must be configured in Genesy OAUTH
----------------------------------------------------------------------------- */

function getRedirectURL() {

  let redirectUri;

  switch (window.location.hostname) {

  // in case you want a different redirect_uri to the current window url
  case 'special-URL':
    // Change this to redirectUri you require
    redirectUri = window.location.origin + window.location.pathname;
    console.log("ctd_pwajs::getRedirectURL() custom redirect matched:",
                 redirectUri);
    break;

  default:
    redirectUri = window.location.origin + window.location.pathname;
    console.log(`ctd_pwajs::getRedirectURL() no custom redirect matched, ` +
                `using standard redirect:`,redirectUri);

  }

  return redirectUri;
}

/* -----------------------------------------------------------------------------
  Genesys redirect URL matching ignores state, but fails on num=%s so can't
    pass that directly, must be passed as state
  Needs persist token. Otherwise subsequent api calls fail with unauthorised
  SDK appears to pick up OAauth code from URL to get API enpoint Token
----------------------------------------------------------------------------- */

async function genesysLogin(client, phoneNumber, clientId) {

  console.log(`ctd_pwajs::genesysLogIn() entry, phone: ${phoneNumber}, ` +
              `oauth client id ${clientId}` );

  let redirectUri = getRedirectURL();

  try {

    await client.loginPKCEGrant(clientId, redirectUri, { state: phoneNumber })

    // only gets here if no redirect issued, eg already logged in
    console.log("ctd_pwajs::genesysLogin() already logged in");

    return true;
  }

  catch(err)  {
    console.log("ctd_pwajs::genesysLogin() login failed:\n", err);
    throw err;   // Global error handler in window.load will catch this
  }

}


