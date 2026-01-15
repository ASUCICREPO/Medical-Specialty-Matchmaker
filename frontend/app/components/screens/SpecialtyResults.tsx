'use client';

import { ProgressIndicator } from '../ProgressIndicator';
import { BackButton } from '../BackButton';
import { ClinicianData } from './ClinicianForm';
import { ChatData } from './ChatInterface';

interface SpecialtyResultsProps {
  onBack: () => void;
  onSubmit: () => void;
  clinicianData: ClinicianData;
  patientData: ChatData;
}

interface Specialty {
  name: string;
  description: string;
  matchLevel: 'high' | 'medium' | 'low';
}

export function SpecialtyResults({ onBack, onSubmit, clinicianData, patientData }: SpecialtyResultsProps) {
  // Mock specialty matching based on symptoms
  const getSpecialties = (): Specialty[] => {
    const symptoms = patientData.extractedData?.symptoms?.toLowerCase() || '';
    
    if (symptoms.includes('respiratory') || symptoms.includes('breathing') || symptoms.includes('cough')) {
      return [
        {
          name: 'Internal Medicine',
          description: 'Specializes in prevention, diagnosis, and treatment of adult diseases, including respiratory and infectious conditions.',
          matchLevel: 'high'
        },
        {
          name: 'Pulmonology',
          description: 'Expert in respiratory system disorders and lung diseases.',
          matchLevel: 'medium'
        }
      ];
    }
    
    if (symptoms.includes('digestive') || symptoms.includes('stomach') || symptoms.includes('abdominal')) {
      return [
        {
          name: 'Gastroenterology',
          description: 'Specializes in digestive system disorders and diseases of the gastrointestinal tract.',
          matchLevel: 'high'
        },
        {
          name: 'Internal Medicine',
          description: 'Comprehensive care for adult diseases including digestive issues.',
          matchLevel: 'medium'
        }
      ];
    }
    
    // Default specialties
    return [
      {
        name: 'Internal Medicine',
        description: 'Comprehensive medical care for adults with focus on prevention, diagnosis, and treatment of diseases.',
        matchLevel: 'high'
      },
      {
        name: 'Family Medicine',
        description: 'Primary care for patients of all ages with comprehensive healthcare services.',
        matchLevel: 'medium'
      }
    ];
  };

  const specialties = getSpecialties();

  const getMatchColor = (level: string) => {
    switch (level) {
      case 'high':
        return { bg: 'bg-wti-teal', text: 'text-white', border: 'border-wti-teal' };
      case 'medium':
        return { bg: 'bg-wti-gold', text: 'text-wti-navy', border: 'border-wti-gold' };
      case 'low':
        return { bg: 'bg-gray-300', text: 'text-gray-700', border: 'border-gray-300' };
      default:
        return { bg: 'bg-gray-300', text: 'text-gray-700', border: 'border-gray-300' };
    }
  };

  return (
    <div className="min-h-[calc(100vh-120px)] px-6 py-8">
      <div className="max-w-2xl lg:max-w-3xl mx-auto">
        <BackButton onClick={onBack} />
        
        <ProgressIndicator currentStep={3} totalSteps={3} />

        {/* Request Summary */}
        <div 
          className="bg-white rounded-xl shadow-lg p-6 mb-6" 
          style={{ boxShadow: 'rgba(2, 30, 66, 0.1) 0px 2px 8px' }}
        >
          <h2 className="mb-4 text-xl font-semibold text-wti-navy">
            Request Summary
          </h2>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-gray-600">Clinician:</span>{' '}
              <span className="text-wti-navy font-medium">{clinicianData.name}</span>
            </div>
            <div>
              <span className="text-gray-600">Location:</span>{' '}
              <span className="text-wti-navy font-medium">{clinicianData.location}</span>
            </div>
            <div>
              <span className="text-gray-600">Patient Age Group:</span>{' '}
              <span className="text-wti-navy font-medium">{patientData.extractedData?.ageGroup || 'Not specified'}</span>
            </div>
            <div>
              <span className="text-gray-600">Symptoms:</span>{' '}
              <span className="text-wti-navy font-medium">{patientData.extractedData?.symptoms || 'Not specified'}</span>
            </div>
            <div>
              <span className="text-gray-600">Duration:</span>{' '}
              <span className="text-wti-navy font-medium">{patientData.extractedData?.duration || 'Not specified'}</span>
            </div>
            {patientData.extractedData?.additionalInfo && (
              <div>
                <span className="text-gray-600">Additional Info:</span>{' '}
                <span className="text-wti-navy font-medium">{patientData.extractedData.additionalInfo}</span>
              </div>
            )}
          </div>
          <button className="text-wti-teal hover:text-wti-dark-teal text-sm mt-4 transition-colors">
            Edit Details
          </button>
        </div>

        {/* Recommended Specialists */}
        <div className="mb-6">
          <h2 className="mb-4 text-xl font-semibold text-wti-navy">
            Recommended Specialists
          </h2>
          <div className="space-y-4">
            {specialties.map((specialty, index) => {
              const colors = getMatchColor(specialty.matchLevel);
              return (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-md p-6 border-l-4"
                  style={{ 
                    boxShadow: 'rgba(2, 30, 66, 0.1) 0px 2px 8px',
                    borderLeftColor: specialty.matchLevel === 'high' ? '#4db9d6' : 
                                   specialty.matchLevel === 'medium' ? '#f7cf56' : '#d1d5db'
                  }}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h3 className="text-lg font-semibold text-wti-navy">
                      {specialty.name}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs uppercase tracking-wide flex-shrink-0 ${colors.bg} ${colors.text}`}>
                      {specialty.matchLevel} match
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {specialty.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path 
                  fillRule="evenodd" 
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" 
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="text-sm">
              <p className="text-blue-900 mb-1">
                <strong>Privacy & Data Security</strong>
              </p>
              <p className="text-blue-800 text-xs">
                All patient information is handled in compliance with HIPAA standards and international data protection regulations. Data is encrypted and shared only with matched specialists.
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={onSubmit}
          className="w-full py-4 px-6 rounded-full bg-wti-red text-white hover:bg-wti-red-hover active:scale-98 transition-all duration-200 shadow-md hover:shadow-lg min-h-[56px] flex items-center justify-center gap-2 font-medium"
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
            className="w-5 h-5"
          >
            <path d="M20 6 9 17l-5-5"></path>
          </svg>
          Submit Request
        </button>
      </div>
    </div>
  );
}