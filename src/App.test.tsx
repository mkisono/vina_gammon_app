import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";

const mockUseAuthUser = vi.fn();
const authenticatorPropsSpy = vi.fn();

vi.mock("./hooks", () => ({
  useAuthUser: () => mockUseAuthUser(),
}));

vi.mock("./pages/PublicHomePage", () => ({
  PublicHomePage: () => <div>PublicHomePage</div>,
}));
vi.mock("./pages/PublicEventPage", () => ({
  PublicEventPage: () => <div>PublicEventPage</div>,
}));
vi.mock("./pages/HomePage", () => ({
  HomePage: () => <div>AdminHomePage</div>,
}));
vi.mock("./pages/EventPage", () => ({
  EventPage: () => <div>AdminEventPage</div>,
}));
vi.mock("./pages/ProfilePage", () => ({
  ProfilePage: () => <div>AdminProfilePage</div>,
}));
vi.mock("./pages/EventCreatePage", () => ({
  EventCreatePage: () => <div>AdminEventCreatePage</div>,
}));
vi.mock("./pages/AdminUsersPage", () => ({
  AdminUsersPage: () => <div>AdminUsersPage</div>,
}));

vi.mock("@aws-amplify/ui-react", () => ({
  Authenticator: ({
    children,
    ...props
  }: {
    children: React.ReactNode | ((args: { signOut?: () => void; user?: unknown }) => React.ReactNode);
  }) => {
    authenticatorPropsSpy(props);
    if (typeof children === "function") {
      return <>{children({ signOut: vi.fn(), user: undefined })}</>;
    }
    return <>{children}</>;
  },
  useAuthenticator: () => ({
    toForgotPassword: vi.fn(),
  }),
  View: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Button: ({ children, onClick }: { children?: React.ReactNode; onClick?: () => void }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
}));

describe("App routing and admin guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuthUser.mockReturnValue({ isAdmin: false, isLoadingAuthUser: false });
    window.history.pushState({}, "", "/");
  });

  it("shows public home on root route", () => {
    render(<App />);

    expect(screen.getByText("PublicHomePage")).toBeInTheDocument();
  });

  it("shows public event page on event route", () => {
    window.history.pushState({}, "", "/events/sample-event");

    render(<App />);

    expect(screen.getByText("PublicEventPage")).toBeInTheDocument();
  });

  it("redirects non-admin user away from /admin", () => {
    window.history.pushState({}, "", "/admin");
    mockUseAuthUser.mockReturnValue({ isAdmin: false, isLoadingAuthUser: false });

    render(<App />);

    expect(screen.getByText("PublicHomePage")).toBeInTheDocument();
  });

  it("shows admin route when user is admin", () => {
    window.history.pushState({}, "", "/admin/users");
    mockUseAuthUser.mockReturnValue({ isAdmin: true, isLoadingAuthUser: false });

    render(<App />);

    expect(screen.getByText("AdminUsersPage")).toBeInTheDocument();
  });

  it("configures authenticator to hide sign-up", () => {
    window.history.pushState({}, "", "/admin");
    mockUseAuthUser.mockReturnValue({ isAdmin: true, isLoadingAuthUser: false });

    render(<App />);

    expect(authenticatorPropsSpy).toHaveBeenCalled();
    const firstCallProps = authenticatorPropsSpy.mock.calls[0][0] as {
      hideSignUp: boolean;
      initialState: string;
      loginMechanisms: string[];
    };

    expect(firstCallProps.hideSignUp).toBe(true);
    expect(firstCallProps.initialState).toBe("signIn");
    expect(firstCallProps.loginMechanisms).toEqual(["email"]);
  });
});
