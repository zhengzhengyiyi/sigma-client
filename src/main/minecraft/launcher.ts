import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { getMinecraftDirectory } from '../utils/file';

export interface LaunchOptions {
  instanceId: string;
  username: string;
  uuid: string;
  javaPath?: string;
  memory?: number;
  gameDirectory?: string;
}

export interface LaunchResult {
  success: boolean;
  error?: string;
}

export async function launchMinecraft(options: LaunchOptions): Promise<LaunchResult> {
  try {
    console.log('Launching Minecraft with options:', options);
    
    const minecraftDir = options.gameDirectory || getMinecraftDirectory();
    const instanceId = options.instanceId;
    
    // Find instance details
    const instancesFile = path.join(minecraftDir, 'instances.json');
    if (!fs.existsSync(instancesFile)) {
      return { success: false, error: 'No instances found' };
    }
    
    const instances = JSON.parse(fs.readFileSync(instancesFile, 'utf-8'));
    const instance = instances.find((inst: any) => inst.id === instanceId);
    
    if (!instance) {
      return { success: false, error: 'Instance not found' };
    }
    
    const version = instance.version;
    const versionDir = path.join(minecraftDir, 'versions', version);
    const clientJar = path.join(versionDir, `${version}.jar`);
    const versionJson = path.join(versionDir, `${version}.json`);
    
    console.log('Checking for Minecraft files...');
    console.log('Version directory:', versionDir);
    console.log('Client JAR:', clientJar);
    console.log('Version JSON:', versionJson);
    
    if (!fs.existsSync(clientJar)) {
      return { success: false, error: `Minecraft version not downloaded. Please download version ${version} in Settings first.` };
    }
    
    if (!fs.existsSync(versionJson)) {
      return { success: false, error: `Version metadata not found. Please download version ${version} again.` };
    }
    
    // Read version JSON for libraries
    const versionData = JSON.parse(fs.readFileSync(versionJson, 'utf-8'));
    console.log('Loaded version data for:', version);
    
    // Find Java
    let javaPath = options.javaPath;
    if (!javaPath) {
      // Try to find java in common locations
      const commonJavaPaths = [
        '/usr/bin/java',
        '/usr/local/bin/java',
        'java', // Try from PATH
        '/Library/Java/JavaVirtualMachines/jdk-21.jdk/Contents/Home/bin/java',
        '/Library/Java/JavaVirtualMachines/jdk-17.jdk/Contents/Home/bin/java',
        '/Library/Java/JavaVirtualMachines/jdk-11.jdk/Contents/Home/bin/java',
        '/Library/Java/JavaVirtualMachines/jdk-8.jdk/Contents/Home/bin/java',
      ];
      
      for (const java of commonJavaPaths) {
        try {
          if (fs.existsSync(java)) {
            javaPath = java;
            console.log('Found Java at:', javaPath);
            break;
          }
        } catch (e) {
          continue;
        }
      }
    }
    
    if (!javaPath) {
      return { success: false, error: 'Java not found. Please install Java or specify Java path in settings.' };
    }
    
    // Build classpath
    const librariesDir = path.join(minecraftDir, 'libraries');
    const classpath: string[] = [clientJar];
    
    // Add libraries to classpath
    for (const lib of versionData.libraries) {
      if (lib.downloads && lib.downloads.artifact) {
        const libPath = path.join(librariesDir, lib.downloads.artifact.path);
        if (fs.existsSync(libPath)) {
          classpath.push(libPath);
        }
      }
    }
    
    console.log('Classpath libraries count:', classpath.length);
    
    // Native libraries for macOS
    const nativeLibraries: string[] = [];
    for (const lib of versionData.libraries) {
      if (lib.downloads && lib.downloads.classifiers) {
        // Try macOS arm64 first (Apple Silicon)
        let classifier = lib.downloads.classifiers['natives-macos-arm64'];
        if (!classifier) {
          // Fallback to macOS
          classifier = lib.downloads.classifiers['natives-macos'];
        }
        if (!classifier) {
          // Fallback to osx
          classifier = lib.downloads.classifiers['natives-osx'];
        }
        if (classifier) {
          const nativePath = path.join(librariesDir, classifier.path);
          if (fs.existsSync(nativePath)) {
            nativeLibraries.push(nativePath);
          }
        }
      }
    }
    
    console.log('Native libraries count:', nativeLibraries.length);
    
    // Build JVM arguments
    const memory = options.memory || 2048;
    const jvmArgs = [
      `-Xmx${memory}M`,
      `-Xms${Math.min(512, memory)}M`,
      '-Djava.library.path=' + nativeLibraries.join(path.delimiter),
      '-Duser.language=en',
      '-Duser.country=US',
      '-cp', classpath.join(path.delimiter),
      'net.minecraft.client.main.Main',
      '--username', options.username,
      '--uuid', options.uuid,
      '--accessToken', '0', // Placeholder token for offline mode
      '--version', version,
      '--gameDir', minecraftDir,
      '--assetsDir', path.join(minecraftDir, 'assets'),
      '--offline' // Offline mode
    ];
    
    // Add macOS-specific flag
    if (process.platform === 'darwin') {
      jvmArgs.unshift('-XstartOnFirstThread');
    }
    
    console.log('Launching with Java:', javaPath);
    console.log('JVM Args:', jvmArgs.slice(0, 10), '...'); // Show first 10 args
    
    // Launch the process
    const minecraftProcess = spawn(javaPath, jvmArgs, {
      cwd: minecraftDir,
      stdio: 'inherit'
    });
    
    minecraftProcess.on('error', (error) => {
      console.error('Minecraft process error:', error);
    });
    
    minecraftProcess.on('close', (code) => {
      console.log(`Minecraft process exited with code ${code}`);
    });
    
    return {
      success: true
    };
    
  } catch (error) {
    console.error('Failed to launch Minecraft:', error);
    return {
      success: false,
      error: (error as Error).message
    };
  }
}
