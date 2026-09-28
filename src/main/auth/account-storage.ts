import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';

export interface Account {
  id: string;
  username: string;
  uuid: string;
  type: 'offline' | 'microsoft';
  accessToken?: string;
  refreshToken?: string;
  profile?: {
    name: string;
    id: string;
  };
  createdAt: string;
  lastUsed: string;
}

export interface AccountsData {
  accounts: Account[];
  currentAccountId: string | null;
}

const ACCOUNTS_FILE = '.sigma-launcher.json';

// Get accounts file path
function getAccountsFilePath(): string {
  const homeDir = app.getPath('home');
  return path.join(homeDir, ACCOUNTS_FILE);
}

// Load accounts from file
export function loadAccounts(): AccountsData {
  const accountsPath = getAccountsFilePath();
  
  if (!fs.existsSync(accountsPath)) {
    // Create default accounts file
    const defaultData: AccountsData = {
      accounts: [],
      currentAccountId: null
    };
    fs.writeFileSync(accountsPath, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
  
  try {
    const data = fs.readFileSync(accountsPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to load accounts:', error);
    return { accounts: [], currentAccountId: null };
  }
}

// Save accounts to file
export function saveAccounts(data: AccountsData): void {
  const accountsPath = getAccountsFilePath();
  fs.writeFileSync(accountsPath, JSON.stringify(data, null, 2));
}

// Add offline account
export function addOfflineAccount(username: string, uuid: string): Account {
  const data = loadAccounts();
  
  // Check if account already exists
  const existingAccount = data.accounts.find(
    acc => acc.type === 'offline' && acc.username === username
  );
  
  if (existingAccount) {
    // Update last used
    existingAccount.lastUsed = new Date().toISOString();
    data.currentAccountId = existingAccount.id;
    saveAccounts(data);
    return existingAccount;
  }
  
  // Create new account
  const account: Account = {
    id: Date.now().toString(),
    username,
    uuid,
    type: 'offline',
    createdAt: new Date().toISOString(),
    lastUsed: new Date().toISOString()
  };
  
  data.accounts.push(account);
  data.currentAccountId = account.id;
  saveAccounts(data);
  
  return account;
}

// Add Microsoft account
export function addMicrosoftAccount(
  username: string,
  uuid: string,
  accessToken: string,
  refreshToken: string,
  profile: any
): Account {
  const data = loadAccounts();
  
  // Check if account already exists
  const existingAccount = data.accounts.find(
    acc => acc.type === 'microsoft' && acc.uuid === uuid
  );
  
  if (existingAccount) {
    // Update tokens and last used
    existingAccount.accessToken = accessToken;
    existingAccount.refreshToken = refreshToken;
    existingAccount.lastUsed = new Date().toISOString();
    data.currentAccountId = existingAccount.id;
    saveAccounts(data);
    return existingAccount;
  }
  
  // Create new account
  const account: Account = {
    id: Date.now().toString(),
    username,
    uuid,
    type: 'microsoft',
    accessToken,
    refreshToken,
    profile,
    createdAt: new Date().toISOString(),
    lastUsed: new Date().toISOString()
  };
  
  data.accounts.push(account);
  data.currentAccountId = account.id;
  saveAccounts(data);
  
  return account;
}

// Get current account
export function getCurrentAccount(): Account | null {
  const data = loadAccounts();
  
  if (!data.currentAccountId) {
    return null;
  }
  
  return data.accounts.find(acc => acc.id === data.currentAccountId) || null;
}

// Set current account
export function setCurrentAccount(accountId: string): void {
  const data = loadAccounts();
  data.currentAccountId = accountId;
  saveAccounts(data);
}

// Get all accounts
export function getAllAccounts(): Account[] {
  const data = loadAccounts();
  return data.accounts;
}

// Delete account
export function deleteAccount(accountId: string): void {
  const data = loadAccounts();
  data.accounts = data.accounts.filter(acc => acc.id !== accountId);
  
  if (data.currentAccountId === accountId) {
    data.currentAccountId = null;
  }
  
  saveAccounts(data);
}

// Update Microsoft account tokens
export function updateMicrosoftTokens(
  accountId: string,
  accessToken: string,
  refreshToken: string
): void {
  const data = loadAccounts();
  const account = data.accounts.find(acc => acc.id === accountId);
  
  if (account && account.type === 'microsoft') {
    account.accessToken = accessToken;
    account.refreshToken = refreshToken;
    account.lastUsed = new Date().toISOString();
    saveAccounts(data);
  }
}
