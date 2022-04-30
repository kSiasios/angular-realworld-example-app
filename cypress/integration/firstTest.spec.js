///<reference types="cypress" />

function deleteArticleByTitle(title) {
  cy.get(".nav-item .nav-link img.user-pic").click();
  cy.contains("a.preview-link", title).click();
  cy.contains("button", "Delete Article").click();
}

const runOn = (browser, fn) => {
  if (Cypress.isBrowser(browser)) {
    fn();
  }
};

const ignoreOn = (browser, fn) => {
  if (!Cypress.isBrowser(browser)) {
    fn();
  }
};

describe("Test with backend", () => {
  beforeEach("Log-in to application", () => {
    // cy.server();
    cy.intercept({ method: "GET", path: "tags" }, { fixture: "tags.json" });
    cy.loginToApplication();
  });

  it("Verify correct request and response", () => {
    // cy.log("LOGGED IN");

    // To intercept the calls, we need to create a Cypress server
    // cy.server();
    cy.intercept("POST", "**/api.realworld.io/api/articles").as("postArticles");
    // cy.intercept("POST", "**/articles").as("postArticles");

    cy.contains("New Article").click();

    const articleTitle = "This is the title of this article";
    const articleDescription = "This is the description";
    const articleText = "Article text";

    // Fill in the inputs
    cy.get("input[placeholder='Article Title']").type(articleTitle);
    cy.get('input[placeholder="What\'s this article about?"]').type(
      articleDescription
    );
    cy.get('textarea[placeholder="Write your article (in markdown)"]').type(
      articleText
    );

    cy.contains("button", "Publish Article").click();

    // wait for the request to complete and handle the returned value
    cy.wait("@postArticles");
    cy.get("@postArticles").then((xhr) => {
      console.log(xhr);

      // assert that the request title is the one we typed
      // and that the response description is the one we typed
      expect(xhr.response.statusCode).to.equal(200);
      expect(xhr.request.body.article.title).to.equal(articleTitle);
      expect(xhr.response.body.article.title).to.equal(articleTitle);
    });

    deleteArticleByTitle(articleTitle);
  });

  it("Intercept and modify request and response", () => {
    // Modify Request
    // cy.intercept("POST", "**/api.realworld.io/api/articles", (req) => {
    //   req.body.article.description = "This is a description 2";
    // }).as("postArticles");

    // Modify Response
    cy.intercept("POST", "**/api.realworld.io/api/articles", (req) => {
      req.reply((res) => {
        expect(res.body.article.description).to.equal(
          "This is the description"
        );

        res.body.article.description = "This is the description 2";
      });
    }).as("postArticles");

    cy.contains("New Article").click();

    const articleTitle = "This is the title of this article";
    const articleDescription = "This is the description";
    const articleText = "Article text";

    // Fill in the inputs
    cy.get("input[placeholder='Article Title']").type(articleTitle);
    cy.get('input[placeholder="What\'s this article about?"]').type(
      articleDescription
    );
    cy.get('textarea[placeholder="Write your article (in markdown)"]').type(
      articleText
    );

    cy.contains("button", "Publish Article").click();

    // wait for the request to complete and handle the returned value
    cy.wait("@postArticles");
    cy.get("@postArticles").then((xhr) => {
      console.log(xhr);

      // assert that the request title is the one we typed
      // and that the response description is the one we typed
      expect(xhr.response.statusCode).to.equal(200);
      expect(xhr.request.body.article.title).to.equal(articleTitle);
      expect(xhr.response.body.article.title).to.equal(articleTitle);
    });

    deleteArticleByTitle(articleTitle);
  });

  it("Intercept get request with custom response", () => {
    // cy.wait("@getTags");
    cy.get(".tag-list")
      .should("contain", "cypress")
      .and("contain", "automation")
      .and("contain", "testing");
  });

  it("Verify global feed likes count", () => {
    cy.intercept("GET", "**/articles/feed", { articles: [], articlesCount: 0 });
    cy.intercept("GET", "**/articles*", { fixture: "articles.json" });

    cy.wait(2000);
    cy.contains("Global Feed").click();

    cy.get("app-article-list button").then((likeButtons) => {
      expect(likeButtons[0]).to.contain(15);
      expect(likeButtons[1]).to.contain(2);
    });

    cy.fixture("articles").then((file) => {
      const articleLink = file.articles[1].slug;
      cy.intercept(
        "POST",
        `**/articles/${articleLink}/favourite`,
        file.articles[1]
      );
    });

    cy.get("app-article-list button").eq(1).click().should("contain", 3);
  });

  // ignore test on certain browser
  ignoreOn("firefox", () => {
    it("Test article deletion", () => {
      // To test deletion, we need to create a test article.
      // We do so using api calls, not to bother with UI

      // Intercept any DELETE
      cy.intercept({
        method: "DELETE",
      }).as("deleteRequest");

      const articleBody = {
        article: {
          tagList: [],
          title: "Request from API",
          description: "This article is about requests from api.",
          body: "Requests from api are invisible to the user.",
        },
      };

      cy.get("@token").then((token) => {
        // POST request to create article
        cy.request({
          method: "POST",
          url: `${Cypress.env("apiURL")}api/articles/`,
          headers: {
            Authorization: `Token ${token}`,
          },
          body: articleBody,
        }).then((response) => {
          expect(response.status).to.equal(200);
        });

        // // Delete article using the UI
        // // cy.contains("Global Feed").click();
        // cy.get("a.nav-link").contains("Global Feed").click();
        // // cy.wait(5000);
        // // cy.contains(articleBody.article.title).click();
        // cy.get(".article-preview").contains(articleBody.article.title).click();
        // // cy.contains("Delete Article").click();
        // cy.get("button.btn-outline-danger").contains("Delete Article").click();

        deleteArticleByTitle(articleBody.article.title);

        // CHECK IF THE ARTICLE WAS DELETED
        cy.wait("@deleteRequest").then(() => {
          cy.request({
            method: "GET",
            url: `${Cypress.env("apiURL")}/api/articles?limit=10&offset=0`,
            headers: {
              Authorization: `Token ${token}`,
            },
          })
            .its("body")
            .then((body) => {
              body.articles.forEach((element) => {
                expect(element.title).not.to.include(articleBody.article.title);
              });
            });
        });
      });
    });
  });
});
