import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/global.css";

// "standalone": uygulamanın tam ekran (bir çerçeve içinde olmadan) çalıştığını
// belirtir; global.css bazı yerleşimleri buna göre ayarlar.
document.documentElement.classList.add("standalone");

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
