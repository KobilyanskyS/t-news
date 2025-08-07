// Главная страница
import { getCurrentUser, getFeedPosts, getPublicPosts, getUsers } from '../services/api.js';
import { createPostCardComponent } from '../components/postCard.js';

let allPosts = [];
let nextIndex = 0;
const PAGE_SIZE = 5;

function enrichPostsWithAuthors(posts, users) {
  const byId = new Map(users.map(u => [String(u.id), u]));
  return posts.map(p => {
    const author = byId.get(String(p.author_id));
    return {
      ...p,
      author_name: author?.name || 'Пользователь',
      author_avatar: author?.avatar || '/src/images/Profile.svg'
    };
  });
}

// Загрузка начальных постов
async function loadInitial() {
  const user = await getCurrentUser();
  const cards = document.querySelector('.cards');
  if (!cards) return;
  cards.innerHTML = '';

  let posts = await getFeedPosts();
  if (!user || !posts.length) {
    const [publicPosts, users] = await Promise.all([getPublicPosts(), getUsers()]);
    posts = enrichPostsWithAuthors(publicPosts, users);
  }
  allPosts = posts;
  nextIndex = 0;
  await renderMore(user);
}

// Загрузка дополнительных постов
async function renderMore(currentUser) {
  const cards = document.querySelector('.cards');
  if (!cards) return;
  let moreBtn = document.getElementById('load-more-posts');
  if (!moreBtn) {
    moreBtn = document.createElement('button');
    moreBtn.id = 'load-more-posts';
    moreBtn.className = 'button';
    Object.assign(moreBtn.style, { display: 'block', margin: '24px auto' });
    moreBtn.textContent = 'Загрузить ещё';
    moreBtn.addEventListener('click', () => renderMore(currentUser));
    cards.parentElement.appendChild(moreBtn);
  }
  const slice = allPosts.slice(nextIndex, nextIndex + PAGE_SIZE);
  for (const post of slice) {
    const card = createPostCardComponent(post, currentUser || null);
    cards.appendChild(card);
  }
  nextIndex += slice.length;
  moreBtn.style.display = nextIndex >= allPosts.length ? 'none' : 'block';
}

document.addEventListener('DOMContentLoaded', loadInitial);

