document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form');
  const errorDiv = document.getElementById('register-error');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorDiv.textContent = '';
    errorDiv.classList.remove('active');
    const login = form.elements['login'].value;
    const password = form.elements['password'].value;
    const passwordRepeat = form.elements['password_repeat'].value;
    const name = login;
    if (password !== passwordRepeat) {
      errorDiv.textContent = 'Пароли не совпадают';
      errorDiv.classList.add('active');
      return;
    }
    try {
      const res = await fetch('http://localhost:3000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password, name }),
        credentials: 'include'
      });
      if (!res.ok) {
        const data = await res.json();
        errorDiv.textContent = data.error || 'Ошибка регистрации';
        errorDiv.classList.add('active');
        return;
      }
      window.location.href = '/';
    } catch (err) {
      errorDiv.textContent = 'Ошибка сети';
      errorDiv.classList.add('active');
    }
  });
});
