// Check if user is logged in
const username = sessionStorage.getItem('username');
if (!username) {
    window.location.href = '/';
}

// Display current user
document.getElementById('currentUser').textContent = username;

// WebSocket connection
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const ws = new WebSocket(`${protocol}//${window.location.host}`);

const messagesContainer = document.getElementById('messagesContainer');
const messageForm = document.getElementById('messageForm');
const messageInput = document.getElementById('messageInput');
const logoutBtn = document.getElementById('logoutBtn');

// WebSocket event handlers
ws.onopen = () => {
    console.log('Connected to server');
    // Send join message
    ws.send(JSON.stringify({
        type: 'join',
        username: username
    }));
};

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    if (data.type === 'system') {
        addSystemMessage(data.message);
    } else if (data.type === 'message') {
        addMessage(data.username, data.message, data.timestamp);
    }
};

ws.onerror = (error) => {
    console.error('WebSocket error:', error);
    addSystemMessage('Connection error. Please refresh the page.');
};

ws.onclose = () => {
    console.log('Disconnected from server');
    addSystemMessage('Disconnected from server. Please refresh the page.');
};

// Send message
messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const message = messageInput.value.trim();
    if (message && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'message',
            message: message
        }));
        messageInput.value = '';
    }
});

// Add message to chat
function addMessage(username, message, timestamp) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    
    const time = new Date(timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    messageDiv.innerHTML = `
        <div class="message-header">
            <span class="message-username">${escapeHtml(username)}</span>
            <span class="message-time">${time}</span>
        </div>
        <div class="message-content">${escapeHtml(message)}</div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Add system message
function addSystemMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'system-message';
    messageDiv.textContent = message;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Logout
logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('username');
    ws.close();
    window.location.href = '/';
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    ws.close();
});