// PROJECTVERSE - Full-Stack REST API & Static Server
// High performance, zero external dependencies using native Node.js APIs

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const url = require('node:url');
const crypto = require('node:crypto');
const { db, initDatabase, hashPassword } = require(path.join(__dirname, 'database.js'));

// Initialize database tables and seed records
initDatabase();

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const JWT_SECRET = process.env.JWT_SECRET || 'projectverse_super_secret_jwt_key_2026';

// In-memory rate limiting map
const rateLimitMap = new Map();

// Helper to sign JWT-style token
function signToken(payload, expiresInHours = 24) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor(Date.now() / 1000) + (expiresInHours * 3600);
  const fullPayload = { ...payload, exp };

  const b64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
  const b64Payload = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${b64Header}.${b64Payload}`).digest('base64url');

  return `${b64Header}.${b64Payload}.${signature}`;
}

// Helper to verify token
function verifyToken(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [b64Header, b64Payload, signature] = parts;
  const expectedSignature = crypto.createHmac('sha256', JWT_SECRET).update(`${b64Header}.${b64Payload}`).digest('base64url');

  if (signature !== expectedSignature) return null;

  try {
    const payload = JSON.parse(Buffer.from(b64Payload, 'base64url').toString('utf8'));
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
      return null; // Expired
    }
    return payload;
  } catch (e) {
    return null;
  }
}

// Extract bearer token from Authorization header
function getAuthUser(req) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  return verifyToken(match[1]);
}

// Parse request body JSON
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 25 * 1024 * 1024) { // 25MB max
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body.trim()) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

// Helper to send JSON response
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

// Helper to send text/csv
function sendCsv(res, filename, csvContent) {
  res.writeHead(200, {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="${filename}"`,
    'Access-Control-Allow-Origin': '*'
  });
  res.end(csvContent);
}

// MIME types dictionary for static file serving
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.mp4': 'video/mp4',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf'
};

// Main HTTP request router
const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    });
    return res.end();
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;
  const clientIp = req.socket.remoteAddress || '127.0.0.1';

  // Basic rate limiting for inquiries
  if (pathname === '/api/inquiries' && req.method === 'POST') {
    const now = Date.now();
    const count = rateLimitMap.get(clientIp) || { count: 0, resetTime: now + 60000 };
    if (now > count.resetTime) {
      count.count = 1;
      count.resetTime = now + 60000;
    } else {
      count.count += 1;
    }
    rateLimitMap.set(clientIp, count);

    if (count.count > 15) { // max 15 submissions per minute per IP
      return sendJson(res, 429, { error: 'Too many requests. Please wait a moment.' });
    }
  }

  try {
    // ==========================================
    // 1. AUTHENTICATION ENDPOINTS
    // ==========================================

    // Admin Login
    if (pathname === '/api/auth/admin-login' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const { email, password } = body;

      if (!email || !password) {
        return sendJson(res, 400, { error: 'Email and password are required' });
      }

      const user = db.prepare('SELECT * FROM users WHERE email = ? AND role = "admin"').get(email);
      if (!user || user.password_hash !== hashPassword(password)) {
        return sendJson(res, 401, { error: 'Invalid admin credentials' });
      }

      const token = signToken({ id: user.id, email: user.email, role: 'admin', name: user.name });
      return sendJson(res, 200, {
        success: true,
        message: 'Admin authenticated successfully',
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role }
      });
    }

    // Student Register
    if (pathname === '/api/auth/student-register' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const { name, email, phone, college, course, department, year_sem, city, password } = body;

      if (!name || !email || !password || !phone) {
        return sendJson(res, 400, { error: 'Name, email, phone and password are required' });
      }

      const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
      if (existing) {
        return sendJson(res, 409, { error: 'An account with this email already exists' });
      }

      const now = new Date().toISOString();
      const insert = db.prepare(`
        INSERT INTO users (name, email, phone, password_hash, role, college, course, department, year_sem, city, created_at)
        VALUES (?, ?, ?, ?, 'student', ?, ?, ?, ?, ?, ?)
      `).run(name, email, phone, hashPassword(password), college || '', course || '', department || '', year_sem || '', city || '', now);

      const userId = Number(insert.lastInsertRowid);
      const token = signToken({ id: userId, email, role: 'student', name });

      return sendJson(res, 201, {
        success: true,
        message: 'Account created successfully',
        token,
        user: { id: userId, name, email, phone, college, course, department, role: 'student' }
      });
    }

    // Student Login
    if (pathname === '/api/auth/student-login' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const { email, password } = body;

      if (!email || !password) {
        return sendJson(res, 400, { error: 'Email and password are required' });
      }

      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
      if (!user || user.password_hash !== hashPassword(password)) {
        return sendJson(res, 401, { error: 'Invalid email or password' });
      }

      const token = signToken({ id: user.id, email: user.email, role: user.role, name: user.name });
      return sendJson(res, 200, {
        success: true,
        message: 'Signed in successfully',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          college: user.college,
          course: user.course,
          department: user.department,
          year_sem: user.year_sem,
          city: user.city,
          role: user.role
        }
      });
    }

    // Get Current Authenticated User Profile
    if (pathname === '/api/auth/me' && req.method === 'GET') {
      const authUser = getAuthUser(req);
      if (!authUser) {
        return sendJson(res, 401, { error: 'Not authenticated' });
      }

      const user = db.prepare(`
        SELECT id, name, email, phone, role, college, course, department, year_sem, city, created_at
        FROM users WHERE id = ?
      `).get(authUser.id);

      if (!user) return sendJson(res, 404, { error: 'User not found' });
      return sendJson(res, 200, { success: true, user });
    }

    // Update Profile
    if (pathname === '/api/auth/profile' && req.method === 'PUT') {
      const authUser = getAuthUser(req);
      if (!authUser) return sendJson(res, 401, { error: 'Not authenticated' });

      const body = await parseJsonBody(req);
      const { name, phone, college, course, department, year_sem, city } = body;

      db.prepare(`
        UPDATE users SET
          name = COALESCE(?, name),
          phone = COALESCE(?, phone),
          college = COALESCE(?, college),
          course = COALESCE(?, course),
          department = COALESCE(?, department),
          year_sem = COALESCE(?, year_sem),
          city = COALESCE(?, city)
        WHERE id = ?
      `).run(name, phone, college, course, department, year_sem, city, authUser.id);

      const updated = db.prepare('SELECT id, name, email, phone, role, college, course, department, year_sem, city FROM users WHERE id = ?').get(authUser.id);
      return sendJson(res, 200, { success: true, message: 'Profile updated', user: updated });
    }

    // ==========================================
    // 2. PROJECTS ENDPOINTS
    // ==========================================

    // GET /api/projects
    if (pathname === '/api/projects' && req.method === 'GET') {
      let sql = `
        SELECT p.*, d.name as domain_name, d.slug as domain_slug, d.color as domain_color,
               c.name as category_name, c.slug as category_slug, c.badge_color as category_badge_color
        FROM projects p
        JOIN domains d ON p.domain_id = d.id
        JOIN categories c ON p.category_id = c.id
        WHERE 1=1
      `;
      const params = [];

      // Check admin status for unpublished viewing
      const authUser = getAuthUser(req);
      if (!authUser || authUser.role !== 'admin') {
        sql += ` AND p.is_published = 1`;
      }

      // Filter by domain
      if (query.domain) {
        if (/^\d+$/.test(query.domain)) {
          sql += ` AND p.domain_id = ?`;
          params.push(parseInt(query.domain, 10));
        } else {
          sql += ` AND d.slug = ?`;
          params.push(query.domain);
        }
      }

      // Filter by category
      if (query.category) {
        if (/^\d+$/.test(query.category)) {
          sql += ` AND p.category_id = ?`;
          params.push(parseInt(query.category, 10));
        } else {
          sql += ` AND c.slug = ?`;
          params.push(query.category);
        }
      }

      // Filter by difficulty
      if (query.difficulty) {
        sql += ` AND LOWER(p.difficulty) = LOWER(?)`;
        params.push(query.difficulty);
      }

      // Filter by language
      if (query.language) {
        sql += ` AND LOWER(p.languages) LIKE LOWER(?)`;
        params.push(`%${query.language}%`);
      }

      // Filter by featured
      if (query.featured === '1' || query.featured === 'true') {
        sql += ` AND p.is_featured = 1`;
      }

      // Filter by trending
      if (query.trending === '1' || query.trending === 'true') {
        sql += ` AND p.is_trending = 1`;
      }

      // Search keyword
      if (query.search && query.search.trim()) {
        const s = `%${query.search.trim()}%`;
        sql += ` AND (
          LOWER(p.title) LIKE LOWER(?) OR
          LOWER(p.short_desc) LIKE LOWER(?) OR
          LOWER(p.technologies) LIKE LOWER(?) OR
          LOWER(d.name) LIKE LOWER(?)
        )`;
        params.push(s, s, s, s);
      }

      // Sorting
      if (query.sort === 'popular') {
        sql += ` ORDER BY p.views_count DESC, p.id DESC`;
      } else if (query.sort === 'featured') {
        sql += ` ORDER BY p.is_featured DESC, p.id DESC`;
      } else if (query.sort === 'alphabetical') {
        sql += ` ORDER BY p.title ASC`;
      } else {
        // default latest
        sql += ` ORDER BY p.id DESC`;
      }

      const rows = db.prepare(sql).all(...params);

      // Parse JSON fields
      const projects = rows.map(r => ({
        ...r,
        technologies: safeJsonParse(r.technologies, []),
        gallery: safeJsonParse(r.gallery, []),
        features: safeJsonParse(r.features, []),
        objectives: safeJsonParse(r.objectives, []),
        sw_requirements: safeJsonParse(r.sw_requirements, []),
        hw_requirements: safeJsonParse(r.hw_requirements, []),
        workflow_steps: safeJsonParse(r.workflow_steps, []),
        expected_outcomes: safeJsonParse(r.expected_outcomes, [])
      }));

      return sendJson(res, 200, { success: true, count: projects.length, projects });
    }

    // GET /api/projects/:id_or_slug
    const projectMatch = pathname.match(/^\/api\/projects\/([a-zA-Z0-9_-]+)$/);
    if (projectMatch && req.method === 'GET') {
      const identifier = projectMatch[1];
      let sql = `
        SELECT p.*, d.name as domain_name, d.slug as domain_slug, d.color as domain_color,
               c.name as category_name, c.slug as category_slug, c.badge_color as category_badge_color
        FROM projects p
        JOIN domains d ON p.domain_id = d.id
        JOIN categories c ON p.category_id = c.id
        WHERE p.slug = ? OR p.id = ?
      `;
      const project = db.prepare(sql).get(identifier, /^\d+$/.test(identifier) ? parseInt(identifier, 10) : -1);

      if (!project) {
        return sendJson(res, 404, { error: 'Project not found' });
      }

      // Increment views count
      db.prepare('UPDATE projects SET views_count = views_count + 1 WHERE id = ?').run(project.id);

      // Get related projects
      const relatedRows = db.prepare(`
        SELECT id, title, slug, thumbnail, short_desc, difficulty, technologies, views_count
        FROM projects
        WHERE domain_id = ? AND id != ? AND is_published = 1
        LIMIT 3
      `).all(project.domain_id, project.id);

      const formatted = {
        ...project,
        technologies: safeJsonParse(project.technologies, []),
        gallery: safeJsonParse(project.gallery, []),
        features: safeJsonParse(project.features, []),
        objectives: safeJsonParse(project.objectives, []),
        sw_requirements: safeJsonParse(project.sw_requirements, []),
        hw_requirements: safeJsonParse(project.hw_requirements, []),
        workflow_steps: safeJsonParse(project.workflow_steps, []),
        expected_outcomes: safeJsonParse(project.expected_outcomes, []),
        related_projects: relatedRows.map(r => ({ ...r, technologies: safeJsonParse(r.technologies, []) }))
      };

      return sendJson(res, 200, { success: true, project: formatted });
    }

    // Admin POST /api/projects (Create)
    if (pathname === '/api/projects' && req.method === 'POST') {
      const authUser = getAuthUser(req);
      if (!authUser || authUser.role !== 'admin') {
        return sendJson(res, 403, { error: 'Unauthorized: Admin access required' });
      }

      const body = await parseJsonBody(req);
      const {
        title, slug, short_desc, full_desc, domain_id, category_id,
        technologies, languages, difficulty, thumbnail, gallery,
        demo_video_url, live_demo_url, github_url, report_url, ppt_url,
        features, objectives, sw_requirements, hw_requirements,
        architecture_desc, workflow_steps, expected_outcomes,
        is_featured, is_trending, is_published
      } = body;

      if (!title || !short_desc || !domain_id || !category_id) {
        return sendJson(res, 400, { error: 'Title, short description, domain and category are required' });
      }

      const generatedSlug = (slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')) + '-' + Math.floor(Math.random() * 900 + 100);
      const now = new Date().toISOString();

      const insert = db.prepare(`
        INSERT INTO projects (
          title, slug, short_desc, full_desc, domain_id, category_id,
          technologies, languages, difficulty, thumbnail, gallery,
          demo_video_url, live_demo_url, github_url, report_url, ppt_url,
          features, objectives, sw_requirements, hw_requirements,
          architecture_desc, workflow_steps, expected_outcomes,
          is_featured, is_trending, is_published, views_count,
          created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?, 0,
          ?, ?
        )
      `).run(
        title, generatedSlug, short_desc, full_desc || short_desc,
        parseInt(domain_id, 10), parseInt(category_id, 10),
        Array.isArray(technologies) ? JSON.stringify(technologies) : (technologies || '[]'),
        languages || 'Python', difficulty || 'Intermediate',
        thumbnail || 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80',
        Array.isArray(gallery) ? JSON.stringify(gallery) : (gallery || '[]'),
        demo_video_url || '', live_demo_url || '', github_url || '', report_url || '', ppt_url || '',
        Array.isArray(features) ? JSON.stringify(features) : (features || '[]'),
        Array.isArray(objectives) ? JSON.stringify(objectives) : (objectives || '[]'),
        Array.isArray(sw_requirements) ? JSON.stringify(sw_requirements) : (sw_requirements || '[]'),
        Array.isArray(hw_requirements) ? JSON.stringify(hw_requirements) : (hw_requirements || '[]'),
        architecture_desc || '',
        Array.isArray(workflow_steps) ? JSON.stringify(workflow_steps) : (workflow_steps || '[]'),
        Array.isArray(expected_outcomes) ? JSON.stringify(expected_outcomes) : (expected_outcomes || '[]'),
        is_featured ? 1 : 0, is_trending ? 1 : 0, is_published !== 0 ? 1 : 0,
        now, now
      );

      return sendJson(res, 201, { success: true, message: 'Project created successfully', projectId: Number(insert.lastInsertRowid), slug: generatedSlug });
    }

    // Admin PUT /api/projects/:id (Update)
    if (projectMatch && req.method === 'PUT') {
      const authUser = getAuthUser(req);
      if (!authUser || authUser.role !== 'admin') {
        return sendJson(res, 403, { error: 'Unauthorized: Admin access required' });
      }

      const projectId = parseInt(projectMatch[1], 10);
      const body = await parseJsonBody(req);
      const now = new Date().toISOString();

      const {
        title, short_desc, full_desc, domain_id, category_id,
        technologies, languages, difficulty, thumbnail, gallery,
        demo_video_url, live_demo_url, github_url, report_url, ppt_url,
        features, objectives, sw_requirements, hw_requirements,
        architecture_desc, workflow_steps, expected_outcomes,
        is_featured, is_trending, is_published
      } = body;

      db.prepare(`
        UPDATE projects SET
          title = COALESCE(?, title),
          short_desc = COALESCE(?, short_desc),
          full_desc = COALESCE(?, full_desc),
          domain_id = COALESCE(?, domain_id),
          category_id = COALESCE(?, category_id),
          technologies = COALESCE(?, technologies),
          languages = COALESCE(?, languages),
          difficulty = COALESCE(?, difficulty),
          thumbnail = COALESCE(?, thumbnail),
          gallery = COALESCE(?, gallery),
          demo_video_url = COALESCE(?, demo_video_url),
          live_demo_url = COALESCE(?, live_demo_url),
          github_url = COALESCE(?, github_url),
          report_url = COALESCE(?, report_url),
          ppt_url = COALESCE(?, ppt_url),
          features = COALESCE(?, features),
          objectives = COALESCE(?, objectives),
          sw_requirements = COALESCE(?, sw_requirements),
          hw_requirements = COALESCE(?, hw_requirements),
          architecture_desc = COALESCE(?, architecture_desc),
          workflow_steps = COALESCE(?, workflow_steps),
          expected_outcomes = COALESCE(?, expected_outcomes),
          is_featured = COALESCE(?, is_featured),
          is_trending = COALESCE(?, is_trending),
          is_published = COALESCE(?, is_published),
          updated_at = ?
        WHERE id = ?
      `).run(
        title, short_desc, full_desc, domain_id ? parseInt(domain_id, 10) : null,
        category_id ? parseInt(category_id, 10) : null,
        technologies ? (Array.isArray(technologies) ? JSON.stringify(technologies) : technologies) : null,
        languages, difficulty, thumbnail,
        gallery ? (Array.isArray(gallery) ? JSON.stringify(gallery) : gallery) : null,
        demo_video_url, live_demo_url, github_url, report_url, ppt_url,
        features ? (Array.isArray(features) ? JSON.stringify(features) : features) : null,
        objectives ? (Array.isArray(objectives) ? JSON.stringify(objectives) : objectives) : null,
        sw_requirements ? (Array.isArray(sw_requirements) ? JSON.stringify(sw_requirements) : sw_requirements) : null,
        hw_requirements ? (Array.isArray(hw_requirements) ? JSON.stringify(hw_requirements) : hw_requirements) : null,
        architecture_desc,
        workflow_steps ? (Array.isArray(workflow_steps) ? JSON.stringify(workflow_steps) : workflow_steps) : null,
        expected_outcomes ? (Array.isArray(expected_outcomes) ? JSON.stringify(expected_outcomes) : expected_outcomes) : null,
        is_featured !== undefined ? (is_featured ? 1 : 0) : null,
        is_trending !== undefined ? (is_trending ? 1 : 0) : null,
        is_published !== undefined ? (is_published ? 1 : 0) : null,
        now, projectId
      );

      return sendJson(res, 200, { success: true, message: 'Project updated successfully' });
    }

    // Admin DELETE /api/projects/:id
    if (projectMatch && req.method === 'DELETE') {
      const authUser = getAuthUser(req);
      if (!authUser || authUser.role !== 'admin') {
        return sendJson(res, 403, { error: 'Unauthorized: Admin access required' });
      }

      const projectId = parseInt(projectMatch[1], 10);
      db.prepare('DELETE FROM projects WHERE id = ?').run(projectId);
      return sendJson(res, 200, { success: true, message: 'Project deleted successfully' });
    }

    // ==========================================
    // 3. DOMAINS & CATEGORIES ENDPOINTS
    // ==========================================

    // GET /api/domains
    if (pathname === '/api/domains' && req.method === 'GET') {
      const rows = db.prepare(`
        SELECT d.*, COUNT(p.id) as project_count
        FROM domains d
        LEFT JOIN projects p ON d.id = p.domain_id AND p.is_published = 1
        GROUP BY d.id
        ORDER BY d.display_order ASC, d.id ASC
      `).all();

      return sendJson(res, 200, { success: true, domains: rows });
    }

    // Admin POST /api/domains (Create Domain)
    if (pathname === '/api/domains' && req.method === 'POST') {
      const authUser = getAuthUser(req);
      if (!authUser || authUser.role !== 'admin') return sendJson(res, 403, { error: 'Admin access required' });

      const body = await parseJsonBody(req);
      const { name, slug, icon, description, color } = body;
      if (!name || !description) return sendJson(res, 400, { error: 'Domain name and description are required' });

      const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const maxOrder = db.prepare('SELECT MAX(display_order) as mo FROM domains').get().mo || 0;

      const insert = db.prepare(`
        INSERT INTO domains (name, slug, icon, description, color, display_order)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(name, finalSlug, icon || 'Layers', description, color || 'blue', maxOrder + 1);

      return sendJson(res, 201, { success: true, message: 'Domain created successfully', domainId: Number(insert.lastInsertRowid) });
    }

    // Admin PUT /api/domains/:id
    const domainMatch = pathname.match(/^\/api\/domains\/(\d+)$/);
    if (domainMatch && req.method === 'PUT') {
      const authUser = getAuthUser(req);
      if (!authUser || authUser.role !== 'admin') return sendJson(res, 403, { error: 'Admin access required' });

      const domainId = parseInt(domainMatch[1], 10);
      const body = await parseJsonBody(req);
      const { name, icon, description, color } = body;

      db.prepare(`
        UPDATE domains SET
          name = COALESCE(?, name),
          icon = COALESCE(?, icon),
          description = COALESCE(?, description),
          color = COALESCE(?, color)
        WHERE id = ?
      `).run(name, icon, description, color, domainId);

      return sendJson(res, 200, { success: true, message: 'Domain updated successfully' });
    }

    // Admin DELETE /api/domains/:id
    if (domainMatch && req.method === 'DELETE') {
      const authUser = getAuthUser(req);
      if (!authUser || authUser.role !== 'admin') return sendJson(res, 403, { error: 'Admin access required' });

      const domainId = parseInt(domainMatch[1], 10);
      db.prepare('DELETE FROM domains WHERE id = ?').run(domainId);
      return sendJson(res, 200, { success: true, message: 'Domain deleted successfully' });
    }

    // GET /api/categories
    if (pathname === '/api/categories' && req.method === 'GET') {
      const rows = db.prepare(`
        SELECT c.*, COUNT(p.id) as project_count
        FROM categories c
        LEFT JOIN projects p ON c.id = p.category_id AND p.is_published = 1
        GROUP BY c.id
        ORDER BY c.id ASC
      `).all();

      return sendJson(res, 200, { success: true, categories: rows });
    }

    // ==========================================
    // 4. STUDENT INTEREST (LEADS) ENDPOINTS
    // ==========================================

    // POST /api/inquiries (Public Lead Registration)
    if (pathname === '/api/inquiries' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const {
        student_name, mobile, email, college, course, department, city,
        project_id, project_title, domain_name, category_name,
        preferred_tech, additional_req, message
      } = body;

      // Validation
      if (!student_name || !mobile || !email || !college || !course || !department || !city) {
        return sendJson(res, 400, { error: 'Please fill in all required fields (Name, Mobile, Email, College, Course, Department, City)' });
      }

      // Mobile number validation (at least 10 digits)
      const cleanMobile = mobile.replace(/[^0-9]/g, '');
      if (cleanMobile.length < 10) {
        return sendJson(res, 400, { error: 'Please enter a valid 10-digit mobile number' });
      }

      // Email validation
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return sendJson(res, 400, { error: 'Please enter a valid email address' });
      }

      // Prevent accidental duplicate within last 5 minutes
      const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const duplicate = db.prepare(`
        SELECT id, ref_code FROM inquiries
        WHERE email = ? AND mobile = ? AND created_at > ?
      `).get(email, cleanMobile, fiveMinsAgo);

      if (duplicate) {
        return sendJson(res, 200, {
          success: true,
          message: 'Your inquiry has already been recorded! Our project counselor is preparing your demo.',
          ref_code: duplicate.ref_code
        });
      }

      // Generate Reference Code
      const randNum = Math.floor(1000 + Math.random() * 9000);
      const ref_code = `PV-2026-${randNum}`;
      const now = new Date().toISOString();

      const insert = db.prepare(`
        INSERT INTO inquiries (
          ref_code, student_name, mobile, email, college, course, department, city,
          project_id, project_title, domain_name, category_name, preferred_tech,
          additional_req, message, status, admin_notes, created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, 'New Inquiry', '', ?, ?
        )
      `).run(
        ref_code, student_name.trim(), cleanMobile, email.trim().toLowerCase(),
        college.trim(), course.trim(), department.trim(), city.trim(),
        project_id ? parseInt(project_id, 10) : null,
        project_title || 'General Consultation Inquiry',
        domain_name || 'Multi-Domain',
        category_name || 'Major Projects',
        preferred_tech || '',
        additional_req || '',
        message || '',
        now, now
      );

      const inqId = Number(insert.lastInsertRowid);

      // Log activity
      db.prepare(`
        INSERT INTO inquiry_logs (inquiry_id, action, note, performed_by, created_at)
        VALUES (?, 'Created', 'Student submitted interest through web platform', 'Student', ?)
      `).run(inqId, now);

      return sendJson(res, 201, {
        success: true,
        message: 'Thank You! Your Interest Has Been Successfully Submitted. Our Team Will Contact You Soon.',
        ref_code,
        inquiry_id: inqId,
        contact_links: {
          whatsapp: `https://wa.me/917989010109?text=${encodeURIComponent(`Hi ProjectVerse Team, I have submitted my project interest with Reference: ${ref_code} for "${project_title || 'Final Year Project'}". Please connect with me.`)}`,
          phone: 'tel:7989010109'
        }
      });
    }

    // GET /api/inquiries (Admin view all leads)
    if (pathname === '/api/inquiries' && req.method === 'GET') {
      const authUser = getAuthUser(req);
      if (!authUser || authUser.role !== 'admin') {
        return sendJson(res, 403, { error: 'Unauthorized: Admin access required' });
      }

      let sql = 'SELECT * FROM inquiries WHERE 1=1';
      const params = [];

      if (query.status && query.status !== 'All') {
        sql += ' AND status = ?';
        params.push(query.status);
      }

      if (query.domain) {
        sql += ' AND domain_name LIKE ?';
        params.push(`%${query.domain}%`);
      }

      if (query.search && query.search.trim()) {
        const s = `%${query.search.trim()}%`;
        sql += ' AND (LOWER(student_name) LIKE LOWER(?) OR mobile LIKE ? OR LOWER(email) LIKE LOWER(?) OR LOWER(college) LIKE LOWER(?) OR LOWER(project_title) LIKE LOWER(?))';
        params.push(s, s, s, s, s);
      }

      sql += ' ORDER BY id DESC';

      const inquiries = db.prepare(sql).all(...params);
      return sendJson(res, 200, { success: true, count: inquiries.length, inquiries });
    }

    // GET /api/inquiries/export (Admin CSV Export)
    if (pathname === '/api/inquiries/export' && req.method === 'GET') {
      const authUser = getAuthUser(req);
      if (!authUser || authUser.role !== 'admin') {
        return sendJson(res, 403, { error: 'Unauthorized: Admin access required' });
      }

      const rows = db.prepare('SELECT * FROM inquiries ORDER BY id DESC').all();

      const headers = ['Ref Code', 'Student Name', 'Mobile', 'Email', 'College', 'Course', 'Department', 'City', 'Project Title', 'Domain', 'Category', 'Status', 'Submitted Date', 'Admin Notes'];
      const escapeCsv = (str) => `"${(str || '').toString().replace(/"/g, '""')}"`;

      let csv = headers.join(',') + '\r\n';
      rows.forEach(r => {
        csv += [
          escapeCsv(r.ref_code),
          escapeCsv(r.student_name),
          escapeCsv(r.mobile),
          escapeCsv(r.email),
          escapeCsv(r.college),
          escapeCsv(r.course),
          escapeCsv(r.department),
          escapeCsv(r.city),
          escapeCsv(r.project_title),
          escapeCsv(r.domain_name),
          escapeCsv(r.category_name),
          escapeCsv(r.status),
          escapeCsv(r.created_at),
          escapeCsv(r.admin_notes)
        ].join(',') + '\r\n';
      });

      return sendCsv(res, `projectverse_leads_${Date.now()}.csv`, csv);
    }

    // PATCH /api/inquiries/:id (Update lead status or notes)
    const inqMatch = pathname.match(/^\/api\/inquiries\/(\d+)$/);
    if (inqMatch && req.method === 'PATCH') {
      const authUser = getAuthUser(req);
      if (!authUser || authUser.role !== 'admin') {
        return sendJson(res, 403, { error: 'Unauthorized: Admin access required' });
      }

      const inqId = parseInt(inqMatch[1], 10);
      const body = await parseJsonBody(req);
      const { status, admin_notes } = body;
      const now = new Date().toISOString();

      if (status) {
        db.prepare('UPDATE inquiries SET status = ?, updated_at = ? WHERE id = ?').run(status, now, inqId);
        db.prepare(`
          INSERT INTO inquiry_logs (inquiry_id, action, note, performed_by, created_at)
          VALUES (?, 'Status Changed', ?, ?, ?)
        `).run(inqId, `Status updated to "${status}"`, authUser.name || 'Admin', now);
      }

      if (admin_notes !== undefined) {
        db.prepare('UPDATE inquiries SET admin_notes = ?, updated_at = ? WHERE id = ?').run(admin_notes, now, inqId);
        db.prepare(`
          INSERT INTO inquiry_logs (inquiry_id, action, note, performed_by, created_at)
          VALUES (?, 'Note Added', ?, ?, ?)
        `).run(inqId, admin_notes, authUser.name || 'Admin', now);
      }

      const updated = db.prepare('SELECT * FROM inquiries WHERE id = ?').get(inqId);
      return sendJson(res, 200, { success: true, message: 'Inquiry updated successfully', inquiry: updated });
    }

    // DELETE /api/inquiries/:id
    if (inqMatch && req.method === 'DELETE') {
      const authUser = getAuthUser(req);
      if (!authUser || authUser.role !== 'admin') {
        return sendJson(res, 403, { error: 'Unauthorized: Admin access required' });
      }

      const inqId = parseInt(inqMatch[1], 10);
      db.prepare('DELETE FROM inquiries WHERE id = ?').run(inqId);
      return sendJson(res, 200, { success: true, message: 'Inquiry deleted successfully' });
    }

    // ==========================================
    // 5. STUDENT DASHBOARD SPECIFIC
    // ==========================================

    // GET /api/student/inquiries (Student view their inquiries)
    if (pathname === '/api/student/inquiries' && req.method === 'GET') {
      const authUser = getAuthUser(req);
      if (!authUser) return sendJson(res, 401, { error: 'Authentication required' });

      const inquiries = db.prepare(`
        SELECT * FROM inquiries
        WHERE email = ? OR mobile = (SELECT phone FROM users WHERE id = ?)
        ORDER BY id DESC
      `).all(authUser.email, authUser.id);

      return sendJson(res, 200, { success: true, count: inquiries.length, inquiries });
    }

    // GET /api/student/favorites
    if (pathname === '/api/student/favorites' && req.method === 'GET') {
      const authUser = getAuthUser(req);
      if (!authUser) return sendJson(res, 401, { error: 'Authentication required' });

      const favs = db.prepare(`
        SELECT p.*, d.name as domain_name, c.name as category_name
        FROM favorites f
        JOIN projects p ON f.project_id = p.id
        JOIN domains d ON p.domain_id = d.id
        JOIN categories c ON p.category_id = c.id
        WHERE f.user_id = ?
        ORDER BY f.id DESC
      `).all(authUser.id);

      return sendJson(res, 200, { success: true, count: favs.length, favorites: favs });
    }

    // POST /api/student/favorites/toggle
    if (pathname === '/api/student/favorites/toggle' && req.method === 'POST') {
      const authUser = getAuthUser(req);
      if (!authUser) return sendJson(res, 401, { error: 'Authentication required' });

      const body = await parseJsonBody(req);
      const projectId = parseInt(body.project_id, 10);
      if (!projectId) return sendJson(res, 400, { error: 'Project ID required' });

      const existing = db.prepare('SELECT id FROM favorites WHERE user_id = ? AND project_id = ?').get(authUser.id, projectId);
      if (existing) {
        db.prepare('DELETE FROM favorites WHERE id = ?').run(existing.id);
        return sendJson(res, 200, { success: true, is_favorited: false, message: 'Removed from favorites' });
      } else {
        const now = new Date().toISOString();
        db.prepare('INSERT INTO favorites (user_id, project_id, created_at) VALUES (?, ?, ?)').run(authUser.id, projectId, now);
        return sendJson(res, 200, { success: true, is_favorited: true, message: 'Added to favorites' });
      }
    }

    // ==========================================
    // 6. ADMIN DASHBOARD ANALYTICS & STATS
    // ==========================================

    // GET /api/admin/stats
    if (pathname === '/api/admin/stats' && req.method === 'GET') {
      const authUser = getAuthUser(req);
      if (!authUser || authUser.role !== 'admin') {
        return sendJson(res, 403, { error: 'Unauthorized: Admin access required' });
      }

      const totalProjects = db.prepare('SELECT COUNT(*) as c FROM projects').get().c;
      const totalDomains = db.prepare('SELECT COUNT(*) as c FROM domains').get().c;
      const totalStudents = db.prepare('SELECT COUNT(*) as c FROM users WHERE role = "student"').get().c;
      const totalInquiries = db.prepare('SELECT COUNT(*) as c FROM inquiries').get().c;

      // Inquiries by status
      const statusCounts = db.prepare(`
        SELECT status, COUNT(*) as count FROM inquiries GROUP BY status
      `).all();

      const newInquiries = statusCounts.find(s => s.status === 'New Inquiry')?.count || 0;
      const contactedInquiries = statusCounts.find(s => s.status === 'Contacted')?.count || 0;
      const progressInquiries = statusCounts.find(s => s.status === 'Discussion in Progress')?.count || 0;
      const convertedInquiries = statusCounts.find(s => s.status === 'Converted')?.count || 0;

      // Inquiries by domain breakdown
      const domainStats = db.prepare(`
        SELECT domain_name, COUNT(*) as count FROM inquiries GROUP BY domain_name ORDER BY count DESC LIMIT 6
      `).all();

      // Top popular projects by views
      const popularProjects = db.prepare(`
        SELECT id, title, slug, views_count, (SELECT COUNT(*) FROM inquiries WHERE project_id = projects.id) as leads_count
        FROM projects ORDER BY views_count DESC LIMIT 5
      `).all();

      // Recent leads activity
      const recentLeads = db.prepare(`
        SELECT id, ref_code, student_name, mobile, college, project_title, status, created_at
        FROM inquiries ORDER BY id DESC LIMIT 5
      `).all();

      return sendJson(res, 200, {
        success: true,
        stats: {
          totalProjects,
          totalDomains,
          totalStudents,
          totalInquiries,
          newInquiries,
          contactedInquiries,
          progressInquiries,
          convertedInquiries,
          statusCounts,
          domainStats,
          popularProjects,
          recentLeads
        }
      });
    }

    // ==========================================
    // 7. TESTIMONIALS & REVIEWS
    // ==========================================

    // GET /api/testimonials
    if (pathname === '/api/testimonials' && req.method === 'GET') {
      const testimonials = db.prepare(`
        SELECT * FROM testimonials WHERE is_approved = 1 ORDER BY id DESC
      `).all();
      return sendJson(res, 200, { success: true, testimonials });
    }

    // POST /api/testimonials (Student submit review)
    if (pathname === '/api/testimonials' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const { student_name, college, course, project_name, rating, review } = body;

      if (!student_name || !college || !review) {
        return sendJson(res, 400, { error: 'Name, college and review are required' });
      }

      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO testimonials (student_name, college, course, project_name, rating, review, avatar, is_approved, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
      `).run(
        student_name, college, course || 'B.Tech', project_name || 'Final Year Project',
        parseInt(rating, 10) || 5, review,
        `https://images.unsplash.com/photo-${Math.floor(1500000000000 + Math.random() * 90000000000)}?auto=format&fit=crop&w=200&q=80`,
        now
      );

      return sendJson(res, 201, { success: true, message: 'Thank you for your feedback!' });
    }

    // ==========================================
    // 8. FILE UPLOAD ENDPOINT (Base64)
    // ==========================================
    if (pathname === '/api/upload' && req.method === 'POST') {
      const authUser = getAuthUser(req);
      if (!authUser || authUser.role !== 'admin') {
        return sendJson(res, 403, { error: 'Unauthorized: Admin access required' });
      }

      const body = await parseJsonBody(req);
      const { filename, base64Data } = body;
      if (!filename || !base64Data) {
        return sendJson(res, 400, { error: 'Filename and base64Data are required' });
      }

      // Safe clean filename
      const ext = path.extname(filename).toLowerCase();
      const safeName = 'upload_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8) + ext;
      const targetPath = path.join(PUBLIC_DIR, 'uploads', safeName);

      const buffer = Buffer.from(base64Data.replace(/^data:.*?;base64,/, ''), 'base64');
      fs.writeFileSync(targetPath, buffer);

      return sendJson(res, 201, {
        success: true,
        message: 'File uploaded successfully',
        url: `/uploads/${safeName}`
      });
    }

    // ==========================================
    // 9. STATIC FILE SERVING & SPA FALLBACK
    // ==========================================
    let filePath = path.join(PUBLIC_DIR, pathname);

    // If root or path doesn't have an extension, try file or fallback to index.html
    if (pathname === '/' || !path.extname(pathname)) {
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        // file exists
      } else {
        filePath = path.join(PUBLIC_DIR, 'index.html');
      }
    }

    // Normalize path to prevent directory traversal
    const safePath = path.normalize(filePath);
    if (!safePath.startsWith(PUBLIC_DIR)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      return res.end('Access Denied');
    }

    if (fs.existsSync(safePath) && fs.statSync(safePath).isFile()) {
      const ext = path.extname(safePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=86400'
      });
      return fs.createReadStream(safePath).pipe(res);
    }

    // 404 handler
    sendJson(res, 404, { error: 'Route or file not found' });

  } catch (error) {
    console.error('Server Internal Error:', error);
    sendJson(res, 500, { error: 'Internal Server Error', details: error.message });
  }
});

function safeJsonParse(val, fallback) {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch (e) {
    return fallback;
  }
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`🚀 PROJECTVERSE Server running at http://localhost:${PORT}`);
  console.log(`👉 Admin Credentials: admin@projectverse.com / admin123`);
  console.log(`👉 Contact Hotline: 7989010109 | saikirangorle909@gmail.com`);
  console.log(`=======================================================`);
});
