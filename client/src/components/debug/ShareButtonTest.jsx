import React from 'react';
import ShareButton from '../sharing/ShareButton';
import Card from '../ui/Card';

/**
 * ShareButton Test Component
 * Simple test to verify ShareButton renders without errors
 */
const ShareButtonTest = () => {
  const handleShare = async (fileId, settings) => {
    console.log('Test share handler called:', { fileId, settings });
    
    // Mock successful response
    return {
      success: true,
      shareInfo: {
        shareUrl: `https://example.com/shared/${fileId}/test-token`,
        shareToken: 'test-token',
        permissions: settings
      }
    };
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          ShareButton Component Test
        </h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Test 1: Basic ShareButton</h3>
            <ShareButton
              fileId="test-file-1"
              fileName="test-data.csv"
              onShare={handleShare}
              isShared={false}
              shareUrl=""
            />
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Test 2: Already Shared File</h3>
            <ShareButton
              fileId="test-file-2"
              fileName="shared-data.csv"
              onShare={handleShare}
              isShared={true}
              shareUrl="https://example.com/shared/test-file-2/existing-token"
            />
          </div>
          
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-medium text-green-800 mb-2">✅ Test Results</h4>
            <p className="text-green-700 text-sm">
              If you can see this message and the ShareButton components above, 
              the component is rendering successfully without errors!
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ShareButtonTest;
