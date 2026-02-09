'use client';

import { useState } from 'react';
import { ProgressIndicator } from '../components/ProgressIndicator';
import { BackButton } from '../components/BackButton';
import { ClinicianData } from './ClinicianForm';
import { ChatData } from './ChatInterface';

interface FormReviewProps {
  onBack: () => void;
  onSubmit: (finalClassification?: any) => void;
  clinicianData: ClinicianData;
  chatData: ChatData;
}

export function FormReview({ onBack, onSubmit, clinicianData, chatData }: FormReviewProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [symptoms, setSymptoms] = useState(chatData.extractedData?.symptoms || '');
  const [symptomsError, setSymptomsError] = useState('');
  const [classification, setClassification] = useState(chatData.classificationResult);
  const [isReEvaluating, setIsReEvaluating] = useState(false);
  const [symptomsChanged, setSymptomsChanged] = useState(false);
  const [originalSymptoms] = useState(chatData.extractedData?.symptoms || '');
  const [piiCheckResult, setPiiCheckResult] = useState<any>(null);
  const [showPiiWarning, setShowPiiWarning] = useState(false);
  
  const MAX_SYMPTOMS_LENGTH = 5000;

  // Debug: Log the extracted data to see what we're working with
  console.log('🔍 FormReview - chatData.extractedData:', chatData.extractedData);

  const handleSubmit = async () => {
    // Validate symptoms
    if (!symptoms.trim()) {
      setSymptomsError('Symptoms description is required');
      return;
    }

    // Block submission if symptoms were changed but not re-evaluated
    if (symptomsChanged) {
      setSymptomsError('Please re-evaluate the specialty before submitting');
      return;
    }

    // Block submission if PII was detected and not resolved
    if (piiCheckResult?.containsPII) {
      setSymptomsError('Please remove all personally identifiable information before submitting');
      setShowPiiWarning(true);
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('🚀 Starting form submission with data');
      
      // Get final classification if not already done
      let finalClassification = classification; // Use the current classification (might be re-evaluated)
      
      if (!finalClassification) {
        console.log('Getting final classification...');
        
        const classifyResponse = await fetch('/api/chatbot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'classify',
            data: {
              symptoms: symptoms,
              ageGroup: chatData.extractedData?.ageGroup || 'Adult',
              urgency: chatData.extractedData?.urgency || 'medium',
              requireSubspecialty: true
            },
          }),
        });
        
        if (!classifyResponse.ok) {
          const errorText = await classifyResponse.text();
          console.error('Classification response error:', errorText);
          throw new Error(`Classification failed: ${classifyResponse.status} ${errorText}`);
        }
        
        finalClassification = await classifyResponse.json();
        console.log('✅ Classification result:', finalClassification);
      }
      
      // Submit the complete request to database
      console.log('Submitting request to database...');
      
      const submitData = {
        doctorName: clinicianData.name,
        hospital: clinicianData.hospital,  // Added hospital/clinic name
        location: clinicianData.location,
        email: clinicianData.email,
        ageGroup: chatData.extractedData?.ageGroup || 'Adult',  // Required age group
        symptoms: symptoms,
        urgency: chatData.extractedData?.urgency || 'medium',
        additionalInfo: chatData.extractedData?.additionalInfo || '',
        specialty: finalClassification.specialty,
        subspecialty: finalClassification.subspecialty,
        reasoning: finalClassification.reasoning,
        confidence: finalClassification.confidence,
      };
      
      console.log('📤 Submitting data:', submitData);
      
      const submitResponse = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit',
          data: submitData,
        }),
      });
      
      if (!submitResponse.ok) {
        const errorText = await submitResponse.text();
        console.error('Submission response error:', errorText);
        throw new Error(`Submission failed: ${submitResponse.status} ${errorText}`);
      }
      
      const result = await submitResponse.json();
      console.log('✅ Submission result:', result);
      
      if (result.success) {
        // Pass the final classification back to parent
        onSubmit(finalClassification);
      } else {
        throw new Error('Submission was not successful: ' + JSON.stringify(result));
      }
    } catch (error) {
      console.error('❌ Form submission error:', error);
      alert(`There was an error processing your request: ${(error as Error).message}\n\nPlease try again or contact support.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSymptomsChange = (value: string) => {
    if (value.length <= MAX_SYMPTOMS_LENGTH) {
      setSymptoms(value);
      setSymptomsChanged(value !== originalSymptoms);
      setShowPiiWarning(false); // Hide PII warning when user starts editing
      setPiiCheckResult(null); // Clear previous PII check
      if (symptomsError) {
        setSymptomsError('');
      }
    }
  };

  const handleReEvaluate = async () => {
    if (!symptoms.trim()) {
      setSymptomsError('Symptoms description is required');
      return;
    }

    setIsReEvaluating(true);
    setShowPiiWarning(false);
    
    try {
      // First, check for PII
      console.log('🔍 Checking for PII in symptoms...');
      
      const piiResponse = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'check_pii',
          data: {
            text: symptoms
          },
        }),
      });
      
      if (!piiResponse.ok) {
        const errorText = await piiResponse.text();
        console.error('PII check response error:', errorText);
        throw new Error(`PII check failed: ${piiResponse.status} ${errorText}`);
      }
      
      const piiResult = await piiResponse.json();
      console.log('✅ PII check result:', piiResult);
      
      setPiiCheckResult(piiResult);
      
      // If PII is detected, block re-evaluation and show warning
      if (piiResult.containsPII) {
        setShowPiiWarning(true);
        setSymptomsError('Personally identifiable information detected. Please remove it before proceeding.');
        return;
      }
      
      // No PII detected, proceed with re-evaluation
      console.log('🔄 Re-evaluating specialty with updated symptoms...');
      
      const classifyResponse = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'classify',
          data: {
            symptoms: symptoms,
            ageGroup: chatData.extractedData?.ageGroup || 'Adult',
            urgency: chatData.extractedData?.urgency || 'medium',
            requireSubspecialty: true
          },
        }),
      });
      
      if (!classifyResponse.ok) {
        const errorText = await classifyResponse.text();
        console.error('Re-evaluation response error:', errorText);
        throw new Error(`Re-evaluation failed: ${classifyResponse.status} ${errorText}`);
      }
      
      const newClassification = await classifyResponse.json();
      console.log('✅ Re-evaluation result:', newClassification);
      
      // Update the classification
      setClassification(newClassification);
      setSymptomsChanged(false); // Reset the changed flag
      
    } catch (error) {
      console.error('❌ Re-evaluation error:', error);
      alert(`There was an error re-evaluating the specialty: ${(error as Error).message}\n\nPlease try again.`);
    } finally {
      setIsReEvaluating(false);
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
              <span className="text-wti-navy font-medium">
                {(() => {
                  const ageGroup = chatData.extractedData?.ageGroup;
                  
                  // Debug log
                  console.log('🔍 Age Group Display - ageGroup:', ageGroup);
                  
                  // Use ageGroup directly
                  if (ageGroup === 'Child') {
                    return 'Child (0-17 years)';
                  } else if (ageGroup === 'Adult') {
                    return 'Adult (18+ years)';
                  } else {
                    return 'Adult (18+ years)'; // Default
                  }
                })()}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Symptoms:</span>{' '}
              <span className="text-wti-navy font-medium">{symptoms.substring(0, 100)}{symptoms.length > 100 ? '...' : ''}</span>
            </div>
          </div>
          <button 
            onClick={onBack}
            className="text-wti-teal hover:text-wti-dark-teal text-sm mt-4 transition-colors"
          >
            Edit Details
          </button>
        </div>

        {/* Recommended Specialists */}
        <div className="mb-6">
          <h2 className="mb-4 text-xl font-semibold text-wti-navy">
            Recommended Specialists
          </h2>
          <div className="space-y-4">
            <div
              className="bg-white rounded-xl shadow-md p-6 border-l-4"
              style={{ 
                boxShadow: 'rgba(2, 30, 66, 0.1) 0px 2px 8px',
                borderLeftColor: '#4db9d6'
              }}
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <h3 className="text-lg font-semibold text-wti-navy">
                  {classification?.specialty || 'Internal Medicine'}
                </h3>
                <span className="px-3 py-1 rounded-full text-xs uppercase tracking-wide flex-shrink-0 bg-wti-teal text-white">
                  high match
                </span>
              </div>
              {classification?.subspecialty && (
                <div className="mb-3">
                  <span className="text-sm text-gray-600">Subspecialty: </span>
                  <span className="text-sm font-medium text-wti-navy">{classification.subspecialty}</span>
                </div>
              )}
              <p className="text-gray-600 text-sm leading-relaxed">
                {classification?.reasoning || 'Specializes in comprehensive medical care and diagnosis.'}
              </p>
            </div>
          </div>
        </div>

        {/* Editable Symptoms Section */}
        <div 
          className="bg-white rounded-xl shadow-lg p-6 mb-6" 
          style={{ boxShadow: 'rgba(2, 30, 66, 0.1) 0px 2px 8px' }}
        >
          <h2 className="mb-4 text-xl font-semibold text-wti-navy">
            Patient Symptoms
          </h2>
          <p className="text-gray-600 text-sm mb-4">
            Review and edit the symptoms description if needed. This information will be shared with the specialist.
          </p>
          
          <div>
            <label className="block text-sm font-medium text-wti-navy mb-2">
              Symptoms and Condition Description *
            </label>
            <textarea
              value={symptoms}
              onChange={(e) => handleSymptomsChange(e.target.value)}
              rows={6}
              className={`w-full px-4 py-3 rounded-lg bg-[#f3f3f5] border-2 border-transparent focus:border-wti-teal outline-none transition-colors text-gray-900 placeholder-gray-600 ${
                symptomsError ? 'border-red-500' : ''
              }`}
              placeholder="Describe the patient's symptoms, condition, and any relevant medical history. Please avoid including any personally identifiable information."
            />
            <div className="flex justify-between items-center mt-1">
              {symptomsError && <p className="text-red-500 text-xs">{symptomsError}</p>}
              <span className={`text-xs ml-auto ${symptoms.length > MAX_SYMPTOMS_LENGTH * 0.9 ? 'text-wti-red' : 'text-gray-500'}`}>
                {symptoms.length} / {MAX_SYMPTOMS_LENGTH}
              </span>
            </div>
            
            {/* PII Warning */}
            {showPiiWarning && piiCheckResult?.containsPII && (
              <div className="mt-4 p-4 bg-red-50 border-2 border-red-500 rounded-lg">
                <div className="flex gap-3">
                  <div className="shrink-0">
                    <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path 
                        fillRule="evenodd" 
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-800 mb-2">
                      Personally Identifiable Information Detected
                    </p>
                    <p className="text-xs text-red-700 mb-3">
                      {piiCheckResult.recommendation}
                    </p>
                    {piiCheckResult.piiFound && piiCheckResult.piiFound.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-red-800 mb-1">PII Types Found:</p>
                        <ul className="list-disc list-inside text-xs text-red-700 space-y-1">
                          {piiCheckResult.piiFound.map((type: string, index: number) => (
                            <li key={index}>{type}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {piiCheckResult.piiDetails && piiCheckResult.piiDetails.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-red-800 mb-1">Details:</p>
                        <ul className="space-y-2">
                          {piiCheckResult.piiDetails.map((detail: any, index: number) => (
                            <li key={index} className="text-xs text-red-700">
                              <span className="font-medium">{detail.type}:</span> {detail.location}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <p className="text-xs text-red-700 font-medium">
                      Please remove or generalize this information and try again.
                    </p>
                  </div>
                </div>
              </div>
            )}
            </div>
            
            {/* Re-evaluate Button - Shows when symptoms are changed */}
            {symptomsChanged && (
              <div className="mt-4 p-4 bg-yellow-50 border-2 border-yellow-500 rounded-lg">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-yellow-800 mb-1">
                      Symptoms Updated - Re-evaluation Required
                    </p>
                    <p className="text-xs text-yellow-700">
                      Please re-evaluate to get updated specialty recommendations before submitting.
                    </p>
                  </div>
                  <button
                    onClick={handleReEvaluate}
                    disabled={isReEvaluating}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 text-sm font-medium whitespace-nowrap"
                  >
                    {isReEvaluating ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Checking & Re-evaluating...
                      </>
                    ) : (
                      <>
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          width="16" 
                          height="16" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        >
                          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                          <path d="M21 3v5h-5"></path>
                          <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                          <path d="M3 21v-5h5"></path>
                        </svg>
                        Re-evaluate
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Privacy Notice */}
          <div className="bg-wti-teal bg-opacity-10 border border-wti-teal border-opacity-30 rounded-lg p-4 mb-6">
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

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={isLoading || symptomsChanged || (piiCheckResult?.containsPII)}
            className="w-full py-4 px-6 rounded-full bg-wti-red text-white hover:bg-wti-red-hover active:scale-98 transition-all duration-200 shadow-md hover:shadow-lg min-h-[56px] flex items-center justify-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            title={symptomsChanged ? 'Please re-evaluate before submitting' : piiCheckResult?.containsPII ? 'Please remove PII before submitting' : ''}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting Request...
              </>
            ) : (
              <>
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
              </>
            )}
          </button>

        </div>
      </div>
  );
}