export function WTILogo() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center justify-center w-12 h-12 bg-wti-red rounded-full">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path 
            d="M12 2L12 22M2 12L22 12" 
            stroke="white" 
            strokeWidth="3" 
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div className="flex flex-col">
        <span className="tracking-wider uppercase text-wti-navy" style={{ letterSpacing: '0.1em' }}>
          World Telehealth
        </span>
        <span className="tracking-wider uppercase text-wti-navy" style={{ letterSpacing: '0.1em' }}>
          Initiative
        </span>
      </div>
    </div>
  );
}