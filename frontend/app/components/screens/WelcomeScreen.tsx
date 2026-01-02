'use client';

interface WelcomeScreenProps {
  onStartRequest: () => void;
  hasExistingClinicianData?: boolean;
  clinicianName?: string;
  onClearClinicianData?: () => void;
}

export function WelcomeScreen({ 
  onStartRequest, 
  hasExistingClinicianData = false, 
  clinicianName,
  onClearClinicianData 
}: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] px-6 py-12">
      <div className="max-w-[600px] w-full">
        {/* Logo Section */}
        <div className="flex justify-center mb-12">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center justify-center w-24 h-24 bg-wti-red rounded-full shadow-lg">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path 
                  d="M24 4L24 44M4 24L44 24" 
                  stroke="white" 
                  strokeWidth="5" 
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div className="flex flex-col items-center">
              <span className="tracking-widest uppercase text-wti-navy" style={{ letterSpacing: '0.15em' }}>
                World Telehealth
              </span>
              <span className="tracking-widest uppercase text-wti-navy" style={{ letterSpacing: '0.15em' }}>
                Initiative
              </span>
            </div>
          </div>
        </div>

        {/* Welcome Back Message for Returning Users */}
        {hasExistingClinicianData && clinicianName && (
          <div 
            className="bg-wti-teal bg-opacity-10 border border-wti-teal rounded-xl p-6 mb-6" 
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-wti-teal rounded-full flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path 
                    d="M8 8C10.2091 8 12 6.20914 12 4C12 1.79086 10.2091 0 8 0C5.79086 0 4 1.79086 4 4C4 6.20914 5.79086 8 8 8Z" 
                    fill="white"
                  />
                  <path 
                    d="M8 10C3.58172 10 0 13.5817 0 18H16C16 13.5817 12.4183 10 8 10Z" 
                    fill="white"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-wti-navy">
                Welcome back, {clinicianName}!
              </h2>
            </div>
            <p className="text-wti-dark-teal text-sm mb-4">
              Your information is saved. You can start a new consultation request right away.
            </p>
            <button 
              onClick={onClearClinicianData}
              className="text-wti-dark-teal hover:text-wti-navy text-sm underline transition-colors"
            >
              Use different clinician information
            </button>
          </div>
        )}

        {/* Main Content Card */}
        <div 
          className="bg-white rounded-xl shadow-lg p-8 mb-6" 
          style={{ boxShadow: 'rgba(2, 30, 66, 0.1) 0px 2px 8px' }}
        >
          <h1 className="text-center mb-4 text-2xl font-semibold text-wti-navy">
            Medical Specialty Matchmaker
          </h1>
          <p className="text-center text-gray-600 mb-8 leading-relaxed">
            Get connected to the right specialist, fast. Our intelligent system helps you describe your consultation needs and matches you with the appropriate volunteer specialist physician.
          </p>

          {/* Feature List */}
          <div className="space-y-4 mb-8">
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-6 h-6 rounded-full bg-wti-teal flex items-center justify-center mt-0.5">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path 
                    d="M2 7L5 10L12 3" 
                    stroke="white" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p className="text-gray-700">Quick conversational interface to describe patient symptoms</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-6 h-6 rounded-full bg-wti-teal flex items-center justify-center mt-0.5">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path 
                    d="M2 7L5 10L12 3" 
                    stroke="white" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p className="text-gray-700">Smart matching with appropriate medical specialties</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-6 h-6 rounded-full bg-wti-teal flex items-center justify-center mt-0.5">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path 
                    d="M2 7L5 10L12 3" 
                    stroke="white" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p className="text-gray-700">Connect with volunteer specialists worldwide</p>
            </div>
          </div>

          {/* Start Button */}
          <button 
            onClick={onStartRequest}
            className="w-full py-4 px-6 rounded-full bg-wti-red text-white hover:bg-wti-red-hover active:scale-98 transition-all duration-200 shadow-md hover:shadow-lg min-h-[56px] font-medium"
          >
            {hasExistingClinicianData ? 'Start New Consultation' : 'Start New Request'}
          </button>
        </div>

        {/* Footer Text */}
        <div className="text-center text-sm text-gray-500">
          <p>Currently available in English</p>
          <p className="text-xs mt-1 italic">Coming soon: Spanish, French, Ukrainian</p>
        </div>
      </div>
    </div>
  );
}