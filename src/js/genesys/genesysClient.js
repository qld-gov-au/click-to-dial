import platformClient from 'purecloud-platform-client-v2';

export function initGenesys() {
  console.log('Initializing Genesys SDK:', platformClient); // Debugging log

  if (!platformClient || !platformClient.ApiClient) {
    throw new Error('Genesys SDK is not initialized. Ensure the SDK is properly imported and configured.');
  }

  const client = platformClient.ApiClient.instance;
  client.setPersistSettings(true, 'optional_prefix');
  client.setEnvironment(platformClient.PureCloudRegionHosts.ap_southeast_2);
  return client;
}

export async function genesysLogin(client, phoneNumber, clientId) {
  const redirectUri = window.location.origin + window.location.pathname;
  try {
    await client.loginPKCEGrant(clientId, redirectUri, { state: phoneNumber });
    console.log('Genesys login successful.');
  } catch (error) {
    console.error('Genesys login failed:', error);
    throw new Error('Client connection is not established. Please log in to Genesys.');
  }
}
