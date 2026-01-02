'use client';

import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { WelcomeScreen } from './components/screens/WelcomeScreen';
import { ClinicianForm, ClinicianData } from './components/screens/ClinicianForm';
import { ChatInterface, ChatData } from './components/screens/ChatInterface';
import { FormReview } from './components/screens/FormReview';

type Screen = 'welcome' | 'clinician-form' | 'chat' | 'form-review' | 'success';

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');
  const [clinicianData, setClinicianData] = useState<ClinicianData | null>(null);
  const [chatData, setChatData] = useState<ChatData | null>(null);
  const [finalClassification, setFinalClassification] = useState<any>(null);

  // Load clinician data from localStorage on component mount
  useEffect(() => {
    const savedClinicianData = localStorage.getItem('clinicianData');
    if (savedClinicianData) {
      try {
        const parsedData = JSON.parse(savedClinicianData);
        setClinicianData(parsedData);
        console.log('✅ Loaded saved clinician data:', parsedData);
      } catch (error) {
        console.error('Error parsing saved clinician data:', error);
        localStorage.removeItem('clinicianData');
      }
    }
  }, []);

  const handleStartRequest = () => {
    // If we have saved clinician data, skip to chat
    if (clinicianData) {
      setCurrentScreen('chat');
    } else {
      setCurrentScreen('clinician-form');
    }
  };

  const handleClinicianFormSubmit = (data: ClinicianData) => {
    setClinicianData(data);
    // Save clinician data to localStorage for future requests
    localStorage.setItem('clinicianData', JSON.stringify(data));
    console.log('💾 Saved clinician data to localStorage');
    setCurrentScreen('chat');
  };

  const handleChatComplete = (data: ChatData) => {
    setChatData(data);
    setCurrentScreen('form-review');
  };

  const handleFormSubmit = (classification?: any) => {
    // Store the final classification (could be re-evaluated)
    if (classification) {
      setFinalClassification(classification);
    } else if (chatData?.classificationResult) {
      setFinalClassification(chatData.classificationResult);
    }
    setCurrentScreen('success');
  };

  const handleBackToWelcome = () => {
    setCurrentScreen('welcome');
    setChatData(null); // Clear chat data but keep clinician data
    setFinalClassification(null);
  };

  const handleSubmitAnotherRequest = () => {
    // Keep clinician data, clear chat data and final classification, go directly to chat
    setChatData(null);
    setFinalClassification(null);
    setCurrentScreen('chat');
  };

  const handleClearClinicianData = () => {
    // Clear saved clinician data and start fresh
    setClinicianData(null);
    setChatData(null);
    setFinalClassification(null);
    localStorage.removeItem('clinicianData');
    console.log('🗑️ Cleared clinician data');
    setCurrentScreen('welcome');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {currentScreen === 'welcome' && (
        <WelcomeScreen 
          onStartRequest={handleStartRequest}
          hasExistingClinicianData={!!clinicianData}
          clinicianName={clinicianData?.name}
          onClearClinicianData={handleClearClinicianData}
        />
      )}
      
      {currentScreen === 'clinician-form' && (
        <ClinicianForm 
          onBack={() => setCurrentScreen('welcome')}
          onNext={handleClinicianFormSubmit}
        />
      )}
      
      {currentScreen === 'chat' && (
        <ChatInterface 
          onBack={() => clinicianData ? setCurrentScreen('welcome') : setCurrentScreen('clinician-form')}
          onNext={handleChatComplete}
        />
      )}
      
      {currentScreen === 'form-review' && clinicianData && chatData && (
        <FormReview 
          onBack={() => setCurrentScreen('chat')}
          onSubmit={handleFormSubmit}
          clinicianData={clinicianData}
          chatData={chatData}
        />
      )}

      {currentScreen === 'success' && (finalClassification || chatData?.classificationResult) && clinicianData && (
        <div className="min-h-[calc(100vh-120px)] px-6 py-12 flex items-center justify-center">
          <div className="max-w-[600px] w-full">
            <div 
              className="bg-white rounded-xl shadow-lg p-8 text-center" 
              style={{ boxShadow: 'rgba(2, 30, 66, 0.1) 0px 2px 8px' }}
            >
              {/* Animated Success Icon */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-wti-teal opacity-20 rounded-full animate-ping"></div>
                  <div className="relative bg-wti-teal rounded-full p-4">
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
                      className="w-16 h-16 text-white"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="m9 12 2 2 4-4"></path>
                    </svg>
                  </div>
                </div>
              </div>

              <h1 className="mb-4 text-3xl font-semibold text-wti-navy">
                Request Submitted!
              </h1>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Your consultation request has been successfully submitted to our network of volunteer specialist physicians.
              </p>

              {/* Matched Specialties */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
                <h3 className="mb-3 text-lg font-semibold text-wti-navy">
                  Matched Specialties:
                </h3>
                <ul className="space-y-2">
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-wti-teal rounded-full"></div>
                    <span className="text-wti-navy font-medium">
                      {(finalClassification || chatData.classificationResult).specialty}
                      {(finalClassification || chatData.classificationResult).subspecialty && 
                        ` - ${(finalClassification || chatData.classificationResult).subspecialty}`
                      }
                    </span>
                  </li>
                </ul>
              </div>

              {/* What Happens Next */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6 text-left">
                <h3 className="mb-3 text-lg font-semibold text-wti-navy">
                  What Happens Next?
                </h3>
                <ol className="space-y-3 text-sm text-gray-700">
                  <li className="flex gap-3">
                    <span className="shrink-0 flex items-center justify-center w-6 h-6 bg-wti-teal text-white rounded-full text-xs">
                      1
                    </span>
                    <span>
                      A volunteer specialist will review your request within <strong>24-48 hours</strong>
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="shrink-0 flex items-center justify-center w-6 h-6 bg-wti-teal text-white rounded-full text-xs">
                      2
                    </span>
                    <span>
                      You will receive an email at <strong>{clinicianData.email}</strong> with scheduling options
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="shrink-0 flex items-center justify-center w-6 h-6 bg-wti-teal text-white rounded-full text-xs">
                      3
                    </span>
                    <span>
                      The consultation will be conducted via secure video conference
                    </span>
                  </li>
                </ol>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button 
                  onClick={handleSubmitAnotherRequest}
                  className="w-full py-4 px-6 rounded-full bg-wti-red text-white hover:bg-wti-red-hover active:scale-98 transition-all duration-200 shadow-md hover:shadow-lg min-h-[56px] font-medium"
                >
                  Submit Another Request
                </button>
                <button 
                  onClick={handleBackToWelcome}
                  className="w-full py-3 px-6 rounded-full border-2 border-wti-dark-teal text-wti-dark-teal hover:bg-wti-dark-teal hover:text-white transition-all duration-200 min-h-[48px] font-medium"
                >
                  Return to Dashboard
                </button>
              </div>

              <p className="text-sm text-gray-500 mt-6">
                Need immediate assistance?{' '}
                <a 
                  href="mailto:support@worldtelehealth.org" 
                  className="text-wti-teal hover:text-wti-dark-teal transition-colors"
                >
                  Contact Support
                </a>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
