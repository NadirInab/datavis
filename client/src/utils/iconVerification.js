// Icon verification utility for development
import { Icons } from '../components/ui/Button';

/**
 * Verify that all required icons are properly defined
 * This helps catch missing icon issues during development
 */
export const verifyChartTypeIcons = () => {
  const requiredIcons = [
    'BarChart',
    'TrendingUp', 
    'PieChart',
    'Activity',
    'Target',
    'Circle',
    'MapPin' // Recently added for geospatial
  ];

  const missingIcons = [];
  const validIcons = [];

  requiredIcons.forEach(iconName => {
    if (Icons[iconName] && typeof Icons[iconName] === 'function') {
      validIcons.push(iconName);
    } else {
      missingIcons.push(iconName);
    }
  });

  return {
    allValid: missingIcons.length === 0,
    validIcons,
    missingIcons,
    totalRequired: requiredIcons.length,
    totalValid: validIcons.length
  };
};

/**
 * Verify that all icons in the Icons object are valid React components
 */
export const verifyAllIcons = () => {
  const iconNames = Object.keys(Icons);
  const invalidIcons = [];
  const validIcons = [];

  iconNames.forEach(iconName => {
    const IconComponent = Icons[iconName];
    if (typeof IconComponent === 'function') {
      try {
        // Try to create the component (basic validation)
        const element = IconComponent();
        if (element && element.type === 'svg') {
          validIcons.push(iconName);
        } else {
          invalidIcons.push(`${iconName} (not SVG)`);
        }
      } catch (error) {
        invalidIcons.push(`${iconName} (error: ${error.message})`);
      }
    } else {
      invalidIcons.push(`${iconName} (not function)`);
    }
  });

  return {
    allValid: invalidIcons.length === 0,
    validIcons,
    invalidIcons,
    totalIcons: iconNames.length,
    totalValid: validIcons.length
  };
};

/**
 * Development helper to log icon verification results
 */
export const logIconVerification = () => {
  if (import.meta.env.DEV) {
    console.group('🔍 Icon Verification');
    
    const chartIconResults = verifyChartTypeIcons();
    console.log('📊 Chart Type Icons:', chartIconResults);
    
    if (!chartIconResults.allValid) {
      console.warn('❌ Missing chart icons:', chartIconResults.missingIcons);
    } else {
      console.log('✅ All chart type icons are valid');
    }
    
    const allIconResults = verifyAllIcons();
    console.log('🎨 All Icons Summary:', {
      total: allIconResults.totalIcons,
      valid: allIconResults.totalValid,
      invalid: allIconResults.invalidIcons.length
    });
    
    if (allIconResults.invalidIcons.length > 0) {
      console.warn('❌ Invalid icons:', allIconResults.invalidIcons);
    }
    
    console.groupEnd();
  }
};

// Auto-run verification in development
if (import.meta.env.DEV) {
  // Run verification after a short delay to ensure all modules are loaded
  setTimeout(logIconVerification, 1000);
}
