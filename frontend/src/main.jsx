import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AuthProvider } from "./context/AuthContext.jsx"; // We will create this
import { BrowserRouter } from "react-router-dom";
import { initFrontendSentry } from "./utils/sentry.js";
import "./index.css";
import App from "./App.jsx";

// Initialize Sentry client observability
initFrontendSentry();

createRoot(document.getElementById("root")).render(
	<BrowserRouter>
		<AuthProvider>
			<App />
		</AuthProvider>
	</BrowserRouter>
);
