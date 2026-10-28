import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './app/App.tsx';
import { initAnalytics } from './common/analytics/index.ts';
import { migrateStorage } from './common/storage/migrate.ts';

migrateStorage();
initAnalytics();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
