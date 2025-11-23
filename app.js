const freshFaces = [
    { name: 'Thomas', img: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80', online: true },
    { name: 'Jamie', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80', online: true },
    { name: 'Connor', img: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80', online: true },
    { name: 'Benjamin', img: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80', online: true },
    { name: 'Alex', img: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80', online: true },
];

const favourites = [
    { name: 'Thomas', img: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80', online: true, starred: true },
    { name: 'Hugo', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80', online: true, starred: true },
    { name: 'Sung Jin', img: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80', online: true, starred: true },
    { name: 'John', img: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80', online: true, starred: true },
];

const nearby = [
    { name: 'Brodie', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80', online: true },
    { name: 'Brendon', img: 'https://images.unsplash.com/photo-1521119989659-a83eee488058?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80', online: true },
    { name: 'Tommy', img: 'https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80', online: true },
    { name: 'Christian', img: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80', online: true },
    { name: 'Victor', img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80', online: true },
    { name: 'Leon', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80', online: true },
    { name: 'Marcus', img: 'https://images.unsplash.com/photo-1463453091185-61582044d556?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80', online: true },
    { name: 'Daniel', img: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80', online: true },
    { name: 'Lucas', img: 'https://images.unsplash.com/photo-1522075469751-3a3694c2dd77?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80', online: true },
];

function createProfileCard(user, isGrid = false) {
    const card = document.createElement('div');
    card.className = 'profile-card';

    const starHtml = user.starred ? '<span class="material-icons star-icon">star</span>' : '';

    card.innerHTML = `
        <img src="${user.img}" alt="${user.name}">
        ${starHtml}
        <div class="profile-info">
            <div class="status-dot"></div>
            <span class="profile-name">${user.name}</span>
        </div>
    `;
    return card;
}

function renderSection(containerId, data, isGrid = false) {
    const container = document.getElementById(containerId);
    data.forEach(user => {
        container.appendChild(createProfileCard(user, isGrid));
    });
}

document.addEventListener('DOMContentLoaded', () => {
    renderSection('fresh-faces-container', freshFaces);
    renderSection('favourites-container', favourites);
    renderSection('nearby-container', nearby, true);
});
