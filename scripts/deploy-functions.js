#!/usr/bin/env node

/**
 * Script to deploy all functions to Appwrite
 * This script simplifies the deployment process for all demo user management functions
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const FUNCTIONS_DIR = path.join(__dirname, 'functions');
const FUNCTIONS_TO_DEPLOY = [
  'cleanup-demo-sessions',
  'reset-demo-preferences',
  'trigger-demo-cleanup'
];

console.log('Starting deployment of Appwrite functions...');

// Check that Appwrite CLI is installed
try {
  execSync('appwrite --version', { stdio: 'ignore' });
} catch (error) {
  console.error('Error: Appwrite CLI is not installed or not in PATH');
  console.error('Please install it first: npm install -g appwrite-cli');
  process.exit(1);
}

// Check if user is logged in
try {
  execSync('appwrite client --check', { stdio: 'ignore' });
} catch (error) {
  console.error('Error: You are not logged in to Appwrite CLI');
  console.error('Please login first: appwrite login');
  process.exit(1);
}

// Deploy each function
let successCount = 0;
let failCount = 0;

for (const functionName of FUNCTIONS_TO_DEPLOY) {
  const functionDir = path.join(FUNCTIONS_DIR, functionName);
  
  // Check if directory exists
  if (!fs.existsSync(functionDir)) {
    console.error(`Error: Function directory not found: ${functionDir}`);
    failCount++;
    continue;
  }
  
  console.log(`\nDeploying function: ${functionName}...`);
  
  try {
    // Navigate to the function directory
    process.chdir(functionDir);
    
    // Deploy the function
    execSync('appwrite deploy function', { stdio: 'inherit' });
    
    console.log(`✅ Successfully deployed: ${functionName}`);
    successCount++;
  } catch (error) {
    console.error(`❌ Failed to deploy: ${functionName}`);
    console.error(`Error: ${error.message || 'Unknown error'}`);
    failCount++;
  }
}

console.log('\n---------------------------------');
console.log(`Deployment complete: ${successCount} succeeded, ${failCount} failed`);

if (successCount > 0) {
  console.log('\nNext steps:');
  console.log('1. Configure CRON schedules for cleanup-demo-sessions in Appwrite Console');
  console.log('2. Set up proper execution permissions for the functions');
  console.log('3. Test the functions by triggering them manually');
}

// Return to the original directory
process.chdir(path.join(__dirname, '..'));