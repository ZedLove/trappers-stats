// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeModeProvider } from '../theme/ThemeModeProvider';
import { useThemeMode } from '../theme/themeMode';

function ThemeToggleHarness() {
  const { mode, toggle } = useThemeMode();
  return (
    <button type="button" aria-pressed={mode === 'dark'} onClick={toggle}>
      {mode === 'dark' ? 'Sun' : 'Moon'}
    </button>
  );
}

function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

beforeEach(() => {
  localStorage.clear();
  mockMatchMedia(false);
});

afterEach(cleanup);

describe('ThemeModeProvider', () => {
  it('toggle flips between light and dark and persists the choice', () => {
    render(
      <ThemeModeProvider>
        <ThemeToggleHarness />
      </ThemeModeProvider>,
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(button).toHaveTextContent('Moon');

    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(button).toHaveTextContent('Sun');
    expect(localStorage.getItem('theme-mode')).toBe('dark');

    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(button).toHaveTextContent('Moon');
    expect(localStorage.getItem('theme-mode')).toBe('light');
  });

  it('falls back to the system dark-mode preference when nothing is stored', () => {
    mockMatchMedia(true);

    render(
      <ThemeModeProvider>
        <ThemeToggleHarness />
      </ThemeModeProvider>,
    );

    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  });
});
