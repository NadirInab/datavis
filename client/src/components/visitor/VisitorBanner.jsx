import React from 'react';
import { useAuth } from '../../context/FirebaseAuthContext';
import Button, { Icons } from '../ui/Button';
import Card from '../ui/Card';

const VisitorBanner = () => {
  const { visitorSession, isVisitor } = useAuth();

  if (!isVisitor() || !visitorSession) return null;

  const { filesUploaded, fileLimit, remainingFiles, isLimitReached, upgradeMessage } = visitorSession;

  return (
    <Card className="mb-6 bg-gradient-to-r from-[#FAFFCA] to-[#B9D4AA]/20 border-[#84AE92]/30">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Icons.Users className="w-5 h-5 text-[#5A827E]" />
              <span className="font-medium text-[#5A827E]">Visitor Mode</span>
            </div>
            
            {/* Upload Counter */}
            <div className="flex items-center space-x-2 bg-white/60 rounded-lg px-3 py-1">
              <Icons.Upload className="w-4 h-4 text-[#5A827E]" />
              <span className="text-sm font-medium text-[#5A827E]">
                {filesUploaded} of {fileLimit} uploads used
              </span>
              {remainingFiles > 0 && (
                <span className="text-xs text-[#84AE92] bg-[#84AE92]/10 px-2 py-0.5 rounded-full">
                  {remainingFiles} remaining
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Free Account Promotion */}
            <div className="text-right">
              <div className="text-sm font-medium text-[#5A827E]">
                Create a Free Account
              </div>
              <div className="text-xs text-[#5A827E]/70">
                Get 5 uploads at no cost!
              </div>
            </div>
            
            <Button
              variant="primary"
              size="sm"
              icon={Icons.UserPlus}
              onClick={() => {
                // Navigate to signup
                window.location.href = '/signup';
              }}
            >
              Sign Up Free
            </Button>
          </div>
        </div>

        {/* Limit Reached Warning */}
        {isLimitReached && (
          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Icons.AlertTriangle className="w-5 h-5 text-orange-600" />
                <div>
                  <div className="font-medium text-orange-800">Upload Limit Reached</div>
                  <div className="text-sm text-orange-700">
                    {upgradeMessage || 'Create a free account to continue uploading files'}
                  </div>
                </div>
              </div>
              <Button
                variant="primary"
                size="sm"
                icon={Icons.ArrowUp}
                onClick={() => {
                  window.location.href = '/signup';
                }}
              >
                Upgrade Now
              </Button>
            </div>
          </div>
        )}

        {/* Feature Access Info */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-2">
            <Icons.Check className="w-4 h-4 text-green-600" />
            <span className="text-sm text-[#5A827E]">CSV file uploads</span>
          </div>
          <div className="flex items-center space-x-2">
            <Icons.Check className="w-4 h-4 text-green-600" />
            <span className="text-sm text-[#5A827E]">Google Sheets import</span>
          </div>
          <div className="flex items-center space-x-2">
            <Icons.Check className="w-4 h-4 text-green-600" />
            <span className="text-sm text-[#5A827E]">Basic charts & PNG export</span>
          </div>
        </div>

        {/* Premium Features Teaser */}
        <div className="mt-3 pt-3 border-t border-[#84AE92]/20">
          <div className="text-xs text-[#5A827E]/70 mb-2">
            <strong>Free Account Benefits:</strong>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-[#5A827E]/70">
            <div className="flex items-center space-x-1">
              <Icons.Star className="w-3 h-3 text-[#84AE92]" />
              <span>5 file uploads (no cost)</span>
            </div>
            <div className="flex items-center space-x-1">
              <Icons.Star className="w-3 h-3 text-[#84AE92]" />
              <span>Excel, JSON, XML support</span>
            </div>
            <div className="flex items-center space-x-1">
              <Icons.Star className="w-3 h-3 text-[#84AE92]" />
              <span>Advanced chart types</span>
            </div>
            <div className="flex items-center space-x-1">
              <Icons.Star className="w-3 h-3 text-[#84AE92]" />
              <span>PDF & SVG exports</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default VisitorBanner;
