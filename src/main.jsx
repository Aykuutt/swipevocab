import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { registerServiceWorker } from "./lib/pwa";
import { applySavedTheme } from "./lib/theme";
// Yazı tipleri uygulamayla birlikte sunulur (Google'a istek gitmez, internetsiz de çalışır).
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import "@fontsource-variable/unbounded";
import "./styles/global.css";
import "./styles/themes.css";

// "standalone": uygulamanın tam ekran (bir çerçeve içinde olmadan) çalıştığını
// belirtir; global.css bazı yerleşimleri buna göre ayarlar.
document.documentElement.classList.add("standalone");

applySavedTheme(); // kayıt yüklenmeden önce: renkler yanıp sönmesin
registerServiceWorker();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
