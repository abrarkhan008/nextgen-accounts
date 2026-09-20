import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { initDatabase } from "./db/storage";
import { scheduleGstReminder } from "./utils/notifications";

// The database (SQLite on phone, a browser-friendly stand-in during
// `npm run dev`) must finish opening before any screen tries to read data.
initDatabase().finally(() => {
  scheduleGstReminder();
  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <BrowserRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <App />
      </BrowserRouter>
    </React.StrictMode>,
  );
});
