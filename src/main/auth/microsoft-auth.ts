import { fetchJSON, postForm, postJSON } from '../utils/http';

// Microsoft Authentication Constants
const MICROSOFT_AUTH_URL = 'https://login.microsoftonline.com/consumers/oauth2/v2.0/devicecode';
const MICROSOFT_TOKEN_URL = 'https://login.microsoftonline.com/consumers/oauth2/v2.0/token';
const XBL_AUTH_URL = 'https://user.auth.xboxlive.com/user/authenticate';
const XSTS_AUTH_URL = 'https://xsts.auth.xboxlive.com/xsts/authorize';
const MC_AUTH_URL = 'https://api.minecraftservices.com/authentication/login_with_xbox';
const MC_PROFILE_URL = 'https://api.minecraftservices.com/minecraft/profile';

// Microsoft Client ID (you need to register your app in Azure)
// For now using a placeholder - in production you need your own client ID
const CLIENT_ID = 'YOUR_CLIENT_ID'; // Replace with your Azure app client ID

export interface AuthTokens {
  microsoft: {
    access_token: string;
    refresh_token: string;
  };
  minecraft: {
    access_token: string;
    profile: any;
  };
}

let authTokens: AuthTokens | null = null;

// Microsoft Authentication Functions
async function getDeviceCode(): Promise<any> {
  const data = {
    client_id: CLIENT_ID,
    scope: 'XboxLive.signin offline_access'
  };
  
  return await postForm(MICROSOFT_AUTH_URL, data);
}

async function getMicrosoftAccessToken(deviceCode: string): Promise<any> {
  const data = {
    client_id: CLIENT_ID,
    grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
    device_code: deviceCode
  };
  
  return await postForm(MICROSOFT_TOKEN_URL, data);
}

async function authenticateWithXbox(accessToken: string): Promise<any> {
  const data = {
    Properties: {
      AuthMethod: 'RPS',
      SiteName: 'user.auth.xboxlive.com',
      RpsTicket: `d=${accessToken}`
    },
    RelyingParty: 'http://auth.xboxlive.com',
    TokenType: 'JWT'
  };
  
  return await postJSON(XBL_AUTH_URL, data);
}

async function getXSTSToken(xboxToken: string, userHash: string): Promise<any> {
  const data = {
    Properties: {
      SandboxId: 'RETAIL',
      UserTokens: [xboxToken]
    },
    RelyingParty: 'rp://api.minecraftservices.com/',
    TokenType: 'JWT'
  };
  
  return await postJSON(XSTS_AUTH_URL, data);
}

async function authenticateWithMinecraft(xstsToken: string, userHash: string): Promise<any> {
  const data = {
    identityToken: `XBL3.0 x=${userHash};${xstsToken}`
  };
  
  return await postJSON(MC_AUTH_URL, data);
}

async function getMinecraftProfile(accessToken: string): Promise<any> {
  const options = {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  };
  
  return await fetchJSON(MC_PROFILE_URL, options);
}

// Complete Microsoft Authentication Flow
export async function microsoftAuthenticate(onProgress?: (message: string) => Promise<void>): Promise<any> {
  try {
    if (onProgress) await onProgress('Getting device code...');
    
    // Step 1: Get device code
    const deviceCodeResponse = await getDeviceCode();
    console.log('Device code obtained:', deviceCodeResponse);
    
    if (onProgress) {
      await onProgress(`Please visit ${deviceCodeResponse.verification_uri} and enter code: ${deviceCodeResponse.user_code}`);
    }
    
    // Step 2: Poll for access token
    let tokenResponse: any = null;
    const maxAttempts = 30; // 5 minutes with 10 second intervals
    let attempts = 0;
    
    while (attempts < maxAttempts && !tokenResponse) {
      await new Promise(resolve => setTimeout(resolve, deviceCodeResponse.interval * 1000));
      
      try {
        tokenResponse = await getMicrosoftAccessToken(deviceCodeResponse.device_code);
        console.log('Access token obtained');
      } catch (error: any) {
        if (error.message && error.message.includes('authorization_pending')) {
          console.log('Waiting for user to complete authentication...');
          attempts++;
        } else {
          throw error;
        }
      }
    }
    
    if (!tokenResponse) {
      throw new Error('Authentication timed out');
    }
    
    if (onProgress) await onProgress('Authenticating with Xbox Live...');
    
    // Step 3: Authenticate with Xbox Live
    const xboxResponse = await authenticateWithXbox(tokenResponse.access_token);
    console.log('Xbox authentication successful');
    
    if (onProgress) await onProgress('Getting XSTS token...');
    
    // Step 4: Get XSTS token
    const xstsResponse = await getXSTSToken(xboxResponse.Token, xboxResponse.DisplayClaims.xui[0].uhs);
    console.log('XSTS token obtained');
    
    if (onProgress) await onProgress('Authenticating with Minecraft...');
    
    // Step 5: Authenticate with Minecraft
    const mcResponse = await authenticateWithMinecraft(xstsResponse.Token, xboxResponse.DisplayClaims.xui[0].uhs);
    console.log('Minecraft authentication successful');
    
    if (onProgress) await onProgress('Getting Minecraft profile...');
    
    // Step 6: Get Minecraft profile
    const profile = await getMinecraftProfile(mcResponse.access_token);
    console.log('Minecraft profile obtained:', profile);
    
    // Store tokens
    authTokens = {
      microsoft: {
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token
      },
      minecraft: {
        access_token: mcResponse.access_token,
        profile: profile
      }
    };
    
    return {
      authenticated: true,
      username: profile.name,
      uuid: profile.id,
      profile: profile
    };
    
  } catch (error) {
    console.error('Microsoft authentication failed:', error);
    throw error;
  }
}

export function getAuthTokens(): AuthTokens | null {
  return authTokens;
}

export function clearAuthTokens(): void {
  authTokens = null;
}
