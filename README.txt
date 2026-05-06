================================================================
   TEAM TASK MANAGER — ETHARA.AI FULL STACK ASSESSMENT
   Built by: Arnav Kumar | KIET Group of Institutions
   Enrollment: 2226IT1203 | B.Tech IT 2026
================================================================

PROJECT OVERVIEW
----------------
A full-stack web application for team task management with
role-based access control (Admin/Member), authentication,
project management, and task tracking.

TECH STACK
----------
Backend  : Node.js + Express.js
Database : SQLite (better-sqlite3)
Auth     : JWT (JSON Web Tokens) + bcryptjs
Frontend : HTML5, CSS3, Vanilla JavaScript
Deploy   : Railway

KEY FEATURES
------------
1. Authentication
   - User Signup with role selection (Admin/Member)
   - JWT-based login with 7-day session
   - Secure password hashing with bcrypt

2. Role-Based Access Control
   - Admin: Create projects, add/remove members, full access
   - Member: View assigned projects, update task status

3. Project Management
   - Create, view, delete projects (Admin only)
   - Add/remove team members per project
   - Member count and task count per project

4. Task Management
   - Create tasks with title, description, project, assignee
   - Priority levels: High, Medium, Low
   - Status tracking: Todo → In Progress → Done
   - Due date with automatic overdue detection
   - Filter tasks by status

5. Dashboard
   - Real-time stats: Total, Todo, In Progress, Done, Overdue
   - Recent tasks overview

6. Team View
   - View all registered team members with roles

REST API ENDPOINTS
------------------
POST   /api/auth/signup          - Register new user
POST   /api/auth/login           - Login user

GET    /api/projects             - List user's projects
POST   /api/projects             - Create project (Admin)
DELETE /api/projects/:id         - Delete project (Admin)
GET    /api/projects/:id/members - Get project members
POST   /api/projects/:id/members - Add member (Admin)

GET    /api/tasks                - List tasks (with filters)
GET    /api/tasks/dashboard      - Dashboard statistics
POST   /api/tasks                - Create task
PATCH  /api/tasks/:id            - Update task status/details
DELETE /api/tasks/:id            - Delete task

GET    /api/users                - List all users
GET    /api/users/me             - Get current user

HOW TO RUN LOCALLY
------------------
1. npm install
2. Create .env file with:
   PORT=3000
   JWT_SECRET=your_secret_key
3. node server.js
4. Open http://localhost:3000

DEPLOYMENT (Railway)
--------------------
1. Push to GitHub
2. Connect repo to Railway
3. Add environment variable: JWT_SECRET
4. Railway auto-detects Node.js and deploys

DATABASE SCHEMA
---------------
users          - id, name, email, password, role, created_at
projects       - id, name, description, created_by, created_at
project_members- id, project_id, user_id, role
tasks          - id, title, description, project_id, assigned_to,
                 created_by, status, priority, due_date, created_at

================================================================
