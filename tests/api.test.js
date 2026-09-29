const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const { createApp } = require('../src/app');

async function withServer(fn) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'focusboard-'));
  const dataFile = path.join(dir, 'db.json');
  const app = createApp({ dataFile });
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    await fn(baseUrl);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await fs.rm(dir, { recursive: true, force: true });
  }
}

test('creates, updates, lists, and deletes a todo', async () => {
  await withServer(async (baseUrl) => {
    let response = await fetch(`${baseUrl}/api/todos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Test task', priority: 'high' }),
    });
    assert.equal(response.status, 201);
    const created = await response.json();
    assert.equal(created.todo.title, 'Test task');

    response = await fetch(`${baseUrl}/api/todos/${created.todo.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: true }),
    });
    const updated = await response.json();
    assert.equal(updated.todo.completed, true);

    response = await fetch(`${baseUrl}/api/todos?status=completed`);
    const listed = await response.json();
    assert.equal(listed.todos.length, 1);

    response = await fetch(`${baseUrl}/api/todos/${created.todo.id}`, { method: 'DELETE' });
    assert.equal(response.status, 204);
  });
});

test('creates and pins a note', async () => {
  await withServer(async (baseUrl) => {
    let response = await fetch(`${baseUrl}/api/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Idea', content: 'Useful thought', tag: 'work' }),
    });
    assert.equal(response.status, 201);
    const created = await response.json();

    response = await fetch(`${baseUrl}/api/notes/${created.note.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pinned: true }),
    });
    const updated = await response.json();
    assert.equal(updated.note.pinned, true);
  });
});

test('rejects invalid todo payloads', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/todos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '', priority: 'urgent' }),
    });
    assert.equal(response.status, 400);
    const body = await response.json();
    assert.ok(Array.isArray(body.errors));
  });
});
