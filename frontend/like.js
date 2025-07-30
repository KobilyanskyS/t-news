// like.js
// Функции для лайка и анлайка поста

export async function toggleLike(postId, currentUser, likeBtn) {
    likeBtn.disabled = true;
    try {
        const res = await fetch('http://localhost:3000/api/likes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ postId })
        });
        if (res.ok) {
            const data = await res.json();
            const likes = data.likes || [];
            const counter = likeBtn.querySelector('.card__button__likes-counter');
            counter.textContent = likes.length;
            const liked = likes.some(id => String(id) === String(currentUser.id));
            if (liked) {
                likeBtn.classList.add('card__button__like');
            } else {
                likeBtn.classList.remove('card__button__like');
            }
        }
    } finally {
        likeBtn.disabled = false;
    }
}
