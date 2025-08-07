// Страница управления профилем пользователя
import { getCurrentUser, getUsers, getFeedPosts, getUserPosts, createPostApi, deletePostApi, updateUserName, updateUserAbout, uploadAvatar, subscribeApi } from '../services/api.js';
import { createPostCardComponent } from '../components/postCard.js';

// Получение ID пользователя из URL
function getUserIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('userId');
}

// Создание элемента
function el(tag, className, html) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (html != null) e.innerHTML = html;
  return e;
}

// Рендеринг блока профиля
function renderProfileBlock(user, isCurrentUser) {
  const root = document.getElementById('profile-root');
  if (!root) return;
  root.innerHTML = `
    <div class="profile">
      <div class="profile__image-block">
        <div class="profile__avatar">
          <img src="${user.avatar || '/Profile.svg'}" alt="" class="profile__avatar-image">
        </div>
        ${isCurrentUser ? '<button class="profile__change_avatar_btn">Изменить фото</button><input type="file" accept="image/*" id="profile-avatar-input" style="display:none">' : ''}
      </div>
      <div class="profile__info-block">
        <div class="profile__name-block">
          <h1 class="profile__name">${user.name || 'Пользователь'}</h1>
          ${isCurrentUser ? '<button class="profile__edit-name-btn" title="Редактировать имя" style="background:none;border:none;padding:0;cursor:pointer;"><img src="/edit.svg" alt="" class="profile__edit-name" width="24px"></button>' : ''}
        </div>
        <div class="profile__about-block">
          <p class="profile__about">${user.about ? 'Обо мне: ' + user.about : ''}</p>
          ${isCurrentUser ? '<button class="profile__edit-about-btn" title="Редактировать обо мне" style="background:none;border:none;padding:0;cursor:pointer;"><img src="/edit.svg" alt="" class="profile__edit-about" width="16px"></button>' : ''}
        </div>
      </div>
      <div class="profile__subscribe-block">
        ${!isCurrentUser ? '<button class="profile__subscribe-button">Подписаться</button>' : ''}
      </div>
    </div>
  `;
}

// Инициализация загрузки аватара
function initAvatarUpload() {
  const avatarBtn = document.querySelector('.profile__change_avatar_btn');
  const fileInput = document.getElementById('profile-avatar-input');
  if (!avatarBtn || !fileInput) return;
  avatarBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    const imgEl = document.querySelector('.profile__avatar-image');
    try {
      const originalDataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const compressedDataUrl = await new Promise((resolve) => {
        const image = new Image();
        image.onload = () => {
          const maxSide = 512; let { width, height } = image;
          const ratio = Math.max(width, height) / maxSide;
          if (ratio > 1) { width = Math.round(width / ratio); height = Math.round(height / ratio); }
          const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        image.onerror = () => resolve(originalDataUrl);
        image.src = originalDataUrl;
      });
      const avatar = await uploadAvatar(compressedDataUrl);
      if (avatar && imgEl) imgEl.src = avatar;
    } finally {
      fileInput.value = '';
    }
  });
}

// Инициализация редактирования имени
function initInlineNameEdit() {
  const nameBlock = document.querySelector('.profile__name-block');
  const editBtn = document.querySelector('.profile__edit-name-btn');
  if (!nameBlock || !editBtn) return;
  editBtn.addEventListener('click', () => {
    const h1 = nameBlock.querySelector('.profile__name');
    const oldName = h1.textContent;
    h1.style.display = 'none'; editBtn.style.display = 'none';
    const input = el('input', 'profile__name-input');
    Object.assign(input, { type: 'text', value: oldName });
    Object.assign(input.style, { fontSize: '2rem', marginRight: '8px', padding: '4px 8px', border: '1px solid #ccc', borderRadius: '6px' });
    const saveBtn = el('button', null, '<img src="/ok.svg" alt="Сохранить" width="24px">');
    saveBtn.title = 'Сохранить'; Object.assign(saveBtn.style, { background: 'none', border: 'none', cursor: 'pointer' });
    nameBlock.insertBefore(input, h1); nameBlock.insertBefore(saveBtn, h1); input.focus();
    const finish = async (cancel) => {
      input.remove(); saveBtn.remove(); h1.style.display = ''; editBtn.style.display = '';
      if (cancel) return;
      const newName = input.value.trim();
      if (newName && newName !== oldName) {
        h1.textContent = newName; await updateUserName(newName);
      }
    };
    saveBtn.addEventListener('click', () => finish(false));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); finish(false); }
      if (e.key === 'Escape') { e.preventDefault(); finish(true); }
    });
    input.addEventListener('blur', () => setTimeout(() => { if (document.activeElement !== saveBtn) finish(false); }, 200));
  });
}

// Инициализация редактирования обо мне
function initInlineAboutEdit() {
  const aboutBlock = document.querySelector('.profile__about-block');
  const editBtn = document.querySelector('.profile__edit-about-btn');
  if (!aboutBlock || !editBtn) return;
  editBtn.addEventListener('click', () => {
    const p = aboutBlock.querySelector('.profile__about');
    const oldAbout = p.textContent.replace(/^Обо мне: /, '');
    p.style.display = 'none'; editBtn.style.display = 'none';
    aboutBlock.classList.add('editing-about');
    const textarea = el('textarea', 'profile__about-textarea');
    textarea.value = oldAbout;
    // Форма редактирования обо мне
    const blockRect = aboutBlock.getBoundingClientRect();
    Object.assign(textarea.style, {
      width: '100%',
      boxSizing: 'border-box',
      marginRight: '8px',
      padding: '6px 10px',
      border: '1px solid #ccc',
      borderRadius: '6px',
      fontSize: '1rem',
      resize: 'vertical',
      minHeight: Math.max(80, Math.round(blockRect.height)) + 'px',
      flex: '1 1 auto',
      display: 'block'
    });
    const saveBtn = el('button', null, '<img src="/ok.svg" alt="Сохранить" width="16px">');
    saveBtn.title = 'Сохранить'; Object.assign(saveBtn.style, { background: 'none', border: 'none', cursor: 'pointer' });
    aboutBlock.insertBefore(textarea, p); aboutBlock.insertBefore(saveBtn, p); textarea.focus();
    const finish = async (cancel) => {
      textarea.remove(); saveBtn.remove(); p.style.display = ''; editBtn.style.display = ''; aboutBlock.classList.remove('editing-about');
      if (cancel) return;
      const newAbout = textarea.value.trim();
      if (newAbout !== oldAbout) {
        p.textContent = newAbout ? 'Обо мне: ' + newAbout : '';
        await updateUserAbout(newAbout);
      }
    };
    saveBtn.addEventListener('click', () => finish(false));
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); finish(false); }
      if (e.key === 'Escape') { e.preventDefault(); finish(true); }
    });
    textarea.addEventListener('blur', () => setTimeout(() => { if (document.activeElement !== saveBtn) finish(false); }, 200));
  });
}

// Рендеринг страницы профиля
async function renderProfilePage() {
  const currentUser = await getCurrentUser();
  const users = await getUsers();
  const userId = getUserIdFromUrl() || (currentUser && currentUser.id);
  const user = users.find(u => String(u.id) === String(userId)) || currentUser;
  if (!user) return;
  const isCurrentUser = currentUser && String(currentUser.id) === String(user.id);

  renderProfileBlock(user, isCurrentUser);
  initAvatarUpload();
  initInlineNameEdit();
  initInlineAboutEdit();
  // Подписки
  if (!isCurrentUser) {
    const btn = document.querySelector('.profile__subscribe-button');
    if (btn) {
      if (!currentUser) {
        btn.textContent = 'Войти, чтобы подписаться';
        btn.addEventListener('click', (e) => { e.preventDefault(); window.location.href = '/login.html'; });
      } else {
        const getIsSubscribed = async () => {
          const all = await getUsers();
          const me = all.find(u => String(u.id) === String(currentUser.id));
          const subs = Array.isArray(me?.subscriptions) ? me.subscriptions.map(String) : [];
          return subs.includes(String(user.id));
        };
        const updateBtn = async () => {
          btn.disabled = true;
          const isSub = await getIsSubscribed();
          btn.textContent = isSub ? 'Отписаться' : 'Подписаться';
          btn.classList.toggle('subscribed', isSub);
          btn.disabled = false;
          return isSub;
        };
        let isSubscribed = await updateBtn();
        btn.addEventListener('click', async () => {
          btn.disabled = true;
          const action = isSubscribed ? 'unsubscribe' : 'subscribe';
          try { await subscribeApi(user.id, action); }
          finally { isSubscribed = await updateBtn(); }
        });
      }
    }
  }

  // Форма создания поста
  const postForm = document.querySelector('.post-form');
  if (postForm) postForm.style.display = isCurrentUser ? '' : 'none';

  // Карточки постов
  const cards = document.querySelector('.cards');
  if (cards) {
    cards.innerHTML = '';
    let userPosts = [];
    if (isCurrentUser) {
      const all = await getFeedPosts();
      userPosts = all.filter(p => String(p.author_id) === String(user.id));
    } else {
      userPosts = await getUserPosts(user.id);
    }
    for (const post of userPosts) {
      const card = createPostCardComponent(post, currentUser);
      if (isCurrentUser) {
        const deleteBtn = el('button', 'post-delete-btn', '<img src="/delete.svg" alt="Удалить" style="width:16px;height:16px;vertical-align:middle;">');
        Object.assign(deleteBtn.style, { marginLeft: '8px', background: 'none', border: 'none', cursor: 'pointer', color: 'gray' });
        deleteBtn.title = 'Удалить пост';
        deleteBtn.addEventListener('click', async (e) => {
          e.preventDefault(); deleteBtn.disabled = true;
          try { if (await deletePostApi(post.id)) card.remove(); } finally { deleteBtn.disabled = false; }
        });
        const footer = card.querySelector('.card__footer');
        if (footer) footer.appendChild(deleteBtn);
      }
      cards.appendChild(card);
    }
  }

  // Создание поста
  if (isCurrentUser && postForm) {
    postForm.onsubmit = async (e) => {
      e.preventDefault();
      const textarea = postForm.querySelector('textarea');
      const content = (textarea.value || '').trim();
      if (!content) return;
      postForm.querySelector('input[type="submit"]').disabled = true;
      try {
        const newPost = await createPostApi(content);
        if (newPost) {
          const card = createPostCardComponent(newPost, user);
          const footer = card.querySelector('.card__footer');
          if (footer) {
            const deleteBtn = el('button', 'post-delete-btn', '<img src="/delete.svg" alt="Удалить" style="width:16px;height:16px;vertical-align:middle;">');
            Object.assign(deleteBtn.style, { marginLeft: '8px', background: 'none', border: 'none', cursor: 'pointer', color: 'gray' });
            deleteBtn.addEventListener('click', async (e) => {
              e.preventDefault(); deleteBtn.disabled = true;
              try { if (await deletePostApi(newPost.id)) card.remove(); } finally { deleteBtn.disabled = false; }
            });
            footer.appendChild(deleteBtn);
          }
          if (cards) cards.insertBefore(card, cards.firstChild);
          textarea.value = '';
        }
      } finally {
        postForm.querySelector('input[type="submit"]').disabled = false;
      }
    };
  }
}

document.addEventListener('DOMContentLoaded', renderProfilePage);

