import React from 'react';
import ReactDOM from 'react-dom/client';
import EditReact from './edit-react.jsx';
import './index.css';
import '../editor.css';
import { mountReactApp } from './site-runtime.js';

mountReactApp(
  ReactDOM.createRoot,
  <React.StrictMode>
    <EditReact />
  </React.StrictMode>
);
