import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App';
import NotFound from './pages/NotFound';
import PlayerPage from './pages/PlayerPage';
import StatsPage from './pages/StatsPage';

// Page placeholders are inline; later tasks replace them with real pages.
const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <App />,
      children: [
        { index: true, element: <StatsPage /> },
        { path: 'players/:playerId', element: <PlayerPage /> },
        { path: 'games', element: <div>Games</div> },
        { path: 'games/:gameId', element: <div>Game</div> },
        { path: '*', element: <NotFound /> },
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL },
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
