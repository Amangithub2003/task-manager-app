let allTasks = [];
let currentFilter = 'all';

const form = document.getElementById('taskForm');
const input = document.getElementById('title');
const tasksContainer = document.getElementById('tasks');
const empty = document.getElementById('empty');

async function loadTasks() {
  try {
    const response = await fetch('/tasks');
    allTasks = await response.json();
    render();
  } catch (error) {
    console.error('Failed to load tasks:', error);
  }
}

function render() {
  updateStats();

  let filtered = allTasks;

  if (currentFilter === 'active') {
    filtered = allTasks.filter(task => !task.done);
  }

  if (currentFilter === 'completed') {
    filtered = allTasks.filter(task => task.done);
  }

  tasksContainer.innerHTML = '';

  if (filtered.length === 0) {
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';

  filtered.forEach(task => {
    const item = document.createElement('div');
    item.className = `task ${task.done ? 'done' : ''}`;

    const checkbox = document.createElement('button');
    checkbox.className = 'checkbox';
    checkbox.textContent = task.done ? '✓' : '';
    checkbox.onclick = () => toggleTask(task);

    const title = document.createElement('span');
    title.className = 'task-title';
    title.textContent = task.title;

    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete';
    deleteButton.textContent = '×';
    deleteButton.title = 'Delete task';
    deleteButton.onclick = () => deleteTask(task._id);

    item.appendChild(checkbox);
    item.appendChild(title);
    item.appendChild(deleteButton);

    tasksContainer.appendChild(item);
  });
}

function updateStats() {
  const total = allTasks.length;
  const completed = allTasks.filter(task => task.done).length;
  const pending = total - completed;

  document.getElementById('total').textContent = total;
  document.getElementById('pending').textContent = pending;
  document.getElementById('completed').textContent = completed;
}

form.addEventListener('submit', async event => {
  event.preventDefault();

  const title = input.value.trim();

  if (!title) return;

  await fetch('/tasks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ title })
  });

  input.value = '';
  await loadTasks();
  input.focus();
});

async function toggleTask(task) {
  await fetch(`/tasks/${task._id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      done: !task.done
    })
  });

  await loadTasks();
}

async function deleteTask(id) {
  await fetch(`/tasks/${id}`, {
    method: 'DELETE'
  });

  await loadTasks();
}

document.querySelectorAll('.filter').forEach(button => {
  button.addEventListener('click', () => {

    document.querySelectorAll('.filter')
      .forEach(btn => btn.classList.remove('active'));

    button.classList.add('active');

    currentFilter = button.dataset.filter;

    render();
  });
});

document.getElementById('clearCompleted').addEventListener('click', async () => {

  const completed = allTasks.filter(task => task.done);

  for (const task of completed) {
    await deleteTask(task._id);
  }

  await loadTasks();
});

loadTasks();
