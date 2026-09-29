const PRIORITIES = new Set(['low', 'medium', 'high']);

function cleanString(value, maxLength = 5000) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
}

function isValidDateString(value) {
  if (value === '' || value == null) return true;
  if (typeof value !== 'string') return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed);
}

function validateTodoInput(body, { partial = false } = {}) {
  const errors = [];
  const output = {};

  if (!partial || Object.hasOwn(body, 'title')) {
    const title = cleanString(body.title, 160);
    if (!title) errors.push('Title is required.');
    else output.title = title;
  }

  if (Object.hasOwn(body, 'description')) {
    output.description = cleanString(body.description, 2000);
  } else if (!partial) {
    output.description = '';
  }

  if (Object.hasOwn(body, 'priority')) {
    if (!PRIORITIES.has(body.priority)) errors.push('Priority must be low, medium, or high.');
    else output.priority = body.priority;
  } else if (!partial) {
    output.priority = 'medium';
  }

  if (Object.hasOwn(body, 'dueDate')) {
    if (!isValidDateString(body.dueDate)) errors.push('Due date must be a valid date.');
    else output.dueDate = body.dueDate ? new Date(body.dueDate).toISOString() : null;
  } else if (!partial) {
    output.dueDate = null;
  }

  if (Object.hasOwn(body, 'category')) {
    output.category = cleanString(body.category, 60);
  } else if (!partial) {
    output.category = '';
  }

  if (Object.hasOwn(body, 'completed')) {
    if (typeof body.completed !== 'boolean') errors.push('Completed must be a boolean.');
    else output.completed = body.completed;
  } else if (!partial) {
    output.completed = false;
  }

  return { errors, value: output };
}

function validateNoteInput(body, { partial = false } = {}) {
  const errors = [];
  const output = {};

  if (!partial || Object.hasOwn(body, 'title')) {
    const title = cleanString(body.title, 160);
    if (!title) errors.push('Title is required.');
    else output.title = title;
  }

  if (!partial || Object.hasOwn(body, 'content')) {
    const content = cleanString(body.content, 10000);
    if (!partial && !content) errors.push('Content is required.');
    output.content = content;
  }

  if (Object.hasOwn(body, 'tag')) {
    output.tag = cleanString(body.tag, 60);
  } else if (!partial) {
    output.tag = '';
  }

  if (Object.hasOwn(body, 'pinned')) {
    if (typeof body.pinned !== 'boolean') errors.push('Pinned must be a boolean.');
    else output.pinned = body.pinned;
  } else if (!partial) {
    output.pinned = false;
  }

  return { errors, value: output };
}

module.exports = {
  validateTodoInput,
  validateNoteInput,
};
