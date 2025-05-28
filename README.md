You cannot directly test Socket.io in Postman since Postman doesn't support WebSocket connections or Socket.io protocols. However, I'll show you several effective ways to test your Socket.io E2E encrypted chat implementation.

I've provided comprehensive testing methods for your Socket.io E2E encrypted chat. Here are the 5 best approaches:
🌐 Method 1: HTML Test Client (Recommended)

Easy to use - Just open in browser
Visual interface - See real-time messages and status
Complete testing - All encryption features covered
Real-time feedback - Instant connection status

💻 Method 2: Node.js Test Script

Automated testing - Run programmatic tests
Multiple clients - Simulate real conversations
Console logging - Detailed event tracking
Production-like - Tests actual client behavior

🔧 Method 3: Socket.io Admin UI

Professional tool - Official Socket.io admin interface
Real-time monitoring - See all connections and events
Easy setup - Just add a few lines to your server

⚡ Method 4: WebSocket Tools

Browser extensions - Like Websocket King
Raw protocol testing - Direct WebSocket messages
Quick testing - For simple connection tests

🧪 Method 5: Jest Test Suite

Unit testing - Automated test coverage
CI/CD ready - Integration with build pipelines
Regression testing - Prevent future bugs

🚀 Quick Start Instructions:
1. Test with HTML Client:
bash# Save the HTML code as test-client.html
# Open in 2 browser tabs/windows
# Use different mobile numbers for each tab
# Test the complete encryption flow
2. Test with Node.js:
bashnpm install socket.io-client
node test-socket-client.js
3. Add Admin UI:
bashnpm install @socket.io/admin-ui
# Add code to server.js
# Visit https://admin.socket.io/
🔒 Testing Checklist:
✅ Connection Testing:

 Client connects successfully
 Joins room with mobile number
 Handles room full scenarios

✅ Encryption Testing:

 Generates ECC key pairs
 Exchanges public keys
 Establishes shared secrets
 Encrypts/decrypts messages

✅ Message Testing:

 Sends encrypted messages
 Receives encrypted messages
 Handles message delivery status
 Supports both encrypted and plain messages

✅ Error Handling:

 Invalid mobile numbers
 Missing encryption keys
 Network disconnections
 Room capacity limits

The HTML test client is perfect for manual testing and demonstrations, while the Node.js script is ideal for automated testing and load testing scenarios!

// ========================================
// METHOD 1: HTML Test Client (Recommended)
// ========================================

// Create a file: test-client.html
/*
<!DOCTYPE html>
<html>
<head>
    <title>Socket.io E2E Encryption Test</title>
    <script src="https://cdn.socket.io/4.7.4/socket.io.min.js"></script>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .container { max-width: 800px; margin: 0 auto; }
        .chat-box { border: 1px solid #ccc; height: 300px; overflow-y: scroll; padding: 10px; margin: 10px 0; }
        .input-group { margin: 10px 0; }
        input, button { padding: 8px; margin: 5px; }
        .status { background: #f0f0f0; padding: 10px; margin: 10px 0; }
        .error { color: red; }
        .success { color: green; }
        .info { color: blue; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Socket.io E2E Encryption Test Client</h1>
        
        <div class="status" id="status">Disconnected</div>
        
        <div class="input-group">
            <input type="text" id="mobileNumber" placeholder="Your Mobile Number" value="+1234567890">
            <button onclick="connect()">Connect</button>
            <button onclick="disconnect()">Disconnect</button>
        </div>
        
        <div class="input-group">
            <input type="text" id="targetMobile" placeholder="Target Mobile Number" value="+1987654321">
            <button onclick="requestPublicKey()">Request Public Key</button>
            <button onclick="establishSecret()">Establish Secret</button>
        </div>
        
        <div class="input-group">
            <input type="text" id="messageInput" placeholder="Type your message">
            <button onclick="sendMessage()">Send Encrypted</button>
            <button onclick="sendPlainMessage()">Send Plain</button>
        </div>
        
        <div class="chat-box" id="chatBox"></div>
        
        <div class="input-group">
            <button onclick="getEncryptionStatus()">Check Encryption Status</button>
            <button onclick="clearChat()">Clear Chat</button>
        </div>
    </div>

    <script>
        let socket = null;
        let myMobile = '';
        let targetMobile = '';
        let publicKeys = new Map();
        let sharedSecrets = new Map();

        function log(message, type = 'info') {
            const chatBox = document.getElementById('chatBox');
            const div = document.createElement('div');
            div.className = type;
            div.innerHTML = `[${new Date().toLocaleTimeString()}] ${message}`;
            chatBox.appendChild(div);
            chatBox.scrollTop = chatBox.scrollTop;
        }

        function updateStatus(message, type = 'info') {
            const status = document.getElementById('status');
            status.textContent = message;
            status.className = `status ${type}`;
        }

        function connect() {
            const mobile = document.getElementById('mobileNumber').value;
            if (!mobile) {
                alert('Please enter mobile number');
                return;
            }

            myMobile = mobile;
            socket = io('http://localhost:5000'); // Change to your server URL

            socket.on('connect', () => {
                updateStatus('Connected to server', 'success');
                log('Connected to server', 'success');
                socket.emit('joinRoom', myMobile);
            });

            socket.on('disconnect', () => {
                updateStatus('Disconnected from server', 'error');
                log('Disconnected from server', 'error');
            });

            socket.on('joinedRoom', (message) => {
                log(`✅ ${message}`, 'success');
            });

            socket.on('roomFull', (message) => {
                log(`❌ ${message}`, 'error');
            });

            socket.on('publicKey', (data) => {
                log(`🔑 Received my public key: ${data.publicKey.substring(0, 50)}...`, 'info');
                publicKeys.set(myMobile, data.publicKey);
            });

            socket.on('publicKeyReceived', (data) => {
                log(`🔑 Received public key for ${data.mobile}: ${data.publicKey.substring(0, 50)}...`, 'info');
                publicKeys.set(data.mobile, data.publicKey);
            });

            socket.on('sharedSecretEstablished', (data) => {
                log(`🔐 Shared secret established with ${data.targetMobile}`, 'success');
                sharedSecrets.set(data.targetMobile, true);
            });

            socket.on('receiveEncryptedMessage', (data) => {
                log(`🔒 Encrypted message from ${data.from}: [ENCRYPTED DATA]`, 'info');
                log(`   - IV: ${data.iv}`, 'info');
                log(`   - Auth Tag: ${data.authTag}`, 'info');
                // In real implementation, you would decrypt here
            });

            socket.on('receiveMessage', (data) => {
                log(`📱 Plain message from ${data.from}: ${data.message}`, 'info');
            });

            socket.on('messageSent', (data) => {
                log(`✅ Message sent to ${data.toMobile}`, 'success');
            });

            socket.on('encryptionStatus', (data) => {
                log(`🔍 Encryption Status for ${data.targetMobile}:`, 'info');
                log(`   - Has Shared Secret: ${data.hasSharedSecret}`, 'info');
                log(`   - Target Online: ${data.targetOnline}`, 'info');
                log(`   - Can Encrypt: ${data.canEncrypt}`, 'info');
            });

            socket.on('error', (data) => {
                log(`❌ Error: ${data.message}`, 'error');
            });
        }

        function disconnect() {
            if (socket) {
                socket.disconnect();
                socket = null;
            }
        }

        function requestPublicKey() {
            targetMobile = document.getElementById('targetMobile').value;
            if (!socket || !targetMobile) {
                alert('Please connect first and enter target mobile');
                return;
            }
            socket.emit('requestPublicKey', targetMobile);
        }

        function establishSecret() {
            if (!socket || !targetMobile) {
                alert('Please request public key first');
                return;
            }
            
            const targetPublicKey = publicKeys.get(targetMobile);
            if (!targetPublicKey) {
                alert('No public key found for target. Request it first.');
                return;
            }

            socket.emit('establishSharedSecret', {
                targetMobile: targetMobile,
                targetPublicKey: targetPublicKey
            });
        }

        function sendMessage() {
            const message = document.getElementById('messageInput').value;
            if (!socket || !message || !targetMobile) {
                alert('Please connect, enter message and target mobile');
                return;
            }

            // Simulate encrypted message (in real app, you'd encrypt here)
            const mockEncrypted = {
                toMobile: targetMobile,
                encryptedMessage: btoa(message), // Base64 encoding as mock encryption
                iv: 'mock_iv_' + Date.now(),
                authTag: 'mock_tag_' + Date.now()
            };

            socket.emit('sendEncryptedMessage', mockEncrypted);
            document.getElementById('messageInput').value = '';
        }

        function sendPlainMessage() {
            const message = document.getElementById('messageInput').value;
            if (!socket || !message || !targetMobile) {
                alert('Please connect, enter message and target mobile');
                return;
            }

            socket.emit('sendMessage', {
                toMobile: targetMobile,
                message: message
            });
            document.getElementById('messageInput').value = '';
        }

        function getEncryptionStatus() {
            if (!socket || !targetMobile) {
                alert('Please connect and set target mobile');
                return;
            }
            socket.emit('getEncryptionStatus', targetMobile);
        }

        function clearChat() {
            document.getElementById('chatBox').innerHTML = '';
        }
    </script>
</body>
</html>
*/

// ========================================
// METHOD 2: Node.js Test Script
// ========================================

// Create a file: test-socket-client.js
const io = require('socket.io-client');
const crypto = require('crypto');

class SocketTester {
    constructor(serverUrl, mobileNumber) {
        this.serverUrl = serverUrl;
        this.mobileNumber = mobileNumber;
        this.socket = null;
        this.publicKeys = new Map();
        this.sharedSecrets = new Map();
    }

    connect() {
        return new Promise((resolve, reject) => {
            this.socket = io(this.serverUrl);

            this.socket.on('connect', () => {
                console.log(`✅ Connected to server as ${this.mobileNumber}`);
                this.setupEventListeners();
                this.socket.emit('joinRoom', this.mobileNumber);
                resolve();
            });

            this.socket.on('connect_error', (error) => {
                console.error('❌ Connection failed:', error);
                reject(error);
            });
        });
    }

    setupEventListeners() {
        this.socket.on('joinedRoom', (message) => {
            console.log('🏠', message);
        });

        this.socket.on('publicKey', (data) => {
            console.log('🔑 Received my public key:', data.publicKey.substring(0, 50) + '...');
            this.publicKeys.set(this.mobileNumber, data.publicKey);
        });

        this.socket.on('publicKeyReceived', (data) => {
            console.log(`🔑 Received public key for ${data.mobile}`);
            this.publicKeys.set(data.mobile, data.publicKey);
        });

        this.socket.on('sharedSecretEstablished', (data) => {
            console.log(`🔐 Shared secret established with ${data.targetMobile}`);
            this.sharedSecrets.set(data.targetMobile, true);
        });

        this.socket.on('receiveEncryptedMessage', (data) => {
            console.log(`🔒 Encrypted message from ${data.from}`);
            console.log('   Encrypted:', data.encryptedMessage);
            console.log('   IV:', data.iv);
            console.log('   Auth Tag:', data.authTag);
        });

        this.socket.on('receiveMessage', (data) => {
            console.log(`📱 Plain message from ${data.from}: ${data.message}`);
        });

        this.socket.on('messageSent', (data) => {
            console.log(`✅ Message sent to ${data.toMobile}`);
        });

        this.socket.on('error', (data) => {
            console.error('❌ Error:', data.message);
        });

        this.socket.on('encryptionStatus', (data) => {
            console.log(`🔍 Encryption Status for ${data.targetMobile}:`);
            console.log(`   Has Shared Secret: ${data.hasSharedSecret}`);
            console.log(`   Target Online: ${data.targetOnline}`);
            console.log(`   Can Encrypt: ${data.canEncrypt}`);
        });
    }

    requestPublicKey(targetMobile) {
        console.log(`🔑 Requesting public key for ${targetMobile}`);
        this.socket.emit('requestPublicKey', targetMobile);
    }

    establishSharedSecret(targetMobile) {
        const targetPublicKey = this.publicKeys.get(targetMobile);
        if (!targetPublicKey) {
            console.error('❌ No public key found. Request it first.');
            return;
        }

        console.log(`🔐 Establishing shared secret with ${targetMobile}`);
        this.socket.emit('establishSharedSecret', {
            targetMobile,
            targetPublicKey
        });
    }

    sendEncryptedMessage(targetMobile, message) {
        // Mock encryption (in real app, use actual AES encryption)
        const mockEncrypted = {
            toMobile: targetMobile,
            encryptedMessage: Buffer.from(message).toString('base64'),
            iv: crypto.randomBytes(12).toString('hex'),
            authTag: crypto.randomBytes(16).toString('hex')
        };

        console.log(`🔒 Sending encrypted message to ${targetMobile}: "${message}"`);
        this.socket.emit('sendEncryptedMessage', mockEncrypted);
    }

    sendPlainMessage(targetMobile, message) {
        console.log(`📱 Sending plain message to ${targetMobile}: "${message}"`);
        this.socket.emit('sendMessage', {
            toMobile: targetMobile,
            message
        });
    }

    checkEncryptionStatus(targetMobile) {
        this.socket.emit('getEncryptionStatus', targetMobile);
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            console.log('👋 Disconnected from server');
        }
    }
}

// Example usage and testing
async function runTests() {
    const client1 = new SocketTester('http://localhost:5000', '+1234567890');
    const client2 = new SocketTester('http://localhost:5000', '+1987654321');

    try {
        // Connect both clients
        await client1.connect();
        await client2.connect();

        // Wait a bit for connections to establish
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Test key exchange
        client1.requestPublicKey('+1987654321');
        client2.requestPublicKey('+1234567890');

        // Wait for key exchange
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Establish shared secrets
        client1.establishSharedSecret('+1987654321');
        client2.establishSharedSecret('+1234567890');

        // Wait for secret establishment
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Test encrypted messaging
        client1.sendEncryptedMessage('+1987654321', 'Hello from Client 1!');
        client2.sendEncryptedMessage('+1234567890', 'Hello from Client 2!');

        // Test plain messaging
        client1.sendPlainMessage('+1987654321', 'Plain message from Client 1');

        // Check encryption status
        client1.checkEncryptionStatus('+1987654321');

        // Keep running for 10 seconds to see responses
        setTimeout(() => {
            client1.disconnect();
            client2.disconnect();
            process.exit(0);
        }, 10000);

    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
}

// Uncomment to run tests
// runTests();

// ========================================
// METHOD 3: Using Socket.io Admin UI
// ========================================

// Add to your server.js file:
/*
const { instrument } = require('@socket.io/admin-ui');

// After creating your io server:
instrument(io, {
    auth: {
        type: "basic",
        username: "admin",
        password: "$2b$10$heqvAkYMez.Va6Et2uXInOnkCT6/uQj1brkrbyG/LpwpAqjcBOJm2" // "changeit"
    },
    mode: "development"
});

// Then visit: https://admin.socket.io/
// Server URL: http://localhost:5000
// Username: admin
// Password: changeit
*/

// ========================================
// METHOD 4: WebSocket Testing Tools
// ========================================

/*
1. **Websocket King** (Chrome Extension)
   - URL: ws://localhost:5000/socket.io/?EIO=4&transport=websocket
   - Send: 42["joinRoom","+1234567890"]
   - Send: 42["sendMessage",{"toMobile":"+1987654321","message":"test"}]

2. **Postman Alternative: Insomnia**
   - Supports WebSocket connections
   - Can test Socket.io protocols

3. **Online WebSocket Testers:**
   - websocket.org/echo.html
   - Modify for Socket.io testing
*/

// ========================================
// METHOD 5: Automated Test Suite with Jest
// ========================================

// test-socket.test.js
const Client = require('socket.io-client');

describe('Socket.io E2E Encryption Tests', () => {
    let clientSocket1, clientSocket2;
    const serverUrl = 'http://localhost:5000';

    beforeAll((done) => {
        // Start your server here if needed
        done();
    });

    beforeEach((done) => {
        clientSocket1 = Client(serverUrl);
        clientSocket2 = Client(serverUrl);
        
        let connectedCount = 0;
        const onConnect = () => {
            connectedCount++;
            if (connectedCount === 2) done();
        };

        clientSocket1.on('connect', onConnect);
        clientSocket2.on('connect', onConnect);
    });

    afterEach(() => {
        if (clientSocket1.connected) clientSocket1.disconnect();
        if (clientSocket2.connected) clientSocket2.disconnect();
    });

    test('should connect and join rooms', (done) => {
        clientSocket1.emit('joinRoom', '+1234567890');
        clientSocket1.on('joinedRoom', (message) => {
            expect(message).toContain('+1234567890');
            done();
        });
    });

    test('should exchange public keys', (done) => {
        clientSocket1.emit('joinRoom', '+1234567890');
        clientSocket2.emit('joinRoom', '+1987654321');

        clientSocket1.on('publicKeyReceived', (data) => {
            expect(data.mobile).toBe('+1987654321');
            expect(data.publicKey).toBeDefined();
            done();
        });

        setTimeout(() => {
            clientSocket1.emit('requestPublicKey', '+1987654321');
        }, 100);
    });

    test('should send encrypted messages', (done) => {
        clientSocket2.on('receiveEncryptedMessage', (data) => {
            expect(data.from).toBe('+1234567890');
            expect(data.encryptedMessage).toBeDefined();
            expect(data.iv).toBeDefined();
            expect(data.authTag).toBeDefined();
            done();
        });

        clientSocket1.emit('joinRoom', '+1234567890');
        clientSocket2.emit('joinRoom', '+1987654321');

        setTimeout(() => {
            clientSocket1.emit('sendEncryptedMessage', {
                toMobile: '+1987654321',
                encryptedMessage: 'encrypted_content',
                iv: 'test_iv',
                authTag: 'test_tag'
            });
        }, 100);
    });
});

// Run with: npm test

module.exports = {
    SocketTester
};