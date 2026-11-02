const express = require('express');
const cors = require('cors');
const path = require('path');
const { DatabaseSync } = require('node:sqlite'); // Module SQLite Bawaan Node.js v26

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Inisialisasi Database SQLite
const db = new DatabaseSync('./tasks.db');

// Buat Tabel Utama jika belum ada
db.exec(`CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mata_kuliah TEXT NOT NULL,
  nama_tugas TEXT NOT NULL,
  deadline TEXT,
  status TEXT DEFAULT 'ditugaskan'
)`);

console.log('Terhubung ke database SQLite bawaan Node.js (tasks.db).');

// GET: Ambil semua tugas
app.get('/api/tasks', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM tasks ORDER BY id DESC');
    const rows = stmt.all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST: Tambah tugas baru
app.post('/api/tasks', (req, res) => {
  const { mata_kuliah, nama_tugas, deadline } = req.body;
  if (!mata_kuliah || !nama_tugas) {
    return res.status(400).json({ message: 'Mata Kuliah dan Nama Tugas wajib diisi' });
  }

  try {
    const stmt = db.prepare('INSERT INTO tasks (mata_kuliah, nama_tugas, deadline, status) VALUES (?, ?, ?, ?)');
    const result = stmt.run(mata_kuliah, nama_tugas, deadline || '-', 'ditugaskan');
    res.status(201).json({
      id: Number(result.lastInsertRowid),
      mata_kuliah,
      nama_tugas,
      deadline: deadline || '-',
      status: 'ditugaskan'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT: Ubah Status / Edit Tugas
app.put('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const { status, mata_kuliah, nama_tugas, deadline } = req.body;

  try {
    if (status) {
      const stmt = db.prepare('UPDATE tasks SET status = ? WHERE id = ?');
      stmt.run(status, id);
      res.json({ id: parseInt(id), status });
    } else if (mata_kuliah && nama_tugas) {
      const stmt = db.prepare('UPDATE tasks SET mata_kuliah = ?, nama_tugas = ?, deadline = ? WHERE id = ?');
      stmt.run(mata_kuliah, nama_tugas, deadline || '-', id);
      res.json({ id: parseInt(id), mata_kuliah, nama_tugas, deadline });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE: Hapus tugas
app.delete('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  try {
    const stmt = db.prepare('DELETE FROM tasks WHERE id = ?');
    stmt.run(id);
    res.json({ message: 'Tugas berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server berjalan lancar di http://localhost:3000`);
});