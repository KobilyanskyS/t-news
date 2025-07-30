// profile.js
// Динамический рендер блока профиля
import { getCurrentUser, getUsersCache } from './user.js';
import { getPosts, createPostCard } from './post.js';

function getUserIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('userId');
}

function renderProfileBlock(user, isCurrentUser) {
    const root = document.getElementById('profile-root');
    if (!root) return;
    root.innerHTML = `
        <div class="profile">
            <div class="profile__image-block">
                <div class="profile__avatar">
                    <img src="${user.avatar || '/src/images/Profile.svg'}" alt="" class="profile__avatar-image">
                </div>
                ${isCurrentUser ? '<button class="profile__change_avatar_btn">Изменить фото</button>' : ''}
            </div>
            <div class="profile__info-block">
                <div class="profile__name-block">
                    <h1 class="profile__name">${user.name || 'Пользователь'}</h1>
                    ${isCurrentUser ? '<button class="profile__edit-name-btn" title="Редактировать имя" style="background:none;border:none;padding:0;cursor:pointer;"><img src="/src/images/edit.svg" alt="" class="profile__edit-name" width="24px"></button>' : ''}
                </div>
                <div class="profile__about-block">
                    <p class="profile__about">${user.about ? 'Обо мне: ' + user.about : ''}</p>
                    ${isCurrentUser ? '<button class="profile__edit-about-btn" title="Редактировать обо мне" style="background:none;border:none;padding:0;cursor:pointer;"><img src="/src/images/edit.svg" alt="" class="profile__edit-about" width="16px"></button>' : ''}
                </div>
            </div>
            <div class="profile__subscribe-block">
                ${!isCurrentUser ? '<button class="profile__subscribe-button">Подписаться</button>' : ''}
            </div>
        </div>
    `;
    // Подписка/отписка
    if (!isCurrentUser) {
        (async () => {
            const btn = root.querySelector('.profile__subscribe-button');
            if (!btn) return;
            // Получаем id текущего пользователя через /api/user
            let currentUser = null;
            try {
                const res = await fetch('http://localhost:3000/api/user', { credentials: 'include' });
                if (res.ok) currentUser = await res.json();
            } catch {}
            if (!currentUser) return;
            async function getIsSubscribed() {
                try {
                    const res = await fetch('http://localhost:3000/users.json');
                    if (res.ok) {
                        const users = await res.json();
                        const me = users.find(u => String(u.id) === String(currentUser.id));
                        if (me && Array.isArray(me.subscriptions)) {
                            return me.subscriptions.some(id => String(id) === String(user.id));
                        }
                    }
                } catch {}
                return false;
            }
            async function updateBtn() {
                btn.disabled = true;
                const isSubscribed = await getIsSubscribed();
                btn.textContent = isSubscribed ? 'Отписаться' : 'Подписаться';
                btn.classList.toggle('subscribed', isSubscribed);
                btn.disabled = false;
                return isSubscribed;
            }
            let isSubscribed = await updateBtn();
            btn.addEventListener('click', async () => {
                btn.disabled = true;
                const action = isSubscribed ? 'unsubscribe' : 'subscribe';
                try {
                    const res = await fetch('http://localhost:3000/api/subscribe', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ targetId: user.id, action })
                    });
                    // После любого действия всегда обновляем состояние кнопки
                    isSubscribed = await updateBtn();
                } finally {
                    btn.disabled = false;
                }
            });
        })();
    }

    // Динамически добавляем форму создания поста только для себя
    if (isCurrentUser) {
        const form = document.createElement('form');
        form.className = 'post-form';
        form.innerHTML = `
            <textarea class="form__input" placeholder="Введите свой пост"></textarea>
            <input class="form__btn" type="submit">
        `;
        // Вставляем форму после блока профиля
        root.parentNode.insertBefore(form, root.nextSibling);
    }

    if (isCurrentUser) {
        // Имя
        const nameBlock = root.querySelector('.profile__name-block');
        const editNameBtn = root.querySelector('.profile__edit-name-btn');
        if (editNameBtn && nameBlock) {
            editNameBtn.addEventListener('click', () => {
                const h1 = nameBlock.querySelector('.profile__name');
                const oldName = h1.textContent;
                h1.style.display = 'none';
                editNameBtn.style.display = 'none';
                const input = document.createElement('input');
                input.type = 'text';
                input.value = oldName;
                input.className = 'profile__name-input';
                input.style.fontSize = '2rem';
                input.style.marginRight = '8px';
                input.style.padding = '4px 8px';
                input.style.border = '1px solid #ccc';
                input.style.borderRadius = '6px';
                input.style.transition = 'all 0.2s';
                input.style.outline = 'none';
                const saveBtn = document.createElement('button');
                saveBtn.innerHTML = '<img src="/src/images/ok.svg" alt="Сохранить" width="24px">';
                saveBtn.title = 'Сохранить';
                saveBtn.style.background = 'none';
                saveBtn.style.border = 'none';
                saveBtn.style.cursor = 'pointer';
                nameBlock.insertBefore(input, h1);
                nameBlock.insertBefore(saveBtn, h1);
                input.focus();
                function finishEdit(cancel) {
                    input.remove(); saveBtn.remove(); h1.style.display = ''; editNameBtn.style.display = '';
                    if (!cancel) {
                        const newName = input.value.trim();
                        if (newName && newName !== oldName) {
                            h1.textContent = newName;
                            fetch('http://localhost:3000/api/user/name', {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                credentials: 'include',
                                body: JSON.stringify({ name: newName })
                            });
                        }
                    }
                }
                saveBtn.addEventListener('click', () => finishEdit(false));
                input.addEventListener('keydown', e => {
                    if (e.key === 'Enter') { e.preventDefault(); finishEdit(false); }
                    if (e.key === 'Escape') { e.preventDefault(); finishEdit(true); }
                });
                input.addEventListener('blur', () => setTimeout(() => { if (document.activeElement !== saveBtn) finishEdit(false); }, 200));
            });
        }
        // Обо мне
        const aboutBlock = root.querySelector('.profile__about-block');
        const editAboutBtn = root.querySelector('.profile__edit-about-btn');
        if (editAboutBtn && aboutBlock) {
            editAboutBtn.addEventListener('click', () => {
                const p = aboutBlock.querySelector('.profile__about');
                const oldAbout = p.textContent.replace(/^Обо мне: /, '');
                p.style.display = 'none';
                editAboutBtn.style.display = 'none';
                const textarea = document.createElement('textarea');
                textarea.value = oldAbout;
                textarea.className = 'profile__about-textarea';
                textarea.style.width = '100%';
                textarea.style.boxSizing = 'border-box';
                textarea.style.marginRight = '8px';
                textarea.style.padding = '6px 10px';
                textarea.style.border = '1px solid #ccc';
                textarea.style.borderRadius = '6px';
                textarea.style.fontSize = '1rem';
                textarea.style.transition = 'all 0.2s';
                textarea.style.outline = 'none';
                // Сделать высоту такой же, как у блока
                const aboutBlockRect = aboutBlock.getBoundingClientRect();
                textarea.style.minHeight = aboutBlockRect.height + 'px';
                textarea.style.resize = 'vertical';
                const saveBtn = document.createElement('button');
                saveBtn.innerHTML = '<img src="/src/images/ok.svg" alt="Сохранить" width="16px">';
                saveBtn.title = 'Сохранить';
                saveBtn.style.background = 'none';
                saveBtn.style.border = 'none';
                saveBtn.style.cursor = 'pointer';
                aboutBlock.insertBefore(textarea, p);
                aboutBlock.insertBefore(saveBtn, p);
                textarea.focus();
                function finishEdit(cancel) {
                    textarea.remove(); saveBtn.remove(); p.style.display = ''; editAboutBtn.style.display = '';
                    if (!cancel) {
                        const newAbout = textarea.value.trim();
                        if (newAbout !== oldAbout) {
                            p.textContent = newAbout ? 'Обо мне: ' + newAbout : '';
                            fetch('http://localhost:3000/api/user/about', {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                credentials: 'include',
                                body: JSON.stringify({ about: newAbout })
                            });
                        }
                    }
                }
                saveBtn.addEventListener('click', () => finishEdit(false));
                textarea.addEventListener('keydown', e => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); finishEdit(false); }
                    if (e.key === 'Escape') { e.preventDefault(); finishEdit(true); }
                });
                textarea.addEventListener('blur', () => setTimeout(() => { if (document.activeElement !== saveBtn) finishEdit(false); }, 200));
            });
        }
    }
}

async function renderProfile() {
    // 1. Получаем пользователя и вычисляем, чей профиль
    const currentUser = await getCurrentUser();
    const users = await getUsersCache();
    const userId = getUserIdFromUrl() || (currentUser && currentUser.id);
    let user = null;
    if (users && userId) {
        user = users.find(u => String(u.id) === String(userId));
    }
    if (!user) user = currentUser;
    if (!user) return;
    const isCurrentUser = currentUser && String(currentUser.id) === String(user.id);

    // 2. Рендерим профиль
    renderProfileBlock(user, isCurrentUser);

    // 3. Показываем/скрываем форму создания поста
    const postForm = document.querySelector('.post-form');
    if (postForm) {
        postForm.style.display = isCurrentUser ? '' : 'none';
    }

    // 4. Выводим посты пользователя
    const cardsBlock = document.querySelector('.cards');
    if (cardsBlock) {
        cardsBlock.innerHTML = '';
        let userPosts = [];
        if (isCurrentUser) {
            // Свой профиль — используем getPosts (лента)
            const allPosts = await getPosts();
            userPosts = allPosts.filter(p => String(p.author_id) === String(user.id));
        } else {
            // Чужой профиль — всегда все посты пользователя
            const res = await fetch(`http://localhost:3000/api/user/${encodeURIComponent(user.id)}/posts`);
            if (res.ok) {
                userPosts = await res.json();
            }
        }
        for (const post of userPosts) {
            const card = await createPostCard(post, currentUser);
            // Добавляем кнопку удаления только для автора и только на странице профиля
            if (isCurrentUser) {
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'post-delete-btn';
                deleteBtn.title = 'Удалить пост';
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
                        const res = await fetch(`http://localhost:3000/api/posts/${post.id}`, {
                            method: 'DELETE',
                            credentials: 'include'
                        });
                        if (res.ok) {
                            card.remove();
                        } else {
                            const data = await res.json();
                            alert(data.error || 'Ошибка удаления поста');
                        }
                    } finally {
                        deleteBtn.disabled = false;
                    }
                });
                // Вставляем кнопку в футер карточки
                const footer = card.querySelector('.card__footer');
                if (footer) footer.appendChild(deleteBtn);
            }
            cardsBlock.appendChild(card);
        }
    }

    // 5. Навешиваем обработчик на форму (только если это свой профиль)
    if (isCurrentUser && postForm) {
        postForm.onsubmit = async function(e) {
            e.preventDefault();
            const textarea = postForm.querySelector('textarea');
            const content = textarea.value.trim();
            if (!content) return;
            postForm.querySelector('input[type="submit"]').disabled = true;
            try {
                const res = await fetch('http://localhost:3000/api/posts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ content })
                });
                if (res.ok) {
                    const newPost = await res.json();
                    const card = await createPostCard(newPost, user);
                    // Добавляем кнопку удаления для нового поста
                    const deleteBtn = document.createElement('button');
                    deleteBtn.className = 'post-delete-btn';
                    deleteBtn.title = 'Удалить пост';
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
                            const res = await fetch(`http://localhost:3000/api/posts/${newPost.id}`, {
                                method: 'DELETE',
                                credentials: 'include'
                            });
                            if (res.ok) {
                                card.remove();
                            } else {
                                const data = await res.json();
                                alert(data.error || 'Ошибка удаления поста');
                            }
                        } finally {
                            deleteBtn.disabled = false;
                        }
                    });
                    // Вставляем кнопку в футер карточки
                    const footer = card.querySelector('.card__footer');
                    if (footer) footer.appendChild(deleteBtn);
                    if (cardsBlock) {
                        cardsBlock.insertBefore(card, cardsBlock.firstChild);
                    }
                    textarea.value = '';
                } else {
                    const err = await res.json();
                    alert(err.error || 'Ошибка создания поста');
                }
            } finally {
                postForm.querySelector('input[type="submit"]').disabled = false;
            }
        };
    }
}

document.addEventListener('DOMContentLoaded', renderProfile);
