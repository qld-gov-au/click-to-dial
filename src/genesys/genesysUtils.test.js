const { initGenesys, setGenesysAccessToken, getGenesysClientId, genesysLogin, getGenesysOrgName } = require('./genesysUtils');

jest.mock('purecloud-platform-client-v2', () => {
    const mockApiClient = {
        setEnvironment: jest.fn(),
        setAccessToken: jest.fn(), // Ensure this method is included
        setPersistSettings: jest.fn(),
        loginPKCEGrant: jest.fn(),
        authData: {}, // Mock authData for testing
        getOrganization: jest.fn(), // Mock getOrganization for getGenesysOrgName
    };

    return {
        ApiClient: {
            instance: mockApiClient, // Mock the singleton instance
        },
        PureCloudRegionHosts: {
            ap_southeast_2: 'mock-region',
        },
    };
});

describe('genesysUtils.js Unit Tests', () => {
    let mockApiClient;

    beforeEach(() => {
        jest.clearAllMocks();
        mockApiClient = require('purecloud-platform-client-v2').ApiClient.instance;
        console.log('beforeEach: mockApiClient initialized', mockApiClient);

        // Set a mock access token in localStorage
        const mockAuthData = {
            accessToken: 'mockAccessToken',
        };
        const localStorageKey = 'ssq_token__auth_data';
        localStorage.setItem(localStorageKey, JSON.stringify(mockAuthData));
        console.log(`beforeEach: Mock access token set in localStorage under key "${localStorageKey}":`, mockAuthData);
    });

    test('initGenesys should initialize the Genesys client', () => {
        console.log('initGenesys test: calling initGenesys');
        const client = initGenesys();

        console.log('initGenesys test: verifying returned client has expected methods');
        expect(client).toHaveProperty('setEnvironment');
        expect(client).toHaveProperty('setAccessToken');
        expect(client).toHaveProperty('setPersistSettings');
        expect(client).toHaveProperty('loginPKCEGrant');

        console.log('initGenesys test: verifying setPersistSettings was called');
        expect(client.setPersistSettings).toHaveBeenCalledWith(true, 'ssq_token_');

        console.log('initGenesys test: verifying setEnvironment was called');
        expect(client.setEnvironment).toHaveBeenCalledWith('mock-region');
    });

    test('setGenesysAccessToken should set the access token', () => {
        console.log('setGenesysAccessToken test: calling setGenesysAccessToken');
        const token = 'mockAccessToken';
        setGenesysAccessToken(token);

        console.log('setGenesysAccessToken test: verifying setAccessToken was called');
        expect(mockApiClient.setAccessToken).toHaveBeenCalledWith(token);

        console.log('setGenesysAccessToken test: verifying access token is saved in authData');
        expect(mockApiClient.authData.accessToken).toBe(token);
    });

    test('genesysLogin should set environment and access token', async () => {
        console.log('genesysLogin test: setting up mock data');
        const mockClient = mockApiClient;
        const mockPhoneNumber = '1234567890';
        const mockClientId = 'mockClientId';

        console.log('genesysLogin test: calling genesysLogin');
        await genesysLogin(mockClient, mockPhoneNumber, mockClientId);

        console.log('genesysLogin test: verifying setEnvironment and setAccessToken were called');
        expect(mockClient.setEnvironment).toHaveBeenCalledWith('mock-region');
        expect(mockClient.setAccessToken).toHaveBeenCalledWith(expect.any(String));
    });

    test('getGenesysOrgName should return the organization name', async () => {
        console.log('getGenesysOrgName test: setting up mock data');
        const mockOrgName = 'mock-org.com'; // Update to match the actual returned value
        mockApiClient.getOrganization.mockResolvedValue({ domain: mockOrgName }); // Ensure the mock returns the correct domain

        console.log('getGenesysOrgName test: calling getGenesysOrgName');
        const orgName = await getGenesysOrgName();

        console.log('getGenesysOrgName test: verifying returned organization name');
        expect(orgName).toBe(mockOrgName); // Verify the returned value matches the mock
    });
});
