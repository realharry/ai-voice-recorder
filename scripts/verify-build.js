#!/usr/bin/env node

// Simple build verification script
const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '../dist');
const requiredFiles = [
  'manifest.json',
  'popup.html',
  'background.js',
  'offscreen.html',
  'offscreen.js',
  'icons/icon16.png',
  'icons/icon32.png',
  'icons/icon48.png',
  'icons/icon128.png'
];

console.log('🔍 Verifying Chrome extension build...');

let allFilesPresent = true;

for (const file of requiredFiles) {
  const filePath = path.join(distDir, file);
  if (fs.existsSync(filePath)) {
    console.log('✅', file);
  } else {
    console.log('❌', file, '(missing)');
    allFilesPresent = false;
  }
}

if (allFilesPresent) {
  console.log('\n🎉 Build verification successful! Extension is ready to load in Chrome.');
  console.log('\n📋 To install:');
  console.log('1. Open chrome://extensions/');
  console.log('2. Enable "Developer mode"');
  console.log('3. Click "Load unpacked" and select the dist/ folder');
} else {
  console.log('\n❌ Build verification failed! Some files are missing.');
  process.exit(1);
}