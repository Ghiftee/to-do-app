const state = {
  todos: [],
  notes: [],
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const els = {
  stats: $('#stats'),
  todoList: $('#todoList'),
  noteList: $('#noteList'),
  todoForm: $('#todoForm'),
  noteForm: $('#noteForm'),
  toast: $('#toast'),
};

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => els.toast.classList.remove('show'), 2200);
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });

  if (!response.ok) {
    const body = response.status === 204 ? {} : await response.json().catch(() => ({}));
    throw new Error(body.error || body.errors?.join(' ') || 'Something went wrong.');
  }

  return response.status === 204 ? null : response.json();
}

function formatDate(value) {
  if (!value) return 'No due date';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function isOverdue(todo) {
  return !todo.completed && todo.dueDate && new Date(todo.dueDate).getTime() < Date.now();
}

function localInputValue(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

async function loadStats() {
  const data = await api('/api/stats');
  els.stats.innerHTML = `
    <div class="stat"><strong>${data.todos.active}</strong><span>Active tasks</span></div>
    <div class="stat"><strong>${data.todos.completed}</strong><span>Completed</span></div>
    <div class="stat"><strong>${data.todos.overdue}</strong><span>Overdue</span></div>
    <div class="stat"><strong>${data.notes.total}</strong><span>Notes</span></div>
  `;
}

async function loadTodos() {
  const params = new URLSearchParams();
  const status = $('#todoStatus').value;
  const priority = $('#todoPriorityFilter').value;
  const q = $('#todoSearch').value.trim();
  const sort = $('#todoSort').value;

  if (status !== 'all') params.set('status', status);
  if (priority) params.set('priority', priority);
  if (q) params.set('q', q);
  if (sort) params.set('sort', sort);

  const data = await api(`/api/todos?${params.toString()}`);
  state.todos = data.todos;
  renderTodos();
}

function renderTodos() {
  if (!state.todos.length) {
    els.todoList.innerHTML = '<div class="empty">No tasks match this view. Add one or change the filters.</div>';
    return;
  }

  els.todoList.innerHTML = state.todos.map((todo) => `
    <article class="task-card ${todo.completed ? 'completed' : ''}">
      <input class="task-check" type="checkbox" data-action="toggle-todo" data-id="${todo.id}" ${todo.completed ? 'checked' : ''} aria-label="Mark ${escapeHtml(todo.title)} complete" />
      <div>
        <h3>${escapeHtml(todo.title)}</h3>
        ${todo.description ? `<p>${escapeHtml(todo.description)}</p>` : ''}
        <div class="meta">
          <span class="badge ${todo.priority}">${escapeHtml(todo.priority)} priority</span>
          ${todo.category ? `<span class="badge">${escapeHtml(todo.category)}</span>` : ''}
          <span class="badge ${isOverdue(todo) ? 'overdue' : ''}">${formatDate(todo.dueDate)}</span>
        </div>
      </div>
      <div class="card-actions">
        <button class="icon-btn" data-action="edit-todo" data-id="${todo.id}">Edit</button>
        <button class="icon-btn danger" data-action="delete-todo" data-id="${todo.id}">Delete</button>
      </div>
    </article>
  `).join('');
}

async function loadNotes() {
  const params = new URLSearchParams();
  const q = $('#noteSearch').value.trim();
  if (q) params.set('q', q);
  if ($('#notePinnedOnly').checked) params.set('pinned', 'true');

  const data = await api(`/api/notes?${params.toString()}`);
  state.notes = data.notes;
  renderNotes();
}

function renderNotes() {
  if (!state.notes.length) {
    els.noteList.innerHTML = '<div class="empty">No notes here yet. Capture an idea, reference, or reminder.</div>';
    return;
  }

  els.noteList.innerHTML = state.notes.map((note) => `
    <article class="note-card ${note.pinned ? 'pinned' : ''}">
      <div class="meta">
        ${note.pinned ? '<span class="badge">Pinned</span>' : ''}
        ${note.tag ? `<span class="badge">${escapeHtml(note.tag)}</span>` : ''}
      </div>
      <h3>${escapeHtml(note.title)}</h3>
      <p>${escapeHtml(note.content)}</p>
      <div class="card-actions">
        <button class="icon-btn" data-action="pin-note" data-id="${note.id}">${note.pinned ? 'Unpin' : 'Pin'}</button>
        <button class="icon-btn" data-action="edit-note" data-id="${note.id}">Edit</button>
        <button class="icon-btn danger" data-action="delete-note" data-id="${note.id}">Delete</button>
      </div>
    </article>
  `).join('');
}

function resetTodoForm() {
  els.todoForm.reset();
  $('#todoId').value = '';
  $('#todoPriority').value = 'medium';
  els.todoForm.classList.add('hidden');
}

function resetNoteForm() {
  els.noteForm.reset();
  $('#noteId').value = '';
  els.noteForm.classList.add('hidden');
}

function editTodo(id) {
  const todo = state.todos.find((item) => item.id === id);
  if (!todo) return;
  $('#todoId').value = todo.id;
  $('#todoTitle').value = todo.title;
  $('#todoDescription').value = todo.description;
  $('#todoPriority').value = todo.priority;
  $('#todoDueDate').value = localInputValue(todo.dueDate);
  $('#todoCategory').value = todo.category;
  els.todoForm.classList.remove('hidden');
  $('#todoTitle').focus();
}

function editNote(id) {
  const note = state.notes.find((item) => item.id === id);
  if (!note) return;
  $('#noteId').value = note.id;
  $('#noteTitle').value = note.title;
  $('#noteContent').value = note.content;
  $('#noteTag').value = note.tag;
  $('#notePinned').checked = note.pinned;
  els.noteForm.classList.remove('hidden');
  $('#noteTitle').focus();
}

els.todoForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const id = $('#todoId').value;
  const payload = {
    title: $('#todoTitle').value,
    description: $('#todoDescription').value,
    priority: $('#todoPriority').value,
    dueDate: $('#todoDueDate').value ? new Date($('#todoDueDate').value).toISOString() : '',
    category: $('#todoCategory').value,
  };

  try {
    await api(id ? `/api/todos/${id}` : '/api/todos', {
      method: id ? 'PATCH' : 'POST',
      body: JSON.stringify(payload),
    });
    resetTodoForm();
    await Promise.all([loadTodos(), loadStats()]);
    showToast(id ? 'Task updated.' : 'Task added.');
  } catch (error) {
    showToast(error.message);
  }
});

els.noteForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const id = $('#noteId').value;
  const payload = {
    title: $('#noteTitle').value,
    content: $('#noteContent').value,
    tag: $('#noteTag').value,
    pinned: $('#notePinned').checked,
  };

  try {
    await api(id ? `/api/notes/${id}` : '/api/notes', {
      method: id ? 'PATCH' : 'POST',
      body: JSON.stringify(payload),
    });
    resetNoteForm();
    await Promise.all([loadNotes(), loadStats()]);
    showToast(id ? 'Note updated.' : 'Note saved.');
  } catch (error) {
    showToast(error.message);
  }
});

els.todoList.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const { action, id } = button.dataset;

  try {
    if (action === 'edit-todo') return editTodo(id);
    if (action === 'delete-todo') {
      if (!confirm('Delete this task?')) return;
      await api(`/api/todos/${id}`, { method: 'DELETE' });
      showToast('Task deleted.');
    }
    await Promise.all([loadTodos(), loadStats()]);
  } catch (error) {
    showToast(error.message);
  }
});

els.todoList.addEventListener('change', async (event) => {
  const input = event.target.closest('[data-action="toggle-todo"]');
  if (!input) return;
  try {
    await api(`/api/todos/${input.dataset.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ completed: input.checked }),
    });
    await Promise.all([loadTodos(), loadStats()]);
  } catch (error) {
    showToast(error.message);
  }
});

els.noteList.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const { action, id } = button.dataset;
  const note = state.notes.find((item) => item.id === id);

  try {
    if (action === 'edit-note') return editNote(id);
    if (action === 'delete-note') {
      if (!confirm('Delete this note?')) return;
      await api(`/api/notes/${id}`, { method: 'DELETE' });
      showToast('Note deleted.');
    }
    if (action === 'pin-note' && note) {
      await api(`/api/notes/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ pinned: !note.pinned }),
      });
      showToast(note.pinned ? 'Note unpinned.' : 'Note pinned.');
    }
    await Promise.all([loadNotes(), loadStats()]);
  } catch (error) {
    showToast(error.message);
  }
});

$$('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    $$('.tab').forEach((item) => item.classList.toggle('active', item === tab));
    $$('.view').forEach((view) => view.classList.remove('active'));
    $(`#${tab.dataset.view}View`).classList.add('active');
  });
});

$('#openTodoForm').addEventListener('click', () => {
  resetTodoForm();
  els.todoForm.classList.remove('hidden');
  $('#todoTitle').focus();
});
$('#cancelTodo').addEventListener('click', resetTodoForm);
$('#openNoteForm').addEventListener('click', () => {
  resetNoteForm();
  els.noteForm.classList.remove('hidden');
  $('#noteTitle').focus();
});
$('#cancelNote').addEventListener('click', resetNoteForm);

let todoDebounce;
['todoStatus', 'todoPriorityFilter', 'todoSort'].forEach((id) => $(`#${id}`).addEventListener('change', loadTodos));
$('#todoSearch').addEventListener('input', () => {
  clearTimeout(todoDebounce);
  todoDebounce = setTimeout(loadTodos, 180);
});
let noteDebounce;
$('#noteSearch').addEventListener('input', () => {
  clearTimeout(noteDebounce);
  noteDebounce = setTimeout(loadNotes, 180);
});
$('#notePinnedOnly').addEventListener('change', loadNotes);

const savedTheme = localStorage.getItem('focusboard-theme');
if (savedTheme === 'dark') document.documentElement.dataset.theme = 'dark';
$('#themeToggle').addEventListener('click', () => {
  const dark = document.documentElement.dataset.theme === 'dark';
  document.documentElement.dataset.theme = dark ? 'light' : 'dark';
  localStorage.setItem('focusboard-theme', dark ? 'light' : 'dark');
});

Promise.all([loadTodos(), loadNotes(), loadStats()]).catch((error) => showToast(error.message));
