describe("Event register card (E2E fallback)", () => {
  const eventId = "stubbed-register-event";

  beforeEach(() => {
    cy.visit(`/events/${eventId}`);
  });

  it("shows register options and surfaces unauthenticated guidance", () => {
    cy.contains("Ready to register?").should("be.visible");
    cy.contains("button", "Going").should("be.visible").click();
    cy.contains("Sign in to register for this event.").should("be.visible");
    cy.contains(
      "Sign in to manage your RSVP and receive event updates.",
    ).should("be.visible");
  });
});
