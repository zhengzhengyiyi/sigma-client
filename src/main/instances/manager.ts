import * as fs from 'fs';
import * as path from 'path';
import { getMinecraftDirectory, ensureDirectory } from '../utils/file';

const INSTANCES_FILE = 'instances.json';

// Simple in-memory store for instances (will be loaded from file)
let instances: any[] = [];

export interface InstanceData {
  name: string;
  version: string;
  memory: number;
  createdAt: string;
  lastPlayed: string | null;
}

export interface Instance extends InstanceData {
  id: string;
}

// Load instances from file
export function loadInstances(): void {
  try {
    const minecraftDir = getMinecraftDirectory();
    ensureDirectory(minecraftDir);
    
    const instancesFilePath = path.join(minecraftDir, INSTANCES_FILE);
    
    if (fs.existsSync(instancesFilePath)) {
      const data = fs.readFileSync(instancesFilePath, 'utf-8');
      instances = JSON.parse(data);
      console.log('Loaded instances from file:', instances.length);
    } else {
      instances = [];
      console.log('No instances file found, starting with empty list');
    }
  } catch (error) {
    console.error('Error loading instances:', error);
    instances = [];
  }
}

// Save instances to file
export function saveInstances(): void {
  try {
    const minecraftDir = getMinecraftDirectory();
    ensureDirectory(minecraftDir);
    
    const instancesFilePath = path.join(minecraftDir, INSTANCES_FILE);
    fs.writeFileSync(instancesFilePath, JSON.stringify(instances, null, 2));
    console.log('Saved instances to file:', instances.length);
  } catch (error) {
    console.error('Error saving instances:', error);
  }
}

// Create instance
export function createInstance(instanceData: InstanceData): Instance {
  const newInstance: Instance = {
    id: Date.now().toString(),
    ...instanceData
  };
  instances.push(newInstance);
  saveInstances(); // Save to file immediately
  console.log('Created instance:', newInstance);
  return newInstance;
}

// Delete instance
export function deleteInstance(instanceId: string): boolean {
  const initialLength = instances.length;
  instances = instances.filter(inst => inst.id !== instanceId);
  if (instances.length < initialLength) {
    saveInstances(); // Save to file immediately
    console.log('Deleted instance:', instanceId);
    return true;
  }
  return false;
}

// Get all instances
export function getAllInstances(): Instance[] {
  return instances;
}

// Get instance by ID
export function getInstance(instanceId: string): Instance | null {
  return instances.find(inst => inst.id === instanceId) || null;
}

// Update instance (e.g., last played time)
export function updateInstance(instanceId: string, updates: Partial<Instance>): boolean {
  const index = instances.findIndex(inst => inst.id === instanceId);
  if (index !== -1) {
    instances[index] = { ...instances[index], ...updates };
    saveInstances(); // Save to file immediately
    return true;
  }
  return false;
}

// Launch instance (placeholder)
export function launchInstance(instanceId: string): boolean {
  console.log('Launch instance:', instanceId);
  
  // Update last played time
  updateInstance(instanceId, { lastPlayed: new Date().toISOString() });
  
  // TODO: Implement actual instance launching
  return true;
}
