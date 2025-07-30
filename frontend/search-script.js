// search.js
// Поиск по постам и пользователям через /api/search

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const query = (urlParams.get('search') || '').trim();
    console.log('search query:', query);
    const postsBlock = document.querySelector('.cards');
    const usersBlock = document.querySelector('.users');
    const filterBtns = document.querySelectorAll('.filter__button');
    if (!postsBlock || !usersBlock) return;

    let mode = 'posts'; // по умолчанию
    // Исправляем индексы: 0 - пользователи, 1 - посты
    filterBtns.forEach((btn, idx) => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            mode = idx === 1 ? 'posts' : 'users';
            render();
        });
    });

    // Получаем результаты поиска с бэка
    let users = [], posts = [];
    if (query) {
        try {
            const url = `http://localhost:3000/api/search?q=${encodeURIComponent(query)}`;
            console.log('fetch url:', url);
            const res = await fetch(url);
            console.log('fetch response status:', res.status);
            if (res.ok) {
                const data = await res.json();
                console.log('fetch data:', data);
                users = data.users || [];
                posts = data.posts || [];
            } else {
                console.log('fetch not ok:', res.status);
            }
        } catch (e) {
            // Ошибка сети или парсинга
            console.error('fetch error:', e);
            users = [];
            posts = [];
        }
    }

    function render() {
        postsBlock.style.display = mode === 'posts' ? '' : 'none';
        usersBlock.style.display = mode === 'users' ? '' : 'none';
        if (mode === 'posts') {
            renderPosts();
        } else {
            renderUsers();
        }
    }

    function renderPosts() {
        postsBlock.innerHTML = '';
        if (!posts.length) {
            postsBlock.innerHTML = '<div style="padding:2rem; color:gray;">Посты не найдены</div>';
            return;
        }
        posts.forEach(post => {
            const card = document.createElement('div');
            card.className = 'card__container';
            card.innerHTML = `
                <div class="card">
                    <div class="card__header">
                        <div class="card__img"><img src="${post.author_avatar || '/src/images/Profile.svg'}" alt=""></div>
                        <a class="card__name" href="/profile.html?userId=${encodeURIComponent(post.author_id)}">${post.author_name || 'Пользователь'}</a>
                    </div>
                    <div class="card__post">${post.content}</div>
                </div>
            `;
            postsBlock.appendChild(card);
        });
    }

    function renderUsers() {
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

    // Если нет query, всё равно рендерим (выведет "Посты не найдены"/"Пользователи не найдены")
    render();
});
