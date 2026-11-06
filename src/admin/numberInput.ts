/**
 * Shared helpers for numeric admin inputs that must stay non-negative.
 *
 * `min` makes the native spinner respect a zero lower bound, but a user can
 * still type a minus sign directly. Pairing `nonNegativeSlotProps` with
 * `blockNegativeKeys` closes that gap.
 */

interface KeyEventLike {
  key: string;
  preventDefault: () => void;
}

export const nonNegativeSlotProps = { htmlInput: { min: 0 } };

/** Blocks keystrokes that could produce a negative or non-integer value. */
export function blockNegativeKeys(event: KeyEventLike): void {
  if (event.key === '-' || event.key === '+' || event.key === 'e' || event.key === 'E') {
    event.preventDefault();
  }
}
