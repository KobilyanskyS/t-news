document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form');
  const errorDiv = document.getElementById('login-error');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorDiv.textContent = '';
    errorDiv.classList.remove('active');
    const login = form.elements['login'].value;
    const password = form.elements['password'].value;
    try {
      const res = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password }),
        credentials: 'include'
      });
      if (!res.ok) {
        const data = await res.json();
        errorDiv.textContent = data.error || 'Ошибка входа';
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
