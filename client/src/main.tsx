import './reset.css';
import './main.css';
import { StrictMode } from 'react';
import App from './App.tsx';
import { createRoot } from 'react-dom/client';
import relativeTime from 'dayjs/plugin/relativeTime';
import updateLocale from 'dayjs/plugin/updateLocale';
import dayjs from 'dayjs';

// DayJS needs to be configured somewhere, here's fine
dayjs.extend(updateLocale);
dayjs.extend(relativeTime);
dayjs.updateLocale('en', {
  relativeTime: { ...dayjs.Ls['en'].relativeTime, s: 'seconds' },
});

// non-nullish assertion is okay here: index.html defines a div with id #root
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
