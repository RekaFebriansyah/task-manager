document.addEventListener('DOMContentLoaded', () => {
  const tableBody = document.getElementById('table-body');
  const searchInput = document.getElementById('search-input');
  const tabFilters = document.querySelectorAll('.tab-filter');
  const btnTabAdd = document.getElementById('btn-tab-add');
  const modalForm = document.getElementById('modal-form');
  const btnCancel = document.getElementById('btn-cancel');
  const addTaskForm = document.getElementById('add-task-form');

  let tasks = [];
  let currentStatusFilter = 'ditugaskan';
  let searchQuery = '';

  async function fetchTasks() {
    try {
      const response = await fetch('/api/tasks');
      tasks = await response.json();
      renderTable();
    } catch (err) {
      console.error('Gagal memuat tugas:', err);
    }
  }

  function renderTable() {
    tableBody.innerHTML = '';

    const filtered = tasks.filter(task => {
      const matchStatus = task.status === currentStatusFilter;
      const matchSearch =
        task.mata_kuliah.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.nama_tugas.toLowerCase().includes(searchQuery.toLowerCase());
      return matchStatus && matchSearch;
    });

    if (filtered.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="6" style="color: #444; padding: 20px;">Tidak ada data tugas</td></tr>`;
      return;
    }

    filtered.forEach((task, index) => {
      const tr = document.createElement('tr');
      const isSelesai = task.status === 'selesai';
      const badgeClass = isSelesai ? 'status-selesai' : 'status-ditugaskan';
      const statusLabel = isSelesai ? 'Selesai' : 'Ditugaskan';

      tr.innerHTML = `
        <td><b>${index + 1}</b></td>
        <td>${escapeHtml(task.mata_kuliah)}</td>
        <td>${escapeHtml(task.nama_tugas)}</td>
        <td>${escapeHtml(task.deadline || '-')}</td>
        <td>
          <span class="status-badge ${badgeClass}" onclick="toggleStatus(${task.id}, '${task.status}')">
            ${statusLabel}
          </span>
        </td>
        <td>
          <button class="btn-action" title="Edit" onclick="editTask(${task.id})">✏️</button>
          <button class="btn-action" title="Hapus" onclick="deleteTask(${task.id})">🗑️</button>
        </td>
      `;
      tableBody.appendChild(tr);
    });
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.innerText = text;
    return div.innerHTML;
  }

  tabFilters.forEach(btn => {
    btn.addEventListener('click', () => {
      tabFilters.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentStatusFilter = btn.dataset.status;
      renderTable();
    });
  });

  btnTabAdd.addEventListener('click', () => modalForm.classList.add('open'));
  btnCancel.addEventListener('click', () => modalForm.classList.remove('open'));

  addTaskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const mata_kuliah = document.getElementById('input-matkul').value.trim();
    const nama_tugas = document.getElementById('input-tugas').value.trim();
    const deadline = document.getElementById('input-deadline').value;

    if (!mata_kuliah || !nama_tugas) return;

    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mata_kuliah, nama_tugas, deadline })
    });

    addTaskForm.reset();
    modalForm.classList.remove('open');
    fetchTasks();
  });

  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderTable();
  });

  window.toggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'ditugaskan' ? 'selesai' : 'ditugaskan';
    await fetch(`/api/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus })
    });
    fetchTasks();
  };

  window.deleteTask = async (id) => {
    if (confirm('Yakin ingin menghapus tugas ini?')) {
      await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      fetchTasks();
    }
  };

  window.editTask = async (id) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const newMatkul = prompt('Edit Mata Kuliah:', task.mata_kuliah);
    const newTugas = prompt('Edit Nama Tugas:', task.nama_tugas);
    const newDeadline = prompt('Edit Deadline (YYYY-MM-DD):', task.deadline);

    if (newMatkul && newTugas) {
      await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mata_kuliah: newMatkul,
          nama_tugas: newTugas,
          deadline: newDeadline
        })
      });
      fetchTasks();
    }
  };

  fetchTasks();
});