'use client';

import { useState } from 'react';
import { MedicalRequest } from './ChatBot';

interface MedicalRequestFormProps {
  onSubmit: (data: MedicalRequest) => void;
  isLoading?: boolean;
  prefilledData?: Partial<MedicalRequest>;
}

export function MedicalRequestForm({ onSubmit, isLoading, prefilledData }: MedicalRequestFormProps) {
  const [formData, setFormData] = useState<MedicalRequest>({
    doctorName: prefilledData?.doctorName || '',
    location: prefilledData?.location || '',
    email: prefilledData?.email || '',
    patientAge: prefilledData?.patientAge || '',
    symptoms: prefilledData?.symptoms || '',
    urgency: prefilledData?.urgency || 'medium',
    additionalInfo: prefilledData?.additionalInfo || '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof MedicalRequest, string>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof MedicalRequest, string>> = {};

    if (!formData.doctorName.trim()) {
      newErrors.doctorName = 'Doctor name is required';
    }
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.patientAge) {
      newErrors.patientAge = 'Patient age is required';
    } else if (isNaN(Number(formData.patientAge)) || Number(formData.patientAge) < 0) {
      newErrors.patientAge = 'Please enter a valid age';
    }
    if (!formData.symptoms.trim()) {
      newErrors.symptoms = 'Symptoms description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleChange = (field: keyof MedicalRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="h-full flex flex-col max-w-2xl mx-auto">
      <div className="flex-shrink-0 mb-4">
        <h3 className="text-lg font-semibold mb-2">Medical Consultation Request</h3>
        <p className="text-gray-600 text-sm">
          Please provide the following information to help us match you with the right specialist. 
          No personally identifiable patient information should be included.
        </p>
      </div>
      
      <div className="flex-1 overflow-y-auto pr-2">
        <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Name (Requesting Doctor) *
            </label>
            <input
              type="text"
              value={formData.doctorName}
              onChange={(e) => handleChange('doctorName', e.target.value)}
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder-gray-600 ${
                errors.doctorName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Dr. John Smith"
            />
            {errors.doctorName && <p className="text-red-500 text-xs mt-1">{errors.doctorName}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location/Hospital *
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder-gray-600 ${
                errors.location ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="City, Country or Hospital Name"
            />
            {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Email Address *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder-gray-600 ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="doctor@hospital.com"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Patient Age *
            </label>
            <input
              type="number"
              value={formData.patientAge}
              onChange={(e) => handleChange('patientAge', e.target.value)}
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder-gray-600 ${
                errors.patientAge ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="25"
              min="0"
            />
            {errors.patientAge && <p className="text-red-500 text-xs mt-1">{errors.patientAge}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Symptoms and Condition Description *
          </label>
          <textarea
            value={formData.symptoms}
            onChange={(e) => handleChange('symptoms', e.target.value)}
            rows={4}
            className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder-gray-600 ${
              errors.symptoms ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Describe the patient's symptoms, condition, and any relevant medical history. Please avoid including any personally identifiable information."
          />
          {errors.symptoms && <p className="text-red-500 text-xs mt-1">{errors.symptoms}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Urgency Level *
          </label>
          <select
            value={formData.urgency}
            onChange={(e) => handleChange('urgency', e.target.value as 'low' | 'medium' | 'high')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
          >
            <option value="low">Low - Routine consultation</option>
            <option value="medium">Medium - Timely response needed</option>
            <option value="high">High - Urgent consultation required</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Additional Information
          </label>
          <textarea
            value={formData.additionalInfo}
            onChange={(e) => handleChange('additionalInfo', e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder-gray-600"
            placeholder="Any additional context, previous treatments, or specific questions you have..."
          />
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Privacy Notice:</strong> Please ensure no personally identifiable patient information 
            (names, ID numbers, specific dates) is included in your request. Use general descriptions only.
          </p>
        </div>

        <div className="flex justify-end space-x-3 pt-4 pb-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading && (
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isLoading ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
        </form>
      </div>
    </div>
  );
}