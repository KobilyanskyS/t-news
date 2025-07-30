// user.js
// Функции для получения информации о пользователе и кэша пользователей

export async function getCurrentUser() {
    const res = await fetch('http://localhost:3000/api/user', { credentials: 'include' });
    if (!res.ok) return null;
    return await res.json();
}

export async function getUsersCache() {
    if (window.usersCache) return window.usersCache;
    const res = await fetch('http://localhost:3000/users.json');
    if (!res.ok) return [];
    window.usersCache = await res.json();
    return window.usersCache;
}

export function getUserDataById(id, currentUser, users) {
    if (currentUser && Number(currentUser.id) === Number(id)) {
        return {
            name: currentUser.name || 'Пользователь',
            avatar: currentUser.avatar || '/src/images/Profile.svg'
        };
    }
    if (users) {
        const u = users.find(u => Number(u.id) === Number(id));
        if (u) return { name: u.name || 'Пользователь', avatar: u.avatar || '/src/images/Profile.svg' };
    }
    return { name: 'Пользователь', avatar: '/src/images/Profile.svg' };
}
