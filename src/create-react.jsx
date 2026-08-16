import React from 'react';
import { createRoot } from 'react-dom/client';
import CreatePostPage from './pages/CreatePostPage.jsx';
import './index.css';
import { mountReactApp } from './site-runtime.js';

mountReactApp(createRoot, <CreatePostPage />);
