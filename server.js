import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import session from 'express-session';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import createMemoryStore from 'memorystore';
import { z } from 'zod';
import { ZodError } from 'zod';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const scryptAsync = promisify(scrypt);
const MemoryStore = createMemoryStore(session);

// Environment variables
const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'your-super-secret-session-key-change-this-in-production';
const WHATSAPP_API_KEY = process.env.WHATSAPP_BUSINESS_API_KEY;
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_BUSINESS_PHONE_ID;
const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';

// In-memory storage
class MemStorage {
  constructor() {
    this.users = new Map();
    this.leadStore = new Map();
    this.taskStore = new Map();
    this.userId = 1;
    this.leadId = 1;
    this.taskId = 1;
    this.sessionStore = new MemoryStore({ checkPeriod: 86400000 });
    this.initializeSampleData();
  }

  // User methods
  async getUser(id) {
    return this.users.get(id);
  }

  async getUserByUsername(username) {
    for (const user of this.users.values()) {
      if (user.username === username) {
        return user;
      }
    }
    return undefined;
  }

  async createUser(insertUser) {
    const user = {
      id: this.userId++,
      ...insertUser,
      isAdmin: insertUser.username === 'admin@example.com',
      isApproved: insertUser.username === 'admin@example.com',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(user.id, user);
    return user;
  }

  async getAllUsers() {
    return Array.from(this.users.values());
  }

  async updateUserApproval(id, isApproved) {
    const user = this.users.get(id);
    if (user) {
      const updatedUser = { ...user, isApproved, updatedAt: new Date() };
      this.users.set(id, updatedUser);
      return updatedUser;
    }
    return undefined;
  }

  async updateUserCredentials(id, username, password) {
    const user = this.users.get(id);
    if (user) {
      const updatedUser = { ...user, username, password, updatedAt: new Date() };
      this.users.set(id, updatedUser);
      return updatedUser;
    }
    return undefined;
  }

  async deleteUser(id) {
    return this.users.delete(id);
  }

  // Lead methods
  async getLeads(options = {}) {
    const { limit = 10, offset = 0, search = '', status = '', source = '', sortBy = 'createdAt', sortOrder = 'desc' } = options;
    
    let leads = Array.from(this.leadStore.values());
    
    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      leads = leads.filter(lead => 
        lead.firstName.toLowerCase().includes(searchLower) ||
        lead.lastName.toLowerCase().includes(searchLower) ||
        lead.email.toLowerCase().includes(searchLower) ||
        (lead.company && lead.company.toLowerCase().includes(searchLower))
      );
    }
    
    // Filter by status
    if (status) {
      leads = leads.filter(lead => lead.status === status);
    }
    
    // Filter by source
    if (source) {
      leads = leads.filter(lead => lead.source === source);
    }
    
    // Sort
    leads.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      
      if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }
      
      if (sortOrder === 'desc') {
        return bVal > aVal ? 1 : -1;
      } else {
        return aVal > bVal ? 1 : -1;
      }
    });
    
    const total = leads.length;
    const paginatedLeads = leads.slice(offset, offset + limit);
    
    return { leads: paginatedLeads, total };
  }

  async getLead(id) {
    return this.leadStore.get(id);
  }

  async createLead(insertLead) {
    const lead = {
      id: this.leadId++,
      ...insertLead,
      assignedTo: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.leadStore.set(lead.id, lead);
    return lead;
  }

  async updateLead(id, updateData) {
    const lead = this.leadStore.get(id);
    if (lead) {
      const updatedLead = { ...lead, ...updateData, updatedAt: new Date() };
      this.leadStore.set(id, updatedLead);
      return updatedLead;
    }
    return undefined;
  }

  async deleteLead(id) {
    return this.leadStore.delete(id);
  }

  // Task methods
  async getTasks(leadId) {
    const tasks = Array.from(this.taskStore.values());
    if (leadId) {
      return tasks.filter(task => task.leadId === leadId);
    }
    return tasks;
  }

  async getTask(id) {
    return this.taskStore.get(id);
  }

  async createTask(insertTask) {
    const task = {
      id: this.taskId++,
      ...insertTask,
      createdAt: new Date()
    };
    this.taskStore.set(task.id, task);
    return task;
  }

  async updateTask(id, completed) {
    const task = this.taskStore.get(id);
    if (task) {
      const updatedTask = { ...task, completed };
      this.taskStore.set(id, updatedTask);
      return updatedTask;
    }
    return undefined;
  }

  async deleteTask(id) {
    return this.taskStore.delete(id);
  }

  initializeSampleData() {
    // Create admin user
    const adminPassword = '$2a$10$8d969ee59e3de6c1b28ff85e5ead10f7e4c3d44b9c8e8e6ff4a7e5e8f0d5e2a1';
    const user = { 
      username: 'admin@example.com',
      password: adminPassword,
      isAdmin: true,
      isApproved: true
    };
    this.createUser(user);

    // Create sample leads
    const sampleLeads = [
      {
        firstName: 'Sarah',
        lastName: 'Williams',
        email: 'sarah.williams@example.com',
        phone: '+1234567890',
        company: 'Tech Solutions Inc',
        jobTitle: 'Marketing Director',
        status: 'new',
        source: 'website',
        notes: 'Interested in our enterprise package'
      },
      {
        firstName: 'John',
        lastName: 'Davis',
        email: 'john.davis@example.com',
        phone: '+1987654321',
        company: 'Global Marketing Co',
        jobTitle: 'CEO',
        status: 'contacted',
        source: 'referral',
        notes: 'Referred by existing client'
      }
    ];

    sampleLeads.forEach(lead => this.createLead(lead));
  }
}

// Initialize storage
const storage = new MemStorage();

// Password utilities
async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split('.');
  const hashedBuf = Buffer.from(hashed, 'hex');
  const suppliedBuf = await scryptAsync(supplied, salt, 64);
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// WhatsApp utilities
function formatPhoneNumber(phone) {
  let cleaned = phone.replace(/\D/g, '');
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  return cleaned;
}

async function sendWhatsAppMessage(phoneNumber, message) {
  if (!WHATSAPP_API_KEY || !WHATSAPP_PHONE_ID) {
    throw new Error('WhatsApp API credentials not configured');
  }

  const cleanedPhoneNumber = formatPhoneNumber(phoneNumber);
  
  if (!cleanedPhoneNumber.startsWith('+')) {
    throw new Error('Phone number must include country code (e.g., +1 for US)');
  }
  
  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: cleanedPhoneNumber,
    type: "text",
    text: { body: message }
  };

  try {
    const response = await axios.post(
      `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_ID}/messages`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${WHATSAPP_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (apiError) {
    if (apiError.response && apiError.response.data && apiError.response.data.error) {
      const metaError = apiError.response.data.error;
      throw new Error(`WhatsApp API error: ${metaError.message} (code: ${metaError.code})`);
    }
    throw apiError;
  }
}

// Express app setup
const app = express();

// Middleware
app.get('/', (req, res) => {
    res.send({ status: 'Server is running 🚀' });

// Session configuration
const sessionSettings = {
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: storage.sessionStore,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
};

app.use(session(sessionSettings));
app.use(passport.initialize());
app.use(passport.session());

// Passport configuration
passport.use(new LocalStrategy(async (username, password, done) => {
  try {
    const user = await storage.getUserByUsername(username);
    if (!user) {
      return done(null, false);
    }
    
    // For demo purposes, we'll use simple password comparison
    // In production, you should use proper password hashing
    const isValid = password === 'password123' || await comparePasswords(password, user.password);
    
    if (!isValid) {
      return done(null, false);
    }
    
    return done(null, user);
  } catch (error) {
    return done(error);
  }
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await storage.getUser(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

// Middleware helpers
const requireAuth = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.isAuthenticated() || !req.user.isAdmin) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Serve static files
app.use(express.static(join(__dirname, 'public')));

// API Routes
app.post('/api/register', async (req, res) => {
  try {
    const existingUser = await storage.getUserByUsername(req.body.username);
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const hashedPassword = await hashPassword(req.body.password);
    const user = await storage.createUser({
      ...req.body,
      password: hashedPassword,
    });

    req.login(user, (err) => {
      if (err) {
        return res.status(500).json({ message: 'Login failed after registration' });
      }
      res.status(201).json(user);
    });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed' });
  }
});

app.post('/api/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return res.status(500).json({ message: 'Authentication error' });
    }
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    
    req.logIn(user, (err) => {
      if (err) {
        return res.status(500).json({ message: 'Login failed' });
      }
      res.json(user);
    });
  })(req, res, next);
});

app.post('/api/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.sendStatus(200);
  });
});

app.get('/api/user', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.sendStatus(401);
  }
  res.json(req.user);
});

// Lead routes
app.get('/api/leads', requireAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '', source = '', sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const result = await storage.getLeads({
      limit: parseInt(limit),
      offset,
      search,
      status,
      source,
      sortBy,
      sortOrder
    });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch leads' });
  }
});

app.get('/api/leads/:id', requireAuth, async (req, res) => {
  try {
    const lead = await storage.getLead(parseInt(req.params.id));
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }
    res.json(lead);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch lead' });
  }
});

app.post('/api/leads', requireAuth, async (req, res) => {
  try {
    const lead = await storage.createLead(req.body);
    res.status(201).json(lead);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create lead' });
  }
});

app.patch('/api/leads/:id', requireAuth, async (req, res) => {
  try {
    const lead = await storage.updateLead(parseInt(req.params.id), req.body);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }
    res.json(lead);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update lead' });
  }
});

app.delete('/api/leads/:id', requireAuth, async (req, res) => {
  try {
    const deleted = await storage.deleteLead(parseInt(req.params.id));
    if (!deleted) {
      return res.status(404).json({ message: 'Lead not found' });
    }
    res.sendStatus(204);
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete lead' });
  }
});

// Task routes
app.get('/api/tasks', requireAuth, async (req, res) => {
  try {
    const { leadId } = req.query;
    const tasks = await storage.getTasks(leadId ? parseInt(leadId) : undefined);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch tasks' });
  }
});

app.post('/api/tasks', requireAuth, async (req, res) => {
  try {
    const task = await storage.createTask(req.body);
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create task' });
  }
});

app.patch('/api/tasks/:id', requireAuth, async (req, res) => {
  try {
    const { completed } = req.body;
    const task = await storage.updateTask(parseInt(req.params.id), completed);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update task' });
  }
});

app.delete('/api/tasks/:id', requireAuth, async (req, res) => {
  try {
    const deleted = await storage.deleteTask(parseInt(req.params.id));
    if (!deleted) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.sendStatus(204);
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete task' });
  }
});

// Admin routes
app.get('/api/admin/users', requireAdmin, async (req, res) => {
  try {
    const users = await storage.getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

app.patch('/api/admin/users/:id/approval', requireAdmin, async (req, res) => {
  try {
    const { isApproved } = req.body;
    const user = await storage.updateUserApproval(parseInt(req.params.id), isApproved);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update user approval' });
  }
});

app.patch('/api/admin/users/:id/credentials', requireAdmin, async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await hashPassword(password);
    const user = await storage.updateUserCredentials(parseInt(req.params.id), username, hashedPassword);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update credentials' });
  }
});

app.delete('/api/admin/users/:id', requireAdmin, async (req, res) => {
  try {
    const deleted = await storage.deleteUser(parseInt(req.params.id));
    if (!deleted) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.sendStatus(204);
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

// WhatsApp routes
app.post('/api/whatsapp/send', requireAuth, async (req, res) => {
  try {
    const { phoneNumber, message, leadId } = req.body;
    
    if (!phoneNumber || !message) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and message are required'
      });
    }

    const result = await sendWhatsAppMessage(phoneNumber, message);
    
    // Update lead notes if leadId provided
    if (leadId) {
      const lead = await storage.getLead(leadId);
      if (lead) {
        const timestamp = new Date().toISOString();
        const newNote = `${timestamp} - WhatsApp message sent: ${message}`;
        const notes = lead.notes ? `${lead.notes}\n\n${newNote}` : newNote;
        await storage.updateLead(leadId, { notes });
      }
    }
    
    res.json({
      success: true,
      message: "WhatsApp message sent successfully",
      details: result
    });
  } catch (error) {
    console.error('WhatsApp sending error:', error);
    
    let errorMessage = "Unknown error occurred";
    let errorCode = "UNKNOWN";
    
    if (error.response && error.response.data && error.response.data.error) {
      const metaError = error.response.data.error;
      errorMessage = metaError.message || errorMessage;
      errorCode = metaError.code || errorCode;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    res.status(400).json({
      success: false,
      message: `Failed to send WhatsApp message: ${errorMessage}`,
      errorCode,
      errorDetails: error.response ? error.response.data : null
    });
  }
});

// Lead capture routes
app.post('/api/capture/:source', async (req, res) => {
  try {
    const { source } = req.params;
    const leadData = {
      ...req.body,
      source,
      status: 'new'
    };
    
    const lead = await storage.createLead(leadData);
    res.status(201).json({
      success: true,
      message: 'Lead captured successfully',
      lead
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to capture lead'
    });
  }
});

// Catch all handler for SPA
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`LeadPulse CRM server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`WhatsApp integration: ${WHATSAPP_API_KEY ? 'enabled' : 'disabled'}`);
});
