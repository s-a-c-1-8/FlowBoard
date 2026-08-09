import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import WorkspacesPage from "../pages/WorkspacesPage.jsx";

vi.mock("../features/workspaces/workspaceService.js", () => ({
  getWorkspaces: vi.fn(),
  createWorkspace: vi.fn(),
}));

import {
  getWorkspaces,
  createWorkspace,
} from "../features/workspaces/workspaceService.js";

describe("WorkspacesPage", () => {
  it("should render workspaces returned by the API", async () => {
    getWorkspaces.mockResolvedValue({
      data: {
        workspaces: [
          {
            id: "workspace-1",
            name: "SAC Engineering",
          },
          {
            id: "workspace-2",
            name: "FlowBoard Team",
          },
        ],
      },
    });

    render(
      <MemoryRouter>
        <WorkspacesPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("SAC Engineering")).toBeInTheDocument();

    expect(screen.getByText("FlowBoard Team")).toBeInTheDocument();
  });

  it("should create a new workspace", async () => {
    const user = userEvent.setup();

    getWorkspaces.mockResolvedValue({
      data: {
        workspaces: [],
      },
    });

    createWorkspace.mockResolvedValue({
      data: {
        workspace: {
          id: "workspace-3",
          name: "New Engineering Team",
        },
      },
    });

    render(
      <MemoryRouter>
        <WorkspacesPage />
      </MemoryRouter>,
    );

    await screen.findByText(/no workspaces/i);

    // Open create form
    const createButtons = screen.getAllByRole("button", {
      name: /create workspace/i,
    });

    await user.click(createButtons[0]);

    // Find the input that now exists inside the form
    const nameInput = screen.getByPlaceholderText(/workspace name/i);

    await user.type(nameInput, "New Engineering Team");

    // Get the actual form containing this input
    const form = nameInput.closest("form");

    // Find Create Workspace ONLY inside that form
    const submitButton = within(form).getByRole("button", {
      name: /^create workspace$/i,
    });

    await user.click(submitButton);

    expect(createWorkspace).toHaveBeenCalledWith({
      name: "New Engineering Team",
    });

    expect(await screen.findByText("New Engineering Team")).toBeInTheDocument();
  });

  it("should show an error when loading workspaces fails", async () => {
    getWorkspaces.mockRejectedValue({
      response: {
        data: {
          message: "Failed to fetch workspaces",
        },
      },
    });

    render(
      <MemoryRouter>
        <WorkspacesPage />
      </MemoryRouter>,
    );

    expect(
      await screen.findByText("Failed to fetch workspaces"),
    ).toBeInTheDocument();
  });
  
});
