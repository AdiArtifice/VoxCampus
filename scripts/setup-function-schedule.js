#!/usr/bin/env node

/**
 * Set up a schedule for the cleanup function
 * This script configures the demo session cleanup to run daily at midnight
 */
const https = require('https');

// Configuration
const config = {
  endpoint: 'https://fra.cloud.appwrite.io/v1',
  projectId: '68acb6eb0002c8837570',
  apiKey: 'standard_a79577854c6c11119c74c7dd0ce197fec3d74450f37aca9dbb6a55dfce6ad8c198c8078cc8d3966fee110dea30df9fb9d3ad2c1ba745b93329a46f15cd601f03e6c9d11c29aa254597fe960faf51e3d1064bb1a03f783ac31ac3d4a949bc518a480c4b499be2d6cdd7dd148c69e7b72e7965de96cb88d1d49389aeb7dc252435',
  functionId: 'cleanup-demo-sessions',
  // Daily at midnight: 0 0 * * *
  schedule: '0 0 * * *'
};

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
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Set up the schedule for the function
async function setupSchedule() {
  console.log(`Setting up schedule for function ${config.functionId}: ${config.schedule}`);
  
  try {
    await appwriteRequest('PUT', `/functions/${config.functionId}`, {
      'Content-Type': 'application/json'
    }, {
      schedule: config.schedule
    });
    
    console.log(`✅ Successfully set up schedule for function: ${config.functionId}`);
  } catch (error) {
    console.error(`❌ Failed to set up schedule: ${error.message}`);
    process.exit(1);
  }
}

// Run the setup
setupSchedule();