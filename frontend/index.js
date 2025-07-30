import { getCurrentUser } from './user.js';
import { getPosts, createPostCard } from './post.js';
import './comments.js';

async function renderPosts() {
    const user = await getCurrentUser();
    const cardsContainer = document.querySelector('.cards');
    cardsContainer.innerHTML = '';
    if (!user) return;
    const posts = await getPosts();
    for (const post of posts) {
        const card = await createPostCard(post, user);
        cardsContainer.appendChild(card);
    }
}

document.addEventListener('DOMContentLoaded', renderPosts);
