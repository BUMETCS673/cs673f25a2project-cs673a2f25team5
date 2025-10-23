import { render, screen } from "@testing-library/react";
import Header from "./Header";

jest.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

jest.mock("@clerk/nextjs", () => ({
  SignedIn: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SignedOut: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SignInButton: () => <button>Sign In</button>,
  SignUpButton: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  UserButton: () => <div>User</div>,
}));

test("renders nav links and auth controls", () => {
  render(<Header />);
  expect(screen.getByText("Home")).toBeInTheDocument();
  expect(screen.getByText("Events")).toBeInTheDocument();
  expect(screen.getByText("Create Event")).toBeInTheDocument();
  expect(screen.getByText("Profile")).toBeInTheDocument();
  expect(screen.getByText("Sign In")).toBeInTheDocument();
  expect(screen.getByText("Sign Up")).toBeInTheDocument();
});
