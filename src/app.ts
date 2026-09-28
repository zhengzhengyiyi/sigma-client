import './types';
import './styles.css';

class SigmaClientApp {
  currentSection: string;
  currentUser: any;

  constructor() {
    this.currentSection = 'home';
    this.currentUser = null;
    this.initialize();
  }

  async initialize() {
    console.log('App initializing...');
    this.setupNavigation();
    this.setupEventListeners();
    console.log('Event listeners setup complete');
    await this.loadUserState();
    await this.loadJavaInstallations();
    await this.loadMinecraftVersions();
    await this.loadInstances();
  }

  setupNavigation() {
    console.log('Setting up navigation...');
    const navItems = document.querySelectorAll('.nav-item');
    console.log('Found nav items:', navItems.length);
    
    navItems.forEach((item, index) => {
      console.log(`Setting up nav item ${index}:`, item);
      item.addEventListener('click', (e) => {
        console.log('Nav item clicked:', e);
        const target = e.currentTarget as HTMLElement;
        const section = target.getAttribute('data-section');
        console.log('Section:', section);
        if (section) {
          this.navigateToSection(section);
        }
      });
    });
  }

  navigateToSection(section: string) {
    console.log('Navigating to section:', section);
    
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
      if ((item as HTMLElement).getAttribute('data-section') === section) {
        item.classList.add('active');
        console.log('Added active class to:', item);
      }
    });

    // Update content sections
    document.querySelectorAll('.content-section').forEach(sec => {
      sec.classList.remove('active');
    });

    const targetSection = document.getElementById(`${section}-section`);
    if (targetSection) {
      targetSection.classList.add('active');
      console.log('Activated section:', targetSection);
    } else {
      console.error('Section not found:', section);
    }

    this.currentSection = section;
  }

  setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Microsoft login button
    const microsoftLoginBtn = document.querySelector('.microsoft-login');
    if (microsoftLoginBtn) {
      console.log('Found Microsoft login button');
      microsoftLoginBtn.addEventListener('click', () => {
        console.log('Microsoft login button clicked');
        this.handleMicrosoftLogin();
      });
    }

    // Simple login button
    const simpleLoginBtn = document.querySelector('.simple-login');
    if (simpleLoginBtn) {
      console.log('Found simple login button');
      simpleLoginBtn.addEventListener('click', () => {
        console.log('Simple login button clicked');
        this.handleLogin();
      });
    }

    // Quick action buttons
    const playButton = document.querySelector('.action-button.primary');
    if (playButton) {
      console.log('Found play button');
      playButton.addEventListener('click', () => {
        console.log('Play button clicked');
        this.handlePlay();
      });
    }

    const newInstanceButton = document.querySelector('.action-button.secondary');
    if (newInstanceButton) {
      console.log('Found new instance button');
      newInstanceButton.addEventListener('click', () => {
        console.log('New instance button clicked');
        this.handleNewInstance();
      });
    }

    // Create instance button
    const createInstanceBtn = document.querySelector('.create-instance-btn');
    if (createInstanceBtn) {
      console.log('Found create instance button');
      createInstanceBtn.addEventListener('click', () => {
        console.log('Create instance button clicked');
        this.handleNewInstance();
      });
    }

    // Download Minecraft button
    const downloadMinecraftBtn = document.getElementById('download-minecraft-btn');
    if (downloadMinecraftBtn) {
      downloadMinecraftBtn.addEventListener('click', () => {
        this.handleDownloadMinecraft();
      });
    }

    // Modal close button
    const modalClose = document.querySelector('#new-instance-modal .modal-close');
    if (modalClose) {
      modalClose.addEventListener('click', () => {
        this.closeNewInstanceModal();
      });
    }

    const usernameModalClose = document.querySelector('#username-modal .modal-close');
    if (usernameModalClose) {
      usernameModalClose.addEventListener('click', () => {
        this.closeUsernameModal();
      });
    }

    // Modal cancel button
    const modalCancel = document.querySelector('#new-instance-modal .modal-btn.cancel');
    if (modalCancel) {
      modalCancel.addEventListener('click', () => {
        this.closeNewInstanceModal();
      });
    }

    // Modal create button
    const modalCreate = document.querySelector('#new-instance-modal .modal-btn.create');
    if (modalCreate) {
      modalCreate.addEventListener('click', () => {
        this.handleCreateInstance();
      });
    }

    // Close modal when clicking outside
    const modal = document.getElementById('new-instance-modal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeNewInstanceModal();
        }
      });
    }

    // Username modal buttons
    const usernameModalConfirm = document.querySelector('#username-modal .modal-btn.confirm');
    if (usernameModalConfirm) {
      usernameModalConfirm.addEventListener('click', () => {
        this.handleUsernameLogin();
      });
    }

    const usernameModalCancel = document.querySelector('#username-modal .modal-btn.cancel');
    if (usernameModalCancel) {
      usernameModalCancel.addEventListener('click', () => {
        this.closeUsernameModal();
      });
    }

    // Close username modal when clicking outside
    const usernameModal = document.getElementById('username-modal');
    if (usernameModal) {
      usernameModal.addEventListener('click', (e) => {
        if (e.target === usernameModal) {
          this.closeUsernameModal();
        }
      });
    }
  }

  async loadUserState() {
    try {
      const user = await window.electronAPI.getCurrentUser();
      if (user && user.authenticated) {
        this.currentUser = user;
        this.updateUserUI(user);
      }
    } catch (error) {
      console.error('Failed to load user state:', error);
    }
  }

  async loadJavaInstallations() {
    try {
      const javaPaths = await window.electronAPI.detectJava();
      console.log('Detected Java installations:', javaPaths);
      
      const javaSelect = document.getElementById('java-path') as HTMLSelectElement;
      if (javaSelect) {
        // Clear existing options except the first one
        while (javaSelect.options.length > 1) {
          javaSelect.remove(1);
        }
        
        // Add detected Java installations
        javaPaths.forEach(javaPath => {
          const option = document.createElement('option');
          option.value = javaPath;
          option.textContent = javaPath;
          javaSelect.appendChild(option);
        });
      }
    } catch (error) {
      console.error('Failed to load Java installations:', error);
    }
  }

  async loadMinecraftVersions() {
    try {
      const versions = await window.electronAPI.getMinecraftVersions();
      console.log('Available Minecraft versions:', versions);
      
      const versionSelect = document.getElementById('minecraft-version') as HTMLSelectElement;
      if (versionSelect) {
        // Clear existing options except the first one
        while (versionSelect.options.length > 1) {
          versionSelect.remove(1);
        }
        
        // Add versions, prioritizing releases
        const releases = versions.filter((v: any) => v.type === 'release').slice(0, 10);
        const snapshots = versions.filter((v: any) => v.type === 'snapshot').slice(0, 5);
        
        releases.forEach((version: any) => {
          const option = document.createElement('option');
          option.value = version.id;
          option.textContent = `${version.id} (Release)`;
          versionSelect.appendChild(option);
        });
        
        snapshots.forEach((version: any) => {
          const option = document.createElement('option');
          option.value = version.id;
          option.textContent = `${version.id} (Snapshot)`;
          versionSelect.appendChild(option);
        });
      }
      
      // Set game directory
      const gameDirInput = document.getElementById('game-directory') as HTMLInputElement;
      if (gameDirInput) {
        gameDirInput.value = '~/sigma_client';
      }
    } catch (error) {
      console.error('Failed to load Minecraft versions:', error);
    }
  }

  updateUserUI(user: any) {
    const usernameElement = document.querySelector('.username');
    const loginButtons = document.querySelector('.login-buttons');
    
    if (usernameElement) {
      usernameElement.textContent = user.username;
    }
    
    if (loginButtons) {
      loginButtons.innerHTML = `
        <button class="login-btn logout-btn">Logout</button>
      `;
      
      const logoutBtn = document.querySelector('.logout-btn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', () => this.handleLogout());
      }
    }
  }

  async handleLogin() {
    console.log('Handle offline login called');
    this.openUsernameModal();
  }

  openUsernameModal() {
    const modal = document.getElementById('username-modal') as HTMLDivElement;
    if (modal) {
      modal.style.display = 'block';
      // Clear previous input
      const usernameInput = document.getElementById('offline-username') as HTMLInputElement;
      if (usernameInput) {
        usernameInput.value = '';
        usernameInput.focus();
      }
    }
  }

  closeUsernameModal() {
    const modal = document.getElementById('username-modal') as HTMLDivElement;
    if (modal) {
      modal.style.display = 'none';
    }
  }

  async handleUsernameLogin() {
    const usernameInput = document.getElementById('offline-username') as HTMLInputElement;
    const username = usernameInput.value.trim();
    
    try {
      const user = await window.electronAPI.login({ username, password: '' });
      
      if (user.authenticated) {
        this.currentUser = user;
        this.updateUserUI(user);
        this.closeUsernameModal();
        alert(`Logged in as ${user.username} (Offline Mode)`);
      }
    } catch (error) {
      console.error('Login failed:', error);
      alert('Login failed: ' + (error as Error).message);
    }
  }

  async handleMicrosoftLogin() {
    console.log('Handle Microsoft login called');
    
    try {
      // Set up progress listener
      window.electronAPI.onAuthProgress((message) => {
        console.log('Auth progress:', message);
        alert(message); // For now, use alert to show progress
      });
      
      // Start Microsoft authentication
      const user = await window.electronAPI.microsoftLogin();
      
      // Clean up
      window.electronAPI.removeAuthProgressListener();
      
      if (user.authenticated) {
        this.currentUser = user;
        this.updateUserUI(user);
        alert(`Successfully logged in as ${user.username}!`);
      }
    } catch (error) {
      console.error('Microsoft login failed:', error);
      window.electronAPI.removeAuthProgressListener();
      alert('Microsoft login failed. Please check the console for details.');
    }
  }

  async handleLogout() {
    try {
      await window.electronAPI.logout();
      this.currentUser = null;
      
      const usernameElement = document.querySelector('.username');
      const loginButtons = document.querySelector('.login-buttons');
      
      if (usernameElement) {
        usernameElement.textContent = 'Not logged in';
      }
      
      if (loginButtons) {
        loginButtons.innerHTML = `
          <button class="login-btn microsoft-login">Microsoft Login</button>
          <button class="login-btn simple-login">Simple Login</button>
        `;
        
        // Re-attach event listeners
        const microsoftLoginBtn = document.querySelector('.microsoft-login');
        if (microsoftLoginBtn) {
          microsoftLoginBtn.addEventListener('click', () => this.handleMicrosoftLogin());
        }
        
        const simpleLoginBtn = document.querySelector('.simple-login');
        if (simpleLoginBtn) {
          simpleLoginBtn.addEventListener('click', () => this.handleLogin());
        }
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  handlePlay() {
    console.log('Handle play called');
    if (!this.currentUser) {
      alert('Please login first');
      return;
    }
    
    // Check if there are any instances
    const instances = document.querySelectorAll('.instance-card:not(.empty)');
    if (instances.length === 0) {
      alert('No instances found. Please create an instance first.');
      this.navigateToSection('instances');
      return;
    }
    
    // If there's only one instance, launch it directly
    if (instances.length === 1) {
      const instanceId = (instances[0] as HTMLElement).getAttribute('data-id');
      this.handlePlayInstance(instanceId);
    } else {
      // Navigate to instances section to let user choose
      this.navigateToSection('instances');
    }
  }

  handleNewInstance() {
    console.log('Handle new instance called');
    this.openNewInstanceModal();
  }

  openNewInstanceModal() {
    const modal = document.getElementById('new-instance-modal') as HTMLDivElement;
    if (modal) {
      modal.style.display = 'block';
      this.populateInstanceVersionDropdown();
    }
  }

  closeNewInstanceModal() {
    const modal = document.getElementById('new-instance-modal') as HTMLDivElement;
    if (modal) {
      modal.style.display = 'none';
      // Clear form
      const nameInput = document.getElementById('instance-name') as HTMLInputElement;
      const versionSelect = document.getElementById('instance-version') as HTMLSelectElement;
      const memoryInput = document.getElementById('instance-memory') as HTMLInputElement;
      
      if (nameInput) nameInput.value = '';
      if (versionSelect) versionSelect.value = '';
      if (memoryInput) memoryInput.value = '2048';
    }
  }

  async populateInstanceVersionDropdown() {
    try {
      const versions = await window.electronAPI.getMinecraftVersions();
      const versionSelect = document.getElementById('instance-version') as HTMLSelectElement;
      
      if (versionSelect) {
        // Clear existing options except the first one
        while (versionSelect.options.length > 1) {
          versionSelect.remove(1);
        }
        
        // Add versions, prioritizing releases
        const releases = versions.filter((v: any) => v.type === 'release').slice(0, 15);
        const snapshots = versions.filter((v: any) => v.type === 'snapshot').slice(0, 5);
        
        releases.forEach((version: any) => {
          const option = document.createElement('option');
          option.value = version.id;
          option.textContent = `${version.id} (Release)`;
          versionSelect.appendChild(option);
        });
        
        snapshots.forEach((version: any) => {
          const option = document.createElement('option');
          option.value = version.id;
          option.textContent = `${version.id} (Snapshot)`;
          versionSelect.appendChild(option);
        });
      }
    } catch (error) {
      console.error('Failed to load Minecraft versions:', error);
    }
  }

  async handleCreateInstance() {
    const nameInput = document.getElementById('instance-name') as HTMLInputElement;
    const versionSelect = document.getElementById('instance-version') as HTMLSelectElement;
    const memoryInput = document.getElementById('instance-memory') as HTMLInputElement;
    
    const name = nameInput.value.trim();
    const version = versionSelect.value;
    const memory = parseInt(memoryInput.value);
    
    if (!name) {
      alert('Please enter an instance name');
      return;
    }
    
    if (!version) {
      alert('Please select a Minecraft version');
      return;
    }
    
    try {
      // Create instance data
      const instanceData = {
        name,
        version,
        memory,
        createdAt: new Date().toISOString(),
        lastPlayed: null as string | null
      };
      
      // Create instance via IPC
      const instance = await window.electronAPI.createInstance(instanceData);
      console.log('Instance created:', instance);
      
      // Close modal
      this.closeNewInstanceModal();
      
      // Refresh instances list
      this.loadInstances();
      
      // Ask if user wants to download the version
      const shouldDownload = confirm(`Instance "${name}" created successfully! Would you like to download Minecraft ${version} now?`);
      
      if (shouldDownload) {
        // Navigate to settings and start download
        this.navigateToSection('settings');
        
        // Set the version in settings dropdown
        const settingsVersionSelect = document.getElementById('minecraft-version') as HTMLSelectElement;
        if (settingsVersionSelect) {
          settingsVersionSelect.value = version;
        }
        
        // Start download
        await this.handleDownloadMinecraft();
      }
      
    } catch (error) {
      console.error('Failed to create instance:', error);
      alert('Failed to create instance. Please try again.');
    }
  }

  async loadInstances() {
    try {
      const instances = await window.electronAPI.getAllInstances();
      console.log('Loaded instances:', instances);
      
      // Update Instances section
      const instanceGrid = document.querySelector('.instance-grid') as HTMLDivElement;
      if (instanceGrid) {
        if (instances.length === 0) {
          instanceGrid.innerHTML = `
            <div class="instance-card empty">
              <p>No instances found</p>
            </div>
          `;
        } else {
          instanceGrid.innerHTML = '';
          instances.forEach((instance: any) => {
            const card = document.createElement('div');
            card.className = 'instance-card';
            card.setAttribute('data-id', instance.id);
            card.innerHTML = `
              <h3>${instance.name}</h3>
              <p>Version: ${instance.version}</p>
              <p>Memory: ${instance.memory}MB</p>
              <div class="instance-actions">
                <button class="play-instance-btn" data-id="${instance.id}">Play</button>
                <button class="delete-instance-btn" data-id="${instance.id}">Delete</button>
              </div>
            `;
            instanceGrid.appendChild(card);
          });
          
          // Add event listeners to new buttons
          document.querySelectorAll('.play-instance-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
              const card = (e.currentTarget as HTMLElement).closest('.instance-card') as HTMLElement;
              const instanceId = card.getAttribute('data-id');
              this.handlePlayInstance(instanceId);
            });
          });
          
          document.querySelectorAll('.delete-instance-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
              const card = (e.currentTarget as HTMLElement).closest('.instance-card') as HTMLElement;
              const instanceId = card.getAttribute('data-id');
              this.handleDeleteInstance(instanceId);
            });
          });
        }
      }
      
      // Update Home section's Recent Instances
      const recentInstancesList = document.querySelector('.instance-list') as HTMLDivElement;
      if (recentInstancesList) {
        if (instances.length === 0) {
          recentInstancesList.innerHTML = `
            <div class="instance-card empty">
              <p>No instances yet. Create your first instance!</p>
            </div>
          `;
        } else {
          recentInstancesList.innerHTML = '';
          // Show first 3 instances as recent
          const recentInstances = instances.slice(0, 3);
          recentInstances.forEach((instance: any) => {
            const card = document.createElement('div');
            card.className = 'instance-card';
            card.setAttribute('data-id', instance.id);
            card.innerHTML = `
              <h3>${instance.name}</h3>
              <p>Version: ${instance.version}</p>
              <p>Memory: ${instance.memory}MB</p>
              <div class="instance-actions">
                <button class="play-instance-btn" data-id="${instance.id}">Play</button>
              </div>
            `;
            recentInstancesList.appendChild(card);
          });
          
          // Add event listeners to recent instance buttons
          recentInstancesList.querySelectorAll('.play-instance-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
              const card = (e.currentTarget as HTMLElement).closest('.instance-card') as HTMLElement;
              const instanceId = card.getAttribute('data-id');
              this.handlePlayInstance(instanceId);
            });
          });
        }
      }
    } catch (error) {
      console.error('Failed to load instances:', error);
    }
  }

  async handlePlayInstance(instanceId: string | null) {
    if (!instanceId) return;
    console.log('Play instance:', instanceId);
    
    // Show launch progress immediately
    this.showLaunchProgress();
    
    // Start progress animation
    this.simulateLaunchProgress();
    
    try {
      const result = await window.electronAPI.launchInstance(instanceId);
      
      if (result.success) {
        // Wait a bit more then hide progress
        setTimeout(() => {
          this.hideLaunchProgress();
        }, 2000);
      } else {
        this.hideLaunchProgress();
        alert('Failed to launch Minecraft: ' + result.error);
      }
    } catch (error) {
      console.error('Failed to launch instance:', error);
      this.hideLaunchProgress();
      alert('Failed to launch instance');
    }
  }

  showLaunchProgress() {
    const progressOverlay = document.getElementById('launch-progress') as HTMLDivElement;
    if (progressOverlay) {
      progressOverlay.classList.add('active');
    }
  }

  hideLaunchProgress() {
    const progressOverlay = document.getElementById('launch-progress') as HTMLDivElement;
    if (progressOverlay) {
      progressOverlay.classList.remove('active');
    }
    
    // Reset progress bar
    const progressBar = document.getElementById('launch-progress-bar') as HTMLDivElement;
    if (progressBar) {
      progressBar.style.width = '0%';
    }
  }

  simulateLaunchProgress() {
    const progressBar = document.getElementById('launch-progress-bar') as HTMLDivElement;
    const statusText = document.getElementById('launch-status') as HTMLParagraphElement;
    
    const steps = [
      { progress: 20, status: 'Validating instance...', delay: 500 },
      { progress: 40, status: 'Checking Java installation...', delay: 800 },
      { progress: 60, status: 'Preparing libraries...', delay: 800 },
      { progress: 80, status: 'Loading game assets...', delay: 800 },
      { progress: 100, status: 'Starting Minecraft...', delay: 1000 }
    ];
    
    let currentStep = 0;
    
    const runStep = () => {
      if (currentStep >= steps.length) return;
      
      const step = steps[currentStep];
      if (progressBar) progressBar.style.width = step.progress + '%';
      if (statusText) statusText.textContent = step.status;
      
      currentStep++;
      setTimeout(runStep, step.delay);
    };
    
    runStep();
  }

  async handleDeleteInstance(instanceId: string | null) {
    if (!instanceId) return;
    
    if (confirm('Are you sure you want to delete this instance?')) {
      try {
        await window.electronAPI.deleteInstance(instanceId);
        console.log('Instance deleted:', instanceId);
        this.loadInstances();
        alert('Instance deleted successfully');
      } catch (error) {
        console.error('Failed to delete instance:', error);
        alert('Failed to delete instance');
      }
    }
  }

  async handleDownloadMinecraft() {
    const versionSelect = document.getElementById('minecraft-version') as HTMLSelectElement;
    const downloadBtn = document.getElementById('download-minecraft-btn') as HTMLButtonElement;
    const progressContainer = document.getElementById('download-progress-container');
    const progressBar = document.getElementById('download-progress-bar') as HTMLDivElement;
    const downloadStatus = document.getElementById('download-status') as HTMLDivElement;
    
    if (!versionSelect.value) {
      alert('Please select a Minecraft version first');
      return;
    }
    
    try {
      // Disable button and show progress
      downloadBtn.disabled = true;
      downloadBtn.textContent = 'Downloading...';
      progressContainer.style.display = 'block';
      
      // Set up progress listener
      window.electronAPI.onMinecraftDownloadProgress((data) => {
        progressBar.style.width = `${data.progress}%`;
        downloadStatus.textContent = data.message;
      });
      
      // Start download
      await window.electronAPI.downloadMinecraft(versionSelect.value);
      
      // Clean up
      window.electronAPI.removeMinecraftDownloadProgressListener();
      downloadBtn.disabled = false;
      downloadBtn.textContent = 'Download Minecraft';
      downloadStatus.textContent = 'Download complete!';
      
      setTimeout(() => {
        progressContainer.style.display = 'none';
        progressBar.style.width = '0%';
      }, 3000);
      
    } catch (error) {
      console.error('Download failed:', error);
      window.electronAPI.removeMinecraftDownloadProgressListener();
      downloadBtn.disabled = false;
      downloadBtn.textContent = 'Download Minecraft';
      downloadStatus.textContent = 'Download failed. Please try again.';
      alert('Download failed. Please check the console for details.');
    }
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing app');
  new SigmaClientApp();
});
