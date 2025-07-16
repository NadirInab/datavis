import React from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Infinity, 
  Star,
  Zap
} from 'lucide-react';
import { useConversionLimits } from '../../utils/conversionLimits';

const ConversionStatusIndicator = ({ className = "", showUpgradePrompt = false }) => {
  const { isAuthenticated, getStatus } = useConversionLimits();
  const status = getStatus();

  const getStatusConfig = () => {
    switch (status.type) {
      case 'unlimited':
        return {
          icon: Infinity,
          bgColor: 'bg-gradient-to-r from-primary-50 to-secondary-50',
          borderColor: 'border-primary-200',
          textColor: 'text-primary-700',
          iconColor: 'text-primary-600',
          message: 'Unlimited conversions',
          badge: 'Free Account'
        };
      
      case 'limit_reached':
        return {
          icon: Clock,
          bgColor: 'bg-gradient-to-r from-red-50 to-orange-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-700',
          iconColor: 'text-red-600',
          message: 'Daily limit reached',
          badge: 'Sign up for unlimited'
        };
      
      case 'warning':
        return {
          icon: AlertTriangle,
          bgColor: 'bg-gradient-to-r from-yellow-50 to-orange-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-700',
          iconColor: 'text-yellow-600',
          message: status.message,
          badge: status.remaining === 1 ? 'Last conversion' : 'Almost done'
        };
      
      default:
        return {
          icon: CheckCircle,
          bgColor: 'bg-gradient-to-r from-green-50 to-primary-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-700',
          iconColor: 'text-green-600',
          message: status.message,
          badge: 'Available'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`${config.bgColor} ${config.borderColor} border rounded-xl p-4 ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 bg-white/80 rounded-lg flex items-center justify-center`}>
            <config.icon className={`w-4 h-4 ${config.iconColor}`} />
          </div>
          
          <div>
            <p className={`font-semibold text-sm ${config.textColor}`}>
              {config.message}
            </p>
            
            {!isAuthenticated && status.type !== 'limit_reached' && (
              <div className="flex items-center space-x-4 mt-1">
                <div className="flex items-center space-x-1">
                  <div className="w-16 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(status.used / status.limit) * 100}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                  <span className="text-xs text-gray-600">
                    {status.used}/{status.limit}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Status Badge */}
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            status.type === 'unlimited' 
              ? 'bg-primary-100 text-primary-700'
              : status.type === 'limit_reached'
              ? 'bg-red-100 text-red-700'
              : status.type === 'warning'
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-green-100 text-green-700'
          }`}>
            {config.badge}
          </span>

          {/* Sign Up Prompt for Visitors */}
          {!isAuthenticated && showUpgradePrompt && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="flex items-center space-x-1 bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-2 py-1 rounded-full text-xs font-medium"
            >
              <Star className="w-3 h-3" />
              <span>Sign Up</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Additional Info for Limit Reached */}
      {status.type === 'limit_reached' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="mt-3 pt-3 border-t border-red-200"
        >
          <div className="flex items-center justify-between text-xs">
            <span className="text-red-600">
              Sign up for free to get unlimited conversions
            </span>
            <div className="flex items-center space-x-1 text-red-500">
              <Zap className="w-3 h-3" />
              <span>Always free</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Progress Bar for Authenticated Users */}
      {isAuthenticated && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="mt-3 pt-3 border-t border-primary-200"
        >
          <div className="flex items-center justify-between text-xs text-primary-600">
            <span>Free account member</span>
            <div className="flex items-center space-x-1">
              <CheckCircle className="w-3 h-3" />
              <span>Unlimited conversions</span>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ConversionStatusIndicator;
