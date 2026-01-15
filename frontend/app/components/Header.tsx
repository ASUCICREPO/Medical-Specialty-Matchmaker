'use client';

import { useState } from 'react';
import Image from 'next/image';
import { HelpModal } from './HelpModal';

export function Header() {
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  return (
    <>
      <header className="w-full border-b border-gray-200 bg-white py-4 px-6">
        <div className="max-w-2xl lg:max-w-3xl mx-auto flex items-center justify-between">
          <Image
            src="/WTI-logo-horiz-800px.png"
            alt="World Telehealth Initiative"
            width={200}
            height={60}
            className="h-12 w-auto"
            priority
          />
          <button 
            onClick={() => setIsHelpModalOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors" 
            aria-label="Help"
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
              className="w-6 h-6 text-wti-dark-teal"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
              <path d="M12 17h.01"></path>
            </svg>
          </button>
        </div>
      </header>

      <HelpModal 
        isOpen={isHelpModalOpen} 
        onClose={() => setIsHelpModalOpen(false)} 
      />
    </>
  );
}