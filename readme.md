## PWA tel protocol handler

This PWA registers as a tel protocol handler. This app will be launched any time a user 
clicks a link of the following standard form on *any* web site.

Example:
<p><a href="tel:+61400000000">Click to dial and invoke the PWA:  +61400000000</a></p>

### Installation

1. Visit the link where this code will be deployed.
2. Click '...' in the top right-hand corner of a Chromium browser.
3. Hover over apps; a little menu box should appear.
4. Click "install this site as an app."
5. Accept defaults.
6. It will launch the app; close the app.

### Installation verification

Check app installed:
1. Hover over apps, select view apps.
2. The installed app should appear.

Check Manifest:
1. Press F12 in the browser, go to the application tab -> manifest.
2. Scroll down and check the protocol handler is registered.

Check Windows has registered the Telephony Provider:  
1. Go to settings -> apps -> default apps -> scroll down -> set app by protocol.
2. Scroll down the list of protocols to `tel:`.
3. The app should appear as the `tel:` protocol handler.

### Local Development

For details on setting up and running the application locally, refer to the [Local Development Guide](./LOCAL_DEVELOPMENT.md).

### What is a PWA

PWAs also have many of the benefits of platform-specific apps, including:

PWAs can be installed on the device. This means:
* The PWA can be installed from the platform's app store or installed directly from the web.
* The PWA can be installed like a platform-specific app and can customize the install process.
* Once installed, the PWA gets an app icon on the device, alongside platform-specific apps.
* Once installed, the PWA can be launched as a standalone app, rather than a website in a browser.

PWAs can operate in the background and offline: a typical website is only active while the page is loaded in the browser. A PWA can:
* Work while the device does not have network connectivity.
* Update content in the background.
* Respond to push messages from the server.
* Display notifications using the OS notifications system.
* PWAs can use the whole screen, rather than running in the browser UI.
* PWAs can be integrated into the device, registering as share targets and sources, and accessing device features.
* PWAs can be distributed in app stores, as well as openly via the web.

For a good description of what is a PWA, see: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/What_is_a_progressive_web_app

### This implementation

This implementation is not a true PWA as it does not have a service worker. Its only purpose is to act as a `tel:` protocol handler and 
doesn't need a service worker to respond to background events or provide capability when the app is launched offline.

It does use the standard PWA manifest file via a web host. The manifest has the following protocol handler section as follows:

<pre>
  "protocol_handlers": [
    {
      "protocol": "tel",
      "url": "/click-to-dial/tel_pwa?num=%s"
    }
  ]
</pre>