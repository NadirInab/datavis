import React, { useEffect } from 'react';
import { Icons } from './Button';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  showCloseButton = true 
}) => {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Simplified Backdrop - No dark overlay */}
      <div
        className="fixed inset-0 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className={`relative bg-white/95 backdrop-blur-md rounded-xl shadow-lg border border-[#5A827E]/20 ${sizeClasses[size]} w-full transform transition-all duration-300 scale-100 opacity-100`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#5A827E]/10">
            <h3 className="text-xl font-semibold text-[#5A827E]">{title}</h3>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-[#5A827E]/10 rounded-full transition-colors duration-200 group"
              >
                <Icons.X className="w-5 h-5 text-[#5A827E] group-hover:text-[#5A827E]/80" />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

// Feature Modal Component for specific feature details
export const FeatureModal = ({ isOpen, onClose, feature }) => {
  if (!feature) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={feature.title} size="lg">
      <div className="space-y-6">
        {/* Icon and Description */}
        <div className="flex items-start space-x-4">
          <div className="w-16 h-16 bg-gradient-to-br from-[#5A827E] to-[#84AE92] rounded-2xl flex items-center justify-center text-white shadow-lg flex-shrink-0">
            <feature.icon className="w-8 h-8" />
          </div>
          <div>
            <p className="text-[#5A827E] leading-relaxed text-lg">
              {feature.description}
            </p>
          </div>
        </div>

        {/* Feature Details */}
        {feature.details && (
          <div className="bg-[#5A827E]/5 rounded-xl p-6 border border-[#5A827E]/10">
            <h4 className="font-semibold text-[#5A827E] mb-4">Key Features:</h4>
            <ul className="space-y-3">
              {feature.details.map((detail, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-[#B9D4AA] rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-[#5A827E]/80">{detail}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Benefits */}
        {feature.benefits && (
          <div className="bg-[#B9D4AA]/10 rounded-xl p-6 border border-[#B9D4AA]/20">
            <h4 className="font-semibold text-[#5A827E] mb-4">Benefits:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {feature.benefits.map((benefit, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <Icons.CheckCircle className="w-5 h-5 text-[#84AE92] flex-shrink-0" />
                  <span className="text-[#5A827E]/80">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Call to Action */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-[#5A827E]/10">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[#5A827E] hover:text-[#5A827E]/80 transition-colors duration-200"
          >
            Close
          </button>
          {feature.ctaAction && (
            <button
              onClick={() => {
                feature.ctaAction();
                onClose();
              }}
              className="px-6 py-2 bg-gradient-to-r from-[#5A827E] to-[#84AE92] text-white rounded-lg hover:from-[#5A827E]/90 hover:to-[#84AE92]/90 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              {feature.ctaText || 'Get Started'}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default Modal;
