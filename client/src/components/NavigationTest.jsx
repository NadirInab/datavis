import React from 'react';
import { Link } from 'react-router-dom';
import Button, { Icons } from './ui/Button';

// Simple test component to verify navigation works
const NavigationTest = () => {
  return (
    <div className="p-8 space-y-4">
      <h2 className="text-2xl font-bold">Navigation Test</h2>
      
      {/* Test regular button */}
      <Button 
        variant="primary" 
        onClick={() => alert('Regular button works!')}
      >
        Regular Button
      </Button>
      
      {/* Test button as Link */}
      <Button
        as={Link}
        to="/app"
        variant="primary"
        icon={Icons.ArrowRight}
        iconPosition="right"
      >
        Go to Dashboard (Link Button)
      </Button>
      
      {/* Test direct Link for comparison */}
      <Link to="/app" className="inline-block">
        <button className="px-4 py-2 bg-blue-500 text-white rounded">
          Direct Link Button
        </button>
      </Link>
    </div>
  );
};

export default NavigationTest;
