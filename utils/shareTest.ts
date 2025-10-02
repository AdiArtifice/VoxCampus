// Simple test file to validate share functionality
import { generateShareableUrl } from '../utils/urlShortener';
import { buildPostUrl, getEnvironmentInfo } from '../constants/environment';

export const testShareFunctionality = async () => {
  console.log('🧪 Testing Share Functionality');
  
  // Test 1: Environment detection
  console.log('📍 Environment Info:', getEnvironmentInfo());
  
  // Test 2: URL generation
  const testPostId = 'post1';
  const directUrl = buildPostUrl(testPostId);
  console.log('🔗 Direct URL:', directUrl);
  
  // Test 3: Shareable URL (with potential shortening)
  try {
    const shareableUrl = await generateShareableUrl(testPostId, false); // Disable shortening for testing
    console.log('✅ Shareable URL:', shareableUrl);
    
    return {
      success: true,
      directUrl,
      shareableUrl,
      environment: getEnvironmentInfo().environment
    };
  } catch (error) {
    console.error('❌ Share test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Export for use in components
export default testShareFunctionality;