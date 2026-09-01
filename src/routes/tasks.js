const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  done: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const Task = mongoose.model('Task', taskSchema);

// GET /tasks - list all tasks
router.get('/', async (req, res) => {
  const tasks = await Task.find().sort({ createdAt: -1 });
  res.json(tasks);
});

// POST /tasks - create a task
router.post('/', async (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });

  const task = await Task.create({ title });
  res.status(201).json(task);
});

// PATCH /tasks/:id - mark done/undone
router.patch('/:id', async (req, res) => {
  const task = await Task.findByIdAndUpdate(
    req.params.id,
    { done: req.body.done },
    { new: true }
  );
  if (!task) return res.status(404).json({ error: 'task not found' });
  res.json(task);
});

// DELETE /tasks/:id
router.delete('/:id', async (req, res) => {
  const task = await Task.findByIdAndDelete(req.params.id);
  if (!task) return res.status(404).json({ error: 'task not found' });
  res.status(204).send();
});

module.exports = router;
