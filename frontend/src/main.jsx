import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { NotifProvider } from './components/NotificationSystem';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <NotifProvider>
      <App />
    </NotifProvider>
  </React.StrictMode>
);
