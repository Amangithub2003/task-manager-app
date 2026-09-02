const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const tasksRouter = require('./routes/tasks');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/taskmanager';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
// Liveness/readiness endpoints — used by Kubernetes probes
app.get('/healthz', (req, res) => res.status(200).json({ status: 'ok' }));
app.get('/readyz', (req, res) => {
  const ready = mongoose.connection.readyState === 1;
  res.status(ready ? 200 : 503).json({ ready });
});

app.use('/tasks', tasksRouter);

async function start() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  }

  app.listen(PORT, () => console.log(`Task Manager API listening on port ${PORT}`));
}

start();

module.exports = app;
