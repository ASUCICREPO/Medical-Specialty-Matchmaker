'use client';

import { useEffect } from 'react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-opacity-20 backdrop-blur-sm transition-all"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-wti-navy">Help & Support</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close help modal"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className="w-5 h-5 text-gray-500"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* About Section */}
          <div>
            <h3 className="text-lg font-medium text-wti-navy mb-3">About This Tool</h3>
            <p className="text-gray-700 leading-relaxed">
              The Medical Specialty Matchmaker helps healthcare professionals in resource-constrained 
              settings connect with volunteer medical experts worldwide. Our AI-powered system analyzes 
              patient symptoms and matches cases with appropriate specialists.
            </p>
          </div>

          {/* How It Works */}
          <div>
            <h3 className="text-lg font-medium text-wti-navy mb-3">How It Works</h3>
            <ol className="space-y-2 text-gray-700">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-wti-teal text-white rounded-full flex items-center justify-center text-sm font-medium">1</span>
                <span>Enter your information as the requesting clinician</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-wti-teal text-white rounded-full flex items-center justify-center text-sm font-medium">2</span>
                <span>Describe patient symptoms through our guided chat interface</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-wti-teal text-white rounded-full flex items-center justify-center text-sm font-medium">3</span>
                <span>Review and submit your consultation request</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-wti-teal text-white rounded-full flex items-center justify-center text-sm font-medium">4</span>
                <span>Get matched with appropriate volunteer specialists</span>
              </li>
            </ol>
          </div>

          {/* Privacy Notice */}
          <div className="bg-wti-teal bg-opacity-10 border border-wti-teal border-opacity-30 rounded-lg p-4">
            <div className="flex gap-3">
              <div className="shrink-0">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path 
                    fillRule="evenodd" 
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" 
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="text-sm">
                <p className="text-white mb-1">
                  <strong>Privacy & Data Security</strong>
                </p>
                <p className="text-gray-200 text-xs">
                  All patient information is handled in compliance with HIPAA standards and international data protection regulations. Data is encrypted and shared only with matched specialists.
                </p>
              </div>
            </div>
          </div>

          {/* Support Contacts */}
          <div>
            <h3 className="text-lg font-medium text-wti-navy mb-3">Contacts</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className="w-5 h-5 text-wti-dark-teal mt-0.5 flex-shrink-0"
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <div>
                  <p className="font-medium text-gray-900">Email</p>
                  <a 
                    href="mailto:inquiry@worldtelehealthinitiative.org" 
                    className="text-wti-dark-teal hover:text-wti-navy transition-colors"
                  >
                    inquiry@worldtelehealthinitiative.org
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className="w-5 h-5 text-wti-dark-teal mt-0.5 flex-shrink-0"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                <div>
                  <p className="font-medium text-gray-900">Phone</p>
                  <a 
                    href="tel:+1-555-WTI-HELP" 
                    className="text-wti-dark-teal hover:text-wti-navy transition-colors"
                  >
                    +1 (805) 886-8016
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className="w-5 h-5 text-wti-dark-teal mt-0.5 flex-shrink-0"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M2 12h20" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
                <div>
                  <p className="font-medium text-gray-900">Website</p>
                  <a 
                    href="https://www.worldtelehealthinitiative.org/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-wti-dark-teal hover:text-wti-navy transition-colors"
                  >
                    worldtelehealthinitiative.org
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Languages */}
          <div className="text-center pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">Currently available in English</p>
            <p className="text-xs text-gray-500 mt-1">Coming soon: Spanish, French, Ukrainian</p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="w-full py-2 px-4 bg-wti-red text-white rounded-lg hover:bg-wti-red-hover transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}