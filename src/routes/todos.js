const express = require('express');
const { validateTodoInput } = require('../utils/validation');

function createTodoRouter(store) {
  const router = express.Router();

  router.get('/', async (req, res, next) => {
    try {
      const data = await store.read();
      let todos = [...data.todos];
      const { status, priority, category, q, sort = 'created-desc' } = req.query;

      if (status === 'active') todos = todos.filter((todo) => !todo.completed);
      if (status === 'completed') todos = todos.filter((todo) => todo.completed);
      if (priority) todos = todos.filter((todo) => todo.priority === priority);
      if (category) todos = todos.filter((todo) => todo.category.toLowerCase() === String(category).toLowerCase());
      if (q) {
        const query = String(q).toLowerCase();
        todos = todos.filter((todo) =>
          `${todo.title} ${todo.description} ${todo.category}`.toLowerCase().includes(query),
        );
      }

      const byDate = (key, direction = 1) => (a, b) => {
        const av = a[key] ? new Date(a[key]).getTime() : Number.MAX_SAFE_INTEGER;
        const bv = b[key] ? new Date(b[key]).getTime() : Number.MAX_SAFE_INTEGER;
        return (av - bv) * direction;
      };

      if (sort === 'due-asc') todos.sort(byDate('dueDate', 1));
      else if (sort === 'due-desc') todos.sort(byDate('dueDate', -1));
      else if (sort === 'created-asc') todos.sort(byDate('createdAt', 1));
      else todos.sort(byDate('createdAt', -1));

      res.json({ todos });
    } catch (error) {
      next(error);
    }
  });

  router.post('/', async (req, res, next) => {
    try {
      const { errors, value } = validateTodoInput(req.body);
      if (errors.length) return res.status(400).json({ errors });

      const now = new Date().toISOString();
      const todo = {
        id: store.id(),
        ...value,
        createdAt: now,
        updatedAt: now,
        completedAt: value.completed ? now : null,
      };

      const data = await store.read();
      data.todos.push(todo);
      await store.write(data);
      res.status(201).json({ todo });
    } catch (error) {
      next(error);
    }
  });

  router.patch('/:id', async (req, res, next) => {
    try {
      const { errors, value } = validateTodoInput(req.body, { partial: true });
      if (errors.length) return res.status(400).json({ errors });

      const data = await store.read();
      const index = data.todos.findIndex((todo) => todo.id === req.params.id);
      if (index === -1) return res.status(404).json({ error: 'Todo not found.' });

      const current = data.todos[index];
      const completed = Object.hasOwn(value, 'completed') ? value.completed : current.completed;
      const todo = {
        ...current,
        ...value,
        updatedAt: new Date().toISOString(),
        completedAt: completed ? current.completedAt || new Date().toISOString() : null,
      };

      data.todos[index] = todo;
      await store.write(data);
      res.json({ todo });
    } catch (error) {
      next(error);
    }
  });

  router.delete('/:id', async (req, res, next) => {
    try {
      const data = await store.read();
      const before = data.todos.length;
      data.todos = data.todos.filter((todo) => todo.id !== req.params.id);
      if (data.todos.length === before) return res.status(404).json({ error: 'Todo not found.' });

      await store.write(data);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = { createTodoRouter };
