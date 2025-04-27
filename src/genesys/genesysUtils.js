import { finish } from '../utils/windowUtils.js';
import { PWA_WIN_TIMEOUT, PWA_WIN_TIMEOUT_ERR } from '../index.js';

import platformClient from "purecloud-platform-client-v2";

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
      await finish("Referral unsuccessful.<br><br>An unknown error has occured. " +
                   "Please report this to your Team Leader.",
                   PWA_WIN_TIMEOUT_ERR);
      return null;
    }
  
  
    if (convObj.entities.length === 0) {
      console.log("ctd_pwajs::getConversationId() Error: no conversations " +
                  "detected, alerting user");
      await finish("Referral unsuccessful.<br><br>A referral cannot be initiated " +
                    "without an active Genesys interaction.",
                    PWA_WIN_TIMEOUT_ERR);
      return null;
    };
  
    let countId=0;
    let convId=0;
    for (let index1 = 0; index1 < convObj.entities.length; ++index1) {
      if ( convObj.entities[index1].participants.length > 0) {
         countId++
         convId=convObj.entities[index1].id
      }
    }
  
    if ( countId > 1) { await finish("Referral unsuccessful.<br><br>A referral " +
                                      "cannot be initiated with more than one active "+
                                      "Genesys interaction.", PWA_WIN_TIMEOUT_ERR) };
    if ( convId === 0) { await finish("Referral unsuccessful.<br><br>A referral " + 
                                       "cannot be initiated without an active " +
                                       "Genesys interaction.", PWA_WIN_TIMEOUT_ERR) };
  
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
  
    let customerId = null;
  
    // convObj = null			// testing null convObj error handling
  
    if ( convObj === undefined || convObj === null || convObj === "")
    {
      console.log("ctd_pwajs::getAgentId() no or null conversation object" +
                  "passed to getAgentId()");
  
      await finish("Referral unsuccessful.<br><br>" +
                   "An unknown error has occured. Please report this to your Team Leader.",
                    PWA_WIN_TIMEOUT_ERR);
  
   
  
  
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
    };
  
    console.log('ctd_pwajs::getCustomerId() customer id found:',customerId);
  
    return customerId;
  }
  

/* -----------------------------------------------------------------------------
  Get Genesys Cloud Organization name for display. Usefull for troubleshooting
------------------------------------------------------------------------------*/

export async function getGenesysOrgName() {

  let apiInstance = new platformClient.OrganizationApi();
  let orgDetails = await apiInstance.getOrganizationsMe();
  console.log("ctd_pwajs::getGenesysOrgName() org name:",orgDetails.domain);
  return orgDetails.domain;

}


/* ----------------------------------------------------------------------------
  init Genesys - load SDK/Libraries
----------------------------------------------------------------------------- */

export function initGenesys() {

  console.log('Initializing Genesys SDK...');
  // This seems to pull the local storage token - console.log(client)
  let client = platformClient.ApiClient;

  // Persist token in on local storage
  client.setPersistSettings(true, 'ssq_token_');

  client.setEnvironment(platformClient.PureCloudRegionHosts.ap_southeast_2);

  return client;

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

export async function consult(phoneNumber) {

  //throw new Error("testing error handling")

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

    await finish(`Referral initiated.<br><br>Navigate to Genesys to manage 
                 the referral. ` , PWA_WIN_TIMEOUT);

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

  };

  return redirectUri;
}

/* -----------------------------------------------------------------------------
  Genesys redirect URL matching ignores state, but fails on num=%s so can't
    pass that directly, must be passed as state
  Needs persist token. Otherwise subsequent api calls fail with unauthorised
  SDK appears to pick up OAauth code from URL to get API enpoint Token
----------------------------------------------------------------------------- */

export async function genesysLogin(client, phoneNumber, clientId) {

  console.log(`ctd_pwajs::genesysLogIn() entry, phone: ${phoneNumber}, ` +
              `oauth client id ${clientId}` );

  let redirectUri = getRedirectURL();

  try {

    console.log("ctd_pwajs::genesysLogIn() attempting loginPKCEGrant...");
    await client.loginPKCEGrant(clientId, redirectUri, { state: phoneNumber })

    // only gets here if no redirect issued, eg already logged in
    console.log("ctd_pwajs::genesysLogin() already logged in");

    return true;
  }

  catch (err) {
    console.error("ctd_pwajs::genesysLogin() login failed:", err);
  
    if (err.message.includes("invalid_client")) {
      console.error("Invalid client ID. Please check the OAuth client configuration.");
    } else if (err.message.includes("invalid_redirect_uri")) {
      console.error("Invalid redirect URI. Please ensure it matches the configured value in Genesys.");
    } else if (err.message.includes("network")) {
      console.error("Network error. Please check your internet connection.");
    }
  
    throw err; // Re-throw the error for the global error handler
  }

}

