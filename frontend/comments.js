export async function createComment({ postId, content, currentUser, commentsList }) {
    const res = await fetch('http://localhost:3000/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ postId, content })
    });
    if (!res.ok) return null;
    const data = await res.json();
    const commentId = data && (data.commentId || data.commentID || data.id);
    let user_avatar = currentUser.avatar;
    let user_name = currentUser.name || 'Пользователь';
    if (!user_avatar) {
        let users = await getUsersCache();
        const u = users.find(u => Number(u.id) === Number(currentUser.id));
        user_avatar = (u && u.avatar) ? u.avatar : '/src/images/Profile.svg';
    }
    const commentCard = document.createElement('div');
    commentCard.className = 'comment-card';
    const cHeader = document.createElement('div');
    cHeader.className = 'card__header';
    const cImgDiv = document.createElement('div');
    cImgDiv.className = 'card__img';
    cImgDiv.innerHTML = `<img src="${user_avatar}" alt="">`;
    const cNameLink = document.createElement('a');
    cNameLink.className = 'card__name';
    cNameLink.textContent = user_name;
    cNameLink.href = '/profile.html?userId=' + encodeURIComponent(currentUser.id);
    cHeader.appendChild(cImgDiv);
    cHeader.appendChild(cNameLink);
    const cPost = document.createElement('div');
    cPost.className = 'card__post';
    cPost.innerHTML = `<p>${content}</p>`;
    // Кнопка удаления для только что созданного комментария
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'comment-delete-btn';
    deleteBtn.title = 'Удалить комментарий';
    deleteBtn.innerHTML = '<img src="/src/images/delete.svg" alt="Удалить" style="width:16px;height:16px;vertical-align:middle;">';
    deleteBtn.style.marginLeft = '8px';
    deleteBtn.style.background = 'none';
    deleteBtn.style.border = 'none';
    deleteBtn.style.cursor = 'pointer';
    deleteBtn.style.color = 'gray';
    deleteBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        deleteBtn.disabled = true;
        try {
            if (!commentId) return;
            const res = await fetch(`http://localhost:3000/api/comments/${commentId}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            if (res.ok) {
                commentCard.remove();
            }
        } finally {
            deleteBtn.disabled = false;
        }
    });
    cPost.appendChild(deleteBtn);
    commentCard.appendChild(cHeader);
    commentCard.appendChild(cPost);
    if (commentsList) commentsList.appendChild(commentCard);
    return commentCard;
}

export async function deleteComment(commentId, commentCard) {
    if (!commentId) return;
    const res = await fetch(`http://localhost:3000/api/comments/${commentId}`, {
        method: 'DELETE',
        credentials: 'include'
    });
    if (res.ok && commentCard) {
        commentCard.remove();
    }
}

// Для получения кэша пользователей (используется в createComment)
export async function getUsersCache() {
    if (window.usersCache) return window.usersCache;
    const res = await fetch('http://localhost:3000/users.json');
    if (!res.ok) return [];
    window.usersCache = await res.json();
    return window.usersCache;
}

// Обработчик показа/скрытия блока комментариев (ранее comments.js)
document.addEventListener('DOMContentLoaded', () => {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.card__button__comments');
    if (!btn) return;
    e.preventDefault();
    const cardContainer = btn.closest('.card__container');
    if (!cardContainer) return;
    const commentsBlock = cardContainer.querySelector('.card__comments-block');
    if (!commentsBlock) return;
    // Переключаем видимость
    const isActive = btn.classList.contains('card__button__active');
    if (isActive) {
      commentsBlock.style.display = 'none';
      btn.classList.remove('card__button__active');
    } else {
      commentsBlock.style.display = 'block';
      btn.classList.add('card__button__active');
    }
  });
});