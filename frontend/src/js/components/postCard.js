// Компонент карточки поста
import { toggleLikeApi, addCommentApi, deleteCommentApi, getUsers } from '../services/api.js';

function createElement(tag, className, html) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (html != null) el.innerHTML = html;
  return el;
}

function renderHeader(post) {
  const header = createElement('div', 'card__header');
  const imgDiv = createElement('div', 'card__img', `<img src="${post.author_avatar || '/Profile.svg'}" alt="">`);
  const nameLink = createElement('a', 'card__name');
  nameLink.textContent = post.author_name || 'Пользователь';
  nameLink.href = `/profile.html?userId=${encodeURIComponent(post.author_id)}`;
  header.append(imgDiv, nameLink);
  return header;
}

function renderFooter(post, currentUser, onLike) {
  const footer = createElement('div', 'card__footer');
  const likesArr = Array.isArray(post.likes) ? post.likes : [];
  const isLiked = currentUser && likesArr.some(id => String(id) === String(currentUser.id));
  const likeBtn = createElement('button', `card__button${isLiked ? ' card__button__like' : ''}`, `
    <img src="/Heart.svg" alt="" class="card__button__img">
    <span class="card__button__likes-counter">${likesArr.length}</span>
  `);
  likeBtn.addEventListener('click', async () => {
    if (!currentUser) {
      alert('Чтобы ставить лайки, пожалуйста, войдите или зарегистрируйтесь.');
      return;
    }
    likeBtn.disabled = true;
    try {
      const likes = await toggleLikeApi(post.id);
      if (likes) {
        const counter = likeBtn.querySelector('.card__button__likes-counter');
        counter.textContent = likes.length;
        const liked = likes.some(id => String(id) === String(currentUser.id));
        likeBtn.classList.toggle('card__button__like', Boolean(liked));
        onLike && onLike(likes);
      }
    } finally {
      likeBtn.disabled = false;
    }
  });
  footer.appendChild(likeBtn);
  const commentsBtn = createElement('button', 'card__button card__button__comments', `<p>Комментарии <span class="card__button__comments-counter">${(post.comments || []).length}</span></p>`);
  footer.appendChild(commentsBtn);
  return { footer, commentsBtn };
}

function renderCommentsBlock(post, currentUser, commentsBtn) {
  const block = createElement('div', 'card__comments-block');
  block.style.display = 'none';
  const list = createElement('div', 'comments');

  // Обогащаем комментарии данными пользователей для гостей
  const enrichComments = async (comments) => {
    if (!comments || comments.length === 0) return comments;
    
    // Проверяем, нужны ли дополнительные данные пользователей
    const needsUserData = comments.some(c => !c.user_name || !c.user_avatar);
    if (!needsUserData) return comments;
    
    try {
      const users = await getUsers();
      const byId = new Map(users.map(u => [String(u.id), u]));
      
      return comments.map(comment => {
        const user = byId.get(String(comment.userId));
        return {
          ...comment,
          user_name: comment.user_name || user?.name || 'Пользователь',
          user_avatar: comment.user_avatar || user?.avatar || '/Profile.svg'
        };
      });
    } catch {
      return comments;
    }
  };

  // Рендерим комментарии с обогащёнными данными
  const renderComments = async () => {
    const enrichedComments = await enrichComments(post.comments || []);
    
    for (const comment of enrichedComments) {
      const commentCard = createElement('div', 'comment-card');
      const header = createElement('div', 'card__header');
      const cImgDiv = createElement('div', 'card__img', `<img src="${comment.user_avatar || '/Profile.svg'}" alt="">`);
      const cNameLink = createElement('a', 'card__name');
      cNameLink.textContent = comment.user_name || 'Пользователь';
      cNameLink.href = `/profile.html?userId=${encodeURIComponent(comment.userId)}`;
      header.append(cImgDiv, cNameLink);
      const cPost = createElement('div', 'card__post');
      cPost.innerHTML = `<p>${comment.content}</p>`;
      if (currentUser && Number(currentUser.id) === Number(comment.userId)) {
        const deleteBtn = createElement('button', 'comment-delete-btn', '<img src="/delete.svg" alt="Удалить" style="width:16px;height:16px;vertical-align:middle;">');
        deleteBtn.title = 'Удалить комментарий';
        Object.assign(deleteBtn.style, { marginLeft: '8px', background: 'none', border: 'none', cursor: 'pointer', color: 'gray' });
        deleteBtn.addEventListener('click', async (e) => {
          e.preventDefault();
          deleteBtn.disabled = true;
          try {
            const ok = await deleteCommentApi(comment.id);
            if (ok) commentCard.remove();
          } finally { deleteBtn.disabled = false; }
        });
        cPost.appendChild(deleteBtn);
      }
      commentCard.append(header, cPost);
      list.appendChild(commentCard);
    }
  };

  // Запускаем рендер комментариев
  renderComments();

  const form = createElement('form', 'comment-form');
  form.setAttribute('data-post-id', post.id);
  form.innerHTML = '<textarea class="form__input" placeholder="Введите свой комментарий"></textarea><input class="form__btn" type="submit">';
  if (!currentUser) {
    const ta = form.querySelector('textarea');
    const btn = form.querySelector('input[type="submit"]');
    ta.disabled = true; btn.disabled = true; ta.placeholder = 'Войдите, чтобы комментировать';
  } else {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const textarea = form.querySelector('textarea');
      const content = textarea.value.trim();
      if (!content) return;
      form.querySelector('input[type="submit"]').disabled = true;
      try {
        const result = await addCommentApi(post.id, content);
        if (result) {
          let avatarUrl = currentUser.avatar || '';
          let userName = currentUser.name || 'Пользователь';
          if (!avatarUrl) {
            const users = await getUsers();
            const me = users.find(u => String(u.id) === String(currentUser.id));
            avatarUrl = (me && me.avatar) ? me.avatar : '/Profile.svg';
            if (me && me.name) userName = me.name;
          }

          const myCard = createElement('div', 'comment-card');
          const header = createElement('div', 'card__header');
          const cImgDiv = createElement('div', 'card__img', `<img src="${avatarUrl}" alt="">`);
          const cNameLink = createElement('a', 'card__name');
          cNameLink.textContent = userName;
          cNameLink.href = `/profile.html?userId=${encodeURIComponent(currentUser.id)}`;
          header.append(cImgDiv, cNameLink);
          const cPost = createElement('div', 'card__post');
          cPost.innerHTML = `<p>${content}</p>`;

          const deleteBtn = createElement('button', 'comment-delete-btn', '<img src="/delete.svg" alt="Удалить" style="width:16px;height:16px;vertical-align:middle;">');
          deleteBtn.title = 'Удалить комментарий';
          Object.assign(deleteBtn.style, { marginLeft: '8px', background: 'none', border: 'none', cursor: 'pointer', color: 'gray' });
          const commentId = result.commentId || result.commentID || result.id;
          deleteBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            deleteBtn.disabled = true;
            try { if (commentId && await deleteCommentApi(commentId)) myCard.remove(); }
            finally { deleteBtn.disabled = false; }
          });
          cPost.appendChild(deleteBtn);

          myCard.append(header, cPost);
          list.appendChild(myCard);
          textarea.value = '';

          if (commentsBtn) {
            const counter = commentsBtn.querySelector('.card__button__comments-counter');
            if (counter) {
              const num = parseInt(counter.textContent || '0', 10) || 0;
              counter.textContent = String(num + 1);
            }
          }
        }
      } finally {
        form.querySelector('input[type="submit"]').disabled = false;
      }
    });
  }
  block.append(list, form);
  return block;
}

export function createPostCardComponent(post, currentUser) {
  const container = createElement('div', 'card__container');
  container.dataset.userid = post.author_id;

  const card = createElement('div', 'card');
  const header = renderHeader(post);
  const postDiv = createElement('div', 'card__post');
  postDiv.textContent = post.content;
  const { footer, commentsBtn } = renderFooter(post, currentUser, (likes) => {
    
  });

  card.append(header, postDiv, footer);
  container.appendChild(card);

  const commentsBlock = renderCommentsBlock(post, currentUser, commentsBtn);
  container.appendChild(commentsBlock);

  commentsBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const isActive = commentsBtn.classList.contains('card__button__active');
    commentsBtn.classList.toggle('card__button__active', !isActive);
    commentsBlock.style.display = isActive ? 'none' : 'block';
  });

  return container;
}

