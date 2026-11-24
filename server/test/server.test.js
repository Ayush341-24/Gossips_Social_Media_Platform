import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const baseUrl = "http://127.0.0.1:5000";

const waitForServer = async (timeoutMs = 15000) => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/`);
      if (response.status === 200) return;
    } catch {
      // Server may still be starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("Server did not start in time");
};

test("server health and public security guards", async (t) => {
  const server = spawn(process.execPath, ["server.js"], {
    cwd: fileURLToPath(new URL("../", import.meta.url)),
    stdio: "ignore",
  });
  t.after(() => {
    if (!server.killed) server.kill();
  });

  await waitForServer();

  const health = await fetch(`${baseUrl}/`);
  assert.equal(health.status, 200);

  const explore = await fetch(`${baseUrl}/api/posts/explore?page=1&limit=10`);
  assert.equal(explore.status, 200);
  const exploreBody = await explore.json();
  assert.equal(exploreBody.success, true);

  const invalidPagination = await fetch(
    `${baseUrl}/api/posts/explore?page=0&limit=10`
  );
  assert.equal(invalidPagination.status, 400);

  const notifications = await fetch(`${baseUrl}/api/notifications`);
  assert.equal(notifications.status, 401);
});
