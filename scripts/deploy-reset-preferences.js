// Helper script to deploy the reset-demo-preferences function to Appwrite

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const functionPath = path.resolve(__dirname, 'functions/reset-demo-preferences');
const functionId = 'reset_demo_preferences';

console.log('Deploying reset-demo-preferences function to Appwrite...');
console.log(`Function path: ${functionPath}`);

try {
  // Make sure the function directory exists
  if (!fs.existsSync(functionPath)) {
    console.error(`Error: Function directory does not exist at ${functionPath}`);
    process.exit(1);
  }

  // Check if package.json exists
  if (!fs.existsSync(path.join(functionPath, 'package.json'))) {
    console.error('Error: package.json not found in function directory');
    process.exit(1);
  }

  // Check if index.js exists
  if (!fs.existsSync(path.join(functionPath, 'index.js'))) {
    console.error('Error: index.js not found in function directory');
    process.exit(1);
  }

  console.log('Creating deployment...');
  
  // Deploy the function
  const result = execSync(`appwrite functions createDeployment --functionId=${functionId} --activate=true --entrypoint="index.js" --code="${functionPath}"`, { encoding: 'utf-8' });
  
  console.log('Deployment result:');
  console.log(result);
  
  console.log('Reset demo preferences function deployed successfully!');
} catch (error) {
  console.error('Error deploying function:', error.message || error);
  process.exit(1);
}