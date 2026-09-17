import { useEffect, useState } from 'react';

/**
 * Debounces a value, but skips the delay when `immediate(value)` says the value
 * is already cheap — typing a query you have searched before resolves on the
 * same render.
 */
export function useDebouncedValue(value, delay = 260, { immediate } = {}) {
  const [debounced, setDebounced] = useState(value);
  const skip = Boolean(immediate?.(value));

  // Adjusting state during render (not in an effect) keeps the debounced value
  // in step without a second render pass.
  if (skip && debounced !== value) setDebounced(value);

  useEffect(() => {
    if (skip) return undefined;
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay, skip]);

  return skip ? value : debounced;
}
