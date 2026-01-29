#!/usr/bin/env node

import { execSync } from 'child_process';
import { rmSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

function run(command, options = {}) {
  console.log(`> ${command}`);
  execSync(command, { stdio: 'inherit', cwd: rootDir, ...options });
}

function clean() {
  console.log('\n--- Cleaning previous build ---');
  const distDir = join(rootDir, 'dist');
  const publicDir = join(rootDir, 'public');

  if (existsSync(distDir)) {
    rmSync(distDir, { recursive: true });
    console.log('Removed dist/');
  }
  if (existsSync(publicDir)) {
    rmSync(publicDir, { recursive: true });
    console.log('Removed public/');
  }
}

function installDependencies() {
  console.log('\n--- Installing dependencies ---');

  // Install root dependencies
  run('npm install');

  // Install frontend dependencies
  run('npm install', { cwd: join(rootDir, 'frontend') });
}

function buildFrontend() {
  console.log('\n--- Building frontend ---');
  run('npm run build', { cwd: join(rootDir, 'frontend') });
  console.log('Frontend built to public/');
}

function compileTypeScript() {
  console.log('\n--- Compiling TypeScript ---');
  run('npx tsc -p tsconfig.build.json');
  console.log('TypeScript compiled to dist/');
}

function main() {
  console.log('=== StickStack Build ===\n');

  try {
    clean();
    installDependencies();
    buildFrontend();
    compileTypeScript();

    console.log('\n=== Build complete! ===');
    console.log('\nTo test locally:');
    console.log('  node dist/cli.js');
    console.log('\nTo publish:');
    console.log('  npm publish');
  } catch (error) {
    console.error('\nBuild failed:', error.message);
    process.exit(1);
  }
}

main();
