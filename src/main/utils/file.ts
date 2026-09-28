import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';

// Get Minecraft directory path
export function getMinecraftDirectory(): string {
  const homeDir = app.getPath('home');
  return path.join(homeDir, 'sigma_client');
}

// Ensure directory exists
export function ensureDirectory(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}
