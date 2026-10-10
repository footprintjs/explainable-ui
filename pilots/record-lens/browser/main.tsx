import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Pilot } from "./Pilot";

const root = document.getElementById("root");
if (!root) throw new Error("Missing pilot root");
createRoot(root).render(<StrictMode><Pilot /></StrictMode>);
