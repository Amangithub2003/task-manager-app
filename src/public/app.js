let allTasks = [];
let currentFilter = 'all';

const form = document.getElementById('taskForm');
const input = document.getElementById('taskInput');
const tasksContainer = document.getElementById('taskList');

async function loadTasks() {
  try {
    const response = await fetch('/tasks');

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

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
    tasksContainer.innerHTML =
      '<div class="empty">No tasks found 🎉</div>';
    return;
  }

  filtered.forEach(task => {
    const item = document.createElement('div');
    item.className = `task ${task.done ? 'done' : ''}`;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-check';
    checkbox.checked = task.done;

    checkbox.addEventListener('change', () => {
      toggleTask(task);
    });

    const title = document.createElement('span');
    title.className = 'task-title';
    title.textContent = task.title;

    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-btn';
    deleteButton.textContent = '×';
    deleteButton.title = 'Delete task';

    deleteButton.addEventListener('click', () => {
      deleteTask(task._id);
    });

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

  document.getElementById('totalTasks').textContent = total;
  document.getElementById('pendingTasks').textContent = pending;
  document.getElementById('completedTasks').textContent = completed;

  const percent = total === 0
    ? 0
    : Math.round((completed / total) * 100);

  document.getElementById('progressPercent').textContent = `${percent}%`;
  document.getElementById('progressText').textContent =
    `${percent}% completed`;

  document.getElementById('progressFill').style.width = `${percent}%`;
}

form.addEventListener('submit', async event => {
  event.preventDefault();

  const title = input.value.trim();

  if (!title) return;

  try {
    const response = await fetch('/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    input.value = '';

    await loadTasks();

    input.focus();
  } catch (error) {
    console.error('Failed to add task:', error);
  }
});

async function toggleTask(task) {
  try {
    const response = await fetch(`/tasks/${task._id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        done: !task.done
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    await loadTasks();
  } catch (error) {
    console.error('Failed to update task:', error);
  }
}

async function deleteTask(id) {
  try {
    const response = await fetch(`/tasks/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok && response.status !== 204) {
      throw new Error(`HTTP ${response.status}`);
    }

    await loadTasks();
  } catch (error) {
    console.error('Failed to delete task:', error);
  }
}

document.querySelectorAll('.filter').forEach(button => {
  button.addEventListener('click', () => {
    document
      .querySelectorAll('.filter')
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
