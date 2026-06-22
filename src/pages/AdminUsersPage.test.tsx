import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { AdminUsersPage } from "./AdminUsersPage";

const mockUseAuthUser = vi.fn();
const mockUseCurrentUser = vi.fn();
const mockUseAdminUsers = vi.fn();

vi.mock("../hooks", () => ({
  useAuthUser: () => mockUseAuthUser(),
  useCurrentUser: () => mockUseCurrentUser(),
}));

vi.mock("../hooks/useAdminUsers", () => ({
  useAdminUsers: (enabled: boolean) => mockUseAdminUsers(enabled),
}));

vi.mock("@aws-amplify/ui-react", () => ({
  View: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Heading: ({ children }: { children?: React.ReactNode }) => <h3>{children}</h3>,
  Text: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
  Button: ({ children, onClick, isLoading }: { children?: React.ReactNode; onClick?: () => void; isLoading?: boolean }) => (
    <button type="button" onClick={onClick} disabled={isLoading}>
      {children}
    </button>
  ),
}));

describe("AdminUsersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuthUser.mockReturnValue({ isAdmin: true, isLoadingAuthUser: false });
    mockUseCurrentUser.mockReturnValue({ userId: "admin-1" });
    mockUseAdminUsers.mockReturnValue({
      users: [
        {
          userId: "managed-1",
          nickname: "alice",
          realName: "Alice",
          identityType: "admin_managed",
          createdBy: "admin-1",
        },
      ],
      isLoadingUsers: false,
      isSavingUser: false,
      createAdminUser: vi.fn().mockResolvedValue(undefined),
      updateAdminUser: vi.fn().mockResolvedValue(undefined),
    });
  });

  it("creates an admin-managed user", async () => {
    const user = userEvent.setup();
    const createAdminUser = vi.fn().mockResolvedValue(undefined);
    mockUseAdminUsers.mockReturnValue({
      users: [],
      isLoadingUsers: false,
      isSavingUser: false,
      createAdminUser,
      updateAdminUser: vi.fn().mockResolvedValue(undefined),
    });

    render(
      <MemoryRouter>
        <AdminUsersPage />
      </MemoryRouter>
    );

    const nicknameInputs = screen.getAllByPlaceholderText("ニックネーム");
    const realNameInputs = screen.getAllByPlaceholderText("本名");

    await user.type(nicknameInputs[0], "new-user");
    await user.type(realNameInputs[0], "New User");
    await user.click(screen.getByRole("button", { name: "利用者を作成" }));

    expect(createAdminUser).toHaveBeenCalledWith({
      nickname: "new-user",
      realName: "New User",
      adminUserId: "admin-1",
    });
  });

  it("updates an existing user", async () => {
    const user = userEvent.setup();
    const updateAdminUser = vi.fn().mockResolvedValue(undefined);
    mockUseAdminUsers.mockReturnValue({
      users: [
        {
          userId: "managed-1",
          nickname: "alice",
          realName: "Alice",
          identityType: "admin_managed",
          createdBy: "admin-1",
        },
      ],
      isLoadingUsers: false,
      isSavingUser: false,
      createAdminUser: vi.fn().mockResolvedValue(undefined),
      updateAdminUser,
    });

    render(
      <MemoryRouter>
        <AdminUsersPage />
      </MemoryRouter>
    );

    await user.click(screen.getByRole("button", { name: "編集" }));

    const editNicknameInput = screen.getByDisplayValue("alice");
    const editRealNameInput = screen.getByDisplayValue("Alice");

    await user.clear(editNicknameInput);
    await user.type(editNicknameInput, "alice-updated");
    await user.clear(editRealNameInput);
    await user.type(editRealNameInput, "Alice Updated");

    await user.click(screen.getByRole("button", { name: "保存" }));

    expect(updateAdminUser).toHaveBeenCalledWith({
      userId: "managed-1",
      nickname: "alice-updated",
      realName: "Alice Updated",
      adminUserId: "admin-1",
    });
  });

  it("shows guard message for non-admin", () => {
    mockUseAuthUser.mockReturnValue({ isAdmin: false, isLoadingAuthUser: false });

    render(
      <MemoryRouter>
        <AdminUsersPage />
      </MemoryRouter>
    );

    expect(screen.getByText("このページは管理者のみアクセスできます。")).toBeInTheDocument();
  });
});
