const API_URL = 'http://localhost:3000/api';
let items = [];
let currentItemId = null;

// Fetch items from backend
async function fetchItems() {
    try {
        const searchTerm = document.getElementById('searchInput').value;
        const categoryFilter = document.getElementById('categoryFilter').value;
        const statusFilter = document.getElementById('statusFilter').value;
        const typeFilter = document.getElementById('typeFilter').value;

        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        if (categoryFilter) params.append('category', categoryFilter);
        if (statusFilter) params.append('status', statusFilter);
        if (typeFilter) params.append('type', typeFilter);

        const response = await fetch(`${API_URL}/items?${params}`);
        const result = await response.json();
        
        if (result.success) {
            items = result.data;
            displayItems();
        } else {
            console.error('Error fetching items:', result.message);
        }
    } catch (error) {
        console.error('Error fetching items:', error);
        alert('Failed to load items. Please check if the server is running.');
    }
}

function showTab(tab, event) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    if (event) event.target.classList.add('active');
    document.getElementById(tab + '-section').classList.add('active');
}

function displayItems() {
    const grid = document.getElementById('itemsGrid');

    if (items.length === 0) {
        grid.innerHTML = '<div class="empty-state"><h3>No items found</h3><p>Try adjusting your search or filters</p></div>';
        return;
    }

    grid.innerHTML = items.map(item => `
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

async function markClaimed(id) {
    try {
        const response = await fetch(`${API_URL}/items/${id}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 'claimed' })
        });

        const result = await response.json();
        
        if (result.success) {
            await fetchItems();
            alert('Item marked as claimed successfully!');
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error('Error marking item as claimed:', error);
        alert('Failed to update item status');
    }
}

async function openMessages(id) {
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

document.getElementById('postForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('type', document.getElementById('itemType').value);
    formData.append('name', document.getElementById('itemName').value);
    formData.append('category', document.getElementById('itemCategory').value);
    formData.append('description', document.getElementById('itemDescription').value);
    formData.append('location', document.getElementById('itemLocation').value);
    formData.append('poster', document.getElementById('posterName').value);
    
    const photoFile = document.getElementById('itemPhoto').files[0];
    if (photoFile) {
        formData.append('photo', photoFile);
    }

    try {
        const response = await fetch(`${API_URL}/items`, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        
        if (result.success) {
            await fetchItems();
            this.reset();
            showTab('browse');
            document.querySelector('.tab').click();
            alert('Item posted successfully!');
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error('Error posting item:', error);
        alert('Failed to post item. Please check if the server is running.');
    }
});

document.getElementById('messageForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const messageData = {
        sender: document.getElementById('messageSender').value,
        text: document.getElementById('messageText').value
    };

    try {
        const response = await fetch(`${API_URL}/items/${currentItemId}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(messageData)
        });

        const result = await response.json();
        
        if (result.success) {
            await fetchItems();
            this.reset();
            openMessages(currentItemId);
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error('Error sending message:', error);
        alert('Failed to send message');
    }
});

document.getElementById('searchInput').addEventListener('input', fetchItems);
document.getElementById('categoryFilter').addEventListener('change', fetchItems);
document.getElementById('statusFilter').addEventListener('change', fetchItems);
document.getElementById('typeFilter').addEventListener('change', fetchItems);

// Initialize
fetchItems();

// Make functions globally accessible for inline event handlers
window.openMessages = openMessages;
window.markClaimed = markClaimed;
window.closeModal = closeModal;
window.showTab = showTab;
