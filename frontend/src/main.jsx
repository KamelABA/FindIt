import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { I18nProvider } from "./lib/i18n";
import { captureInstallPrompt } from "./lib/install";
import "./index.css";

// The browser may offer "install this app" before React mounts: catch it now (see lib/install.js)
captureInstallPrompt();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <I18nProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </I18nProvider>
  </StrictMode>
);

// Service worker (offline shell + install) in production builds only, so it never caches during development
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
