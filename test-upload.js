// Test file to verify if the issue is with file creation
const testBlob = new Blob(['test'], { type: 'text/plain' });
const testFile = new File([testBlob], 'test.txt', { type: 'text/plain' });