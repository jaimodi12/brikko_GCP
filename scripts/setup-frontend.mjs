import { execFileSync, execSync, spawnSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const frontendDir = path.join(rootDir, 'frontend');
const buildLockPath = path.join(os.tmpdir(), 'brikko-frontend-build.lock');
const reactScriptsPkg = path.join(frontendDir, 'node_modules', 'react-scripts', 'package.json');
const reactScriptsEntry = path.join(frontendDir, 'node_modules', 'react-scripts', 'bin', 'react-scripts.js');
const ajvPkg = path.join(frontendDir, 'node_modules', 'ajv', 'package.json');

function buildCleanInstallEnv() {
  const env = { ...process.env, NODE_ENV: 'development' };
  delete env.NPM_CONFIG_PRODUCTION;
  delete env.npm_config_production;
  delete env.NPM_CONFIG_OMIT;
  delete env.npm_config_omit;
  delete env.NPM_CONFIG_ONLY;
  delete env.npm_config_only;
  return env;
}

function hasCommand(cmd) {
  try {
    const res = spawnSync(cmd, ['--version'], {
      stdio: 'ignore',
      shell: process.platform === 'win32',
    });
    return res.status === 0;
  } catch {
    return false;
  }
}

function hasFreshStamp(pkgPath) {
  const npmStamp = path.join(frontendDir, 'node_modules', '.package-lock.json');
  const bunStamp = path.join(frontendDir, 'node_modules', '.bun');
  const pkgMtime = fs.statSync(pkgPath).mtimeMs;
  if (fs.existsSync(npmStamp) && fs.statSync(npmStamp).mtimeMs >= pkgMtime) {
    return true;
  }
  if (fs.existsSync(bunStamp) && fs.statSync(bunStamp).mtimeMs >= pkgMtime) {
    return true;
  }
  return false;
}

function ensureFrontendDependencies() {
  const pkg = path.join(frontendDir, 'package.json');

  if (fs.existsSync(reactScriptsPkg) && fs.existsSync(reactScriptsEntry) && fs.existsSync(ajvPkg) && hasFreshStamp(pkg)) {
    console.log('Frontend dependencies already up to date.');
    return;
  }

  const installEnv = buildCleanInstallEnv();

  if (hasCommand('bun')) {
    try {
      console.log('Installing frontend dependencies with bun...');
      execSync('bun install --cwd frontend', {
        cwd: rootDir,
        stdio: 'inherit',
        env: installEnv,
      });
      if (fs.existsSync(reactScriptsPkg) && fs.existsSync(reactScriptsEntry) && fs.existsSync(ajvPkg)) {
        return;
      }
    } catch (err) {
      console.warn('Bun frontend install fell back to npm:', err?.message || err);
    }
  }

  console.log('Installing frontend dependencies with npm...');
  execSync(
    'npm --prefix frontend install --include=dev --no-audit --no-fund --prefer-offline --legacy-peer-deps',
    {
      cwd: rootDir,
      stdio: 'inherit',
      env: installEnv,
    }
  );
}

function syncFirebaseConfig() {
  const srcConfig = path.join(rootDir, 'firebase-applet-config.json');
  const destDir = path.join(frontendDir, 'src');
  const destConfig = path.join(destDir, 'firebase-applet-config.json');
  if (fs.existsSync(srcConfig)) {
    fs.mkdirSync(destDir, { recursive: true });
    fs.copyFileSync(srcConfig, destConfig);
  }
}

function runReactScripts(commandName, extraEnv = {}) {
  if (!fs.existsSync(reactScriptsEntry)) {
    throw new Error('react-scripts is not installed in frontend/node_modules.');
  }
  execFileSync(process.execPath, [reactScriptsEntry, commandName], {
    cwd: frontendDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      ...extraEnv,
    },
  });
}

function swapDirectory(stagingDir, finalDir, backupDir) {
  try {
    if (fs.existsSync(finalDir)) {
      fs.renameSync(finalDir, backupDir);
    }
    fs.renameSync(stagingDir, finalDir);
    fs.rmSync(backupDir, { recursive: true, force: true });
  } catch (err) {
    // Fallback for Windows file-watcher locks (EPERM / EBUSY)
    if (fs.existsSync(backupDir) && !fs.existsSync(finalDir)) {
      try {
        fs.renameSync(backupDir, finalDir);
      } catch {
        // Ignore rollback failure
      }
    }
    fs.rmSync(finalDir, { recursive: true, force: true });
    fs.cpSync(stagingDir, finalDir, { recursive: true });
    fs.rmSync(stagingDir, { recursive: true, force: true });
    fs.rmSync(backupDir, { recursive: true, force: true });
  }
}

function buildFrontend() {
  try {
    fs.writeFileSync(buildLockPath, String(process.pid), 'utf-8');
  } catch {
    // Ignore lock write failures in read-only temp environments
  }
  const finalBuildDir = path.join(frontendDir, 'build');
  const stagingBuildDir = path.join(frontendDir, 'build_staging');
  const backupBuildDir = path.join(frontendDir, 'build_prev');
  try {
    ensureFrontendDependencies();
    syncFirebaseConfig();
    fs.rmSync(stagingBuildDir, { recursive: true, force: true });
    fs.rmSync(backupBuildDir, { recursive: true, force: true });
    console.log('Building frontend bundle...');
    runReactScripts('build', {
      CI: 'false',
      BROWSER: 'none',
      GENERATE_SOURCEMAP: 'false',
      BUILD_PATH: 'build_staging',
      NODE_ENV: 'production',
    });
    if (!fs.existsSync(path.join(stagingBuildDir, 'index.html'))) {
      throw new Error('Staged frontend build did not produce index.html.');
    }
    swapDirectory(stagingBuildDir, finalBuildDir, backupBuildDir);
  } finally {
    try {
      if (fs.existsSync(stagingBuildDir)) {
        fs.rmSync(stagingBuildDir, { recursive: true, force: true });
      }
      if (fs.existsSync(buildLockPath)) {
        fs.unlinkSync(buildLockPath);
      }
    } catch {
      // Ignore cleanup errors
    }
  }
}

function buildFrontendDirect() {
  ensureFrontendDependencies();
  syncFirebaseConfig();
  console.log('Building frontend bundle...');
  runReactScripts('build', {
    CI: 'false',
    BROWSER: 'none',
    GENERATE_SOURCEMAP: 'false',
    NODE_ENV: 'production',
  });
}

function startFrontendDev() {
  ensureFrontendDependencies();
  syncFirebaseConfig();
  runReactScripts('start', {
    PORT: process.env.PORT || '3000',
    HOST: process.env.HOST || '0.0.0.0',
    BROWSER: process.env.BROWSER || 'none',
    NODE_ENV: 'development',
  });
}

const mode = process.argv[2] || 'build';
if (mode === 'sync-config') {
  syncFirebaseConfig();
} else if (mode === 'install') {
  ensureFrontendDependencies();
} else if (mode === 'build') {
  buildFrontend();
} else if (mode === 'react-build') {
  buildFrontendDirect();
} else if (mode === 'start') {
  startFrontendDev();
} else {
  console.error(`Unknown mode "${mode}". Expected "sync-config", "install", "build", "react-build", or "start".`);
  process.exit(1);
}
