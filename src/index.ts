let source = '';
let apiKey = '';
let token = '';

/**
 * Initalises ValidTrace with the authentication api key. 
 * @param {string} key API key
 * @param {*string} apiSource Optional - Allows you to override the apiSource (for beta testing & dev). 
 */
Cypress.Commands.add("loadValidTrace", (key, apiSource = "https://api.validtrace.com") => {
    apiKey = key;
    source = apiSource;
    //Authenticate with ValidTrace
    cy.request({
        method: 'POST',
        url: `${source}/auth/login`,
        body: {
            username: 'API',
            password: key
        },
        failOnStatusCode: false
    }).then((response) => {
        const isAuthed = response.body.status;
        const message = isAuthed ?
        `(ValidTrace) Successfully authenticated with ValidTrace.com`
        :  `(ValidTrace) Failed to authenticate with ValidTrace.com - ${response.body.message}`;
        token = response.body.token;
        expect(response.body.status).to.equal(true, message);
    })
});

/**
 * Generates a new email address to send emails to.
 */
Cypress.Commands.add("getEmailAddress", () => { 
    cy.request({
      method: 'POST',
      url: `${source}/address/`,
      failOnStatusCode: false,
      auth: {
          'bearer': token
      }
    })
    .its("body").its("email");
});

/**
 * Will check with ValidTrace to see if an email arrives with the given specifications within a 20 second window. 
 */
Cypress.Commands.add("expectEmail", (email, params = undefined) => {
    email = email.split('@')[0];
    const getParams = () => {
        let param = '';
        if(!params || Object.keys(params).length == 0) return '';
        param = '?'
        for(let i = 0; i < Object.keys(params).length; i++) {
            if(i > 0) param+= '&';
            param += Object.keys(params)[i] + "=" + params[Object.keys(params)[i]];
            if(i == Object.keys(params).length - 1) {
                return param;
            }
        }
    }
    cy.request({
        method: 'GET',
        url: `${source}/address/${email}/expect${getParams()}`,
        failOnStatusCode: false,
        auth: {
            'bearer': token
        }
    }).then((response) => {
        const received = response.body.received;
        const message = received ?
            `(ValidTrace) Successfully receieved email to ${email}@validtrace.com`
            :  `(ValidTrace) Failed to receieve email to ${email}@validtrace.com`;

        expect(received).to.equal(true, message);
    })
})
