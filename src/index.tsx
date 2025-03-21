import React from "react";
import { createRoot } from "react-dom/client";
import App from "~/components/App/App";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { BrowserRouter } from "react-router-dom";
import { 
  QueryClient, 
  QueryClientProvider,
  MutationCache
} from "react-query";
import { ReactQueryDevtools } from "react-query/devtools";
import { theme } from "~/theme";
import { AxiosError } from "axios";
import "headers-polyfill";
import ToastProvider from "./components/ToastProvider/ToastProvider";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: false, staleTime: Infinity },
  },
  mutationCache: new MutationCache({
    onError: (error: any) => {
      window.dispatchEvent(new CustomEvent("global-toast", { detail: { message: error.message, severity: "error" } }));
      if (error instanceof AxiosError) {
        if (error.response?.status === 401) {
          window.dispatchEvent(new CustomEvent("global-toast", { detail: { message: "401 Unauthorized", severity: "error" } }));
          console.log("401 Unauthorized", "error");
        }
        if (error.response?.status === 403) {
          window.dispatchEvent(new CustomEvent("global-toast", { detail: { message: "403 Forbidden", severity: "error" } }));
          console.log("403 Forbidden", "error");
        }
      }
    },
  }),
});

if (import.meta.env.DEV) {
  const { worker } = await import("./mocks/browser");
  worker.start({ onUnhandledRequest: "bypass" });
}

const container = document.getElementById("app");
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <ToastProvider>
            <App />
          </ToastProvider>
        </ThemeProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);
