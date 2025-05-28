// socket/index.js
const crypto = require('crypto');

// Store user public keys and shared secrets (in production, use Redis or DB)
const userKeys = new Map(); // mobileNumber -> { publicKey, socket }
const sharedSecrets = new Map(); // room identifier -> shared secret

class CryptoManager {
  // Generate ECC key pair
  static generateECCKeyPair() {
    return crypto.generateKeyPairSync('ec', {
      namedCurve: 'secp256k1',
      publicKeyEncoding: {
        type: 'spki',
        format: 'der'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'der'
      }
    });
  }

  // Derive shared secret using ECDH
  static deriveSharedSecret(privateKey, publicKey) {
    const ecdh = crypto.createECDH('secp256k1');
    ecdh.setPrivateKey(privateKey);
    return ecdh.computeSecret(publicKey);
  }

  // Derive AES key from shared secret using HKDF
  static deriveAESKey(sharedSecret, salt = 'chat-app-salt') {
    return crypto.hkdfSync('sha256', sharedSecret, salt, 'AES Key', 32);
  }

  // Encrypt message with AES-256-GCM
  static encryptMessage(message, key) {
    const iv = crypto.randomBytes(12); // 96-bit IV for GCM
    const cipher = crypto.createCipher('aes-256-gcm', key);
    cipher.setAAD(Buffer.from('chat-message', 'utf8')); // Additional authenticated data
    
    let encrypted = cipher.update(message, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  // Decrypt message with AES-256-GCM
  static decryptMessage(encryptedData, key) {
    const { encrypted, iv, authTag } = encryptedData;
    
    const decipher = crypto.createDecipher('aes-256-gcm', key);
    decipher.setAAD(Buffer.from('chat-message', 'utf8'));
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  // Create room identifier for consistent shared secret storage
  static createRoomId(mobile1, mobile2) {
    return [mobile1, mobile2].sort().join('-');
  }
}

function setupSocket(io) {
  io.on('connection', (socket) => {
    console.log(`New client connected: ${socket.id}`);

    // Generate ECC key pair for this socket connection
    const keyPair = CryptoManager.generateECCKeyPair();
    socket.eccPrivateKey = keyPair.privateKey;
    socket.eccPublicKey = keyPair.publicKey;

    socket.on('joinRoom', (mobileNumber) => {
      const room = io.sockets.adapter.rooms.get(mobileNumber);
      const numClients = room ? room.size : 0;

      if (numClients >= 2) {
        socket.emit('roomFull', `Room for mobile number ${mobileNumber} is full.`);
        return;
      }

      console.log(`${socket.id} joining room: ${mobileNumber}`);
      socket.join(mobileNumber);
      socket.mobileNumber = mobileNumber;

      // Store user's public key
      userKeys.set(mobileNumber, {
        publicKey: socket.eccPublicKey,
        socket: socket
      });

      // Send public key to client
      socket.emit('publicKey', {
        publicKey: socket.eccPublicKey.toString('base64')
      });

      socket.emit('joinedRoom', `Joined room for mobile number: ${mobileNumber}`);
    });

    // Handle public key exchange
    socket.on('requestPublicKey', (targetMobile) => {
      const targetUser = userKeys.get(targetMobile);
      if (targetUser) {
        socket.emit('publicKeyReceived', {
          mobile: targetMobile,
          publicKey: targetUser.publicKey.toString('base64')
        });
      } else {
        socket.emit('error', { message: 'Target user not found or offline' });
      }
    });

    // Handle key exchange completion and shared secret derivation
    socket.on('establishSharedSecret', ({ targetMobile, targetPublicKey }) => {
      try {
        // Convert base64 public key back to buffer
        const targetPubKey = Buffer.from(targetPublicKey, 'base64');
        
        // Derive shared secret using ECDH
        const sharedSecret = CryptoManager.deriveSharedSecret(
          socket.eccPrivateKey, 
          targetPubKey
        );

        // Derive AES key from shared secret
        const aesKey = CryptoManager.deriveAESKey(sharedSecret);

        // Store shared secret for this conversation
        const roomId = CryptoManager.createRoomId(socket.mobileNumber, targetMobile);
        sharedSecrets.set(roomId, aesKey);

        socket.emit('sharedSecretEstablished', { 
          targetMobile,
          roomId 
        });

        console.log(`Shared secret established between ${socket.mobileNumber} and ${targetMobile}`);
      } catch (error) {
        console.error('Error establishing shared secret:', error);
        socket.emit('error', { message: 'Failed to establish shared secret' });
      }
    });

    // Handle encrypted message sending
    socket.on('sendEncryptedMessage', ({ toMobile, encryptedMessage, iv, authTag }) => {
      try {
        console.log(`Encrypted message from ${socket.mobileNumber} to ${toMobile}`);

        // Forward encrypted message to recipient
        socket.to(toMobile).emit('receiveEncryptedMessage', {
          from: socket.mobileNumber,
          encryptedMessage,
          iv,
          authTag,
          timestamp: Date.now()
        });

        socket.emit('messageSent', { 
          toMobile, 
          encrypted: true,
          timestamp: Date.now()
        });

      } catch (error) {
        console.error('Error sending encrypted message:', error);
        socket.emit('error', { message: 'Failed to send encrypted message' });
      }
    });

    // Legacy support for unencrypted messages (optional)
    socket.on('sendMessage', ({ toMobile, message }) => {
      console.log(`[UNENCRYPTED] Message from ${socket.mobileNumber} to ${toMobile}: ${message}`);
      console.warn('WARNING: Unencrypted message sent. Consider using sendEncryptedMessage for security.');

      socket.to(toMobile).emit('receiveMessage', {
        from: socket.mobileNumber,
        message,
        encrypted: false
      });

      socket.emit('messageSent', { toMobile, message, encrypted: false });
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id} (${socket.mobileNumber})`);
      
      // Clean up user data
      if (socket.mobileNumber) {
        userKeys.delete(socket.mobileNumber);
        
        // Clean up shared secrets involving this user
        for (const [roomId, secret] of sharedSecrets.entries()) {
          if (roomId.includes(socket.mobileNumber)) {
            sharedSecrets.delete(roomId);
          }
        }
      }
    });

    // Utility endpoint to get encryption status
    socket.on('getEncryptionStatus', (targetMobile) => {
      const roomId = CryptoManager.createRoomId(socket.mobileNumber, targetMobile);
      const hasSharedSecret = sharedSecrets.has(roomId);
      const targetOnline = userKeys.has(targetMobile);

      socket.emit('encryptionStatus', {
        targetMobile,
        hasSharedSecret,
        targetOnline,
        canEncrypt: hasSharedSecret && targetOnline
      });
    });
  });
}

module.exports = {
  setupSocket,
  CryptoManager // Export for testing purposes
};