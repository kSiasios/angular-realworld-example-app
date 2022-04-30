// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

Cypress.Commands.add("loginToApplication", () => {
  // Headless authentication
  const userCredentials = {
    user: {
      email: Cypress.env("username"),
      password: Cypress.env("password"),
    },
  };
  cy.request({
    method: "POST",
    url: `${Cypress.env("apiURL")}api/users/login`,
    body: userCredentials,
  })
    .its("body")
    .then((body) => {
      // localStorage.setItem("jwtToken", body.user.token);

      // cy.visit("/login");
      // cy.get('input[placeholder="Email"]').type("kostassiasios1999@gmail.com");
      // cy.get('input[placeholder="Password"]').type("PB9pdBsfaLLyKf9");
      // cy.get("form").submit();
      const token = body.user.token;
      cy.wrap(token).as("token");
      cy.visit("/", {
        onBeforeLoad(win) {
          win.localStorage.setItem("jwtToken", token);
        },
      });
    });
});
