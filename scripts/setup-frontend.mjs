import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const frontendDir = path.join(rootDir, 'frontend');

function ensureFrontendDependencies() {
  const reactScriptsBin = path.join(frontendDir, 'node_modules', '.bin', 'react-scripts');
  const ajvPkg = path.join(frontendDir, 'node_modules', 'ajv', 'package.json');
  const stamp = path.join(frontendDir, 'node_modules', '.package-lock.json');
  const pkg = path.join(frontendDir, 'package.json');

  const upToDate =
    fs.existsSync(reactScriptsBin) &&
    fs.existsSync(ajvPkg) &&
    fs.existsSync(stamp) &&
    fs.statSync(stamp).mtimeMs >= fs.statSync(pkg).mtimeMs;

  if (upToDate) {
    console.log('Frontend dependencies already up to date.');
    return;
  }

  console.log('Installing frontend dependencies...');
  execSync(
    'npm --prefix frontend install --include=dev --no-audit --no-fund --prefer-offline --legacy-peer-deps',
    {
      cwd: rootDir,
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'development',
      },
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

function buildFrontend() {
  ensureFrontendDependencies();
  syncFirebaseConfig();
  console.log('Building frontend bundle...');
  execSync('npm --prefix frontend run build', {
    cwd: rootDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      CI: 'false',
      BROWSER: 'none',
      GENERATE_SOURCEMAP: 'false',
      NODE_ENV: 'production',
    },
  });
}

const mode = process.argv[2] || 'build';
if (mode === 'install') {
  ensureFrontendDependencies();
} else if (mode === 'build') {
  buildFrontend();
} else {
  console.error(`Unknown mode "${mode}". Expected "install" or "build".`);
  process.exit(1);
}
