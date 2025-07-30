// post.js
// Функции для получения постов и создания карточки поста
import { getUsersCache, getUserDataById } from './user.js';
import { toggleLike } from './like.js';
import { createComment } from './comments.js';

export async function getPosts() {
    const res = await fetch('http://localhost:3000/api/posts', { credentials: 'include' });
    if (!res.ok) return [];
    return await res.json();
}

export async function createPostCard(post, currentUser) {
    const cardContainer = document.createElement('div');
    cardContainer.className = 'card__container';
    cardContainer.dataset.userid = post.author_id;
    // card
    const card = document.createElement('div');
    card.className = 'card';
    // header
    const header = document.createElement('div');
    header.className = 'card__header';
    const imgDiv = document.createElement('div');
    imgDiv.className = 'card__img';
    imgDiv.innerHTML = `<img src="${post.author_avatar || '/src/images/Profile.svg'}" alt="">`;
    // Имя пользователя как ссылка на профиль
    const nameLink = document.createElement('a');
    nameLink.className = 'card__name';
    nameLink.textContent = post.author_name || 'Пользователь';
    nameLink.href = '/profile.html?userId=' + encodeURIComponent(post.author_id);
    header.appendChild(imgDiv);
    header.appendChild(nameLink);
    // post
    const postDiv = document.createElement('div');
    postDiv.className = 'card__post';
    postDiv.textContent = post.content;
    // footer
    const footer = document.createElement('div');
    footer.className = 'card__footer';
    // like button
    const likeBtn = document.createElement('button');
    const isLiked = post.likes && post.likes.some(id => String(id) === String(currentUser.id));
    likeBtn.className = 'card__button' + (isLiked ? ' card__button__like' : '');
    likeBtn.innerHTML = `<img src="/src/images/Heart.svg" alt="" class="card__button__img"><span class="card__button__likes-counter">${post.likes ? post.likes.length : 0}</span>`;
    likeBtn.addEventListener('click', async () => {
        await toggleLike(post.id, currentUser, likeBtn);
    });
    // comments button
    const commentsBtn = document.createElement('button');
    commentsBtn.className = 'card__button card__button__comments';
    commentsBtn.innerHTML = `<p>Комментарии <span class="card__button__comments-counter">${post.comments ? post.comments.length : 0}</span></p>`;
    footer.appendChild(likeBtn);
    footer.appendChild(commentsBtn);
    
    // card
    card.appendChild(header);
    card.appendChild(postDiv);
    card.appendChild(footer);
    cardContainer.appendChild(card);
    // comments block
    const commentsBlock = document.createElement('div');
    commentsBlock.className = 'card__comments-block';
    commentsBlock.style.display = 'none';
    // comments list
    const commentsList = document.createElement('div');
    commentsList.className = 'comments';
    commentsList.style.marginLeft = '99px';
    if (post.comments && post.comments.length > 0) {
        let users = null;
        let needUsers = post.comments.some(c => (!c.user_name || !c.user_avatar) && c.userId);
        let usersPromise = null;
        if (needUsers) {
            usersPromise = getUsersCache();
        }
        for (const comment of post.comments) {
            const commentCard = document.createElement('div');
            commentCard.className = 'comment-card';
            const cHeader = document.createElement('div');
            cHeader.className = 'card__header';
            const cImgDiv = document.createElement('div');
            cImgDiv.className = 'card__img';
            let avatar = comment.user_avatar;
            let name = comment.user_name;
            if (!avatar || !name) {
                if (!users && usersPromise) users = await usersPromise;
                const userData = getUserDataById(comment.userId, currentUser, users);
                if (!avatar) avatar = userData.avatar;
                if (!name) name = userData.name;
            }
            cImgDiv.innerHTML = `<img src="${avatar}" alt="">`;
            const cNameLink = document.createElement('a');
            cNameLink.className = 'card__name';
            cNameLink.textContent = name;
            cNameLink.href = '/profile.html?userId=' + encodeURIComponent(comment.userId);
            cHeader.appendChild(cImgDiv);
            cHeader.appendChild(cNameLink);
            const cPost = document.createElement('div');
            cPost.className = 'card__post';
            cPost.innerHTML = `<p>${comment.content}</p>`;
            if (currentUser && Number(currentUser.id) === Number(comment.userId)) {
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
                        const res = await fetch(`http://localhost:3000/api/comments/${comment.id}`, {
                            method: 'DELETE',
                            credentials: 'include'
                        });
                        if (res.ok) {
                            commentCard.remove();
                        } else {
                            const data = await res.json();
                            alert(data.error || 'Ошибка удаления');
                        }
                    } finally {
                        deleteBtn.disabled = false;
                    }
                });
                cPost.appendChild(deleteBtn);
            }
            commentCard.appendChild(cHeader);
            commentCard.appendChild(cPost);
            commentsList.appendChild(commentCard);
        }
    }
    commentsBlock.appendChild(commentsList);
    // comment form
    const commentForm = document.createElement('form');
    commentForm.className = 'comment-form';
    commentForm.style.marginLeft = '99px';
    commentForm.setAttribute('data-post-id', post.id);
    commentForm.innerHTML = `<textarea class="form__input" placeholder="Введите свой комментарий"></textarea><input class="form__btn" type="submit">`;
    commentForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const textarea = commentForm.querySelector('textarea');
        const content = textarea.value.trim();
        if (!content) return;
        commentForm.querySelector('input[type="submit"]').disabled = true;
        try {
            await createComment({ postId: post.id, content, currentUser, commentsList });
            textarea.value = '';
        } finally {
            commentForm.querySelector('input[type="submit"]').disabled = false;
        }
    });
    commentsBlock.appendChild(commentForm);
    cardContainer.appendChild(commentsBlock);
    return cardContainer;
}
