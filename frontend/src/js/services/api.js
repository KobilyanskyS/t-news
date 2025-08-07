// Сервис API для взаимодействия с сервером
const API_BASE = 'http://localhost:3000';

// Функция для построения опций запроса
function buildJsonOptions(method, body) {
  return {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined
  };
}

// Получение текущего пользователя
export async function getCurrentUser() {
  let user = null;
  try {
    const res = await fetch(`${API_BASE}/api/user`, { credentials: 'include' });
    if (res.ok) user = await res.json();
  } catch {}
  return user;
}

// Получение всех пользователей
export async function getUsers() {
  let users = [];
  try {
    const res = await fetch(`${API_BASE}/users.json`);
    if (res.ok) users = await res.json();
  } catch {}
  return users;
}

// Получение постов для ленты
export async function getFeedPosts() {
  let posts = [];
  try {
    const res = await fetch(`${API_BASE}/api/posts`, { credentials: 'include' });
    if (res.ok) posts = await res.json();
  } catch {}
  return posts;
}

// Получение публичных постов
export async function getPublicPosts() {
  let posts = [];
  try {
    const res = await fetch(`${API_BASE}/posts.json`);
    if (res.ok) posts = await res.json();
  } catch {}
  return posts;
}

// Получение постов пользователя
export async function getUserPosts(userId) {
  let posts = [];
  try {
    const res = await fetch(`${API_BASE}/api/user/${encodeURIComponent(userId)}/posts`);
    if (res.ok) posts = await res.json();
  } catch {}
  return posts;
}

// Переключение лайка
export async function toggleLikeApi(postId) {
  let likes = null;
  try {
    const res = await fetch(`${API_BASE}/api/likes`, buildJsonOptions('POST', { postId }));
    if (res.ok) {
      const data = await res.json();
      likes = data.likes || [];
    }
  } catch {}
  return likes;
}

// Добавление комментария
export async function addCommentApi(postId, content) {
  let result = null;
  try {
    const res = await fetch(`${API_BASE}/api/comments`, buildJsonOptions('POST', { postId, content }));
    if (res.ok) result = await res.json();
  } catch {}
  return result;
}

// Удаление комментария
export async function deleteCommentApi(commentId) {
  let success = false;
  try {
    const res = await fetch(`${API_BASE}/api/comments/${commentId}`, { method: 'DELETE', credentials: 'include' });
    success = res.ok;
  } catch {}
  return success;
}

// Создание поста
export async function createPostApi(content) {
  let newPost = null;
  try {
    const res = await fetch(`${API_BASE}/api/posts`, buildJsonOptions('POST', { content }));
    if (res.ok) newPost = await res.json();
  } catch {}
  return newPost;
}

// Удаление поста
export async function deletePostApi(postId) {
  let success = false;
  try {
    const res = await fetch(`${API_BASE}/api/posts/${postId}`, { method: 'DELETE', credentials: 'include' });
    success = res.ok;
  } catch {}
  return success;
}

// Обновление имени пользователя
export async function updateUserName(name) {
  let success = false;
  try {
    const res = await fetch(`${API_BASE}/api/user/name`, buildJsonOptions('PATCH', { name }));
    success = res.ok;
  } catch {}
  return success;
}

// Обновление обо мне пользователя
export async function updateUserAbout(about) {
  let success = false;
  try {
    const res = await fetch(`${API_BASE}/api/user/about`, buildJsonOptions('PATCH', { about }));
    success = res.ok;
  } catch {}
  return success;
}

// Загрузка аватара пользователя
export async function uploadAvatar(dataUrl) {
  let avatar = null;
  try {
    const res = await fetch(`${API_BASE}/api/user/avatar`, buildJsonOptions('POST', { dataUrl }));
    if (res.ok) {
      const data = await res.json();
      avatar = data.avatar || null;
    }
  } catch {}
  return avatar;
}

// Поиск пользователей и постов
export async function searchApi(query) {
  let result = { users: [], posts: [] };
  try {
    const res = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(query)}`, { credentials: 'include' });
    if (res.ok) result = await res.json();
  } catch {}
  return result;
}

// Подписка на пользователя
export async function subscribeApi(targetId, action) {
  let success = false;
  try {
    const res = await fetch(`${API_BASE}/api/subscribe`, buildJsonOptions('POST', { targetId, action }));
    success = res.ok;
  } catch {}
  return success;
}

// Вход в систему
export async function loginApi(login, password) {
  let success = false, error = null;
  try {
    const res = await fetch(`${API_BASE}/api/login`, buildJsonOptions('POST', { login, password }));
    success = res.ok;
    if (!success) error = await res.json().catch(() => ({}));
  } catch (e) { error = { error: 'Ошибка сети' }; }
  return { success, error };
}

// Регистрация пользователя
export async function registerApi(login, password, name) {
  let success = false, error = null;
  try {
    const res = await fetch(`${API_BASE}/api/register`, buildJsonOptions('POST', { login, password, name }));
    success = res.ok;
    if (!success) error = await res.json().catch(() => ({}));
  } catch (e) { error = { error: 'Ошибка сети' }; }
  return { success, error };
}

// Выход из системы
export async function logoutApi() {
  let success = false;
  try {
    const res = await fetch(`${API_BASE}/api/logout`, { method: 'POST', credentials: 'include' });
    success = res.ok;
  } catch {}
  return success;
}
