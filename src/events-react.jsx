import React from 'react';
import { createRoot } from 'react-dom/client';
import './data.js';
import EventsPage from './pages/EventsPage.jsx';
import './pages/EventsPage.css';
import './index.css';
import { mountReactApp } from './site-runtime.js';

mountReactApp(createRoot, <EventsPage />);
