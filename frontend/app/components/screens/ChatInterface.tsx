'use client';

import { useState, useRef, useEffect } from 'react';
import { ProgressIndicator } from '../ProgressIndicator';
import { BackButton } from '../BackButton';
import { ChatBubble } from '../ChatBubble';
import { QuickReplyChip } from '../QuickReplyChip';

interface ChatInterfaceProps {
  onBack: () => void;
  onNext: (data: ChatData) => void;
}

export interface ChatData {
  messages: ChatMessage[];
  classificationResult: any;
  extractedData: any;
}

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export function ChatInterface({ onBack, onNext }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: "Hello! I'm here to help you connect with the right medical specialist. Let's start by learning about your patient.\n\nIs the patient a child or an adult?",
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [classificationResult, setClassificationResult] = useState<any>(null);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [ageGroupSelected, setAgeGroupSelected] = useState(false);
  const [showAgeButtons, setShowAgeButtons] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (text: string, sender: 'user' | 'bot') => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      text,
      sender,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleAgeGroupSelect = (ageGroup: string) => {
    addMessage(ageGroup, 'user');
    setAgeGroupSelected(true);
    setShowAgeButtons(false);
    
    // Add follow-up message
    setTimeout(() => {
      addMessage(
        "Thank you. Now, please describe your patient's condition, including their main symptoms and any relevant medical history.",
        'bot'
      );
    }, 1000);
  };

  const handleUserMessage = async (message: string) => {
    if (!ageGroupSelected) return; // Prevent typing until age group is selected
    
    addMessage(message, 'user');
    setIsLoading(true);
    
    try {
      // Call the chatbot orchestrator API - same as existing ChatBot
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
        
        // Check if we can classify the case now (AI determined with 98% confidence)
        if (result.canClassify && result.classification) {
          // Ensure we always have a subspecialty
          let classification = result.classification;
          if (!classification.subspecialty) {
            classification = await ensureSubspecialty(classification, result.extractedData);
          }
          
          setClassificationResult(classification);
          
          // Store AI-extracted data for form pre-filling
          if (result.extractedData) {
            console.log('📋 AI-extracted data:', result.extractedData);
            setExtractedData(result.extractedData);
          }
          
          // Only add the classification message if the response doesn't already indicate classification
          if (!result.response.toLowerCase().includes('identified') && !result.response.toLowerCase().includes('perfect')) {
            setTimeout(() => {
              const confidenceText = classification.confidence >= 0.98 ? 
                `with ${Math.round(classification.confidence * 100)}% confidence` : 
                'based on the available information';
              
              addMessage(
                `Perfect! I've identified that this case should be handled by ${classification.specialty}${classification.subspecialty ? ` (${classification.subspecialty})` : ''} ${confidenceText}. Let me help you fill out the formal request form with this information pre-filled.`,
                'bot'
              );
              setTimeout(() => {
                // Pass the chat data to the next screen
                onNext({
                  messages,
                  classificationResult: classification,
                  extractedData: result.extractedData || {}
                });
              }, 1500);
            }, 1000);
          } else {
            // The response already indicates classification, proceed directly
            setTimeout(() => {
              onNext({
                messages,
                classificationResult: classification,
                extractedData: result.extractedData || {}
              });
            }, 1500);
          }
        }
        // Remove the needsMoreInfo handling since the conversational response should handle this
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

  // Function to ensure we always have a subspecialty
  const ensureSubspecialty = async (classification: any, extractedData: any) => {
    try {
      // If no subspecialty, make another call to get one
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'classify',
          data: {
            symptoms: extractedData?.symptoms || '',
            ageGroup: extractedData?.ageGroup || 'Adult',
            urgency: extractedData?.urgency || 'medium',
            requireSubspecialty: true // Flag to ensure subspecialty
          },
        }),
      });
      
      const result = await response.json();
      return result.subspecialty ? result : {
        ...classification,
        subspecialty: getDefaultSubspecialty(classification.specialty, extractedData?.ageGroup)
      };
    } catch (error) {
      console.error('Error getting subspecialty:', error);
      return {
        ...classification,
        subspecialty: getDefaultSubspecialty(classification.specialty, extractedData?.ageGroup)
      };
    }
  };

  // Fallback subspecialty assignment
  const getDefaultSubspecialty = (specialty: string, ageGroup?: string) => {
    const isChild = ageGroup === 'Child';
    
    switch (specialty) {
      case 'Internal Medicine':
        return isChild ? 'Pediatric Internal Medicine' : 'General Internal Medicine';
      case 'Neurology':
        return isChild ? 'Pediatric Neurology' : 'General Neurology';
      case 'Cardiology':
        return isChild ? 'Pediatric Cardiology' : 'General Cardiology';
      case 'Dermatology':
        return isChild ? 'Pediatric Dermatology' : 'General Dermatology';
      case 'Ophthalmology':
        return isChild ? 'Pediatric Ophthalmology' : 'General Ophthalmology';
      case 'Orthopedics':
        return isChild ? 'Pediatric Orthopedics' : 'General Orthopedics';
      case 'Psychiatry':
        return isChild ? 'Child and Adolescent Psychiatry' : 'General Psychiatry';
      case 'Surgery':
        return isChild ? 'Pediatric Surgery' : 'General Surgery';
      case 'Pediatrics':
        return 'General Pediatrics';
      default:
        return isChild ? 'Pediatric Medicine' : 'General Medicine';
    }
  };

  const handleSendMessage = () => {
    if (!inputValue.trim() || isLoading || !ageGroupSelected) return;
    
    handleUserMessage(inputValue.trim());
    setInputValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-[calc(100vh-120px)] px-6 py-8 flex flex-col">
      <div className="max-w-[600px] mx-auto w-full flex flex-col flex-1">
        <BackButton onClick={onBack} />
        
        <ProgressIndicator currentStep={2} totalSteps={3} />

        <div 
          className="bg-white rounded-xl shadow-lg flex flex-col flex-1" 
          style={{ boxShadow: 'rgba(2, 30, 66, 0.1) 0px 2px 8px' }}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="mb-1 text-xl font-semibold text-wti-navy">
              Patient Context
            </h2>
            <p className="text-gray-600 text-sm">
              Tell me about your patient so I can match the right specialist
            </p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6" style={{ maxHeight: '500px' }}>
            {messages.map((message) => (
              <ChatBubble
                key={message.id}
                message={message.text}
                isUser={message.sender === 'user'}
                timestamp={message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              />
            ))}
            
            {/* Age Group Selection Buttons */}
            {showAgeButtons && (
              <div className="flex flex-wrap gap-2 mt-4">
                <QuickReplyChip
                  text="Child (0-17 years)"
                  onClick={() => handleAgeGroupSelect('Child (0-17 years)')}
                />
                <QuickReplyChip
                  text="Adult (18+ years)"
                  onClick={() => handleAgeGroupSelect('Adult (18+ years)')}
                />
              </div>
            )}
            
            {isLoading && (
              <div className="flex justify-start mb-4">
                <div className="max-w-[75%] order-1">
                  <div className="rounded-2xl px-4 py-3 shadow-sm bg-white text-wti-navy border border-gray-200 rounded-bl-md">
                    <div className="flex items-center space-x-2">
                      <div className="animate-bounce">●</div>
                      <div className="animate-bounce delay-100">●</div>
                      <div className="animate-bounce delay-200">●</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-6 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  !ageGroupSelected 
                    ? "Please select age group first..." 
                    : isLoading 
                    ? "Processing..." 
                    : "Type your response..."
                }
                className="flex-1 px-4 py-3 rounded-lg bg-[#f3f3f5] border-2 border-transparent focus:border-wti-teal outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 placeholder-gray-600"
                disabled={isLoading || !ageGroupSelected}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading || !ageGroupSelected}
                className="px-6 py-3 rounded-lg bg-wti-red text-white hover:bg-wti-red-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 min-w-[60px] flex items-center justify-center"
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
                  <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"></path>
                  <path d="m21.854 2.147-10.94 10.939"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}