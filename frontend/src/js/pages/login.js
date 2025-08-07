// Страница входа
import { loginApi } from '../services/api.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form');
  const errorDiv = document.getElementById('login-error');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (errorDiv) { errorDiv.textContent = ''; errorDiv.classList.remove('active'); }
    const login = form.elements['login'].value;
    const password = form.elements['password'].value;
    const { success, error } = await loginApi(login, password);
    if (!success) {
      if (errorDiv) { errorDiv.textContent = (error && error.error) || 'Ошибка входа'; errorDiv.classList.add('active'); }
      return;
    }
    window.location.href = '/';
  });
});

