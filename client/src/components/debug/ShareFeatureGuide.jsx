import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Share2, Eye, Edit, Users, Globe, Lock, 
  CheckCircle, ArrowRight, Copy, ExternalLink 
} from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';

/**
 * Share Feature Testing Guide
 * Development component to help locate and test sharing features
 */
const ShareFeatureGuide = () => {
  const [currentStep, setCurrentStep] = useState(0);

  const testSteps = [
    {
      id: 'locate-share-button',
      title: 'Step 1: Locate Share Button',
      description: 'Find the Share button in the Visualize page',
      icon: Share2,
      instructions: [
        'Go to /app/files in your browser',
        'Click on any CSV file to open it in the Visualize page',
        'Look for the Share button in the top-right header area',
        'The button appears next to "Back to Files" and "Export" buttons',
        'Note: You must be signed in (not a visitor) to see the Share button'
      ],
      expectedResult: 'You should see a "Share" button with a Share2 icon'
    },
    {
      id: 'create-share-link',
      title: 'Step 2: Create Share Link',
      description: 'Generate a shareable URL for your file',
      icon: Globe,
      instructions: [
        'Click the "Share" button to open the sharing modal',
        'Configure access settings (View only or Can edit)',
        'Choose whether to allow anonymous access',
        'Optionally set an expiration date',
        'Click "Create Share Link" button',
        'Copy the generated URL'
      ],
      expectedResult: 'A unique shareable URL is generated and displayed'
    },
    {
      id: 'test-view-access',
      title: 'Step 3: Test View-Only Access',
      description: 'Verify view-only permissions work correctly',
      icon: Eye,
      instructions: [
        'Open the shared URL in an incognito/private browser window',
        'Verify you can see the file data without signing in',
        'Check that edit controls are not visible',
        'Confirm the permission badge shows "View Only"',
        'Try to interact with the data (should be read-only)'
      ],
      expectedResult: 'File is viewable but not editable, permission badge shows "View Only"'
    },
    {
      id: 'test-edit-access',
      title: 'Step 4: Test Edit Access',
      description: 'Verify edit permissions work correctly',
      icon: Edit,
      instructions: [
        'Go back to the original file and update share settings',
        'Change default access to "Can edit"',
        'Open the updated shared URL in incognito window',
        'Sign in with a different account (or same account)',
        'Verify edit controls are visible',
        'Check that permission badge shows "Can Edit"'
      ],
      expectedResult: 'File is editable, permission badge shows "Can Edit"'
    },
    {
      id: 'test-collaboration',
      title: 'Step 5: Test Real-time Collaboration',
      description: 'Verify collaboration features work in shared files',
      icon: Users,
      instructions: [
        'Open the shared file in two different browser windows',
        'Sign in with different accounts in each window',
        'Move your cursor around and verify live cursor tracking',
        'Add annotations and check they appear in real-time',
        'Test the live chat feature',
        'Verify user presence indicators work'
      ],
      expectedResult: 'Real-time collaboration features work seamlessly'
    }
  ];

  const currentStepData = testSteps[currentStep];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Share Feature Testing Guide
        </h2>
        <p className="text-lg text-gray-600">
          Follow these steps to locate and test the collaboration features
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center justify-center mb-8">
        {testSteps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                index <= currentStep
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {index < currentStep ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <span>{index + 1}</span>
              )}
            </div>
            {index < testSteps.length - 1 && (
              <div
                className={`w-16 h-1 mx-2 ${
                  index < currentStep ? 'bg-primary-600' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Current Step */}
      <Card className="p-8">
        <div className="flex items-start space-x-4 mb-6">
          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
            <currentStepData.icon className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {currentStepData.title}
            </h3>
            <p className="text-gray-600">
              {currentStepData.description}
            </p>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <h4 className="font-medium text-gray-900">Instructions:</h4>
          <ol className="space-y-2">
            {currentStepData.instructions.map((instruction, index) => (
              <li key={index} className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </span>
                <span className="text-gray-700">{instruction}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-green-800 mb-2">Expected Result:</h4>
          <p className="text-green-700">{currentStepData.expectedResult}</p>
        </div>

        <div className="flex justify-between">
          <Button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            variant="outline"
            disabled={currentStep === 0}
          >
            Previous Step
          </Button>
          
          <Button
            onClick={() => setCurrentStep(Math.min(testSteps.length - 1, currentStep + 1))}
            variant="primary"
            disabled={currentStep === testSteps.length - 1}
            icon={ArrowRight}
          >
            Next Step
          </Button>
        </div>
      </Card>

      {/* Quick Reference */}
      <Card className="mt-8 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Reference</h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Key URLs:</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• Files page: <code>/app/files</code></li>
              <li>• Visualize page: <code>/app/visualize/:fileId</code></li>
              <li>• Shared file: <code>/shared/:fileId/:shareToken</code></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Permission Levels:</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• <Eye className="w-4 h-4 inline mr-1" />View Only: Read-only access</li>
              <li>• <Edit className="w-4 h-4 inline mr-1" />Can Edit: Full editing access</li>
              <li>• <Users className="w-4 h-4 inline mr-1" />Admin: Owner permissions</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">Development Notes:</h4>
          <ul className="space-y-1 text-sm text-blue-700">
            <li>• Share button has a green pulse indicator in development mode</li>
            <li>• Backend server must be running on port 5001</li>
            <li>• Socket.IO collaboration requires both frontend and backend</li>
            <li>• Test with different browsers/incognito for true sharing simulation</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};

export default ShareFeatureGuide;
