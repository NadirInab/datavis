import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Zap,
  Shield,
  Clock,
  CheckCircle,
  ArrowRight,
  FileText,
  Users,
  Star,
  Infinity
} from 'lucide-react';
import Button from '../ui/Button';

const ConversionLimitModal = ({ isOpen, onClose, conversionStatus, remainingTime }) => {
  const navigate = useNavigate();

  const handleSignup = () => {
    onClose();
    navigate('/signup');
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { duration: 0.3, ease: "easeOut" }
    },
    exit: { 
      opacity: 0, 
      scale: 0.95, 
      y: 20,
      transition: { duration: 0.2, ease: "easeIn" }
    }
  };

  const benefitVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i) => ({
      opacity: 1,
      x: 0,
      transition: { duration: 0.4, delay: i * 0.1 }
    })
  };

  const benefits = [
    {
      icon: Infinity,
      title: "Unlimited Conversions",
      description: "Convert as many files as you need, completely free forever",
      color: "primary"
    },
    {
      icon: Zap,
      title: "Instant Access",
      description: "No waiting periods or restrictions - start converting immediately",
      color: "secondary"
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your files are processed securely and never stored on our servers",
      color: "accent"
    },
    {
      icon: FileText,
      title: "All Formats Included",
      description: "Access to all 10+ conversion formats with no limitations",
      color: "primary"
    }
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white p-6 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-4 right-4 w-32 h-32 bg-white rounded-full blur-3xl"></div>
              <div className="absolute bottom-4 left-4 w-24 h-24 bg-white rounded-full blur-2xl"></div>
            </div>
            
            <div className="relative flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-1">
                    Create Free Account to Continue
                  </h2>
                  <p className="text-primary-100">
                    You've used all {conversionStatus?.limit} free daily conversions
                  </p>
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Status Message */}
            <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl p-4 mb-6 border border-primary-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-primary-600" />
                  <div>
                    <p className="text-primary-800 font-semibold">
                      Free daily limit reached
                    </p>
                    <p className="text-primary-600 text-sm">
                      Resets in {remainingTime?.hours} hours at {remainingTime?.resetTime}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary-700">
                    {conversionStatus?.used}/{conversionStatus?.limit}
                  </div>
                  <div className="text-xs text-primary-600">conversions used</div>
                </div>
              </div>
            </div>

            {/* Value Proposition */}
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Join thousands of users converting files for free
              </h3>
              <p className="text-gray-600">
                Create your free account in seconds and get unlimited conversions immediately - no payment required
              </p>
            </div>

            {/* Benefits Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  custom={index}
                  variants={benefitVariants}
                  initial="hidden"
                  animate="visible"
                  className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className={`w-8 h-8 bg-gradient-to-br from-${benefit.color}-100 to-${benefit.color}-200 rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <benefit.icon className={`w-4 h-4 text-${benefit.color}-600`} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 text-sm">
                      {benefit.title}
                    </h4>
                    <p className="text-gray-600 text-xs leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Social Proof */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>10,000+ free users</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>1M+ files converted</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Always free</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleSignup}
                className="flex-1 bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-3 px-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                Create Free Account
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>

              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 py-3 px-6"
              >
                Continue as Visitor
              </Button>
            </div>

            {/* Fine Print */}
            <p className="text-xs text-gray-500 text-center mt-4">
              No credit card required • Always free • Unlimited conversions instantly
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ConversionLimitModal;
