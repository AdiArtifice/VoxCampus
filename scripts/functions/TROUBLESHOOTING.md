## Troubleshooting

### Common Deployment Issues

1. **Invalid node-appwrite Version**
   
   **Problem**: Deployment fails with error about missing node-appwrite version
   
   **Solution**: Update the package.json to use a valid version:
   ```json
   "dependencies": {
     "node-appwrite": "^8.0.0"
   }
   ```

2. **Function Execution Timeouts**
   
   **Problem**: Function times out during large cleanup operations
   
   **Solution**: 
   - Increase function timeout in Appwrite console
   - Add batching to process records in smaller chunks

3. **Permission Errors**
   
   **Problem**: Function fails with "not enough permissions" errors
   
   **Solution**: 
   - Check API key permissions in Appwrite console
   - Ensure API key has access to required resources
   - Verify function execution roles are correctly set

4. **Rate Limiting**

   **Problem**: Function fails due to rate limiting
   
   **Solution**:
   - Implement exponential backoff retry strategy
   - Add delays between batches
   - Consider spreading operations over multiple executions