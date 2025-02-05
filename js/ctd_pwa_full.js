/* --------------------------------------------------------------------------------------------------------------------------------------------

  Click to Dial Integration with Genesys Cloud

  Supports click-to-dial using tel: links on any web site


  updates required:
  * none atm

  to be checked:
  * place calls phone state
  * not hard coded, menu and correct status response displayed
  * logged into genesys directly

-----------------------------------------------------------------------------------------------------------------------------------------------*/




/* --------------------------------------------------------------------------------------------------------------------------------------------- 
                                INITIALISATION ROUTINES, RUN EVERY PAGE LOAD  
---------------------------------------------------------------------------------------------------------------------------------------------- */

var client;								// initialised by initGenesys() and used by genesysLogin()
let CTD_TYPE_CLASS = "uselessButtonCTDType";				// any button with class gets a click event listener for CTD
let PWA_WIN_TIMEOUT = 10000;						// 10 second timeout, in milliseconds, to close PWA window
var resolveCTDTypePromise;						// global scope promise resolver
var clientId = "<guid>"							// OAuth client ID get from mtatag which is dynamically loaded
var DEBUG;


DEBUG = (window.location.hostname === "localhost");


/* -------------------------------------------------------------------------------------------------------------------------------------------- 
  Agent does not have token (but logged in Genesys eg cookie)
  First invocation of this page, num=%s is passed by windows tel protocol launcher.
  Extract this for passing as OAuth state paramater (note, Genesys redirect URL matching ignores state, but fails on num=%s so can't pass that)
  

  Second invocation, after calling token endpoint, oath code is passed, then it is assuming thats the OAuth redirect token. Sate contains th ephone number, set in genesysLogin()

--------------------------------------------------------------------------------------------------------------------------------------------- */

if (DEBUG) alert("Open Dev Tools (F12) now for full network trace debuging");				// comment out in production

function getNum() {

  let num;
  let URLParams = new URLSearchParams(window.location.search);

  if (URLParams.get('code')) {
      console.log("ctd_pwajs::initialise: page invoked via OAuth redirect:", window.location.href)
      num = new URLSearchParams(window.location.search).get('state')
  } else {
      console.log("ctd_pwajs::initialise: page invoked directly:", window.location.href);
      num = new URLSearchParams(window.location.search).get('num')
  }

  return num;

}


/* -------------------------------------------------------------------------------------------------------------------------------------------- 
  Note, In a browser extension DOMContentLoaded has already fired. Hence the wait for load event below 
  This code is common with my browser extension code.
--------------------------------------------------------------------------------------------------------------------------------------------- */

window.addEventListener("load", (event) => {
  console.log("ctd_pwajs::inititialise: windows event: loaded");
  begin();
  let num = getNum();
  initGenesys();
  initDivs();
  attachListeners();
  dial(num).then (()=>finish());
})


/* -------------------------- Load Genesys SDK/Libraries ------------------------------------------------------------------------------ */

function initGenesys() {
  platformClient = require('platformClient');
  client = platformClient.ApiClient.instance;				// This seems to pull the local storage token - console.log(client)
  client.setPersistSettings(true, 'optional_prefix');			// Persist token in on local storage
  client.setEnvironment(platformClient.PureCloudRegionHosts.ap_southeast_2); 
}


/* ------------------------------------------------------------------------------------------------------------------------------------------- 
  setup div pop-up for transfer/conult/confrence menu if not hard coded
  setup div for results
------------------------------------------------------------------------------------------------------------------------------------------- */

function initDivs() {

  /*--- menu div ---*/
  var newDivMenu = document.createElement("div");
  newDivMenu.className="ask_ctd_div";
  newDivMenu.innerHTML=`
      <button class=${CTD_TYPE_CLASS} data-action="transfer">transfer</button>&nbsp;&nbsp;
      <button class=${CTD_TYPE_CLASS} data-action="consult">consult</button>&nbsp;&nbsp;
      <button class=${CTD_TYPE_CLASS} data-action="conference">conference</button>`

  newDivMenu.id="getCTDType";
  document.body.append(newDivMenu);


  /*--- results div ---*/
  var newDivResult = document.createElement("div");
  newDivResult.className="ask_ctd_div";
  newDivResult.innerHTML=``

  newDivResult.id="putCTDmsg";
  document.body.append(newDivResult);

  console.log("ctd_pwajs::initGetCTDTypeDiv() ask ctd type menu and result divs created");

}


/* ------  onclick target for the pop-up menu asking consult, transfer, conference - if not specified in data-action button attribute ----- */

function getCTDType() {
    document.getElementById("getCTDType").style.display = "none";
    ctd_type=this.getAttribute("data-action");
    console.log("ctd_pwajs::getCTDtype():",ctd_type);
    resolveCTDTypePromise(ctd_type);					// resolveCTDTypePromise is globaly scoped
}

/* ------  result of transfer, conference or consult actions  ------------------------------------------------------------------------------ */

function putCTDmsg(msg) {
    document.getElementById("putCTDmsg").innerHTML=
        `<h3 class="h3c">${msg}<br><br>
         Please return to Genesys<br><br>
         This window will automatically close in ${PWA_WIN_TIMEOUT/1000} seconds</h3>`
    document.getElementById("putCTDmsg").style.display = "flex";
}



/* --------- Attaches an event listener to clickable CTD buttons by class type and Tel elements  -------------------------------------------- */

function attachListeners () {

  console.log("ctd_pwajs::attachEventListeners() posting event listeners");

  const ctdTypeButtons = document.querySelectorAll(`.${CTD_TYPE_CLASS}`);		
  ctdTypeButtons.forEach((button) => {
    button.addEventListener("click", getCTDType)
    console.log("ctd_pwajs::attachEventListeners() posting listener on:",button);
  });

}


/* ----------------------- used to (a) uridecode phone number and (b) check its at least a numeric only string --------------------------------------------- */

function checkPhoneNumber(phone){

    if ( phone == null || phone.length === 0 || phone === "undefined") {
        console.log("ctd_pwajs::checkPhoneNumber() phone number is invalid, empty or null string passed");
        putCTDmsg("Invalid phone number - empty or null string passed");
        return false;
    }

    let phoneNumber = decodeURIComponent(phone).replaceAll(' ','').replaceAll('(','').replaceAll(')','').replaceAll('-','').replace('tel:','').replace('TEL:','');

    if ( phoneNumber.length === 0 ) {
        console.log(`ctd_pwajs::checkPhoneNumber() phone number does not contain any usefull characters and is invalid: ${phone}`);
        putCTDmsg("Invalid phone number - does not contain dialable numbers");
        return false;
    }

    const re = /^\+[0-9]*$|^[0-9]*$/
    const regex = new RegExp(re);

    if (regex.test(phoneNumber)) {
        console.log(`ctd_pwajs::checkPhoneNumber() ${phone} appears to be a valid number: ${phoneNumber}`);
        return phoneNumber;
    } else {
        console.log(`ctd_pwajs::checkPhoneNumber() ${phone} is NOT a valid number`);
        putCTDmsg(`Invalid phone number: ${phone}`);
        return false;
    }
}


/* ------------------------------------------------------------------------------------------------------------------------ 
     Close the PWA Browser Window 
     DOM refresh isn't tuly sync and alert will block it, hence set timeout. 
       See: https://macarthur.me/posts/when-dom-updates-appear-to-be-asynchronous/
  ----------------------------------------------------------------------------------------------------------------------- */

function finish() {

  function closeWin() {  
    console.log("ctd_pwajs::finish() exiting progressive web app tel handler");
    if (DEBUG) alert ("Click ok to close PWA");    
    window.close();	
  }

  if (DEBUG) {
      setTimeout(closeWin, 6000);      			// Give time for DOM repaint, alert() blocks this
  } else {
      setTimeout(closeWin, PWA_WIN_TIMEOUT);
  }

}
  

/*  --------------------------------------------------------------------------------------------------------------------------------------------- 
 Adjust accordingly depending on business or testing requirements: either immediately minimise window, leave it up there etc
 Note 
   * we can resize a window only if we are not in a browser's tab eg the separate PWA pop-up window -> the isBrowser test
   * we can only resize or close if we opened the window
   * So we window.open self (current url) in the current window, then we can resize it, and close it later in finish function

------------------------------------------------------------------------------------------------------------------------------------------------- */

function begin() {
   isBrowser = matchMedia("(display-mode: browser)").matches;		// PWA will sets this in manifest eg display-mode: standalone
   if (!isBrowser) {
      window.open("", "_self");						// get control of the window by re-opening
      window.resizeTo(800, 400);					// x,y size
   }
}



/* -------------------------------------------------------------------------------------------------------------------------------------------- 
  MAIN CODE - tel click handler

  tel protocol handler in manifest.json tells windows to call <web site>/click-to-dial/gccx/progressive_web_app/telbph.html?num=%s"
  %s is the phone number clicked
  telbph.html runs telbph.js.
  telpbph.js invokes dial() below
  dial will result in menu to chose transfer, consult, conference. This is just for testing. Later ctd_type will be hard coded to transfer

  See readme.md and manifest.json for more details

--------------------------------------------------------------------------------------------------------------------------------------------- */

async function dial(origPhoneNumber) {

  phoneNumber=checkPhoneNumber(origPhoneNumber);

  if (!phoneNumber) return;

  document.getElementById("getCTDType").style.display = "flex";

  var promise = new Promise((resolve) => {
     resolveCTDTypePromise = resolve;						// resolveCTDTypePromise is Global scope variable				
  });

  await promise.then((result) => {						// wait for the promise to be resolved in onclick function getCTDType()
    ctd_type = result;							// getClickValue eg transfer, consult etc
    console.log("ctd_pwajs::dial() resolveCTDTypePromise:", ctd_type);
  });

  await genesysLogin();

  switch (ctd_type) {
    case 'transfer':
      console.log("ctd_pwajs::dial() ctd type: transfer, number: ", phoneNumber);   
      await transfer(phoneNumber);
      break;

    case 'consult':
      console.log("ctd_pwajs::dial() ctd type: consult, number: ", phoneNumber);   
      await consult(phoneNumber);
      break;

    case 'conference':
      console.log("ctd_pwajs::dial() ctd type: conference, number: ", phoneNumber);   
      await conference(phoneNumber);
      break;

    default:
      console.log("ctd_pwajs::dial() Invalid ctd action: ", ctd_type, "should be transfer, consult or conference");
  }

}



/*--------------------------------------------------------------------------------------------------------------------------------

  GENESYS CLOUD TELEPHONY API's

  The API scenarios in transfer, consult and conference were taken from GCCX browser client F12 traces with and agent
  performing transfer, consult and conference. 

----------------------------------------------------------------------------------------------------------------------------------*/


/* -------------------------------------------------------------------------------------------------------------------------------------------------
  Get current calls conversation object for the logged in user. Does not not include other media types.
  
  The JSON object returned is used by all get id type calls 

  If no conversation, JSON strings with some info returned with empty entities[] array
-------------------------------------------------------------------------------------------------------------------------------------------------- */

async function getConversationObj() {

  let conversationObj = null;

  try {

    let apiConversationsInstance = new platformClient.ConversationsApi();

    conversationObj = await apiConversationsInstance.getConversationsCalls();
 
    console.log("ctd_pwajs::getConversationObj: \n", conversationObj);

    return conversationObj; 

  }

  catch (err) {

    console.log("ctd_pwajs::getConversationObj() There was a failure calling getConversationsCalls");
    console.error(err);
    return conversationObj;						// caller must check for null object

  }

}


/* -------------------------- get current conversationId from the conversation object ------------------------------------------------------ */

function getConversationId(convObj) {

  if ( typeof convObj === "undefined" || convObj == null || convObj === "")
  { 
    console.log("ctd_pwajs::getConversationId() no or null conversation object passed to getConversationId()");
    putCTDmsg("no or null conversation object passed to getConversationId()");
    return null;
  }

  if (convObj.entities.length >1) { 
    console.log (`ctd_pwajs::getConversationId() Error: ${convObj.entities.length} conversations detected, alerting user`); 
    putCTDmsg("Cannot transfer, more than conversation detected");
    return null;
  }

  if (convObj.entities.length === 0) {
    console.log('ctd_pwajs::getConversationId() Error: zero conversations detected, alerting user'); 
    putCTDmsg("Cannot do consult, you are not currently on a phone call");
    return null;
  }

  return convObj.entities[0].id;			// Only one conversation ID if we get here

}


/* ------------------------------------------------------------------------------------------------------------------------------------
  get customer participant id, inbound is specified as I've seen inbound and outbound in other conversation APIs

  could use JSONPath-plus and replace array loops with $.participants[?(@.purpose == "customer" && @.direction == "inbound")].id
------------------------------------------------------------------------------------------------------------------------------------*/

function getCustomerId (convObj) {

  let customerId = null;					// caller must check for null

  if ( typeof convObj === "undefined" || convObj == null || convObj === "")
  { 
    console.log("ctd_pwajs::getAgentId() no or null conversation object passed to getAgentId()");
    return null;
  }

  /* need to add abort if more than one entity */

  for (let index1 = 0; index1 < convObj.entities.length; ++index1) {
    for (let index2 = 0; index2 < convObj.entities[index1].participants.length; ++index2) {
      if ( convObj.entities[index1].participants[index2].purpose === "customer"
           && convObj.entities[index1].participants[index2].direction === "inbound")
      { 
           customerId=convObj.entities[index1].participants[index2].id
      } 
    }
  }
  return customerId;
}



/* -------------------------------------------------------------------------------------------------------------------------------------------------
   get agent participant id

   need to add scenario of two agents, one customer in call and so get my agentid, not first found. Not sure if this is a real scenario tho

   could use JSONPath-plus and replace array loops similar to getCustomerId
---------------------------------------------------------------------------------------------------------------------------------------------------- */

function getAgentId(convObj) {

  let agentId = null;

  if ( typeof convObj === "undefined" || convObj === null || convObj === "")
  { 
    console.log("ctd_pwajs::getAgentId() no or null conversation object passed to getAgentId");
    return null;
  }
  

  for (let index1 = 0; index1 < convObj.entities.length; ++index1) {
    for (let index2 = 0; index2 < convObj.entities[index1].participants.length; ++index2) {
      if ( convObj.entities[index1].participants[index2].purpose === "agent" )
      { 
           agentId=convObj.entities[index1].participants[index2].id
      } 
    }
  }

  return agentId;
}



/* ---------------------------------------------------------------------------------------------------------------------------------

  Conference scenario: agent logged in, customer calls queue and customer is now talking to agent, agent selects conference

  Summary trace from GCCX client:
  POST
  https://api.mypurecloud.com.au/api/v2/conversations/calls/<guid>/participants/
  GUID : conversation id
  payload: {"participants":[{"address":"0737119394"}]}

------------------------------------------------------------------------------------------------------------------------------------ */

async function conference(phoneNumber) {

  try {

    let apiInstance = new platformClient.ConversationsApi();

    console.log("ctd_pwajs::conference() phone number: ", phoneNumber);

    let conversationObject = await getConversationObj();
    if (conversationObject == null ) { console.log("ctd_pwajs::conference() exiting, conversationObject is null"); return }

    conversationId = getConversationId(conversationObject);
    if (conversationId == null ) { console.log("ctd_pwajs::conference() exiting, conversationId is null"); return }

    let body = 
      {
        "participants": [
          {
            "address": phoneNumber,
          }
        ]
      };


    /* Add participants specified in body to a conversation */

    let data = await apiInstance.postConversationsCallParticipants(conversationId, body);

    console.log(`ctd_pwajs::conference() postConversationsCallParticipants success, data: ${JSON.stringify(data, null, 2)}`);

    putCTDmsg(`Conferencing with ${phoneNumber} now, please return to Genesys` ) 

  }
  catch (err) {
    console.log("ctd_pwajs::conference() error:", err);
    putCTDmsg(`Conferencing with ${phoneNumber} failed, please return to Genesys` ) 
  } 

} 


/* ------------------------------------------------------------------------------------------------------------------------------------------------------------

  Consult scenario: agent logged in, customer calls queue and customer is now talking to agent, agent selects consult

  POST
  https://api.mypurecloud.com.au/api/v2/conversations/calls/<guid1>/participants/<guid2>/consult
  first GUID : conv id, second GUID: inbound mobile participant (wierd, don't understand why not agent as they are doing the consult. maybe its the participant to put on hold)
  payload: {"speakTo":"DESTINATION","destination":{"address":"0737119394"}}
  -- likley so customer gets put on hold not agent

  Notes
  * there are two customers for the calling mobile - indound and outboud, the inbound one is used in the API
  * no idea why there is two customers - check this
  * the customer gets hold music as soon as transfer initiated and only the agent and transfer number can talk. The agent has conf, transfer options

------------------------------------------------------------------------------------------------------------------------------------------------------------ */

async function consult(phoneNumber) {
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
    if (conversationObject == null ) { console.log("ctd_pwajs::consult() exiting, conversationObject is null"); return }

    let conversationId = getConversationId(conversationObject);
    if (conversationId == null ) { console.log("ctd_pwajs::consult() exiting, conversationId is null"); return }

    customerId = getCustomerId(conversationObject);
    if (customerId == null ) { console.log("ctd_pwajs::consult() exiting, customerId is null"); return }

    /* Initiate and update consult transfer */

    let data = await apiInstance.postConversationsCallParticipantConsult(conversationId, customerId, body)

    console.log(`ctd_pwajs::postConversationsCallParticipantConsult() success! data: ${JSON.stringify(data, null, 2)}`);
  
    putCTDmsg(`Dialing ${phoneNumber} for Consult now, please return to Genesys` ) 
  }

  catch (err) {
    console.log("ctd_pwajs::consult() error: ",err);
    putCTDmsg(`Consult with ${phoneNumber} failed, please return to Genesys` ) 
  }

}


/* -------------------------------------------------------------------------------------------------------------------------------------------------------

  Replace agent with transfer destination:
  POST
  https://api.mypurecloud.com.au/api/v2/conversations/calls/<guid1>/participants/<guid2>/replace
  guids: conv id, agent id
  payload: {"address":"0737119394"} 3rd party address

  Then drop agent out:
  PATCH
  https://api.mypurecloud.com.au/api/v2/conversations/calls/<guid1>/participants/<guid2>
  guids : conv id, agent participant id
  payload: {"state":"DISCONNECTED"}

  Note: disconnects agent immediately

----------------------------------------------------------------------------------------------------------------------------------------------------------- */

async function transfer(phoneNumber) {

  try {

    console.log("ctd_pwajs::transfer(), number:", phoneNumber);

    let apiInstance = new platformClient.ConversationsApi();

    let conversationObject = await getConversationObj();
    if (conversationObject == null ) { console.log("ctd_pwajs::transfer() exiting, conversationObject is null"); return }

    if (Object.keys(conversationObject).length === 0) {
       console.log("ctd_pwajs::transfer() no conversation object returned from getConversationObject()");
       return;
    }

    let conversationId = await getConversationId(conversationObject);
    if (conversationId == null ) { console.log("ctd_pwajs::transfer() exiting, conversationId is null"); return }

    let agentId = await getAgentId(conversationObject);
    if (agentId == null ) { console.log("ctd_pwajs::transfer() exiting, agentId is null"); return }


   /* replace agent with transfer destination  */

    let transferBody = {"address": phoneNumber};

    await apiInstance.postConversationsCallParticipantReplace(conversationId, agentId, transferBody);
 

   /* drop agent out of call before transfer destination answers*/

    let disconnectBody = { "state": "DISCONNECTED" };
    let response = await apiInstance.patchConversationsCallParticipant(conversationId, agentId, disconnectBody)

    console.log(`ctd_pwajs::transfer() success, data: ${JSON.stringify(response, null, 2)}`);

    putCTDmsg(`Transfering to ${phoneNumber}, please return to Genesys` ) 

  }

  catch (err) {
    console.log("ctd_pwajs::transfer() error: ",err);
    putCTDmsg(`Transfer to ${phoneNumber} failed, please return to Genesys` ) 
  }

}

/*-------------------------------------------------------------------------------------------------------------------------------------------
  
  Genesys Cloud Login API's

  Requirements:
  1. CTD will only work if agent logins into Genesys. The Agent Genesys session and this apps Genenesys login must be the same
  2. https://help.mypurecloud.com/articles/allow-apps-to-place-calls must be enabled. This can be done by agent, or hopefully API (see later)
     -- actually, not sure if needed, need to test

--------------------------------------------------------------------------------------------------------------------------------------------*/


/* ---------------------------------- get the redirect URL. These must be configured in Genesy OAUTH --------------------------------------- */

function getRedirectURL() {

  let redirectUri;


  switch (window.location.hostname) {

  case 'ssqld-eval2.matrix.squiz.cloud':
    redirectUri = "https://ssqld-eval2.matrix.squiz.cloud/karl2/sp1";
    console.log("ctd_pwajs::getRedirectURL() Redirect URI:", redirectUri);
    break;

  default:
    redirectUri = window.location.origin + window.location.pathname;
    console.log("ctd_pwajs::getRedirectURL() custom windows.location.hostname not matched, using:",redirectUri);

  }

  return redirectUri;
}


/* ---------------------------- needs persist token. otherwise api calls fail with unauthorised ----------------------- */

async function genesysLogin() {

  console.log("ctd_pwajs::genesysLogIn() called");

  redirectUri = getRedirectURL();

  try {

    let phoneNumber = new URLSearchParams(window.location.search).get('num');

    let response = await client.loginPKCEGrant(clientId, redirectUri, { state: phoneNumber })
//    let response = await client.loginPKCEGrant(clientId, redirectUri)

    //console.log("ctd_pwajs::genesysLogin() Response", response);			// do not log response object in production

    console.log("ctd_pwajs::genesysLogin() Already logged in");				// only gets here if no redirect issued, eg already logged in

    return true;
  }

  catch(err)  {
    console.log("ctd_pwajs::genesysLogin() login failed:\n", err);
    return false;
  }

}


/* ----------------------------------------------------------------------------------------------------------------------------------

   Log out of Genesys. There's no API for this and this is the recomended way .

   Set the logout redirect uri to the page that called genesyslogout()

------------------------------------------------------------------------------------------------------------------------------------ */

function genesysLogout() {

  let logoutRedirectURL= window.location.href;
  let logoutURL = `https://login.mypurecloud.com.au/logout?client_id=${clientId}&redirect_uri=${logoutRedirectURL}`	// same host
  window.location.replace(logoutURL);

}