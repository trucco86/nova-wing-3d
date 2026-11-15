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
  canPrime = () => true,
  onError = () => {},
}) {
  if (
    !Array.isArray(kinds) ||
    typeof prime !== 'function' ||
    typeof schedule !== 'function' ||
    typeof canPrime !== 'function'
  )
    throw new TypeError('Expected kinds, prime and schedule');
  let stopped = false;
  let queued = null;
  let index = 0;
  const unique = [...new Set(kinds)];

  function next() {
    if (stopped || index >= unique.length) return;
    queued = schedule(async (deadline) => {
      queued = null;
      if (stopped) return;
      // requestIdleCallback(timeout) may fire while WebGL is actively rendering.
      // Never compile or construct a model in that critical frame. A rejected
      // slot is retried later, without consuming this asset in the queue.
      if (!canPrime(deadline)) {
        next();
        return;
      }
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
