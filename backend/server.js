const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

// Initialize the Express application
const app = express();
const port = process.env.PORT || 3001;

// Enable CORS for the Netlify frontend URL
const corsOptions = {
  origin: 'https://guileless-sorbet-d35df4.netlify.app',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};
app.use(cors(corsOptions));

// Set up body-parser to parse JSON body requests
app.use(bodyParser.json());

// Initialize SQLite database
const db = new sqlite3.Database(':memory:', (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Connected to the in-memory SQLite database.');
});

// Set up database tables
db.serialize(() => {
  db.run('CREATE TABLE columns (id INTEGER PRIMARY KEY, title TEXT)');
  db.run('CREATE TABLE cards (id INTEGER PRIMARY KEY, title TEXT, description TEXT, columnId INTEGER, FOREIGN KEY(columnId) REFERENCES columns(id))');
});

// Define API endpoints
// Endpoint for creating a new card
app.post('/cards', (req, res) => {
  console.log('POST /cards', req.body);
  const { title, description, columnId } = req.body;
  const stmt = db.prepare('INSERT INTO cards (title, description, columnId) VALUES (?, ?, ?)');
  stmt.run(title, description, columnId, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.status(201).json({ id: this.lastID, title, description, columnId });
  });
  stmt.finalize();
});

// Endpoint for updating a card
app.put('/cards/:id', (req, res) => {
  console.log('PUT /cards/:id', req.params.id, req.body);
  const { title, description, columnId } = req.body;
  const stmt = db.prepare('UPDATE cards SET title = ?, description = ?, columnId = ? WHERE id = ?');
  stmt.run(title, description, columnId, req.params.id, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Card not found' });
      return;
    }
    res.status(200).json({ id: req.params.id, title, description, columnId });
  });
  stmt.finalize();
});

// Endpoint for moving a card
app.put('/cards/:id/move', (req, res) => {
  console.log('PUT /cards/:id/move', req.params.id, req.body);
  const { columnId } = req.body;
  const stmt = db.prepare('UPDATE cards SET columnId = ? WHERE id = ?');
  stmt.run(columnId, req.params.id, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Card not found' });
      return;
    }
    res.status(200).json({ id: req.params.id, columnId });
  });
  stmt.finalize();
});

// Endpoint for creating a new column
app.post('/columns', (req, res) => {
  console.log('POST /columns', req.body);
  const { title } = req.body;
  const stmt = db.prepare('INSERT INTO columns (title) VALUES (?)');
  stmt.run(title, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.status(201).json({ id: this.lastID, title });
  });
  stmt.finalize();
});

// Endpoint for updating a column
app.put('/columns/:id', (req, res) => {
  console.log('PUT /columns/:id', req.params.id, req.body);
  const { title } = req.body;
  const stmt = db.prepare('UPDATE columns SET title = ? WHERE id = ?');
  stmt.run(title, req.params.id, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Column not found' });
      return;
    }
    res.status(200).json({ id: req.params.id, title });
  });
  stmt.finalize();
});

// Endpoint to get all columns
app.get('/columns', (req, res) => {
  console.log('GET /columns');
  db.all('SELECT * FROM columns', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.status(200).json({ columns: rows });
  });
});

// Endpoint to get all cards
app.get('/cards', (req, res) => {
  console.log('GET /cards');
  db.all('SELECT * FROM cards', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.status(200).json({ cards: rows });
  });
});

// Start the Express server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
