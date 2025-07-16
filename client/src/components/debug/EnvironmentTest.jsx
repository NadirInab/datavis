import React from 'react';
import { env, logEnvironmentConfig } from '../../utils/environment';

/**
 * Environment Test Component
 * For debugging environment variable issues
 */
const EnvironmentTest = () => {
  // Log environment config
  React.useEffect(() => {
    logEnvironmentConfig();
  }, []);

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Environment Configuration Test</h3>
      
      <div className="space-y-2 text-sm">
        <div>
          <strong>Server URL:</strong> {env.serverUrl}
        </div>
        <div>
          <strong>API Base URL:</strong> {env.apiBaseUrl}
        </div>
        <div>
          <strong>Collaboration Enabled:</strong> {env.collaborationEnabled ? 'Yes' : 'No'}
        </div>
        <div>
          <strong>Environment:</strong> {env.environment}
        </div>
        <div>
          <strong>Debug Mode:</strong> {env.debugMode ? 'Yes' : 'No'}
        </div>
        <div>
          <strong>Is Development:</strong> {env.isDevelopment ? 'Yes' : 'No'}
        </div>
      </div>

      <div className="mt-4">
        <h4 className="font-medium mb-2">Available Environment Variables:</h4>
        <div className="text-xs bg-white p-2 rounded border">
          {Object.keys(import.meta.env)
            .filter(key => key.startsWith('VITE_'))
            .map(key => (
              <div key={key}>
                <strong>{key}:</strong> {import.meta.env[key]}
              </div>
            ))}
        </div>
      </div>

      <div className="mt-4">
        <h4 className="font-medium mb-2">import.meta.env check:</h4>
        <div className="text-xs bg-white p-2 rounded border">
          <div>Mode: {import.meta.env.MODE}</div>
          <div>DEV: {import.meta.env.DEV ? 'true' : 'false'}</div>
          <div>PROD: {import.meta.env.PROD ? 'true' : 'false'}</div>
        </div>
      </div>
    </div>
  );
};

export default EnvironmentTest;
