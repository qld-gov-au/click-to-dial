import platformClient from 'purecloud-platform-client-v2'; // Import platformClient

// Helper function to fetch conversation objects
async function getConversationObj() {
  try {
    const apiConversationsInstance = new platformClient.ConversationsApi();
    const conversationObj = await apiConversationsInstance.getConversationsCalls();
    console.log("ctd_pwajs::getConversationObj: \n", conversationObj);
    return conversationObj;
  } catch (err) {
    console.log(
      "ctd_pwajs::getConversationObj() There was a failure calling getConversationsCalls:\n",
      err
    );
    throw err; // Global error handler in window.load will catch this
  }
}

export async function getGenesysOrgName() {
  const apiInstance = new platformClient.OrganizationApi();
  const orgDetails = await apiInstance.getOrganizationsMe();
  return orgDetails.domain;
}

export async function consult(phoneNumber) {
  const apiInstance = new platformClient.ConversationsApi();
  const body = {
    speakTo: 'DESTINATION',
    destination: { address: phoneNumber },
  };

  const conversationObj = await getConversationObj(); // Use the helper function

  if (!conversationObj.entities || conversationObj.entities.length === 0) {
    throw new Error('No valid conversation found.');
  }

  const conversationId = conversationObj.entities[0]?.id;
  const customerId = conversationObj.entities[0]?.participants.find(
    (p) => p.purpose === 'customer' && !p.disconnectType
  )?.id;

  if (!conversationId) {
    throw new Error('No valid conversation found.');
  }

  if (!customerId) {
    throw new Error('No valid customer found.');
  }

  await apiInstance.postConversationsCallParticipantConsult(conversationId, customerId, body);
}
