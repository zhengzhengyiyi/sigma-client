import * as crypto from 'crypto';

export interface OfflineUser {
  username: string;
  uuid: string;
  createdAt: string;
}

// Generate random username
export function generateRandomUsername(): string {
  const adjectives = ['Happy', 'Brave', 'Swift', 'Clever', 'Bold', 'Calm', 'Bright', 'Kind', 'Wise', 'Cool'];
  const nouns = ['Player', 'Miner', 'Builder', 'Explorer', 'Warrior', 'Wizard', 'Knight', 'Hero', 'Champion', 'Legend'];
  const numbers = Math.floor(Math.random() * 999);
  
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  
  return `${adjective}${noun}${numbers}`;
}

// Generate UUID for offline mode (v3 UUID based on username)
export function generateOfflineUUID(username: string): string {
  // Generate v3 UUID (namespace-based) for consistent UUID per username
  const namespace = '00000000-0000-0000-0000-000000000000';
  const name = username;
  
  // Simple v3-like UUID generation
  const hash = crypto.createHash('md5').update(namespace + name).digest('hex');
  const uuid = [
    hash.substring(0, 8),
    hash.substring(8, 12),
    hash.substring(12, 16),
    '3' + hash.substring(13, 16), // Version 3
    hash.substring(16, 20),
    hash.substring(20, 32)
  ].join('-');
  
  return uuid;
}

// Create offline user
export function createOfflineUser(username?: string): OfflineUser {
  const finalUsername = (username || generateRandomUsername()).trim();
  const uuid = generateOfflineUUID(finalUsername);
  
  return {
    username: finalUsername,
    uuid: uuid,
    createdAt: new Date().toISOString()
  };
}

// Validate offline username
export function validateOfflineUsername(username: string): boolean {
  // Minecraft usernames must be 3-16 characters, alphanumeric only
  const regex = /^[a-zA-Z0-9_]{3,16}$/;
  return regex.test(username);
}
