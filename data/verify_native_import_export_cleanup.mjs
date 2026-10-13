import assert from "node:assert/strict";
import {
  cleanupIdsKnownFirst,
  cleanupUntilObservedAndQuiet,
  deletePathWithRetry,
} from "./native_import_export_cleanup.mjs";

{
  const deleted = [];
  await assert.rejects(
    cleanupIdsKnownFirst({
      knownIds: ["known-product"],
      discoverIds: async () => {
        throw new Error("query unavailable");
      },
      deleteId: async (id) => deleted.push(id),
    }),
    /query unavailable/,
  );
  assert.deepEqual(deleted, ["known-product"]);
}

{
  const attempted = [];
  await assert.rejects(
    cleanupIdsKnownFirst({
      knownIds: ["first", "second"],
      discoverIds: async () => ["third"],
      deleteId: async (id) => {
        attempted.push(id);
        if (id === "first") throw new Error("first failed");
      },
    }),
    /first failed/,
  );
  assert.deepEqual(new Set(attempted), new Set(["first", "second", "third"]));
}

{
  let attempts = 0;
  await deletePathWithRetry({
    requestDelete: async () => {
      attempts++;
      if (attempts < 3) throw new TypeError("fetch failed");
      return { ok: true, status: 204 };
    },
    sleep: async () => {},
    label: "network retry",
    maxAttempts: 3,
  });
  assert.equal(attempts, 3);
}

{
  let now = 0;
  let observed = false;
  const deleted = [];
  const result = await cleanupUntilObservedAndQuiet({
    listIds: async () => {
      if (!observed && now >= 7_000) {
        observed = true;
        return ["late-file"];
      }
      return [];
    },
    deleteId: async (id) => deleted.push(id),
    now: () => now,
    sleep: async (ms) => {
      now += ms;
    },
    lateWindowMs: 8_000,
    quietPeriodMs: 1_500,
    pollMs: 100,
    maxTotalMs: 12_000,
  });
  assert.deepEqual(deleted, ["late-file"]);
  assert.equal(result.observed, true);
  assert.ok(now >= 8_500, `迟到文件删除后未覆盖完整 quiet period: ${now}ms`);
}

{
  let now = 0;
  const result = await cleanupUntilObservedAndQuiet({
    listIds: async () => [],
    deleteId: async () => assert.fail("不应删除不存在的文件"),
    now: () => now,
    sleep: async (ms) => {
      now += ms;
    },
    lateWindowMs: 8_000,
    quietPeriodMs: 1_500,
    pollMs: 100,
    maxTotalMs: 12_000,
  });
  assert.equal(result.observed, false);
  assert.ok(now >= 8_000, `从未观察到文件时过早结束: ${now}ms`);
}

console.log("PASS native import/export cleanup failure scenarios");
