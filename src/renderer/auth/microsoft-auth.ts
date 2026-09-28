export class MicrosoftAuthHandler {
  async handleMicrosoftLogin(): Promise<void> {
    console.log('Handle Microsoft login called');
    
    try {
      // Set up progress listener
      (window as any).electronAPI.onAuthProgress((message: string) => {
        console.log('Auth progress:', message);
        alert(message); // For now, use alert to show progress
      });
      
      // Start Microsoft authentication
      const user = await (window as any).electronAPI.microsoftLogin();
      
      // Clean up
      (window as any).electronAPI.removeAuthProgressListener();
      
      if (user.authenticated) {
        // Emit event for successful login
        const event = new CustomEvent('microsoft-login-success', { detail: user });
        window.dispatchEvent(event);
      }
    } catch (error) {
      console.error('Microsoft login failed:', error);
      (window as any).electronAPI.removeAuthProgressListener();
      alert('Microsoft login failed. Please check the console for details.');
      
      // Emit event for failed login
      const event = new CustomEvent('microsoft-login-failed', { detail: error });
      window.dispatchEvent(event);
    }
  }
}
