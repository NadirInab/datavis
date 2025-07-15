import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Button, { Icons } from '../components/ui/Button';
import { FeatureCard } from '../components/ui/Card';
import { useAuth } from '../context/FirebaseAuthContext';

const LandingPageTest = () => {
  const { currentUser } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-20">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-6">
            Test Landing Page
          </h1>
          
          <p className="text-xl text-slate-600 mb-8">
            Testing basic functionality and components
          </p>

          {/* Test Icons */}
          <div className="flex justify-center gap-4 mb-8">
            <Icons.Chart className="w-8 h-8 text-blue-600" />
            <Icons.Shield className="w-8 h-8 text-green-600" />
            <Icons.Users className="w-8 h-8 text-indigo-600" />
            <Icons.FileText className="w-8 h-8 text-blue-600" />
            <Icons.Award className="w-8 h-8 text-indigo-600" />
            <Icons.Globe className="w-8 h-8 text-slate-600" />
          </div>

          {/* Test Buttons */}
          <div className="flex gap-4 justify-center mb-8">
            <Button
              as={Link}
              to="/register"
              variant="primary"
              size="lg"
              icon={Icons.ArrowRight}
              iconPosition="right"
            >
              Test Button
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              icon={Icons.Eye}
            >
              Test Outline
            </Button>
          </div>

          {/* Test Feature Card */}
          <div className="max-w-sm mx-auto">
            <FeatureCard
              icon={Icons.Upload}
              title="Test Feature"
              description="This is a test feature card to verify 3D hover effects work correctly."
              action={
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Icons.ArrowRight}
                  iconPosition="right"
                >
                  Test Action
                </Button>
              }
            />
          </div>

          {/* Test Animation */}
          <div className={`mt-8 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <p className="text-slate-600">
              Animation test: {isVisible ? 'Visible' : 'Hidden'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPageTest;
