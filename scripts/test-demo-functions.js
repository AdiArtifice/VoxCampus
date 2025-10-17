#!/usr/bin/env node

/**
 * Test the demo user cleanup functions
 * This script will trigger the cleanup function manually to verify it works
 */
const https = require('https');

// Configuration
const config = {
  endpoint: 'https://fra.cloud.appwrite.io/v1',
  projectId: '68acb6eb0002c8837570',
  apiKey: 'standard_a79577854c6c11119c74c7dd0ce197fec3d74450f37aca9dbb6a55dfce6ad8c198c8078cc8d3966fee110dea30df9fb9d3ad2c1ba745b93329a46f15cd601f03e6c9d11c29aa254597fe960faf51e3d1064bb1a03f783ac31ac3d4a949bc518a480c4b499be2d6cdd7dd148c69e7b72e7965de96cb88d1d49389aeb7dc252435',
  functions: [
    {
      id: 'cleanup-demo-sessions',
      testData: {
        skipOldRecords: false, // Set to true to skip cleanup of old records
        forceReset: true // Force immediate cleanup
      }
    },
    {
      id: 'trigger-demo-cleanup',
      testData: {
        userId: 'demo-user-id', // Replace with an actual demo user ID when testing
        email: 'test@sjcem.edu.in'
      }
    }
  ]
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

// Create an execution for a function
async function executeFunction(functionId, data) {
  console.log(`Executing function ${functionId}...`);
  
  try {
    const execution = await appwriteRequest('POST', `/functions/${functionId}/executions`, {
      'Content-Type': 'application/json'
    }, data);
    
    console.log(`✅ Function execution started: ${execution.$id}`);
    console.log(`   Status: ${execution.status}`);
    
    if (execution.status === 'completed') {
      console.log(`   Response: ${execution.response}`);
    } else if (execution.status === 'failed') {
      console.log(`   Error: ${execution.stderr}`);
    }
    
    return execution;
  } catch (error) {
    console.error(`❌ Function execution failed: ${error.message}`);
    return null;
  }
}

// Test a specific function
async function testFunction(funcConfig) {
  console.log(`\n--- Testing function: ${funcConfig.id} ---`);
  
  const execution = await executeFunction(funcConfig.id, funcConfig.testData);
  
  if (!execution) return false;
  
  if (execution.status === 'completed') {
    return true;
  } else {
    console.log(`Waiting for execution to complete...`);
    
    // Poll for execution status
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      attempts++;
      
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      
      try {
        const updatedExecution = await appwriteRequest('GET', `/functions/${funcConfig.id}/executions/${execution.$id}`);
        
        console.log(`   Status: ${updatedExecution.status}`);
        
        if (updatedExecution.status === 'completed') {
          console.log(`   Response: ${updatedExecution.response}`);
          return true;
        } else if (updatedExecution.status === 'failed') {
          console.log(`   Error: ${updatedExecution.stderr}`);
          return false;
        }
        
        if (attempts === maxAttempts) {
          console.log(`   Timed out waiting for execution to complete.`);
          return false;
        }
      } catch (error) {
        console.error(`   Error checking execution status: ${error.message}`);
      }
    }
  }
  
  return false;
}

// Run the tests
async function runTests() {
  console.log('Starting function tests...');
  
  let success = 0;
  let failed = 0;
  
  // Ask for the demo user ID if not provided
  if (config.functions[1].testData.userId === 'demo-user-id') {
    console.log('\nWARNING: You should replace "demo-user-id" with an actual demo user ID when testing');
    console.log('Continue anyway? (Press Ctrl+C to cancel or Enter to continue)');
    
    await new Promise(resolve => {
      process.stdin.once('data', () => {
        resolve();
      });
    });
  }
  
  for (const funcConfig of config.functions) {
    const result = await testFunction(funcConfig);
    
    if (result) {
      success++;
    } else {
      failed++;
    }
  }
  
  console.log('\n---------------------------------');
  console.log(`Tests complete: ${success} succeeded, ${failed} failed`);
}

// Run the tests
runTests().catch(error => {
  console.error('Testing failed:', error);
  process.exit(1);
});