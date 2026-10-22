#!/usr/bin/env node

/**
 * serve-apk-qr.js
 * Zero-dependency script to serve built Android APKs (Debug or Release) over local HTTP
 * and render an ASCII QR code in the terminal for quick mobile downloading.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');
const { execSync } = require('child_process');

const apkBaseDir = path.join(__dirname, '../android/app/build/outputs/apk');

// Find APK helper
function findApkInDir(subDir) {
  const dirPath = path.join(apkBaseDir, subDir);
  if (!fs.existsSync(dirPath)) return null;
  const files = fs.readdirSync(dirPath).filter((f) => f.endsWith('.apk'));
  if (files.length === 0) return null;
  // Prefer standard name if present
  const preferredName = subDir === 'debug' ? 'app-debug.apk' : 'app-release.apk';
  if (files.includes(preferredName)) return path.join(dirPath, preferredName);
  return path.join(dirPath, files[0]);
}

async function resolveApkPath() {
  const arg = process.argv[2];

  // 1. Direct file path argument passed
  if (arg && !arg.startsWith('-') && fs.existsSync(path.resolve(arg))) {
    return path.resolve(arg);
  }

  const debugApk = findApkInDir('debug');
  const releaseApk = findApkInDir('release');

  // 2. CLI flags passed
  if (arg === '--release' || arg === '-r') {
    if (!releaseApk) {
      console.error('\n❌ Release APK not found in android/app/build/outputs/apk/release/\n');
      process.exit(1);
    }
    return releaseApk;
  }
  if (arg === '--debug' || arg === '-d') {
    if (!debugApk) {
      console.error('\n❌ Debug APK not found in android/app/build/outputs/apk/debug/\n');
      process.exit(1);
    }
    return debugApk;
  }

  // 3. Check availability of builds
  if (!debugApk && !releaseApk) {
    console.error('\n❌ No built APKs found in android/app/build/outputs/apk/');
    console.error('💡 Please build an APK first (e.g. pnpm build:apk)\n');
    process.exit(1);
  }

  if (debugApk && !releaseApk) return debugApk;
  if (!debugApk && releaseApk) return releaseApk;

  // 4. Both exist -> Ask interactively
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const debugSize = (fs.statSync(debugApk).size / (1024 * 1024)).toFixed(1);
  const releaseSize = (fs.statSync(releaseApk).size / (1024 * 1024)).toFixed(1);

  console.log('\n📦 Multiple APK builds found:');
  console.log(`  [1] Debug   (${path.basename(debugApk)} - ${debugSize} MB)`);
  console.log(`  [2] Release (${path.basename(releaseApk)} - ${releaseSize} MB)`);

  const answer = await new Promise((resolve) => {
    rl.question('\nSelect build type to serve [1=Debug, 2=Release] (default: 1): ', (ans) => {
      rl.close();
      resolve(ans.trim());
    });
  });

  return answer === '2' || answer.toLowerCase() === 'r' || answer.toLowerCase() === 'release'
    ? releaseApk
    : debugApk;
}

// Detect Local IPv4 Address
function getLocalIp() {
  const interfaces = os.networkInterfaces();
  let fallbackIp = null;

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        if (name.startsWith('wlan') || name.startsWith('wlp') || name.startsWith('eth') || name.startsWith('en')) {
          return iface.address;
        }
        if (!fallbackIp) fallbackIp = iface.address;
      }
    }
  }
  return fallbackIp || '127.0.0.1';
}

async function startServer() {
  const apkPath = await resolveApkPath();
  const apkStats = fs.statSync(apkPath);
  const apkSizeMB = (apkStats.size / (1024 * 1024)).toFixed(1);
  const fileName = path.basename(apkPath);
  const buildType = apkPath.includes('/release/') ? 'RELEASE' : 'DEBUG';

  const ip = getLocalIp();
  const preferredPort = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;

  const server = http.createServer((req, res) => {
    if (req.url === '/' || req.url.endsWith('.apk')) {
      console.log(`\n📥 [${new Date().toLocaleTimeString()}] Download requested by ${req.socket.remoteAddress}`);

      res.writeHead(200, {
        'Content-Type': 'application/vnd.android.package-archive',
        'Content-Length': apkStats.size,
        'Content-Disposition': `attachment; filename="${fileName}"`,
      });

      const stream = fs.createReadStream(apkPath);
      stream.pipe(res);

      stream.on('end', () => {
        console.log(`✅ [${new Date().toLocaleTimeString()}] Successfully transferred ${fileName} (${apkSizeMB} MB)`);
      });

      stream.on('error', (err) => {
        console.error(`❌ Download error:`, err.message);
      });
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
    }
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`⚠️  Port ${preferredPort} is in use. Trying port ${preferredPort + 1}...`);
      server.listen(preferredPort + 1, '0.0.0.0');
    } else {
      console.error('❌ Server error:', err.message);
      process.exit(1);
    }
  });

  server.listen(preferredPort, '0.0.0.0', () => {
    const actualPort = server.address().port;
    const downloadUrl = `http://${ip}:${actualPort}/${fileName}`;

    console.clear();
    console.log('====================================================');
    console.log(`📱  LOCAL APK QR DOWNLOAD SERVER [${buildType}]`);
    console.log('====================================================');
    console.log(`📦 Serving File:  ${fileName} (${apkSizeMB} MB)`);
    console.log(`🌐 Local Network: ${downloadUrl}`);
    console.log('====================================================\n');

    try {
      const qrAscii = execSync(
        `python3 -c "import qrcode; qr = qrcode.QRCode(); qr.add_data('${downloadUrl}'); qr.make(fit=True); qr.print_ascii(invert=True)"`,
        { stdio: ['pipe', 'pipe', 'ignore'] }
      ).toString();
      console.log(qrAscii);
    } catch {
      try {
        const qrAscii = execSync(`npx -y qrcode-terminal "${downloadUrl}"`, { stdio: ['pipe', 'pipe', 'ignore'] }).toString();
        console.log(qrAscii);
      } catch {
        console.log('📷 Open link manually on your phone browser:');
        console.log(`   ${downloadUrl}\n`);
      }
    }

    console.log('----------------------------------------------------');
    console.log('📲 Scan the QR code above with your phone camera');
    console.log('   (Make sure phone is connected to the same Wi-Fi/Hotspot)');
    console.log('----------------------------------------------------');
    console.log('💡 Firewall Note: If download fails to start, ensure port');
    console.log(`   ${actualPort} is allowed (e.g. sudo ufw allow ${actualPort}/tcp)`);
    console.log('Press Ctrl+C to stop the server.\n');
  });
}

startServer();
