const express = require('express');

function createStatsRouter(store) {
  const router = express.Router();

  router.get('/', async (req, res, next) => {
    try {
      const data = await store.read();
      const now = Date.now();
      const overdue = data.todos.filter((todo) => !todo.completed && todo.dueDate && new Date(todo.dueDate).getTime() < now).length;
      const completed = data.todos.filter((todo) => todo.completed).length;

      res.json({
        todos: {
          total: data.todos.length,
          active: data.todos.length - completed,
          completed,
          overdue,
        },
        notes: {
          total: data.notes.length,
          pinned: data.notes.filter((note) => note.pinned).length,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = { createStatsRouter };
