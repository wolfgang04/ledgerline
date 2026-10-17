import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import {
  parseStoredUser,
  saveSession,
  clearSession,
  getSessionSnapshot,
  getToken,
  subscribeSession,
  SESSION_EVENT,
} from "./session.ts";

const user = {
  id: 1,
  name: "Alex",
  email: "alex@example.com",
  role: "employee",
};
afterEach(() => {
  delete globalThis.window;
});

test("stored session accepts valid users and rejects malformed or incomplete data", () => {
  assert.deepEqual(parseStoredUser(JSON.stringify(user)), user);
  for (const raw of [
    null,
    undefined,
    "",
    "{",
    "null",
    "[]",
    "1",
    JSON.stringify({ ...user, id: 0 }),
    JSON.stringify({ ...user, id: 1.5 }),
    JSON.stringify({ ...user, role: "owner" }),
    JSON.stringify({ ...user, role: ["employee"] }),
    JSON.stringify({ ...user, email: null }),
  ]) {
    assert.equal(parseStoredUser(raw), null);
  }
});

test("session changes notify subscribers, preserve unrelated storage, and unsubscribe", () => {
  const values = new Map([["unrelated", "keep"]]);
  const browser = new EventTarget();
  browser.localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
  globalThis.window = browser;
  let changes = 0;
  const unsubscribe = subscribeSession(() => changes++);
  assert.equal(getSessionSnapshot(), null);
  saveSession("token", user);
  assert.equal(getToken(), "token");
  assert.deepEqual(parseStoredUser(getSessionSnapshot()), user);
  assert.equal(changes, 1);
  clearSession();
  assert.equal(getToken(), null);
  assert.equal(getSessionSnapshot(), null);
  assert.equal(values.get("unrelated"), "keep");
  assert.equal(changes, 2);
  unsubscribe();
  browser.dispatchEvent(new Event(SESSION_EVENT));
  assert.equal(changes, 2);
});

test("cross-tab session changes notify only for session storage keys", () => {
  globalThis.window = new EventTarget();
  let changes = 0;
  const unsubscribe = subscribeSession(() => changes++);
  for (const key of [
    "unrelated",
    "financial-operations-token",
    "financial-operations-user",
    null,
  ]) {
    const event = new Event("storage");
    Object.defineProperty(event, "key", { value: key });
    window.dispatchEvent(event);
  }
  assert.equal(changes, 3);
  unsubscribe();
});
