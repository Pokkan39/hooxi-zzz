import React from 'react';
import ReactDOM from 'react-dom/client';
import EditPostPage from './pages/EditPostPage';
import './styles/interknot.css';
import { mountReactApp } from './site-runtime.js';

mountReactApp(
  ReactDOM.createRoot,
  <React.StrictMode>
    <EditPostPage />
  </React.StrictMode>
);
