describe("Visual Test", () => {
  it("should test snapshot", () => {
    cy.visit("/");

    cy.contains("Forms").click();
    cy.contains("Form Layouts").click();

    cy.contains("nb-card", "Using the Grid").then(form => {
      cy.wrap(form).toMatchImageSnapshot();
    });
  });
});
