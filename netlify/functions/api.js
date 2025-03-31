const express = require('express');
const serverless = require('serverless-http');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Directly define User model here to avoid path issues
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Task schema
const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'in-progress', 'completed'],
    default: 'pending' 
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  dueDate: { type: Date },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: { type: Date, default: Date.now }
});

// Client schema
const clientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String },
  additional_emails: { type: [String], default: [] },
  phone: { type: String },
  address: { type: String },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const clientCaseSchema = new mongoose.Schema({
  case_number: { type: String, required: true },
  case_name: { type: String },
  client_id: { type: String, required: true },
  description: { type: String },
  status: { type: String },
  home_address: { type: String },
  work_address: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const clientDocumentSchema = new mongoose.Schema({
  client_id: { type: String, required: true },
  case_number: { type: String },
  file_name: { type: String, required: true },
  file_path: { type: String, required: true },
  file_type: { type: String },
  file_size: { type: Number },
  description: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const serveAttemptSchema = new mongoose.Schema({
  client_id: { type: String, required: true },
  case_number: { type: String },
  status: { type: String, default: 'pending' },
  notes: { type: String },
  coordinates: { type: Object },
  timestamp: { type: Date, default: Date.now },
  image_data: { type: String },
  attempt_number: { type: Number, default: 1 }
});

// Models
const User = mongoose.model('User', userSchema);
const Task = mongoose.model('Task', taskSchema);
const Client = mongoose.model('Client', clientSchema);
const ClientCase = mongoose.model('ClientCase', clientCaseSchema);
const ClientDocument = mongoose.model('ClientDocument', clientDocumentSchema);
const ServeAttempt = mongoose.model('ServeAttempt', serveAttemptSchema);

// Initialize Express
const app = express();

// Connect to MongoDB
const connectDB = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || "mongodb://netlify_app:Crazy8809@143.198.119.28:27017/happyhelper?authSource=admin";
    
    const conn = await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
};

connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Auth middleware
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'abc123');
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ message: 'User not found, please log in again' });
      }
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, invalid token' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'abc123', {
    expiresIn: '30d',
  });
};

// USER ROUTES
app.post('/api/users/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const userExists = await User.findOne({ email });
    
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      username,
      email,
      password,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/users/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// TASK ROUTES
app.get('/api/tasks', protect, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user._id });
    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/tasks/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    res.json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/tasks', protect, async (req, res) => {
  try {
    const { title, description, priority, dueDate } = req.body;

    const task = await Task.create({
      title,
      description,
      priority,
      dueDate,
      userId: req.user._id,
    });

    res.status(201).json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/tasks/:id', protect, async (req, res) => {
  try {
    const { title, description, status, priority, dueDate } = req.body;
    
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    task.title = title || task.title;
    task.description = description || task.description;
    task.status = status || task.status;
    task.priority = priority || task.priority;
    task.dueDate = dueDate || task.dueDate;

    const updatedTask = await task.save();
    res.json(updatedTask);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/tasks/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await Task.deleteOne({ _id: req.params.id });
    res.json({ message: 'Task removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// CLIENT ROUTES
app.get('/api/clients', async (req, res) => {
  try {
    const clients = await Client.find().sort({ createdAt: -1 });
    res.json(clients);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/clients/:id', async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    res.json(client);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/clients', async (req, res) => {
  try {
    const client = await Client.create(req.body);
    res.status(201).json(client);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/clients/:id', async (req, res) => {
  try {
    const client = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    res.json(client);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/clients/:id', async (req, res) => {
  try {
    // First delete associated records
    await ClientCase.deleteMany({ client_id: req.params.id });
    await ClientDocument.deleteMany({ client_id: req.params.id });
    await ServeAttempt.deleteMany({ client_id: req.params.id });
    
    // Then delete the client
    const client = await Client.findByIdAndDelete(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    res.json({ message: 'Client deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// SERVE ATTEMPTS ROUTES 
app.get('/api/serves', async (req, res) => {
  try {
    const serves = await ServeAttempt.find().sort({ timestamp: -1 });
    res.json(serves);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/serves/client/:clientId', async (req, res) => {
  try {
    const serves = await ServeAttempt.find({ client_id: req.params.clientId }).sort({ timestamp: -1 });
    res.json(serves);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/serves', async (req, res) => {
  try {
    const serve = await ServeAttempt.create(req.body);
    res.status(201).json(serve);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/serves/:id', async (req, res) => {
  try {
    const serve = await ServeAttempt.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!serve) {
      return res.status(404).json({ message: 'Serve attempt not found' });
    }
    res.json(serve);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/serves/:id', async (req, res) => {
  try {
    const serve = await ServeAttempt.findByIdAndDelete(req.params.id);
    if (!serve) {
      return res.status(404).json({ message: 'Serve attempt not found' });
    }
    res.json({ message: 'Serve attempt deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DOCUMENT ROUTES
app.get('/api/documents/:clientId', async (req, res) => {
  try {
    const { caseNumber } = req.query;
    let query = { client_id: req.params.clientId };
    
    if (caseNumber) {
      query.case_number = caseNumber;
    }
    
    const documents = await ClientDocument.find(query).sort({ createdAt: -1 });
    
    // Get case names for documents
    const documents_with_cases = await Promise.all(documents.map(async (doc) => {
      let caseName = undefined;
      if (doc.case_number) {
        const caseData = await ClientCase.findOne({ 
          client_id: doc.client_id, 
          case_number: doc.case_number 
        });
        if (caseData) {
          caseName = caseData.case_name;
        }
      }
      return {
        id: doc._id,
        clientId: doc.client_id,
        fileName: doc.file_name,
        filePath: doc.file_path,
        fileType: doc.file_type,
        fileSize: doc.file_size,
        caseNumber: doc.case_number,
        description: doc.description,
        caseName
      };
    }));
    
    res.json(documents_with_cases);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/documents/upload/:clientId', async (req, res) => {
  try {
    // For netlify functions, file handling would need to be implemented with a storage solution
    // This is a simplified version
    const { clientId } = req.params;
    const { fileName, fileData, fileType, fileSize, caseNumber, description } = req.body;
    
    // In a real implementation, you would upload to a storage service here
    // and get back a file path or URL
    const filePath = `uploads/${clientId}/${fileName}`;
    
    const document = await ClientDocument.create({
      client_id: clientId,
      file_name: fileName,
      file_path: filePath,
      file_type: fileType,
      file_size: fileSize,
      case_number: caseNumber,
      description
    });
    
    res.status(201).json({
      id: document._id,
      clientId: document.client_id,
      fileName: document.file_name,
      filePath: document.file_path,
      fileType: document.file_type,
      fileSize: document.file_size,
      caseNumber: document.case_number,
      description: document.description
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/documents/url/:documentId', async (req, res) => {
  try {
    const document = await ClientDocument.findById(req.params.documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    // In a real implementation, you would generate a signed URL from your storage service
    // This is a placeholder
    const url = `https://yourdomain.com/files/${document.file_path}`;
    
    res.json({ url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/documents/:documentId', async (req, res) => {
  try {
    const document = await ClientDocument.findById(req.params.documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    // In a real implementation, you would delete the file from your storage service here
    
    await ClientDocument.findByIdAndDelete(req.params.documentId);
    res.json({ message: 'Document deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// CASE ROUTES
app.get('/api/cases/:clientId', async (req, res) => {
  try {
    const cases = await ClientCase.find({ client_id: req.params.clientId });
    res.json(cases);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/cases', async (req, res) => {
  try {
    const newCase = await ClientCase.create(req.body);
    res.status(201).json(newCase);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// EMAIL ROUTE
app.post('/api/email/send', async (req, res) => {
  try {
    // This would integrate with an email service in production
    console.log('Email would be sent with:', req.body);
    
    res.json({ 
      success: true, 
      message: 'Email sent successfully' 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Error sending email' 
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ message: 'Something broke!' });
});

// Export the serverless function
module.exports.handler = serverless(app);
