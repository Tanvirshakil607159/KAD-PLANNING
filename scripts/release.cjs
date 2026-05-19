const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Helpers for colored output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  bright: '\x1b[1m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

function runCmd(cmd, desc) {
  log(colors.cyan, `\n>> Running: ${desc || cmd}...`);
  try {
    execSync(cmd, { stdio: 'inherit' });
    return true;
  } catch (err) {
    log(colors.red, `[ERROR] Failed to run: ${desc || cmd}`);
    console.error(err.message);
    return false;
  }
}

// Set up readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function main() {
  console.log('\n' + '='.repeat(60));
  log(colors.bright + colors.green, '   KAD PLANNING SYSTEM — AUTOMATED RELEASE & DEPLOYMENT');
  console.log('='.repeat(60));

  // 1. Pull latest changes
  if (!runCmd('git pull origin main', 'Git Pull (Syncing with remote repo)')) {
    log(colors.yellow, 'Could not pull remote changes. Proceeding anyway...');
  }

  // 2. Select version bump type
  log(colors.yellow, '\nSelect release version increment:');
  console.log('  [1] patch (e.g. 1.0.0 -> 1.0.1) - bug fixes, minor updates [DEFAULT]');
  console.log('  [2] minor (e.g. 1.0.0 -> 1.1.0) - new features');
  console.log('  [3] major (e.g. 1.0.0 -> 2.0.0) - breaking changes');
  
  rl.question('\nEnter option (1/2/3) [Default is 1]: ', (answer) => {
    let type = 'patch';
    if (answer.trim() === '2') type = 'minor';
    if (answer.trim() === '3') type = 'major';

    log(colors.green, `\nUsing release type: ${type}`);
    rl.close();

    // 3. Stage existing local changes to ensure clean bump
    runCmd('git add -A', 'Staging current modifications');

    // 4. Bump version in package.json
    log(colors.cyan, `\n>> Running npm version ${type} --force...`);
    try {
      execSync(`npm version ${type} --force -m "Bump version to %s"`, { stdio: 'inherit' });
    } catch (err) {
      log(colors.red, `\n[ERROR] npm version failed! Make sure git changes are properly staged and there are no conflicts.`);
      process.exit(1);
    }

    // 5. Read new version
    const packagePath = path.join(__dirname, '../package.json');
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const newVersion = pkg.version;
    log(colors.green, `\nSuccessfully bumped version to v${newVersion}!`);

    // 6. Build the application and compile the installer
    log(colors.cyan, `\n>> Compiling application and packaging installer for v${newVersion}...`);
    if (!runCmd('npm run dist', 'electron-builder packaging')) {
      log(colors.red, '\n[ERROR] Application compilation or installer packaging failed!');
      process.exit(1);
    }

    // 7. Push new version commit and tag to GitHub
    log(colors.cyan, `\n>> Pushing tags and commits to GitHub...`);
    if (!runCmd('git push origin main --follow-tags', 'Git Push with tags')) {
      log(colors.red, '\n[WARNING] Git push failed. The local tag was created but not pushed to GitHub.');
    } else {
      // 8. Create GitHub Release and upload installer
      const installerPath = `release/KAD Planning Setup ${newVersion}.exe`;
      log(colors.cyan, `\n>> Creating GitHub Release for v${newVersion} and uploading installer...`);
      const ghReleaseCmd = `gh release create v${newVersion} "${installerPath}" --title "v${newVersion}" --notes "Release version v${newVersion}"`;
      if (!runCmd(ghReleaseCmd, 'GitHub Release Creation')) {
        log(colors.red, '\n[WARNING] Failed to automatically create GitHub Release. You may need to create it manually.');
      } else {
        log(colors.green, `\n[OK] Successfully created GitHub Release and uploaded installer!`);
      }
    }

    // 9. Launch the unpacked application
    const appExecutable = path.join(__dirname, '../release/win-unpacked/KAD Planning.exe');
    log(colors.green, `\n===================================================`);
    log(colors.bright + colors.green, `   Release Complete! Starting KAD Planning System...`);
    log(colors.green, `===================================================`);
    log(colors.cyan, `Launching: ${appExecutable}\n`);

    try {
      const child = spawn(appExecutable, [], {
        detached: true,
        stdio: 'ignore'
      });
      child.unref();
      log(colors.green, 'Application launched successfully in background. You can close this console.');
    } catch (err) {
      log(colors.red, `[ERROR] Failed to launch application: ${err.message}`);
    }

    process.exit(0);
  });
}

main();
