let items = [];
let currentItemId = null;

// Sample data initialization
function initSampleData() {
    items = [
        {
            id: 1,
            type: 'found',
            name: 'Blue Water Bottle',
            category: 'Other',
            description: 'Blue stainless steel water bottle found near the gym',
            location: 'Sports Complex',
            poster: 'John Doe',
            status: 'unclaimed',
            date: new Date().toLocaleDateString(),
            photo: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400',
            messages: []
        },
        {
            id: 2,
            type: 'lost',
            name: 'Laptop Charger',
            category: 'Electronics',
            description: 'MacBook Pro charger with USB-C cable, lost in Room 301',
            location: 'Engineering Building',
            poster: 'Jane Smith',
            status: 'unclaimed',
            date: new Date().toLocaleDateString(),
            photo: 'https://images.unsplash.com/photo-1591290619762-f61a75ab6dac?w=400',
            messages: []
        }
    ];
    displayItems();
}

function showTab(tab, event) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    if (event) event.target.classList.add('active');
    document.getElementById(tab + '-section').classList.add('active');
}

function displayItems() {
    const grid = document.getElementById('itemsGrid');
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    const typeFilter = document.getElementById('typeFilter').value;

    const filtered = items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm) || 
                                item.description.toLowerCase().includes(searchTerm);
        const matchesCategory = !categoryFilter || item.category === categoryFilter;
        const matchesStatus = !statusFilter || item.status === statusFilter;
        const matchesType = !typeFilter || item.type === typeFilter;
        return matchesSearch && matchesCategory && matchesStatus && matchesType;
    });

    if (filtered.length === 0) {
        grid.innerHTML = '<div class="empty-state"><h3>No items found</h3><p>Try adjusting your search or filters</p></div>';
        return;
    }

    grid.innerHTML = filtered.map(item => `
        <div class="item-card">
            <img src="${item.photo || 'https://via.placeholder.com/400x200?text=No+Image'}" 
                 alt="${item.name}" class="item-image" 
                 onerror="this.src='https://via.placeholder.com/400x200?text=No+Image'">
            <div class="item-title">${item.type === 'lost' ? '🔍' : '✨'} ${item.name}</div>
            <div class="item-description">${item.description}</div>
            <p style="font-size: 0.85em; color: #999; margin: 5px 0;">
                📍 ${item.location} | 📅 ${item.date}
            </p>
            <p style="font-size: 0.85em; color: #999;">Posted by: ${item.poster}</p>
            <p style="font-size: 0.85em; color: #999;">Category: ${item.category}</p>
            <div class="item-meta">
                <span class="status-badge status-${item.status}">
                    ${item.status === 'unclaimed' ? '✓ Available' : '✗ Claimed'}
                </span>
                <button class="message-btn" onclick="openMessages(${item.id})">
                    💬 Messages (${item.messages.length})
                </button>
            </div>
            ${item.status === 'unclaimed' ? 
                `<button class="btn" style="width: 100%; margin-top: 10px;" onclick="markClaimed(${item.id})">Mark as Claimed</button>` 
                : ''}
        </div>
    `).join('');
}

function markClaimed(id) {
    const item = items.find(i => i.id === id);
    if (item) {
        item.status = 'claimed';
        displayItems();
    }
}

function openMessages(id) {
    currentItemId = id;
    const item = items.find(i => i.id === id);
    const modal = document.getElementById('messageModal');
    const messagesList = document.getElementById('messagesList');
    
    if (item.messages.length === 0) {
        messagesList.innerHTML = '<p style="color: #999; text-align: center;">No messages yet. Be the first to send a message!</p>';
    } else {
        messagesList.innerHTML = item.messages.map(msg => `
            <div class="message">
                <div class="message-sender">${msg.sender}</div>
                <div>${msg.text}</div>
                <div style="font-size: 0.8em; color: #999; margin-top: 5px;">${msg.date}</div>
            </div>
        `).join('');
    }
    modal.classList.add('active');
}

function closeModal() {
    document.getElementById('messageModal').classList.remove('active');
    currentItemId = null;
}

document.getElementById('postForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const newItem = {
        id: items.length ? Math.max(...items.map(i => i.id))+1 : 1,
        type: document.getElementById('itemType').value,
        name: document.getElementById('itemName').value,
        category: document.getElementById('itemCategory').value,
        description: document.getElementById('itemDescription').value,
        location: document.getElementById('itemLocation').value,
        poster: document.getElementById('posterName').value,
        photo: document.getElementById('itemPhoto').value,
        status: 'unclaimed',
        date: new Date().toLocaleDateString(),
        messages: []
    };
    
    items.unshift(newItem);
    displayItems();
    this.reset();
    showTab('browse');
    document.querySelector('.tab').click();
    alert('Item posted successfully!');
});

document.getElementById('messageForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const item = items.find(i => i.id === currentItemId);
    if (item) {
        const message = {
            sender: document.getElementById('messageSender').value,
            text: document.getElementById('messageText').value,
            date: new Date().toLocaleString()
        };
        item.messages.push(message);
        this.reset();
        openMessages(currentItemId);
        displayItems();
    }
});

document.getElementById('searchInput').addEventListener('input', displayItems);
document.getElementById('categoryFilter').addEventListener('change', displayItems);
document.getElementById('statusFilter').addEventListener('change', displayItems);
document.getElementById('typeFilter').addEventListener('change', displayItems);

initSampleData();

// Make functions globally accessible for inline event handlers
window.openMessages = openMessages;
window.markClaimed = markClaimed;
window.closeModal = closeModal;
window.showTab = showTab;
