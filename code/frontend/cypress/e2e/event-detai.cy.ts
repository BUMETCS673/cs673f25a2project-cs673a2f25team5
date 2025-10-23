// cypress/e2e/event-detail.cy.ts
describe("Event detail (server-rendered)", () => {
  const id = "00000000-0000-0000-0000-000000000001"; // must be a real event UUID

  it("renders event details", () => {
    cy.visit(`/events/${id}`);
    cy.contains("Back to events").should("be.visible");
    // Header + sections render
    cy.get("h1").should("contain", "E2E Event");
    cy.contains(/About|Location|Register/i).should("exist");
  });
});
