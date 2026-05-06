const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, (req, res) => {
  res.json(db.projects.findForUser(req.user.id));
});

router.get('/:id', auth, (req, res) => {
  const project = db.projects.findById(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  res.json(project);
});

router.post('/', auth, (req, res) => {
  if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Only Admins can create projects' });
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Project name is required' });

  const project = db.projects.create({ name, description, created_by: req.user.id });
  db.members.add({ project_id: project.id, user_id: req.user.id, role: 'Admin' });
  res.status(201).json(project);
});

router.delete('/:id', auth, (req, res) => {
  const project = db.projects.findById(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  if (project.created_by !== req.user.id) return res.status(403).json({ error: 'Only creator can delete' });
  db.projects.delete(req.params.id);
  res.json({ message: 'Project deleted' });
});

router.get('/:id/members', auth, (req, res) => {
  res.json(db.members.findByProject(req.params.id));
});

router.post('/:id/members', auth, (req, res) => {
  if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Only Admins can add members' });
  const { email, role } = req.body;
  const user = db.users.findByEmail(email?.toLowerCase());
  if (!user) return res.status(404).json({ error: 'User not found with this email' });
  try {
    db.members.add({ project_id: req.params.id, user_id: user.id, role });
    res.json({ message: `${user.name} added to project` });
  } catch {
    res.status(400).json({ error: 'User is already a member' });
  }
});

router.delete('/:id/members/:userId', auth, (req, res) => {
  if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Only Admins can remove members' });
  db.members.remove(req.params.id, req.params.userId);
  res.json({ message: 'Member removed' });
});

module.exports = router;
