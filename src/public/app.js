const form = document.getElementById('taskForm');
const input = document.getElementById('title');
const tasks = document.getElementById('tasks');

async function loadTasks() {
  const res = await fetch('/tasks');
  const data = await res.json();

  tasks.innerHTML = '';

  data.forEach(task => {
    const li = document.createElement('li');

    li.innerHTML = `
      <span>${task.title}</span>
      <button onclick="deleteTask('${task._id}')">Delete</button>
    `;

    tasks.appendChild(li);
  });
}

form.addEventListener('submit', async e => {
  e.preventDefault();

  await fetch('/tasks', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({title: input.value})
  });

  input.value = '';
  loadTasks();
});

async function deleteTask(id) {
  await fetch('/tasks/' + id, {
    method: 'DELETE'
  });

  loadTasks();
}

loadTasks();
