#!/usr/bin/env node

/**
 * Deploy functions to Appwrite directly using the Appwrite API
 * This allows us to deploy functions without relying on the Appwrite CLI
 */
const fs = require('fs');
const path = require('path');
const https = require('https');
const FormData = require('form-data');
const archiver = require('archiver');
const { promisify } = require('util');

// Configuration - these match your Appwrite project
const config = {
  endpoint: 'https://fra.cloud.appwrite.io/v1',
  projectId: '68acb6eb0002c8837570',
  apiKey: 'standard_a79577854c6c11119c74c7dd0ce197fec3d74450f37aca9dbb6a55dfce6ad8c198c8078cc8d3966fee110dea30df9fb9d3ad2c1ba745b93329a46f15cd601f03e6c9d11c29aa254597fe960faf51e3d1064bb1a03f783ac31ac3d4a949bc518a480c4b499be2d6cdd7dd148c69e7b72e7965de96cb88d1d49389aeb7dc252435',
  functions: [
    {
      id: 'cleanup-demo-sessions',
      name: 'Cleanup Demo User Sessions',
      source: path.join(__dirname, 'functions', 'cleanup-demo-sessions'),
      entrypoint: 'index.js',
      runtime: 'node-18.0',
      execute: ['any'],
      commands: 'npm install node-appwrite@3.0.6',
      timeout: 30,
      vars: {
        DATABASE_ID: '68c58e83000a2666b4d9',
        DEMO_USER_EMAIL: 'test@sjcem.edu.in'
      }
    },
    {
      id: 'reset-demo-preferences',
      name: 'Reset Demo User Preferences',
      source: path.join(__dirname, 'functions', 'reset-demo-preferences'),
      entrypoint: 'index.js',
      runtime: 'node-18.0',
      execute: ['any'],
      commands: 'npm install node-appwrite@3.0.6',
      timeout: 15,
      vars: {
        DATABASE_ID: '68c58e83000a2666b4d9',
        DEMO_USER_EMAIL: 'test@sjcem.edu.in'
      }
    },
    {
      id: 'trigger-demo-cleanup',
      name: 'Trigger Demo User Cleanup',
      source: path.join(__dirname, 'functions', 'trigger-demo-cleanup'),
      entrypoint: 'index.js',
      runtime: 'node-18.0',
      execute: ['any'],
      commands: 'npm install node-appwrite@3.0.6',
      timeout: 15,
      vars: {
        CLEANUP_FUNCTION_ID: 'cleanup-demo-sessions',
        DEMO_USER_EMAIL: 'test@sjcem.edu.in'
      }
    }
  ]
};

// Create a zip file from a directory
async function zipDirectory(sourceDir, outPath) {
  const archive = archiver('zip', { zlib: { level: 9 }});
  const stream = fs.createWriteStream(outPath);
  
  return new Promise((resolve, reject) => {
    archive
      .directory(sourceDir, false)
      .on('error', err => reject(err))
      .pipe(stream);

    stream.on('close', () => resolve());
    archive.finalize();
  });
}

// Make a request to the Appwrite API
function appwriteRequest(method, path, headers = {}, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      method,
      headers: {
        'X-Appwrite-Project': config.projectId,
        'X-Appwrite-Key': config.apiKey,
        ...headers
      }
    };

    const req = https.request(`${config.endpoint}${path}`, options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonResponse = JSON.parse(responseData);
          
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(jsonResponse);
          } else {
            reject(new Error(`API request failed: ${JSON.stringify(jsonResponse)}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse response: ${responseData}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      if (data instanceof FormData) {
        Object.entries(data.getHeaders()).forEach(([key, value]) => {
          req.setHeader(key, value);
        });
        data.pipe(req);
      } else if (typeof data === 'object') {
        req.write(JSON.stringify(data));
        req.end();
      } else {
        req.write(data);
        req.end();
      }
    } else {
      req.end();
    }
  });
}

// Check if function exists, create if not
async function ensureFunction(functionConfig) {
  try {
    console.log(`Checking if function ${functionConfig.id} exists...`);
    const functionData = await appwriteRequest('GET', `/functions/${functionConfig.id}`);
    console.log(`Function ${functionConfig.id} already exists.`);
    return functionData;
  } catch (error) {
    console.log(`Function ${functionConfig.id} does not exist. Creating...`);
    
    return appwriteRequest('POST', '/functions', {
      'Content-Type': 'application/json'
    }, {
      functionId: functionConfig.id,
      name: functionConfig.name,
      runtime: functionConfig.runtime,
      execute: functionConfig.execute,
      commands: functionConfig.commands,
      timeout: functionConfig.timeout,
      entrypoint: functionConfig.entrypoint
    });
  }
}

// Create or update function variables
async function setupFunctionVariables(functionId, variables) {
  console.log(`Setting up variables for function ${functionId}...`);
  
  // Get existing variables
  const existingVarsRes = await appwriteRequest('GET', `/functions/${functionId}/variables`);
  const existingVars = existingVarsRes.variables || [];
  
  // Map existing variables by key for easy lookup
  const existingVarsMap = existingVars.reduce((map, v) => {
    map[v.key] = v;
    return map;
  }, {});
  
  // Create or update each variable
  for (const [key, value] of Object.entries(variables)) {
    if (existingVarsMap[key]) {
      console.log(`  Updating variable: ${key}`);
      
      await appwriteRequest('PUT', `/functions/${functionId}/variables/${existingVarsMap[key].$id}`, {
        'Content-Type': 'application/json'
      }, {
        key,
        value
      });
    } else {
      console.log(`  Creating variable: ${key}`);
      
      await appwriteRequest('POST', `/functions/${functionId}/variables`, {
        'Content-Type': 'application/json'
      }, {
        key,
        value
      });
    }
  }
}

// Create deployment for a function
async function createDeployment(functionId, sourceDir, entrypoint) {
  console.log(`Creating deployment for function ${functionId}...`);
  
  // Create temp zip file
  const tmpZipPath = path.join(__dirname, `${functionId}.zip`);
  await zipDirectory(sourceDir, tmpZipPath);
  
  console.log(`  Created zip file: ${tmpZipPath}`);
  
  // Create form data with the zip file
  const formData = new FormData();
  formData.append('entrypoint', entrypoint);
  formData.append('activate', 'true');
  formData.append('code', fs.createReadStream(tmpZipPath));
  
  try {
    const deploymentResult = await appwriteRequest('POST', `/functions/${functionId}/deployments`, {}, formData);
    console.log(`  Deployment created: ${deploymentResult.$id}`);
    
    // Clean up the zip file
    fs.unlinkSync(tmpZipPath);
    
    return deploymentResult;
  } catch (error) {
    console.error(`  Deployment failed: ${error.message}`);
    // Clean up the zip file even on error
    if (fs.existsSync(tmpZipPath)) {
      fs.unlinkSync(tmpZipPath);
    }
    throw error;
  }
}

// Set up CRON schedule for a function
async function setupSchedule(functionId, schedule) {
  if (!schedule) return;
  
  console.log(`Setting up schedule for function ${functionId}: ${schedule}`);
  
  await appwriteRequest('PUT', `/functions/${functionId}`, {
    'Content-Type': 'application/json'
  }, {
    schedule
  });
}

// Main deployment function
async function deployFunctions() {
  console.log('Starting function deployment...');
  
  let success = 0;
  let failed = 0;
  
  for (const funcConfig of config.functions) {
    try {
      console.log(`\n--- Processing function: ${funcConfig.id} ---`);
      
      // Step 1: Ensure function exists
      await ensureFunction(funcConfig);
      
      // Step 2: Set up function variables
      if (funcConfig.vars) {
        await setupFunctionVariables(funcConfig.id, funcConfig.vars);
      }
      
      // Step 3: Create deployment
      await createDeployment(funcConfig.id, funcConfig.source, funcConfig.entrypoint);
      
      // Step 4: Set up schedule if provided
      if (funcConfig.schedule) {
        await setupSchedule(funcConfig.id, funcConfig.schedule);
      }
      
      console.log(`✅ Successfully deployed function: ${funcConfig.id}`);
      success++;
    } catch (error) {
      console.error(`❌ Failed to deploy function ${funcConfig.id}: ${error.message}`);
      failed++;
    }
  }
  
  console.log('\n---------------------------------');
  console.log(`Deployment complete: ${success} succeeded, ${failed} failed`);
  
  if (success > 0) {
    console.log('\nNext steps:');
    console.log('1. Configure function permissions in Appwrite Console');
    console.log('2. Test the functions by triggering them manually');
  }
}

// Check for required npm packages
function checkRequirements() {
  const requiredPackages = ['archiver', 'form-data'];
  const missingPackages = [];
  
  for (const pkg of requiredPackages) {
    try {
      require.resolve(pkg);
    } catch (error) {
      missingPackages.push(pkg);
    }
  }
  
  if (missingPackages.length > 0) {
    console.error(`Missing required packages: ${missingPackages.join(', ')}`);
    console.error(`Please install them: npm install ${missingPackages.join(' ')}`);
    process.exit(1);
  }
}

// Run the deployment
async function main() {
  try {
    checkRequirements();
    await deployFunctions();
  } catch (error) {
    console.error('Deployment failed:', error);
    process.exit(1);
  }
}

main();