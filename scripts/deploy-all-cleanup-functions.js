// Helper script to deploy all demo user cleanup functions to Appwrite

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration for each function
const functions = [
  {
    id: 'cleanup_demo_sessions',
    path: 'functions/cleanup-demo-sessions',
    name: 'Cleanup Demo Sessions'
  },
  {
    id: 'reset_demo_preferences',
    path: 'functions/reset-demo-preferences',
    name: 'Reset Demo Preferences'
  },
  {
    id: 'trigger_demo_cleanup',
    path: 'functions/trigger-demo-cleanup',
    name: 'Trigger Demo Cleanup'
  }
];

console.log('Deploying all demo user cleanup functions to Appwrite...');

// Deploy each function
functions.forEach(func => {
  try {
    console.log(`\n--- Deploying ${func.name} ---`);
    
    const functionPath = path.resolve(__dirname, func.path);
    console.log(`Function path: ${functionPath}`);
    
    // Make sure the function directory exists
    if (!fs.existsSync(functionPath)) {
      console.error(`Error: Function directory does not exist at ${functionPath}`);
      return;
    }

    // Check if package.json exists
    if (!fs.existsSync(path.join(functionPath, 'package.json'))) {
      console.error('Error: package.json not found in function directory');
      return;
    }

    // Check if index.js exists
    if (!fs.existsSync(path.join(functionPath, 'index.js'))) {
      console.error('Error: index.js not found in function directory');
      return;
    }

    console.log('Creating deployment...');
    
    // Deploy the function
    const result = execSync(`appwrite functions createDeployment --functionId=${func.id} --activate=true --entrypoint="index.js" --code="${functionPath}"`, { encoding: 'utf-8' });
    
    console.log('Deployment result:');
    console.log(result);
    
    console.log(`${func.name} function deployed successfully!`);
  } catch (error) {
    console.error(`Error deploying ${func.name}:`, error.message || error);
  }
});

console.log('\nAll functions deployment complete!');