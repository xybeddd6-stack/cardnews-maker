import React from "react";
import { createRoot } from "react-dom/client";
import CardNewsMaker from "./CardNewsMaker.jsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <CardNewsMaker />
  </React.StrictMode>
);
