import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App';
import GamesPage from './pages/GamesPage';
import NotFound from './pages/NotFound';
import PlayerPage from './pages/PlayerPage';
import BoxScorePage from './pages/BoxScorePage';
import StatsPage from './pages/StatsPage';
import { ThemeModeProvider } from '../theme/ThemeModeProvider';

// Page placeholders are inline; later tasks replace them with real pages.
const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <App />,
      children: [
        { index: true, element: <StatsPage /> },
        { path: 'players/:playerId', element: <PlayerPage /> },
        { path: 'games', element: <GamesPage /> },
        { path: 'games/:gameId', element: <BoxScorePage /> },
        { path: '*', element: <NotFound /> },
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL },
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeModeProvider>
      <RouterProvider router={router} />
    </ThemeModeProvider>
  </StrictMode>,
);
