import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';

const execAsync = promisify(exec);

// Detect Java installations
export async function detectJavaInstallations(): Promise<string[]> {
  const javaPaths: string[] = [];

  try {
    // Check common Java locations based on platform
    const commonPaths: Record<string, string[]> = {
      darwin: [
        '/Library/Java/JavaVirtualMachines',
        '/System/Library/Java/JavaVirtualMachines',
        '/usr/libexec/java_home',
      ],
      win32: [
        'C:\\Program Files\\Java',
        'C:\\Program Files (x86)\\Java',
      ],
      linux: [
        '/usr/lib/jvm',
        '/usr/java',
        '/opt/java',
      ],
    };

    const platformPaths = commonPaths[process.platform] || [];

    for (const searchPath of platformPaths) {
      try {
        if (fs.existsSync(searchPath)) {
          if (fs.statSync(searchPath).isDirectory()) {
            // List contents of directory
            const contents = fs.readdirSync(searchPath);
            for (const item of contents) {
              const fullPath = path.join(searchPath, item);
              if (fs.statSync(fullPath).isDirectory()) {
                // Check if this is a Java installation
                const javaBinPath = path.join(fullPath, 'bin', 'java');
                const javaExePath = path.join(fullPath, 'bin', 'java.exe');
                
                if (fs.existsSync(javaBinPath) || fs.existsSync(javaExePath)) {
                  const javaPath = fs.existsSync(javaBinPath) ? javaBinPath : javaExePath;
                  javaPaths.push(javaPath);
                }
              }
            }
          }
        }
      } catch (error) {
        // Skip paths that can't be accessed
        continue;
      }
    }

    // On macOS, use /usr/libexec/java_home to get all Java versions
    if (process.platform === 'darwin') {
      try {
        const { stdout } = await execAsync('/usr/libexec/java_home -V');
        const lines = stdout.split('\n');
        for (const line of lines) {
          const match = line.match(/,\s*(.+?):$/);
          if (match) {
            const javaPath = path.join(match[1], 'bin', 'java');
            if (fs.existsSync(javaPath) && !javaPaths.includes(javaPath)) {
              javaPaths.push(javaPath);
            }
          }
        }
      } catch (error) {
        // Ignore errors from java_home
      }
    }

    // Try to find java in PATH
    try {
      const { stdout } = await execAsync('which java');
      const javaInPath = stdout.trim();
      if (javaInPath && !javaPaths.includes(javaInPath)) {
        javaPaths.push(javaInPath);
      }
    } catch (error) {
      // Ignore errors from which command
    }

  } catch (error) {
    console.error('Error detecting Java installations:', error);
  }

  return javaPaths;
}
