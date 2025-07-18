import React from 'react';
import ReactDOM from 'react-dom/client';
import DevToolsPanel from './DevToolsPanel.tsx';
import './style.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DevToolsPanel />
  </React.StrictMode>,
);
