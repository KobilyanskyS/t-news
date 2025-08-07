// Страница поиска
import { getCurrentUser, searchApi } from '../services/api.js';
import { createPostCardComponent } from '../components/postCard.js';

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const query = (urlParams.get('search') || '').trim();
  const postsBlock = document.querySelector('.cards');
  const usersBlock = document.querySelector('.users');
  const filterBtns = document.querySelectorAll('.filter__button');
  if (!postsBlock || !usersBlock) return;

  let mode = 'posts';
  filterBtns.forEach((btn, idx) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      mode = idx === 1 ? 'posts' : 'users';
      render();
    });
  });

  // Поиск постов и пользователей
  let users = [], posts = [];
  if (query) {
    const data = await searchApi(query);
    users = data.users || [];
    posts = data.posts || [];
  }

  const currentUser = await getCurrentUser();

  // Рендеринг постов и пользователей
  async function render() {
    postsBlock.style.display = mode === 'posts' ? '' : 'none';
    usersBlock.style.display = mode === 'users' ? '' : 'none';
    if (mode === 'posts') {
      postsBlock.innerHTML = '';
      if (!posts.length) {
        postsBlock.innerHTML = '<div style="padding:2rem; color:gray;">Посты не найдены</div>';
        return;
      }
      for (const post of posts) postsBlock.appendChild(createPostCardComponent(post, currentUser || null));
    } else {
      usersBlock.innerHTML = '';
      if (!users.length) {
        usersBlock.innerHTML = '<div style="padding:2rem; color:gray;">Пользователи не найдены</div>';
        return;
      }
      users.forEach(u => {
        const a = document.createElement('a');
        a.className = 'user';
        a.href = `/profile.html?userId=${encodeURIComponent(u.id)}`;
        a.innerHTML = `
          <div class="user__img"><img src="${u.avatar || '/src/images/Profile.svg'}" alt=""></div>
          <h3 class="user__name">${u.name || 'Пользователь'}</h3>
        `;
        usersBlock.appendChild(a);
      });
    }
  }

  await render();
});

