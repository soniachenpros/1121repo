// 待辦清單資料儲存在瀏覽器的 localStorage。
const STORAGE_KEY = 'root-todo-list';

const form = document.getElementById('todo-form');
const input = document.getElementById('todo-input');
const list = document.getElementById('todo-list');
const emptyState = document.getElementById('empty-state');
const remainingCount = document.getElementById('remaining-count');
const clearCompletedButton = document.getElementById('clear-completed');
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const themeLabel = document.getElementById('theme-label');
const filterButtons = document.querySelectorAll('.btn-filter');
const colorScheme = window.matchMedia('(prefers-color-scheme: dark)');
const THEME_STORAGE_KEY = 'root-todo-theme';
const FILTER_STORAGE_KEY = 'root-todo-filter';
const FILTER_VALUES = ['all', 'active', 'completed'];

let todos = loadTodos();
const savedFilter = localStorage.getItem(FILTER_STORAGE_KEY);
let activeFilter = FILTER_VALUES.includes(savedFilter) ? savedFilter : 'all';
const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
let selectedTheme = savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : null;

// 從 localStorage 載入清單；資料不存在或格式錯誤時以空清單開始。
function loadTodos() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('讀取待辦清單失敗，將以空清單開始。', error);
    return [];
  }
}

// 將目前清單儲存至 localStorage。
function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

// 依照目前資料更新清單、空狀態提示與未完成數量。
function render() {
  list.replaceChildren();

  const visibleTodos = todos.filter((todo) => {
    if (activeFilter === 'active') return !todo.completed;
    if (activeFilter === 'completed') return todo.completed;
    return true;
  });

  visibleTodos.forEach((todo) => {
    const item = document.createElement('li');
    item.className = todo.completed ? 'todo-item completed' : 'todo-item';
    item.dataset.id = todo.id;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = todo.completed;
    checkbox.setAttribute('aria-label', `標記「${todo.text}」為完成`);

    const text = document.createElement('span');
    text.className = 'todo-text';
    text.textContent = todo.text;

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'btn-delete';
    deleteButton.textContent = '刪除';
    deleteButton.setAttribute('aria-label', `刪除「${todo.text}」`);

    item.append(checkbox, text, deleteButton);
    list.append(item);
  });

  emptyState.hidden = visibleTodos.length > 0;
  if (activeFilter === 'active') {
    emptyState.textContent = '沒有未完成的待辦事項。';
  } else if (activeFilter === 'completed') {
    emptyState.textContent = '目前沒有已完成的事項。取消勾選的項目並未刪除，切換至「全部」或「未完成」即可查看。';
  } else {
    emptyState.textContent = '還沒有任何待辦事項,新增一個吧!';
  }

  const remaining = todos.filter((todo) => !todo.completed).length;
  remainingCount.textContent = `未完成:${remaining} 項`;
  clearCompletedButton.disabled = !todos.some((todo) => todo.completed);
}

// 依照目前篩選條件更新按鈕的選取狀態。
function updateFilterButtons() {
  filterButtons.forEach((button) => {
    const isActive = button.dataset.filter === activeFilter;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
}

// 套用手動選擇的主題；沒有選擇時由 CSS 跟隨系統設定。
function updateTheme() {
  if (selectedTheme) {
    document.documentElement.dataset.theme = selectedTheme;
  } else {
    delete document.documentElement.dataset.theme;
  }

  const isDark = selectedTheme
    ? selectedTheme === 'dark'
    : colorScheme.matches;
  themeIcon.textContent = isDark ? '☀️' : '🌙';
  themeLabel.textContent = isDark ? '淺色模式' : '深色模式';
  themeToggle.setAttribute('aria-label', isDark ? '切換為淺色模式' : '切換為深色模式');
}

// 以時間戳記與隨機字串建立待辦事項識別碼。
function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

themeToggle.addEventListener('click', () => {
  const isDark = selectedTheme
    ? selectedTheme === 'dark'
    : colorScheme.matches;
  selectedTheme = isDark ? 'light' : 'dark';
  localStorage.setItem(THEME_STORAGE_KEY, selectedTheme);
  updateTheme();
});

colorScheme.addEventListener('change', () => {
  if (!selectedTheme) updateTheme();
});

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const selectedFilter = button.dataset.filter;
    if (!FILTER_VALUES.includes(selectedFilter)) return;

    activeFilter = selectedFilter;
    localStorage.setItem(FILTER_STORAGE_KEY, activeFilter);
    updateFilterButtons();
    render();
  });
});

clearCompletedButton.addEventListener('click', () => {
  if (!todos.some((todo) => todo.completed)) return;
  if (!window.confirm('確定要清除所有已完成的待辦事項嗎？')) return;

  todos = todos.filter((todo) => !todo.completed);
  saveTodos();
  render();
});

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const text = input.value.trim();
  if (!text) return;

  todos.push({ id: createId(), text, completed: false });
  saveTodos();
  render();
  form.reset();
  input.focus();
});

list.addEventListener('click', (event) => {
  const target = event.target;
  const item = target.closest('.todo-item');
  if (!item) return;

  const { id } = item.dataset;
  if (target.matches('input[type="checkbox"]')) {
    todos = todos.map((todo) =>
      todo.id === id ? { ...todo, completed: target.checked } : todo
    );
  } else if (target.matches('.btn-delete')) {
    todos = todos.filter((todo) => todo.id !== id);
  } else {
    return;
  }

  saveTodos();
  render();
});

updateTheme();
updateFilterButtons();
render();
