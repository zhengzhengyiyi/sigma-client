import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Store methods
  getStoreValue: (key: string) => ipcRenderer.invoke('store-get', key),
  setStoreValue: (key: string, value: any) => ipcRenderer.invoke('store-set', key, value),
  getStoreAll: () => ipcRenderer.invoke('store-get-all'),
  clearStore: () => ipcRenderer.invoke('store-clear'),
  
  // File system methods
  readFile: (filePath: string) => ipcRenderer.invoke('file-read', filePath),
  writeFile: (filePath: string, content: string) => ipcRenderer.invoke('file-write', filePath, content),
  deleteFile: (filePath: string) => ipcRenderer.invoke('file-delete', filePath),
  listDirectory: (dirPath: string) => ipcRenderer.invoke('file-list', dirPath),
  directoryExists: (dirPath: string) => ipcRenderer.invoke('file-exists', dirPath),
  
  // Auth methods
  login: (credentials: { username: string; password: string }) => ipcRenderer.invoke('auth-login', credentials),
  microsoftLogin: () => ipcRenderer.invoke('auth-microsoft-login'),
  logout: () => ipcRenderer.invoke('auth-logout'),
  getCurrentUser: () => ipcRenderer.invoke('auth-get-user'),
  validateToken: (accessToken: string) => ipcRenderer.invoke('auth-validate', accessToken),
  getAccounts: () => ipcRenderer.invoke('auth-get-accounts'),
  switchAccount: (accountId: string) => ipcRenderer.invoke('auth-switch-account', accountId),
  deleteAccount: (accountId: string) => ipcRenderer.invoke('auth-delete-account', accountId),
  
  // Instance methods
  createInstance: (instanceData: any) => ipcRenderer.invoke('instance-create', instanceData),
  deleteInstance: (instanceId: string) => ipcRenderer.invoke('instance-delete', instanceId),
  getAllInstances: () => ipcRenderer.invoke('instance-get-all'),
  getInstance: (instanceId: string) => ipcRenderer.invoke('instance-get', instanceId),
  launchInstance: (instanceId: string) => ipcRenderer.invoke('instance-launch', instanceId),
  
  // Java detection
  detectJava: () => ipcRenderer.invoke('java-detect'),
  
  // Minecraft download
  downloadMinecraft: (versionId: string) => ipcRenderer.invoke('minecraft-download', versionId),
  getMinecraftVersions: () => ipcRenderer.invoke('minecraft-get-versions'),
  
  // Event listeners
  onMinecraftDownloadProgress: (callback: (data: { progress: number; message: string }) => void) => {
    ipcRenderer.on('minecraft-download-progress', (event, data) => callback(data));
  },
  removeMinecraftDownloadProgressListener: () => {
    ipcRenderer.removeAllListeners('minecraft-download-progress');
  },
  onAuthProgress: (callback: (message: string) => void) => {
    ipcRenderer.on('auth-progress', (event, message) => callback(message));
  },
  removeAuthProgressListener: () => {
    ipcRenderer.removeAllListeners('auth-progress');
  },
});
