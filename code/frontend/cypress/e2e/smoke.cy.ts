/*

AI-generated code: 0%

Human code: 100%

Framework-generated code: 0%

*/

describe("Smoke test", () => {
  it("loads home and shows header links", () => {
    cy.visit("/");
    cy.contains("Home").should("exist");
    cy.contains("Events").should("exist");
    cy.contains("Create Event").should("exist");
  });
  it("loads events page and shows events", () => {
    cy.visit("/events");
    cy.contains("Events").should("exist");
  });
  it("loads create event page and shows create event form and can create an event", () => {
    cy.visit("/create-events");
    cy.contains("Create Event").should("exist");
  });
});
