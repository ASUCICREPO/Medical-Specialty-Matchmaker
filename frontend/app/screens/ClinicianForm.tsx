'use client';

import { useState } from 'react';
import { ProgressIndicator } from '../components/ProgressIndicator';
import { BackButton } from '../components/BackButton';

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

// Validation constants
const VALIDATION_RULES = {
  name: { min: 2, max: 100 },
  email: { max: 254 }, // RFC 5321
  hospital: { min: 2, max: 200 },
  location: { min: 2, max: 100 },
};

// Email validation regex (RFC 5322 simplified)
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export function ClinicianForm({ onBack, onNext }: ClinicianFormProps) {
  const [formData, setFormData] = useState<ClinicianData>({
    name: '',
    email: '',
    hospital: '',
    location: ''
  });

  const [errors, setErrors] = useState<Partial<Record<keyof ClinicianData, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof ClinicianData, boolean>>>({});

  const validateField = (field: keyof ClinicianData, value: string): string | undefined => {
    switch (field) {
      case 'name':
        if (!value.trim()) return 'Clinician name is required';
        if (value.trim().length < VALIDATION_RULES.name.min) {
          return `Name must be at least ${VALIDATION_RULES.name.min} characters`;
        }
        if (value.length > VALIDATION_RULES.name.max) {
          return `Name must not exceed ${VALIDATION_RULES.name.max} characters`;
        }
        // Check for valid name characters (letters, spaces, hyphens, apostrophes, periods)
        if (!/^[a-zA-Z\s\-'.]+$/.test(value)) {
          return 'Name can only contain letters, spaces, hyphens, apostrophes, and periods';
        }
        break;

      case 'email':
        if (!value.trim()) return 'Email is required';
        if (value.length > VALIDATION_RULES.email.max) {
          return `Email must not exceed ${VALIDATION_RULES.email.max} characters`;
        }
        if (!EMAIL_REGEX.test(value)) {
          return 'Please enter a valid email address (e.g. doctor@hospital.com)';
        }
        // Additional check for common typos
        if (value.includes('..') || value.startsWith('.') || value.endsWith('.')) {
          return 'Email address format is invalid';
        }
        break;

      case 'hospital':
        if (!value.trim()) return 'Hospital/clinic name is required';
        if (value.trim().length < VALIDATION_RULES.hospital.min) {
          return `Hospital name must be at least ${VALIDATION_RULES.hospital.min} characters`;
        }
        if (value.length > VALIDATION_RULES.hospital.max) {
          return `Hospital name must not exceed ${VALIDATION_RULES.hospital.max} characters`;
        }
        break;

      case 'location':
        if (!value.trim()) return 'Location is required';
        if (value.trim().length < VALIDATION_RULES.location.min) {
          return `Location must be at least ${VALIDATION_RULES.location.min} characters`;
        }
        if (value.length > VALIDATION_RULES.location.max) {
          return `Location must not exceed ${VALIDATION_RULES.location.max} characters`;
        }
        // Check for valid location format (letters, numbers, spaces, commas, hyphens)
        if (!/^[a-zA-Z0-9\s,\-]+$/.test(value)) {
          return 'Location can only contain letters, numbers, spaces, commas, and hyphens';
        }
        break;
    }
    return undefined;
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ClinicianData, string>> = {};
    
    // Validate all fields
    (Object.keys(formData) as (keyof ClinicianData)[]).forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    const allTouched: Partial<Record<keyof ClinicianData, boolean>> = {};
    Object.keys(formData).forEach(key => {
      allTouched[key as keyof ClinicianData] = true;
    });
    setTouched(allTouched);

    if (validateForm()) {
      onNext(formData);
    }
  };

  const handleChange = (field: keyof ClinicianData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Validate on change if field has been touched
    if (touched[field]) {
      const error = validateField(field, value);
      setErrors(prev => {
        const newErrors = { ...prev };
        if (error) {
          newErrors[field] = error;
        } else {
          delete newErrors[field];
        }
        return newErrors;
      });
    }
  };

  const handleBlur = (field: keyof ClinicianData) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field]);
    setErrors(prev => {
      const newErrors = { ...prev };
      if (error) {
        newErrors[field] = error;
      } else {
        delete newErrors[field];
      }
      return newErrors;
    });
  };

  const isFormValid = 
    formData.name.trim() && 
    formData.email.trim() && 
    formData.hospital.trim() && 
    formData.location.trim() &&
    Object.keys(errors).length === 0;

  return (
    <div className="min-h-[calc(100vh-120px)] px-6 py-8">
      <div className="max-w-2xl lg:max-w-3xl mx-auto">
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
                onBlur={() => handleBlur('name')}
                maxLength={VALIDATION_RULES.name.max}
                className={`w-full px-4 py-3 rounded-lg bg-[#f3f3f5] border-2 outline-none transition-colors text-gray-900 placeholder-gray-600 ${
                  errors.name ? 'border-red-500' : 'border-transparent focus:border-wti-teal'
                }`}
                placeholder="Dr. Jane Smith"
                required
              />
              <div className="flex justify-between items-center mt-1">
                {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
                <span className="text-xs text-gray-500 ml-auto">
                  {formData.name.length} / {VALIDATION_RULES.name.max}
                </span>
              </div>
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
                onBlur={() => handleBlur('email')}
                maxLength={VALIDATION_RULES.email.max}
                className={`w-full px-4 py-3 rounded-lg bg-[#f3f3f5] border-2 outline-none transition-colors text-gray-900 placeholder-gray-600 ${
                  errors.email ? 'border-red-500' : 'border-transparent focus:border-wti-teal'
                }`}
                placeholder="jane.smith@hospital.org"
                required
              />
              <div className="flex justify-between items-center mt-1">
                {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
                <span className="text-xs text-gray-500 ml-auto">
                  {formData.email.length} / {VALIDATION_RULES.email.max}
                </span>
              </div>
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
                onBlur={() => handleBlur('hospital')}
                maxLength={VALIDATION_RULES.hospital.max}
                className={`w-full px-4 py-3 rounded-lg bg-[#f3f3f5] border-2 outline-none transition-colors text-gray-900 placeholder-gray-600 ${
                  errors.hospital ? 'border-red-500' : 'border-transparent focus:border-wti-teal'
                }`}
                placeholder="General Hospital"
                required
              />
              <div className="flex justify-between items-center mt-1">
                {errors.hospital && <p className="text-red-500 text-xs">{errors.hospital}</p>}
                <span className="text-xs text-gray-500 ml-auto">
                  {formData.hospital.length} / {VALIDATION_RULES.hospital.max}
                </span>
              </div>
            </div>

            <div>
              <label htmlFor="location" className="block mb-2 font-medium text-wti-navy">
                Location (City, Country) *
              </label>
              <input
                id="location"
                type="text"
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                onBlur={() => handleBlur('location')}
                maxLength={VALIDATION_RULES.location.max}
                className={`w-full px-4 py-3 rounded-lg bg-[#f3f3f5] border-2 outline-none transition-colors text-gray-900 placeholder-gray-600 ${
                  errors.location ? 'border-red-500' : 'border-transparent focus:border-wti-teal'
                }`}
                placeholder="Nairobi, Kenya"
                required
              />
              <div className="flex justify-between items-center mt-1">
                {errors.location && <p className="text-red-500 text-xs">{errors.location}</p>}
                <span className="text-xs text-gray-500 ml-auto">
                  {formData.location.length} / {VALIDATION_RULES.location.max}
                </span>
              </div>
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