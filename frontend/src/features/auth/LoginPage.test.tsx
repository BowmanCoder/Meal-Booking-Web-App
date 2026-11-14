import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { jsonResponse, renderApp } from "../../test/render";
import LoginPage from "./LoginPage";

function renderLogin() {
  return renderApp(
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<p>Week view</p>} />
    </Routes>,
    { route: "/login" },
  );
}

async function signIn() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(/^Email/), "eli@example.com");
  await user.type(screen.getByLabelText(/^Password/), "DemoPass#2026");
  await user.click(screen.getByRole("button", { name: "Sign in" }));
}

describe("LoginPage", () => {
  it("keeps the button disabled until both fields are filled", async () => {
    renderLogin();
    const button = screen.getByRole("button", { name: "Sign in" });
    expect(button).toBeDisabled();
    await userEvent.type(screen.getByLabelText(/^Email/), "eli@example.com");
    expect(button).toBeDisabled();
    await userEvent.type(screen.getByLabelText(/^Password/), "x");
    expect(button).toBeEnabled();
  });

  it("signs in, stores the session and goes to the week view", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ token: { access: "access-1", refresh: "refresh-1" }, msg: "ok" }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const { store } = renderLogin();

    await signIn();

    expect(await screen.findByText("Week view")).toBeInTheDocument();
    expect(store.getState().auth).toEqual({ access: "access-1", refresh: "refresh-1" });
    const request = fetchMock.mock.calls[0][0] as Request;
    expect(request.url).toMatch(/\/login\/$/);
    // Signing in must not send a leftover token.
    expect(request.headers.get("Authorization")).toBeNull();
  });

  it("shows the server's message when the password is wrong", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({ errors: { non_field_errors: ["Email or Password is INVALID!!!"] } }, 401),
      ),
    );
    const { store } = renderLogin();

    await signIn();

    expect(await screen.findByRole("alert")).toHaveTextContent("Email or Password is INVALID!!!");
    await waitFor(() => expect(store.getState().auth.access).toBeNull());
    expect(screen.queryByText("Week view")).not.toBeInTheDocument();
  });
});
