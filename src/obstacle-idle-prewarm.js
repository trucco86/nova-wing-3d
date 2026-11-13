/**
 * Prime expensive first-use objects only when the browser has an idle slot.
 * Each scheduled callback handles one asset to avoid a synchronous burst.
 * The cancellation function prevents late callbacks after game teardown.
 */
export function scheduleIdlePrewarm({
  kinds,
  prime,
  schedule,
  cancel,
  onError = () => {},
}) {
  if (!Array.isArray(kinds) || typeof prime !== 'function' || typeof schedule !== 'function')
    throw new TypeError('Expected kinds, prime and schedule');
  let stopped = false;
  let queued = null;
  let index = 0;
  const unique = [...new Set(kinds)];

  function next() {
    if (stopped || index >= unique.length) return;
    queued = schedule(async () => {
      queued = null;
      if (stopped) return;
      const kind = unique[index++];
      try {
        await prime(kind);
      } catch (error) {
        onError(error, kind);
      }
      next();
    });
  }
  next();
  return () => {
    stopped = true;
    if (queued !== null && typeof cancel === 'function') cancel(queued);
    queued = null;
  };
}
