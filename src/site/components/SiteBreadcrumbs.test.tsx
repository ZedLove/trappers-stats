// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import SiteBreadcrumbs from './SiteBreadcrumbs';

afterEach(cleanup);

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SiteBreadcrumbs />
    </MemoryRouter>,
  );
}

describe('SiteBreadcrumbs', () => {
  it('renders nothing on the stats home page', () => {
    renderAt('/');
    expect(screen.queryByRole('navigation', { name: 'breadcrumb' })).not.toBeInTheDocument();
  });

  it('renders nothing on the games page', () => {
    renderAt('/games');
    expect(screen.queryByRole('navigation', { name: 'breadcrumb' })).not.toBeInTheDocument();
  });

  it('renders Stats / player name on a player page', () => {
    renderAt('/players/z-man');
    const nav = screen.getByRole('navigation', { name: 'breadcrumb' });
    expect(nav).toHaveTextContent('Stats');
    expect(nav).toHaveTextContent('Z-Man');
    expect(screen.getByRole('link', { name: 'Stats' })).toHaveAttribute('href', '/');
  });

  it('renders Games / Box Score on a box score page', () => {
    renderAt('/games/2026-05-05-hornets');
    const nav = screen.getByRole('navigation', { name: 'breadcrumb' });
    expect(nav).toHaveTextContent('Games');
    expect(nav).toHaveTextContent('Box Score');
    expect(screen.getByRole('link', { name: 'Games' })).toHaveAttribute('href', '/games');
  });
});
