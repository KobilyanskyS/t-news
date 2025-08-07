document.addEventListener('DOMContentLoaded', async () => {
  const headerLinks = document.querySelector('.header__links');
  if (!headerLinks) return;

  let user = null;
  try {
    const res = await fetch('http://localhost:3000/api/user', { credentials: 'include' });
    if (res.ok) user = await res.json();
  } catch {}

  if (user) {
    headerLinks.innerHTML = `
      <a href="#" class="header_links__link" id="logout-link"><p>Выйти </p><img width="24px" src="/src/images/arrow-in-right.svg" alt=""></a>
      <a href="/profile.html?userId=${encodeURIComponent(user.id)}" class="header_links__link"><img width="24px" src="/src/images/Profile.svg" alt=""></a>
    `;
    document.getElementById('logout-link').addEventListener('click', async (e) => {
      e.preventDefault();
      await fetch('http://localhost:3000/api/logout', { method: 'POST', credentials: 'include' });
      window.location.reload();
    });
  } else {
    headerLinks.innerHTML = `
      <a href="/register.html" id="reg" class="header_links__link"><p>Зарегистрироваться </p><img width="24px" src="/src/images/arrow-in-right.svg" alt=""></a>
      <a href="/login.html" class="header_links__link"><p>Войти </p><img width="24px" src="/src/images/arrow-in-right.svg" alt=""></a>
    `;
  }
});

