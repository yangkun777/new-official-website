export async function deletePathWithRetry({
  requestDelete,
  sleep,
  label,
  maxAttempts = 3,
  retryDelayMs = 150,
}) {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await requestDelete();
      if (response.ok || response.status === 404) return;
      lastError = new Error(`${label}: HTTP ${response.status}`);
      if (response.status < 500) throw lastError;
    } catch (error) {
      lastError = error;
    }
    if (attempt < maxAttempts) await sleep(retryDelayMs);
  }
  throw new Error(`${label}: ${lastError?.message ?? "删除失败"}`, {
    cause: lastError,
  });
}

export async function cleanupIdsKnownFirst({
  knownIds,
  discoverIds,
  deleteId,
}) {
  const known = [...new Set(knownIds.filter(Boolean))];
  const knownDeletesPromise = Promise.allSettled(known.map((id) => deleteId(id)));
  const discoveryResult = await Promise.allSettled([discoverIds()]);
  const discovered =
    discoveryResult[0].status === "fulfilled" ? discoveryResult[0].value : [];
  const additional = [...new Set(discovered.filter(Boolean))].filter(
    (id) => !known.includes(id),
  );
  const [knownDeletes, additionalDeletes] = await Promise.all([
    knownDeletesPromise,
    Promise.allSettled(additional.map((id) => deleteId(id))),
  ]);
  const errors = [
    ...(discoveryResult[0].status === "rejected"
      ? [discoveryResult[0].reason]
      : []),
    ...knownDeletes
      .filter((result) => result.status === "rejected")
      .map((result) => result.reason),
    ...additionalDeletes
      .filter((result) => result.status === "rejected")
      .map((result) => result.reason),
  ];
  if (errors.length) throw new AggregateError(errors, errors.map((error) => error.message).join("; "));
}

export async function cleanupUntilObservedAndQuiet({
  listIds,
  deleteId,
  now,
  sleep,
  lateWindowMs,
  quietPeriodMs,
  pollMs,
  maxTotalMs,
}) {
  const startedAt = now();
  const discoveryDeadline = startedAt + lateWindowMs;
  const absoluteDeadline = startedAt + maxTotalMs;
  let observed = false;
  let quietSince = null;

  while (now() <= absoluteDeadline) {
    const ids = [...new Set((await listIds()).filter(Boolean))];
    if (ids.length) {
      observed = true;
      quietSince = null;
      await Promise.allSettled(ids.map((id) => deleteId(id)));
    } else if (observed) {
      quietSince ??= now();
      if (now() - quietSince >= quietPeriodMs) return { observed };
    } else if (now() >= discoveryDeadline) {
      return { observed };
    }
    await sleep(pollMs);
  }

  const remaining = [...new Set((await listIds()).filter(Boolean))];
  await Promise.allSettled(remaining.map((id) => deleteId(id)));
  const afterFinalDelete = await listIds();
  if (afterFinalDelete.length) {
    throw new Error(
      `清理达到 ${maxTotalMs}ms 上限后仍有 ${afterFinalDelete.length} 个残留`,
    );
  }
  return { observed };
}
