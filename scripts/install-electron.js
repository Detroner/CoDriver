const { downloadArtifact } = require('@electron/get');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

async function installElectron() {
  const version = '29.1.0';
  const electronDir = path.resolve(__dirname, '..', 'node_modules', 'electron');
  const distDir = path.join(electronDir, 'dist');
  const pathTxt = path.join(electronDir, 'path.txt');
  const exePath = path.join(distDir, 'electron.exe');

  if (fs.existsSync(pathTxt) && fs.existsSync(exePath)) {
    console.log(`[CoDriver] Electron ${version} is already installed.`);
    return;
  }

  console.log(`[CoDriver] Installing Electron v${version}...`);

  try {
    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir, { recursive: true });
    }

    const zipPath = await downloadArtifact({
      version,
      artifactName: 'electron',
      platform: 'win32',
      arch: 'x64',
    });

    console.log(`[CoDriver] Extracting binary to ${distDir}...`);
    execSync(`powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${distDir}' -Force"`, {
      stdio: 'inherit',
    });

    fs.writeFileSync(pathTxt, 'electron.exe', 'utf-8');
    fs.writeFileSync(path.join(distDir, 'version'), `v${version}`, 'utf-8');

    console.log('[CoDriver] Electron successfully installed and verified!');
  } catch (err) {
    console.error('[CoDriver] Failed to install Electron:', err);
    process.exit(1);
  }
}

installElectron();
