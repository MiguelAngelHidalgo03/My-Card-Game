import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
// import reportWebVitals from './reportWebVitals';
import { UserProvider } from './context/UserContext';
if ('scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';   // 👈 evita que el navegador mantenga el scroll al recargar
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <UserProvider>
      <App />
    </UserProvider>
  </React.StrictMode>
);
