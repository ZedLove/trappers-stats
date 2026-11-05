import { useEffect } from 'react';

/**
 * Sets the browser tab title to `${title} · Trappers` for the lifetime of the
 * component. Pages call this once with their own short title; the suffix keeps
 * every tab clearly tied to the Trappers site.
 */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    document.title = `${title} · Trappers`;
  }, [title]);
}
