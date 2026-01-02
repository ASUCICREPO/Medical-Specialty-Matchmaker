'use client';

import { useState } from 'react';
import { ProgressIndicator } from '../ProgressIndicator';
import { BackButton } from '../BackButton';

interface ClinicianFormProps {
  onBack: () => void;
  onNext: (data: ClinicianData) => void;
}

export interface ClinicianData {
  name: string;
  email: string;
  hospital: string;
  location: string;
}

export function ClinicianForm({ onBack, onNext }: ClinicianFormProps) {
  const [formData, setFormData] = useState<ClinicianData>({
    name: '',
    email: '',
    hospital: '',
    location: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.email && formData.hospital && formData.location) {
      onNext(formData);
    }
  };

  const handleChange = (field: keyof ClinicianData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isFormValid = formData.name && formData.email && formData.hospital && formData.location;

  return (
    <div className="min-h-[calc(100vh-120px)] px-6 py-8">
      <div className="max-w-[600px] mx-auto">
        <BackButton onClick={onBack} />
        
        <ProgressIndicator currentStep={1} totalSteps={3} />

        <div 
          className="bg-white rounded-xl shadow-lg p-8" 
          style={{ boxShadow: 'rgba(2, 30, 66, 0.1) 0px 2px 8px' }}
        >
          <h2 className="mb-2 text-2xl font-semibold text-wti-navy">
            Clinician Information
          </h2>
          <p className="text-gray-600 mb-8">
            Please provide your contact information so a specialist can reach you.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block mb-2 font-medium text-wti-navy">
                Clinician Name *
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-[#f3f3f5] border-2 border-transparent focus:border-wti-teal outline-none transition-colors text-gray-900 placeholder-gray-600"
                placeholder="Dr. Jane Smith"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block mb-2 font-medium text-wti-navy">
                Email Address *
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-[#f3f3f5] border-2 border-transparent focus:border-wti-teal outline-none transition-colors text-gray-900 placeholder-gray-600"
                placeholder="jane.smith@hospital.org"
                required
              />
            </div>

            <div>
              <label htmlFor="hospital" className="block mb-2 font-medium text-wti-navy">
                Hospital/Clinic Name *
              </label>
              <input
                id="hospital"
                type="text"
                value={formData.hospital}
                onChange={(e) => handleChange('hospital', e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-[#f3f3f5] border-2 border-transparent focus:border-wti-teal outline-none transition-colors text-gray-900 placeholder-gray-600"
                placeholder="General Hospital"
                required
              />
            </div>

            <div>
              <label htmlFor="location" className="block mb-2 font-medium text-wti-navy">
                Location (Country/Region) *
              </label>
              <input
                id="location"
                type="text"
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-[#f3f3f5] border-2 border-transparent focus:border-wti-teal outline-none transition-colors text-gray-900 placeholder-gray-600"
                placeholder="Nairobi, Kenya"
                required
              />
            </div>

            <button
              type="submit"
              disabled={!isFormValid}
              className="w-full py-4 px-6 rounded-full bg-wti-red text-white hover:bg-wti-red-hover active:scale-98 transition-all duration-200 shadow-md hover:shadow-lg min-h-[56px] disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Continue to Patient Details
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}