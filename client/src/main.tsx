import App from "./App";
import { createRoot } from "react-dom/client";
import "./index.css";

// Default to dark mode (Spotify-style experience) unless user prefers light
const prefersDark = !window.matchMedia("(prefers-color-scheme: light)").matches;
if (prefersDark) document.documentElement.classList.add("dark");

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");
createRoot(root).render(<App />);
