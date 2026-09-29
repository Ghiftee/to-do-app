const express = require('express');
const { validateNoteInput } = require('../utils/validation');

function createNoteRouter(store) {
  const router = express.Router();

  router.get('/', async (req, res, next) => {
    try {
      const data = await store.read();
      let notes = [...data.notes];
      const { q, tag, pinned } = req.query;

      if (tag) notes = notes.filter((note) => note.tag.toLowerCase() === String(tag).toLowerCase());
      if (pinned === 'true') notes = notes.filter((note) => note.pinned);
      if (q) {
        const query = String(q).toLowerCase();
        notes = notes.filter((note) => `${note.title} ${note.content} ${note.tag}`.toLowerCase().includes(query));
      }

      notes.sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return new Date(b.updatedAt) - new Date(a.updatedAt);
      });

      res.json({ notes });
    } catch (error) {
      next(error);
    }
  });

  router.post('/', async (req, res, next) => {
    try {
      const { errors, value } = validateNoteInput(req.body);
      if (errors.length) return res.status(400).json({ errors });

      const now = new Date().toISOString();
      const note = {
        id: store.id(),
        ...value,
        createdAt: now,
        updatedAt: now,
      };

      const data = await store.read();
      data.notes.push(note);
      await store.write(data);
      res.status(201).json({ note });
    } catch (error) {
      next(error);
    }
  });

  router.patch('/:id', async (req, res, next) => {
    try {
      const { errors, value } = validateNoteInput(req.body, { partial: true });
      if (errors.length) return res.status(400).json({ errors });

      const data = await store.read();
      const index = data.notes.findIndex((note) => note.id === req.params.id);
      if (index === -1) return res.status(404).json({ error: 'Note not found.' });

      const note = {
        ...data.notes[index],
        ...value,
        updatedAt: new Date().toISOString(),
      };

      data.notes[index] = note;
      await store.write(data);
      res.json({ note });
    } catch (error) {
      next(error);
    }
  });

  router.delete('/:id', async (req, res, next) => {
    try {
      const data = await store.read();
      const before = data.notes.length;
      data.notes = data.notes.filter((note) => note.id !== req.params.id);
      if (data.notes.length === before) return res.status(404).json({ error: 'Note not found.' });

      await store.write(data);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = { createNoteRouter };
