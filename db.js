// Pure JavaScript JSON-based database — no native modules needed!
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data.json');

let store = {
  users: [],
  projects: [],
  project_members: [],
  tasks: [],
  _counters: { users: 0, projects: 0, project_members: 0, tasks: 0 }
};

// Load existing data from file
if (fs.existsSync(DB_PATH)) {
  try { store = JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); }
  catch (e) { console.log('Fresh database created'); }
}

function persist() {
  fs.writeFileSync(DB_PATH, JSON.stringify(store, null, 2));
}

function nextId(table) {
  store._counters[table] = (store._counters[table] || 0) + 1;
  return store._counters[table];
}

function now() { return new Date().toISOString(); }

const db = {
  // ===== USERS =====
  users: {
    create({ name, email, password, role }) {
      if (store.users.find(u => u.email === email)) throw new Error('EMAIL_EXISTS');
      const user = { id: nextId('users'), name, email, password, role: role || 'Member', created_at: now() };
      store.users.push(user);
      persist();
      return user;
    },
    findByEmail(email) {
      return store.users.find(u => u.email === email) || null;
    },
    findById(id) {
      return store.users.find(u => u.id === Number(id)) || null;
    },
    findAll() {
      return store.users.map(({ password, ...u }) => u);
    }
  },

  // ===== PROJECTS =====
  projects: {
    create({ name, description, created_by }) {
      const project = { id: nextId('projects'), name, description: description || '', created_by, created_at: now() };
      store.projects.push(project);
      persist();
      return project;
    },
    findAll() { return store.projects; },
    findById(id) {
      return store.projects.find(p => p.id === Number(id)) || null;
    },
    findForUser(userId) {
      const uid = Number(userId);
      const memberProjectIds = store.project_members.filter(m => m.user_id === uid).map(m => m.project_id);
      return store.projects.filter(p => p.created_by === uid || memberProjectIds.includes(p.id)).map(p => {
        const creator = store.users.find(u => u.id === p.created_by);
        const task_count = store.tasks.filter(t => t.project_id === p.id).length;
        const member_count = store.project_members.filter(m => m.project_id === p.id).length;
        return { ...p, creator_name: creator?.name || 'Unknown', task_count, member_count };
      }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    },
    delete(id) {
      const pid = Number(id);
      store.tasks = store.tasks.filter(t => t.project_id !== pid);
      store.project_members = store.project_members.filter(m => m.project_id !== pid);
      store.projects = store.projects.filter(p => p.id !== pid);
      persist();
    }
  },

  // ===== PROJECT MEMBERS =====
  members: {
    add({ project_id, user_id, role }) {
      const pid = Number(project_id), uid = Number(user_id);
      if (store.project_members.find(m => m.project_id === pid && m.user_id === uid)) throw new Error('ALREADY_MEMBER');
      const member = { id: nextId('project_members'), project_id: pid, user_id: uid, role: role || 'Member' };
      store.project_members.push(member);
      persist();
      return member;
    },
    findByProject(project_id) {
      const pid = Number(project_id);
      return store.project_members.filter(m => m.project_id === pid).map(m => {
        const user = store.users.find(u => u.id === m.user_id);
        return { id: user?.id, name: user?.name, email: user?.email, role: m.role };
      });
    },
    remove(project_id, user_id) {
      store.project_members = store.project_members.filter(
        m => !(m.project_id === Number(project_id) && m.user_id === Number(user_id))
      );
      persist();
    }
  },

  // ===== TASKS =====
  tasks: {
    create({ title, description, project_id, assigned_to, created_by, priority, due_date }) {
      const task = {
        id: nextId('tasks'),
        title, description: description || '',
        project_id: Number(project_id),
        assigned_to: assigned_to ? Number(assigned_to) : Number(created_by),
        created_by: Number(created_by),
        status: 'Todo',
        priority: priority || 'Medium',
        due_date: due_date || null,
        created_at: now()
      };
      store.tasks.push(task);
      persist();
      return this._hydrate(task);
    },
    findForUser(userId, filters = {}) {
      const uid = Number(userId);
      let tasks = store.tasks.filter(t => t.assigned_to === uid || t.created_by === uid);
      if (filters.project_id) tasks = tasks.filter(t => t.project_id === Number(filters.project_id));
      if (filters.status) tasks = tasks.filter(t => t.status === filters.status);
      if (filters.overdue) {
        const today = new Date().toISOString().split('T')[0];
        tasks = tasks.filter(t => t.due_date && t.due_date < today && t.status !== 'Done');
      }
      return tasks.map(t => this._hydrate(t)).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    },
    dashboard(userId) {
      const uid = Number(userId);
      const today = new Date().toISOString().split('T')[0];
      const mine = store.tasks.filter(t => t.assigned_to === uid || t.created_by === uid);
      return {
        total: mine.length,
        todo: mine.filter(t => t.status === 'Todo').length,
        in_progress: mine.filter(t => t.status === 'In Progress').length,
        done: mine.filter(t => t.status === 'Done').length,
        overdue: mine.filter(t => t.due_date && t.due_date < today && t.status !== 'Done').length,
        recent: mine.slice(-5).reverse().map(t => this._hydrate(t))
      };
    },
    findById(id) {
      return store.tasks.find(t => t.id === Number(id)) || null;
    },
    update(id, fields) {
      const idx = store.tasks.findIndex(t => t.id === Number(id));
      if (idx === -1) return null;
      Object.keys(fields).forEach(k => { if (fields[k] !== undefined) store.tasks[idx][k] = fields[k]; });
      persist();
      return this._hydrate(store.tasks[idx]);
    },
    delete(id) {
      store.tasks = store.tasks.filter(t => t.id !== Number(id));
      persist();
    },
    _hydrate(task) {
      const assigned = store.users.find(u => u.id === task.assigned_to);
      const creator = store.users.find(u => u.id === task.created_by);
      const project = store.projects.find(p => p.id === task.project_id);
      return {
        ...task,
        assigned_to_name: assigned?.name || 'Unassigned',
        created_by_name: creator?.name || 'Unknown',
        project_name: project?.name || 'Unknown'
      };
    }
  }
};

console.log('✅ Database ready (JSON store)');
module.exports = db;
