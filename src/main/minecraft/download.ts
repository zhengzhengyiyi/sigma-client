import { fetchJSON } from '../utils/http';
import { downloadFile } from '../utils/http';
import { getMinecraftDirectory, ensureDirectory } from '../utils/file';
import * as path from 'path';
import * as fs from 'fs';

// Download Minecraft version
export async function downloadMinecraftVersion(versionId: string, onProgress?: (progress: number, message: string) => void): Promise<void> {
  try {
    console.log('Starting download for version:', versionId);
    const minecraftDir = getMinecraftDirectory();
    console.log('Minecraft directory:', minecraftDir);
    ensureDirectory(minecraftDir);
    
    if (onProgress) onProgress(0, 'Fetching version manifest...');
    
    // Fetch version manifest
    const manifestUrl = 'https://launchermeta.mojang.com/mc/game/version_manifest.json';
    console.log('Fetching manifest from:', manifestUrl);
    const manifestData = await fetchJSON(manifestUrl);
    
    if (onProgress) onProgress(5, 'Finding version...');
    
    // Find the requested version
    const version = manifestData.versions.find((v: any) => v.id === versionId);
    if (!version) {
      throw new Error(`Version ${versionId} not found`);
    }
    
    console.log('Found version:', version);
    if (onProgress) onProgress(10, 'Fetching version details...');
    
    // Fetch version details
    const versionData = await fetchJSON(version.url);
    console.log('Version data fetched, downloading client JAR...');
    
    // Create version directory
    const versionDir = path.join(minecraftDir, 'versions', versionId);
    ensureDirectory(versionDir);
    
    // Download client JAR
    if (onProgress) onProgress(15, 'Downloading client JAR...');
    const clientJarPath = path.join(versionDir, `${versionId}.jar`);
    console.log('Downloading client JAR to:', clientJarPath);
    await downloadFile(versionData.downloads.client.url, clientJarPath, (progress) => {
      if (onProgress) onProgress(15 + progress * 0.3, 'Downloading client JAR...');
    });
    console.log('Client JAR downloaded successfully');
    
    // Download version JSON
    const versionJsonPath = path.join(versionDir, `${versionId}.json`);
    fs.writeFileSync(versionJsonPath, JSON.stringify(versionData, null, 2));
    console.log('Version JSON saved');
    
    // Download libraries
    if (onProgress) onProgress(50, 'Downloading libraries...');
    const librariesDir = path.join(minecraftDir, 'libraries');
    ensureDirectory(librariesDir);
    
    const totalLibraries = versionData.libraries.length;
    console.log('Downloading', totalLibraries, 'libraries');
    
    for (let i = 0; i < totalLibraries; i++) {
      const lib = versionData.libraries[i];
      if (lib.downloads && lib.downloads.artifact) {
        const artifact = lib.downloads.artifact;
        const libPath = path.join(librariesDir, artifact.path);
        const libDir = path.dirname(libPath);
        ensureDirectory(libDir);
        
        if (!fs.existsSync(libPath)) {
          await downloadFile(artifact.url, libPath);
        }
        
        if (onProgress) {
          const libProgress = 50 + ((i + 1) / totalLibraries) * 20;
          onProgress(libProgress, `Downloading libraries (${i + 1}/${totalLibraries})...`);
        }
      }
    }
    console.log('Libraries downloaded');
    
    // Download native libraries
    if (onProgress) onProgress(70, 'Downloading native libraries...');
    console.log('Downloading native libraries...');
    
    for (let i = 0; i < totalLibraries; i++) {
      const lib = versionData.libraries[i];
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
          const nativeDir = path.dirname(nativePath);
          ensureDirectory(nativeDir);
          
          if (!fs.existsSync(nativePath)) {
            await downloadFile(classifier.url, nativePath);
          }
        }
      }
    }
    console.log('Native libraries downloaded');
    
    // Download assets
    if (onProgress) onProgress(75, 'Downloading assets...');
    const assetsDir = path.join(minecraftDir, 'assets');
    ensureDirectory(assetsDir);
    
    // Download asset index
    const assetIndexId = versionData.assetIndex.id;
    const assetIndexPath = path.join(assetsDir, 'indexes', `${assetIndexId}.json`);
    ensureDirectory(path.dirname(assetIndexPath));
    
    const assetIndexData = await fetchJSON(versionData.assetIndex.url);
    fs.writeFileSync(assetIndexPath, JSON.stringify(assetIndexData, null, 2));
    console.log('Asset index saved');
    
    // Download asset objects
    const objects = Object.entries(assetIndexData.objects);
    const totalObjects = objects.length;
    console.log('Downloading', totalObjects, 'assets');
    
    for (let i = 0; i < totalObjects; i++) {
      const [name, obj] = objects[i];
      const assetObj = obj as any;
      const hash = assetObj.hash;
      const assetPath = path.join(assetsDir, 'objects', hash.substring(0, 2), hash);
      const assetDir = path.dirname(assetPath);
      ensureDirectory(assetDir);
      
      if (!fs.existsSync(assetPath)) {
        const assetUrl = `https://resources.download.minecraft.net/${hash.substring(0, 2)}/${hash}`;
        await downloadFile(assetUrl, assetPath);
      }
      
      if (onProgress) {
        const assetProgress = 75 + ((i + 1) / totalObjects) * 25;
        onProgress(assetProgress, `Downloading assets (${i + 1}/${totalObjects})...`);
      }
    }
    console.log('Assets downloaded');
    
    if (onProgress) onProgress(100, 'Download complete!');
    console.log('Download complete for version:', versionId);
    
  } catch (error) {
    console.error('Error downloading Minecraft version:', error);
    throw error;
  }
}

// Get available Minecraft versions
export async function getMinecraftVersions(): Promise<any[]> {
  try {
    const manifestUrl = 'https://launchermeta.mojang.com/mc/game/version_manifest.json';
    const manifestData = await fetchJSON(manifestUrl);
    return manifestData.versions;
  } catch (error) {
    console.error('Error fetching Minecraft versions:', error);
    throw error;
  }
}
