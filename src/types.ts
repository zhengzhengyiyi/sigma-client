// Define the ElectronAPI interface locally to avoid import issues
export interface ElectronAPI {
  // Store methods
  getStoreValue: (key: string) => Promise<any>;
  setStoreValue: (key: string, value: any) => Promise<boolean>;
  getStoreAll: () => Promise<Record<string, any>>;
  clearStore: () => Promise<boolean>;
  
  // File system methods
  readFile: (filePath: string) => Promise<string>;
  writeFile: (filePath: string, content: string) => Promise<void>;
  deleteFile: (filePath: string) => Promise<void>;
  listDirectory: (dirPath: string) => Promise<string[]>;
  directoryExists: (dirPath: string) => Promise<boolean>;
  
  // Auth methods
  login: (credentials: { username: string; password: string }) => Promise<any>;
  microsoftLogin: () => Promise<any>;
  logout: () => Promise<boolean>;
  getCurrentUser: () => Promise<any>;
  validateToken: (accessToken: string) => Promise<boolean>;
  getAccounts: () => Promise<any[]>;
  switchAccount: (accountId: string) => Promise<any>;
  deleteAccount: (accountId: string) => Promise<boolean>;
  
  // Instance methods
  createInstance: (instanceData: any) => Promise<any>;
  deleteInstance: (instanceId: string) => Promise<boolean>;
  getAllInstances: () => Promise<any[]>;
  getInstance: (instanceId: string) => Promise<any>;
  launchInstance: (instanceId: string) => Promise<{ success: boolean; error?: string }>;
  
  // Java detection
  detectJava: () => Promise<string[]>;
  
  // Minecraft download
  downloadMinecraft: (versionId: string) => Promise<void>;
  getMinecraftVersions: () => Promise<any[]>;
  
  // Event listeners
  onMinecraftDownloadProgress: (callback: (data: { progress: number; message: string }) => void) => void;
  removeMinecraftDownloadProgressListener: () => void;
  onAuthProgress: (callback: (message: string) => void) => void;
  removeAuthProgressListener: () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
