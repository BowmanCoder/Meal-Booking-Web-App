import { ThemeProvider } from "@mui/material/styles";
import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";

import { createAppStore } from "../app/store";
import { theme } from "../theme";

/** Render a component with the app's theme, a fresh store and a router. */
export function renderApp(ui: ReactElement, { route = "/" }: { route?: string } = {}) {
  const store = createAppStore();
  const result = render(
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </ThemeProvider>
    </Provider>,
  );
  return { store, ...result };
}

/** A JSON response, as the API would send it. */
export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
