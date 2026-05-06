const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

router.get('/dashboard', auth, (req, res) => {
  res.json(db.tasks.dashboard(req.user.id));
});

router.get('/', auth, (req, res) => {
  const { project_id, status } = req.query;
  const filters = {};
  if (project_id) filters.project_id = project_id;
  if (status) filters.status = status;
  res.json(db.tasks.findForUser(req.user.id, filters));
});

router.post('/', auth, (req, res) => {
  const { title, description, project_id, assigned_to, priority, due_date } = req.body;
  if (!title || !project_id) return res.status(400).json({ error: 'Title and project are required' });
  const task = db.tasks.create({ title, description, project_id, assigned_to, created_by: req.user.id, priority, due_date });
  res.status(201).json(task);
});

router.patch('/:id', auth, (req, res) => {
  const task = db.tasks.findById(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  const { title, description, status, assigned_to, priority, due_date } = req.body;
  const updated = db.tasks.update(req.params.id, { title, description, status, assigned_to, priority, due_date });
  res.json(updated);
});

router.delete('/:id', auth, (req, res) => {
  const task = db.tasks.findById(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  db.tasks.delete(req.params.id);
  res.json({ message: 'Task deleted' });
});

module.exports = router;
