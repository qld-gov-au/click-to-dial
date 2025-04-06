describe('Get Phone Number', () => {
  let isRemoteEnvironmentConnected = false;

  before(() => {
    // Simulate a check for the remote environment connection
    cy.task('checkRemoteEnvironment').then((isConnected) => {
      isRemoteEnvironmentConnected = isConnected;
    });
  });

  beforeEach(function () {
    if (!isRemoteEnvironmentConnected) {
      // Skip the test if the remote environment is not connected
      this.skip();
    }
    cy.visit('/src/js/utils/phoneUtils.html'); // Ensure the app is loaded
  });

  it('should return the phone number from the "state" parameter when invoked via OAuth redirect', () => {
    cy.window().then((win) => {
      const url = new URL(win.location.href);
      url.search = '?code=12345&state=%2B61400000000';
      win.history.pushState({}, '', url.toString());

      cy.window().then(async (win) => {
        const phoneNumber = await win.getPhoneNumber();
        expect(phoneNumber).to.equal('+61400000000');
      });
    });
  });

  it('should return the phone number from the "num" parameter when invoked directly', () => {
    cy.window().then((win) => {
      const url = new URL(win.location.href);
      url.search = '?num=%2B61400000000';
      win.history.pushState({}, '', url.toString());

      cy.window().then(async (win) => {
        const phoneNumber = await win.getPhoneNumber();
        expect(phoneNumber).to.equal('+61400000000');
      });
    });
  });

  it('should throw an error if the phone number is null or empty', () => {
    cy.window().then((win) => {
      const url = new URL(win.location.href);
      url.search = '?num=';
      win.history.pushState({}, '', url.toString());

      cy.window().then(async (win) => {
        try {
          await win.getPhoneNumber();
        } catch (error) {
          expect(error.message).to.equal(
            'Invalid phone number - empty or null string passed'
          );
        }
      });
    });
  });

  it('should throw an error if the phone number contains no valid characters', () => {
    cy.window().then((win) => {
      const url = new URL(win.location.href);
      url.search = '?num=%28%29%20-%20';
      win.history.pushState({}, '', url.toString());

      cy.window().then(async (win) => {
        try {
          await win.getPhoneNumber();
        } catch (error) {
          expect(error.message).to.equal(
            'Invalid phone number - does not contain dialable numbers'
          );
        }
      });
    });
  });

  it('should throw an error if the phone number is not valid', () => {
    cy.window().then((win) => {
      const url = new URL(win.location.href);
      url.search = '?num=invalidPhoneNumber';
      win.history.pushState({}, '', url.toString());

      cy.window().then(async (win) => {
        try {
          await win.getPhoneNumber();
        } catch (error) {
          expect(error.message).to.equal(
            'Invalid phone number: invalidPhoneNumber'
          );
        }
      });
    });
  });

  it('should handle phone numbers with special characters and return a valid formatted number', () => {
    cy.window().then((win) => {
      const url = new URL(win.location.href);
      url.search = '?num=tel:%2B61%20400%20000-000';
      win.history.pushState({}, '', url.toString());

      cy.window().then(async (win) => {
        const phoneNumber = await win.getPhoneNumber();
        expect(phoneNumber).to.equal('+61400000000');
      });
    });
  });
});

describe('Debug Cypress Tasks', () => {
  it('should trigger the debug task', () => {
    cy.task('debugTask').then(() => {
      console.log('Debug task executed successfully.');
    });
  });
});

describe('Coverage Debugging', () => {
  it('should log window.__coverage__', () => {
    cy.window().then((win) => {
      if (win.__coverage__) {
        console.log('Coverage data:', JSON.stringify(win.__coverage__, null, 2));
      } else {
        console.warn('No coverage data found on window.__coverage__');
      }
    });
  });

  it('should trigger logCoverage and writeCoverage tasks', () => {
    cy.window().then((win) => {
      if (win.__coverage__) {
        console.log('Triggering logCoverage task...');
        cy.task('logCoverage', win.__coverage__).then(() => {
          console.log('logCoverage task completed.');
        }).catch((err) => {
          console.error('Error in logCoverage task:', err);
        });

        console.log('Triggering writeCoverage task...');
        cy.task('writeCoverage', win.__coverage__).then(() => {
          console.log('writeCoverage task completed.');
        }).catch((err) => {
          console.error('Error in writeCoverage task:', err);
        });
      } else {
        console.warn('No coverage data found on window.__coverage__ to send to tasks.');
      }
    });
  });
});

describe('Simulate window:before:unload', () => {
  it('should trigger the window:before:unload event', () => {
    cy.window().then((win) => {
      console.log('Simulating window:before:unload event...');
      const event = new Event('beforeunload');
      win.dispatchEvent(event);
    });
  });
});