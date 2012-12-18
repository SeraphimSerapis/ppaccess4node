PayPal Access for node.js
============

This example shows how to integrate PayPal's open identity solution PayPal Access into an existing [node.js](http://nodejs.org/) that leverages the web framework [Express.js](http://expressjs.com/) & the templating engine [Jade](http://jade-lang.com/).

PayPal offers two flows right now - *OpenID Connect* & *OAuth 2.0*. This example leverages *OpenID Connect* to provide session management functionality.

This is intended as an orientation / helper to integrate PayPal Access in other projects.


How it works
------------
Basically the file app.js creates a webserver which provides three different endpoints:

- **/** - this is just a plain index site that provides a button for the actual login
- **/auth** - this endpoint redirects the user to PayPal and enables him to login
- **/authz** - this is the callback url that will be used by PayPal to deliver the requested *authorization token*

PayPal's endpoints
-------------
PayPal offers five different endpoints for the OpenID Connect flow which provide different functionality:

- **https://www.paypal.com/.../authorize** - authorization requests
- **https://www.paypal.com/.../tokenservice** -- access token
- **https://www.paypal.com/.../userinfo** - profile
- **https://www.paypal.com/.../checkid** - validation
- **https://www.paypal.com/.../endsession** - logout

These endpoints use the same base url:
**https://www.paypal.com/webapps/auth/protocol/openidconnect/v1/..**

Usage
-----
To use the different endpoints the helper already provides five methods:

- authorize
- getProfile
- validateToken
- refreshToken
- logout

To use these methods you'll have to pass the response and a callback-function like this:

    getProfile(res, function(status, body) {
      console.log('status: ' + status);
    });

Author
-----
Tim Messerschmidt - PayPal Developer Evangelist - [tmesserschmidt@paypal.com](mailto:tmesserschmidt@paypal.com)
