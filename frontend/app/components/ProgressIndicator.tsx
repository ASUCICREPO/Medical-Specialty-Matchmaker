interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export function ProgressIndicator({ currentStep, totalSteps }: ProgressIndicatorProps) {
  return (
    <div className="flex items-center justify-center mb-8">
      {Array.from({ length: totalSteps }, (_, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;
        
        return (
          <div key={stepNumber} className="flex items-center">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${
                isCompleted
                  ? 'bg-wti-teal text-white'
                  : isCurrent
                  ? 'bg-wti-red text-white scale-110'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {isCompleted ? (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path 
                    d="M4 10L8 14L16 6" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <span>{stepNumber}</span>
              )}
            </div>
            {stepNumber < totalSteps && (
              <div className={`w-12 h-1 mx-2 ${
                isCompleted ? 'bg-wti-teal' : 'bg-gray-200'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}