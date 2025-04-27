import {
  extractPhoneNumberFromURL,
  validatePhoneNumber,
  isPhoneNumberValid,
  getPhoneNumber,
} from './phoneUtils';

describe('phoneUtils', () => {
  let originalLocation;

  beforeAll(() => {
    // Save the original location object
    originalLocation = window.location;
  });

  afterAll(() => {
    // Restore the original location object
    delete window.location;
    window.location = originalLocation;
  });

  describe('extractPhoneNumberFromURL', () => {
    it('should extract the phone number from the "state" parameter when invoked via OAuth redirect', () => {
      delete window.location;
      window.location = {
        search: '?code=12345&state=%2B61400000000',
        origin: 'http://localhost',
        pathname: '/test',
      };

      const phone = extractPhoneNumberFromURL();
      expect(phone).toBe('+61400000000');
    });

    it('should extract the phone number from the "num" parameter when invoked directly', () => {
      delete window.location;
      window.location = {
        search: '?num=%2B61400000000',
        origin: 'http://localhost',
        pathname: '/test',
      };

      const phone = extractPhoneNumberFromURL();
      expect(phone).toBe('+61400000000');
    });

    it('should return null if no phone number is provided in the URL', () => {
      delete window.location;
      window.location = {
        search: '',
        origin: 'http://localhost',
        pathname: '/test',
      };

      const phone = extractPhoneNumberFromURL();
      expect(phone).toBeNull();
    });
  });

  describe('validatePhoneNumber', () => {
    it('should throw an error if the phone number is null or empty', () => {
      expect(() => validatePhoneNumber(null)).toThrow(
        'Invalid phone number - empty or null string passed'
      );
      expect(() => validatePhoneNumber('')).toThrow(
        'Invalid phone number - empty or null string passed'
      );
    });

    it('should throw an error if the phone number contains no valid characters', () => {
      expect(() => validatePhoneNumber('() - ')).toThrow(
        'Invalid phone number - does not contain dialable numbers'
      );
    });

    it('should return a valid formatted phone number', () => {
      const phone = 'tel:%2B61%20400%20000-000';
      const formattedPhone = validatePhoneNumber(phone);
      expect(formattedPhone).toBe('+61400000000');
    });
  });

  describe('isPhoneNumberValid', () => {
    it('should return true for a valid phone number', () => {
      expect(isPhoneNumberValid('+61400000000')).toBe(true);
      expect(isPhoneNumberValid('0400000000')).toBe(true);
    });

    it('should throw an error for an invalid phone number', () => {
      expect(() => isPhoneNumberValid('invalidPhoneNumber')).toThrow(
        'Invalid phone number: invalidPhoneNumber'
      );
    });
  });

  describe('getPhoneNumber', () => {
    it('should return the phone number from the "state" parameter when invoked via OAuth redirect', async () => {
      delete window.location;
      window.location = {
        search: '?code=12345&state=%2B61400000000',
        origin: 'http://localhost',
        pathname: '/test',
      };

      const phoneNumber = await getPhoneNumber();
      expect(phoneNumber).toBe('+61400000000');
    });

    it('should return the phone number from the "num" parameter when invoked directly', async () => {
      delete window.location;
      window.location = {
        search: '?num=%2B61400000000',
        origin: 'http://localhost',
        pathname: '/test',
      };

      const phoneNumber = await getPhoneNumber();
      expect(phoneNumber).toBe('+61400000000');
    });

    it('should throw an error if the phone number is null or empty', async () => {
      delete window.location;
      window.location = {
        search: '?num=',
        origin: 'http://localhost',
        pathname: '/test',
      };

      await expect(getPhoneNumber()).rejects.toThrow(
        'Invalid phone number - empty or null string passed'
      );
    });

    it('should throw an error if the phone number contains no valid characters', async () => {
      delete window.location;
      window.location = {
        search: '?num=%28%29%20-%20',
        origin: 'http://localhost',
        pathname: '/test',
      };

      await expect(getPhoneNumber()).rejects.toThrow(
        'Invalid phone number - does not contain dialable numbers'
      );
    });

    it('should throw an error if the phone number is not valid', async () => {
      delete window.location;
      window.location = {
        search: '?num=invalidPhoneNumber',
        origin: 'http://localhost',
        pathname: '/test',
      };

      await expect(getPhoneNumber()).rejects.toThrow(
        'Invalid phone number: invalidPhoneNumber'
      );
    });

    it('should handle phone numbers with special characters and return a valid formatted number', async () => {
      delete window.location;
      window.location = {
        search: '?num=tel:%2B61%20400%20000-000',
        origin: 'http://localhost',
        pathname: '/test',
      };

      const phoneNumber = await getPhoneNumber();
      expect(phoneNumber).toBe('+61400000000');
    });
  });
});
