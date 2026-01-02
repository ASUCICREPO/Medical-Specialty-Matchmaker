'use client';

import { useState } from 'react';
import { ChatMessage } from './ChatMessage';
import { MedicalRequestForm } from './MedicalRequestForm';

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export interface MedicalRequest {
  doctorName: string;
  location: string;
  email: string;
  patientAge: string;
  symptoms: string;
  urgency: 'low' | 'medium' | 'high';
  additionalInfo: string;
}

export function ChatBot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m here to help you connect with the right medical specialist. Please describe your patient\'s condition, including their age and main symptoms.',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [currentStep, setCurrentStep] = useState<'chat' | 'form' | 'complete'>('chat');
  const [isLoading, setIsLoading] = useState(false);
  const [classificationResult, setClassificationResult] = useState<any>(null);
  const [extractedData, setExtractedData] = useState<any>(null);

  const addMessage = (text: string, sender: 'user' | 'bot') => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      sender,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleUserMessage = async (message: string) => {
    addMessage(message, 'user');
    setIsLoading(true);
    
    try {
      // Call the chatbot orchestrator API
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          data: {
            message,
            conversationHistory: messages.map(m => ({
              sender: m.sender,
              text: m.text
            }))
          },
        }),
      });
      
      const result = await response.json();
      console.log('🤖 Chat result:', result);
      
      if (result.response) {
        addMessage(result.response, 'bot');
        
        // Check if we can classify the case now (AI determined)
        if (result.canClassify && result.classification) {
          setClassificationResult(result.classification);
          
          // Store AI-extracted data for form pre-filling
          if (result.extractedData) {
            console.log('📋 AI-extracted data:', result.extractedData);
            setExtractedData(result.extractedData);
          }
          
          setTimeout(() => {
            addMessage(
              `Perfect! I've identified that this case should be handled by ${result.classification.specialty}${result.classification.subspecialty ? ` (${result.classification.subspecialty})` : ''}. Let me help you fill out the formal request form with this information pre-filled.`,
              'bot'
            );
            setTimeout(() => setCurrentStep('form'), 1500);
          }, 1000);
        }
      } else {
        addMessage('I apologize, but I encountered an issue. Could you please rephrase that?', 'bot');
      }
    } catch (error) {
      console.error('Chat error:', error);
      addMessage('I apologize, but there was an error processing your message. Please try again.', 'bot');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = async (formData: MedicalRequest) => {
    setIsLoading(true);
    
    try {
      console.log('🚀 Starting form submission with data:', formData);
      
      // Step 1: Get final classification if not already done
      let finalClassification = classificationResult;
      
      if (!finalClassification) {
        console.log('Getting final classification...');
        addMessage('Analyzing your case with AI...', 'bot');
        
        const classifyResponse = await fetch('/api/chatbot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'classify',
            data: {
              symptoms: formData.symptoms,
              patientAge: parseInt(formData.patientAge),
              urgency: formData.urgency,
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
        setClassificationResult(finalClassification);
      }
      
      // Step 2: Submit the complete request to DynamoDB via data handler
      console.log('Submitting request to database...');
      addMessage('Saving your request to the database...', 'bot');
      
      const submitData = {
        doctorName: formData.doctorName,
        location: formData.location,
        email: formData.email,
        patientAge: formData.patientAge,
        symptoms: formData.symptoms,
        urgency: formData.urgency,
        additionalInfo: formData.additionalInfo,
        specialty: finalClassification.specialty,
        subspecialty: finalClassification.subspecialty,
        reasoning: finalClassification.reasoning,
        confidence: finalClassification.confidence,
        source: finalClassification.source,
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
        // Show success message with classification details
        const specialtyText = finalClassification.specialty + (finalClassification.subspecialty ? ` (${finalClassification.subspecialty})` : '');
        const reasoningText = finalClassification.reasoning ? `\n\nReasoning: ${finalClassification.reasoning}` : '';
        
        addMessage(
          `Perfect! Your case has been classified as ${specialtyText} and saved to our database.${reasoningText}\n\nRequest ID: ${result.id}\nTimestamp: ${result.timestamp}\n\nYou should receive a response at ${formData.email} within 24 hours when a specialist becomes available.`,
          'bot'
        );
        setCurrentStep('complete');
      } else {
        throw new Error('Submission was not successful: ' + JSON.stringify(result));
      }
    } catch (error) {
      console.error('❌ Form submission error:', error);
      addMessage(`I apologize, but there was an error processing your request: ${(error as Error).message}\n\nPlease try again or contact support.`, 'bot');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
      <div className="bg-blue-600 text-white p-4 rounded-t-lg">
        <h2 className="text-xl font-semibold">Medical Specialty Matchmaker</h2>
        <p className="text-blue-100 text-sm">Connecting you with the right medical expertise</p>
      </div>
      
      <div className="flex-1 overflow-hidden">
        {currentStep === 'chat' && (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="animate-bounce">●</div>
                      <div className="animate-bounce delay-100">●</div>
                      <div className="animate-bounce delay-200">●</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="border-t p-4 flex-shrink-0">
              <MessageInput onSendMessage={handleUserMessage} isDisabled={isLoading} />
            </div>
          </div>
        )}
        
        {currentStep === 'form' && (
          <div className="h-full p-4 overflow-hidden">
            <MedicalRequestForm 
              onSubmit={handleFormSubmit} 
              isLoading={isLoading}
              prefilledData={extractedData || {}}
            />
          </div>
        )}
        
        {currentStep === 'complete' && (
          <div className="h-full overflow-y-auto p-4 flex items-center justify-center">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 max-w-lg">
              <div className="flex justify-center mb-4">
                <svg className="w-16 h-16 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-green-800 mb-2 text-center">Request Submitted Successfully!</h3>
              <p className="text-green-700 text-center mb-4">Your case has been saved to our database and matched with appropriate specialists.</p>
              
              {classificationResult && (
                <div className="bg-white rounded-lg p-4 mb-4 border border-green-300">
                  <h4 className="font-semibold text-gray-800 mb-2">Medical Classification:</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium text-gray-700">Primary Specialty:</span>
                      <span className="ml-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                        {classificationResult.specialty}
                      </span>
                    </div>
                    {classificationResult.subspecialty && (
                      <div>
                        <span className="font-medium text-gray-700">Subspecialty:</span>
                        <span className="ml-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                          {classificationResult.subspecialty}
                        </span>
                      </div>
                    )}
                  </div>
                  {classificationResult.reasoning && (
                    <div className="text-sm text-gray-600 mt-3">
                      <strong>Analysis:</strong> {classificationResult.reasoning}
                    </div>
                  )}
                  {classificationResult.confidence && (
                    <div className="text-sm text-gray-500 mt-2">
                      <strong>Confidence:</strong> {(classificationResult.confidence * 100).toFixed(0)}%
                      {classificationResult.source && (
                        <span className="ml-2 text-xs">
                          ({classificationResult.source === 'bedrock' ? '🤖 AI-powered' : 
                            classificationResult.source === 'enhanced_local' ? '📋 Enhanced Analysis' : 
                            '📋 Basic Analysis'})
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              <button 
                onClick={() => window.location.reload()} 
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start New Request
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MessageInput({ onSendMessage, isDisabled }: { onSendMessage: (message: string) => void; isDisabled?: boolean }) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isDisabled) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={isDisabled ? "Processing..." : "Type your message..."}
        disabled={isDisabled}
        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-900 bg-white placeholder-gray-600"
      />
      <button
        type="submit"
        disabled={isDisabled}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        Send
      </button>
    </form>
  );
}