import { getGenesysOrgName, consult } from './genesysApi';
import platformClient from 'purecloud-platform-client-v2';

jest.mock('purecloud-platform-client-v2', () => ({
  OrganizationApi: jest.fn().mockImplementation(() => ({
    getOrganizationsMe: jest.fn().mockResolvedValue({ domain: 'example.com' }),
  })),
  ConversationsApi: jest.fn().mockImplementation(() => ({
    getConversationsCalls: jest.fn().mockResolvedValue({
      entities: [
        {
          id: 'conversationId',
          participants: [
            { id: 'customerId', purpose: 'customer', disconnectType: null },
          ],
        },
      ],
    }),
    postConversationsCallParticipantConsult: jest.fn().mockResolvedValue({}),
  })),
}));

describe('genesysApi', () => {
  describe('getGenesysOrgName', () => {
    it('should return the organization domain', async () => {
      const domain = await getGenesysOrgName();
      expect(domain).toBe('example.com');
    });
  });

  describe('consult', () => {
    it('should throw an error if no valid conversation is found', async () => {
      const mockConversationsApi = new platformClient.ConversationsApi();
      mockConversationsApi.getConversationsCalls.mockResolvedValueOnce({
        entities: [],
      });

      await expect(consult('+61400000000')).rejects.toThrow(
        'No valid conversation found.'
      );
    });

    it('should throw an error if no valid customer is found', async () => {
      const mockConversationsApi = new platformClient.ConversationsApi();
      mockConversationsApi.getConversationsCalls.mockResolvedValueOnce({
        entities: [
          {
            id: 'conversationId',
            participants: [],
          },
        ],
      });

      await expect(consult('+61400000000')).rejects.toThrow(
        'No valid customer found.'
      );
    });

    it('should call postConversationsCallParticipantConsult with correct parameters', async () => {
      const mockConversationsApi = new platformClient.ConversationsApi();
      await consult('+61400000000');

      expect(
        mockConversationsApi.postConversationsCallParticipantConsult
      ).toHaveBeenCalledWith(
        'conversationId',
        'customerId',
        expect.objectContaining({
          speakTo: 'DESTINATION',
          destination: { address: '+61400000000' },
        })
      );
    });
  });
});
