// Страница регистрации
import { registerApi } from '../services/api.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form');
  const errorDiv = document.getElementById('register-error');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (errorDiv) { errorDiv.textContent = ''; errorDiv.classList.remove('active'); }
    const login = form.elements['login'].value;
    const password = form.elements['password'].value;
    const passwordRepeat = form.elements['password_repeat'].value;
    const name = login;
    if (password !== passwordRepeat) {
      if (errorDiv) { errorDiv.textContent = 'Пароли не совпадают'; errorDiv.classList.add('active'); }
      return;
    }
    const { success, error } = await registerApi(login, password, name);
    if (!success) {
      if (errorDiv) { errorDiv.textContent = (error && error.error) || 'Ошибка регистрации'; errorDiv.classList.add('active'); }
      return;
    }
    window.location.href = '/';
  });
});

