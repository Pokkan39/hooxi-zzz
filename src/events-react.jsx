import React from 'react';
import { createRoot } from 'react-dom/client';
import './data.js';
import EventsPage from './pages/EventsPage.jsx';
import './pages/EventsPage.css';
import './index.css';

const root = createRoot(document.getElementById('root'));
root.render(<EventsPage />);
