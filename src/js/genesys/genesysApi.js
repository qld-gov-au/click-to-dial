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

  const conversationObj = await apiInstance.getConversationsCalls();
  const conversationId = conversationObj.entities[0]?.id;
  const customerId = conversationObj.entities[0]?.participants.find(
    (p) => p.purpose === 'customer' && !p.disconnectType
  )?.id;

  if (!conversationId || !customerId) {
    throw new Error('No valid conversation or customer found.');
  }

  await apiInstance.postConversationsCallParticipantConsult(conversationId, customerId, body);
}
