const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files from public directory
app.use(express.static('public'));

// Store connected clients with their usernames
const clients = new Map();

// WebSocket connection handler
wss.on('connection', (ws) => {
    console.log('New client connected');
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            // Handle user join
            if (data.type === 'join') {
                clients.set(ws, data.username);
                console.log(`${data.username} joined the chat`);
                
                // Broadcast join notification
                broadcast({
                    type: 'system',
                    message: `${data.username} joined the chat`,
                    timestamp: new Date().toISOString()
                }, ws);
                
                // Send welcome message to the user
                ws.send(JSON.stringify({
                    type: 'system',
                    message: 'Welcome to the chat!',
                    timestamp: new Date().toISOString()
                }));
            }
            
            // Handle chat message
            if (data.type === 'message') {
                const username = clients.get(ws);
                console.log(`Message from ${username}: ${data.message}`);
                
                // Broadcast message to all clients
                broadcast({
                    type: 'message',
                    username: username,
                    message: data.message,
                    timestamp: new Date().toISOString()
                });
            }
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    });
    
    ws.on('close', () => {
        const username = clients.get(ws);
        if (username) {
            console.log(`${username} disconnected`);
            clients.delete(ws);
            
            // Broadcast leave notification
            broadcast({
                type: 'system',
                message: `${username} left the chat`,
                timestamp: new Date().toISOString()
            });
        }
    });
    
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

// Broadcast message to all connected clients
function broadcast(data, excludeWs = null) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN && client !== excludeWs) {
            client.send(JSON.stringify(data));
        }
    });
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});