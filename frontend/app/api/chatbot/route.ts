import { NextRequest, NextResponse } from 'next/server';

const AWS_CHATBOT_URL = process.env.NEXT_PUBLIC_API_URL || '';
const USE_AWS = process.env.NEXT_PUBLIC_USE_AWS === 'true';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    console.log('📥 API Request:', { action, USE_AWS });

    // If AWS is configured, proxy to AWS Lambda
    if (USE_AWS) {
      const response = await fetch(AWS_CHATBOT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, data }),
      });

      const result = await response.json();
      return NextResponse.json(result);
    }

    // Otherwise, use local implementation for development
    switch (action) {
      case 'chat':
        return NextResponse.json(await handleChatMessage(data));
      case 'classify':
        return NextResponse.json(await classifyMedicalRequest(data));
      case 'submit':
        return NextResponse.json(await submitRequest(data));
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('❌ API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handleChatMessage(data: any) {
  try {
    const { message, conversationHistory = [] } = data;
    
    console.log('🤖 Processing chat message:', message);
    
    // Use local extraction for development (AWS Bedrock handles production)
    const extractedData = await extractDataLocally(conversationHistory, message);
    console.log('📋 Extracted data:', extractedData);
    
    // Generate intelligent response based on extracted data
    const response = await generateIntelligentResponse(extractedData);
    
    // Check if we can move to form
    const canClassify = extractedData.canClassify || false;
    
    return {
      response,
      source: 'local_development',
      canClassify,
      extractedData,
      classification: canClassify ? {
        specialty: extractedData.specialty,
        subspecialty: extractedData.subspecialty,
        reasoning: extractedData.reasoning || 'Local analysis',
        confidence: extractedData.confidence || 0.8,
        source: 'local_extraction'
      } : null
    };
  } catch (error) {
    console.error('❌ Chat message error:', error);
    throw error;
  }
}

async function extractDataLocally(conversationHistory: any[], currentMessage: string) {
  try {
    // Combine conversation for analysis
    const allMessages = [...conversationHistory.filter((m: any) => m.sender === 'user'), { text: currentMessage }];
    const conversationText = allMessages.map((m: any) => `Doctor: ${m.text}`).join('\n');
    
    console.log('🔧 Using local extraction for:', conversationText);
    
    const extracted: any = {
      patientAge: null,
      symptoms: null,
      urgency: 'medium',
      specialty: null,
      subspecialty: null,
      canClassify: false,
      reasoning: 'Local extraction used',
      confidence: 0.8
    };
    
    const textLower = conversationText.toLowerCase();
    
    // Extract age with improved patterns
    const agePatterns = [
      /(?:patient|he|she|they)(?:\s+is)?\s+(\d+)\s*(?:year|yr|y\.o\.|years?\s+old)/i,
      /(\d+)\s*(?:year|yr|y\.o\.|years?\s+old)/i,
      /age\s*(?:is\s*)?(\d+)/i,
      /(\d+)(?:\s+|-)?(?:yo|y\/o)/i,
      /\b(\d+)\b/ // Any number as potential age
    ];
    
    for (const pattern of agePatterns) {
      const matches = conversationText.match(pattern);
      if (matches) {
        const age = parseInt(matches[1]);
        if (age >= 0 && age <= 120) {
          extracted.patientAge = age;
          console.log('✅ Found age:', age);
          break;
        }
      }
    }
    
    // Extract symptoms - combine all user messages
    if (conversationText.length > 10) {
      extracted.symptoms = conversationText
        .replace(/doctor:\s*/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
    }
    
    // Determine urgency from keywords
    if (['urgent', 'emergency', 'severe', 'serious', 'pain', 'worried'].some(word => textLower.includes(word))) {
      extracted.urgency = 'high';
    } else if (['mild', 'minor', 'routine', 'check'].some(word => textLower.includes(word))) {
      extracted.urgency = 'low';
    }
    
    // Basic specialty classification based on symptoms
    if (textLower.includes('arm') || textLower.includes('pain')) {
      if (extracted.patientAge && extracted.patientAge < 18) {
        extracted.specialty = 'Pediatrics';
        extracted.subspecialty = null;
      } else {
        extracted.specialty = 'Internal Medicine';
        extracted.subspecialty = null;
      }
    } else if (textLower.includes('head') || textLower.includes('concussion')) {
      if (extracted.patientAge && extracted.patientAge < 18) {
        extracted.specialty = 'Pediatrics';
        extracted.subspecialty = 'Pediatric Neurology';
      } else {
        extracted.specialty = 'Neurology';
        extracted.subspecialty = 'Neurocritical Care';
      }
    } else if (textLower.includes('eye') || textLower.includes('vision')) {
      extracted.specialty = 'Ophthalmology';
      extracted.subspecialty = null;
    } else if (textLower.includes('skin') || textLower.includes('rash')) {
      extracted.specialty = 'Dermatology';
      extracted.subspecialty = null;
    }
    
    // Check if we can classify (have age, symptoms, and specialty)
    if (extracted.patientAge && extracted.symptoms && extracted.specialty) {
      extracted.canClassify = true;
      extracted.reasoning = `Local analysis: ${extracted.patientAge} year old with ${extracted.symptoms.substring(0, 50)}...`;
      extracted.confidence = 0.85;
    }
    
    console.log('📋 Local extraction result:', extracted);
    return extracted;
  } catch (error) {
    console.error('❌ Extraction error:', error);
    return {
      patientAge: null,
      symptoms: null,
      urgency: 'medium',
      specialty: null,
      subspecialty: null,
      canClassify: false,
      reasoning: 'Extraction failed',
      confidence: 0.0
    };
  }
}

async function generateIntelligentResponse(extractedData: any) {
  const { patientAge, symptoms, specialty, subspecialty, canClassify } = extractedData;
  
  // Generate contextual response based on what we have
  if (!patientAge) {
    return "I'd like to help you find the right specialist. Could you tell me the patient's age?";
  }
  
  if (!symptoms || symptoms.length < 20) {
    return `Thank you. For a ${patientAge} year old patient, could you describe their main symptoms or condition?`;
  }
  
  if (!canClassify) {
    return "Could you provide any additional details about the symptoms? This will help me identify the most appropriate specialist.";
  }
  
  // We have everything - prepare for form
  return `Perfect! Based on the information provided, this ${patientAge} year old patient should be seen by ${specialty}${subspecialty ? `, specifically ${subspecialty}` : ''}. Let me prepare the referral form with this information.`;
}

async function classifyMedicalRequest(data: any) {
  const { symptoms, patientAge, urgency } = data;

  console.log('🔍 Local Classification:', { symptoms, patientAge, urgency });

  // Use local classification for development (AWS Bedrock handles production)
  try {
    const textLower = symptoms.toLowerCase();
    let specialty = 'Internal Medicine';
    let subspecialty = null;
    
    // Basic classification logic
    if (textLower.includes('head') || textLower.includes('concussion') || textLower.includes('neurological')) {
      if (patientAge < 18) {
        specialty = 'Pediatrics';
        subspecialty = 'Pediatric Neurology';
      } else {
        specialty = 'Neurology';
        subspecialty = 'Neurocritical Care';
      }
    } else if (textLower.includes('eye') || textLower.includes('vision')) {
      specialty = 'Ophthalmology';
    } else if (textLower.includes('skin') || textLower.includes('rash')) {
      specialty = 'Dermatology';
    } else if (textLower.includes('heart') || textLower.includes('chest')) {
      specialty = 'Internal Medicine';
      subspecialty = 'Cardiovascular Disease';
    } else if (patientAge < 18) {
      specialty = 'Pediatrics';
    }
    
    const classification = {
      specialty,
      subspecialty,
      reasoning: `Local classification based on symptoms: ${symptoms.substring(0, 100)}... Age: ${patientAge}, Urgency: ${urgency}`,
      confidence: 0.8,
      urgency_assessment: urgency,
      source: 'local_development'
    };
    
    return classification;
    
  } catch (error) {
    console.error('❌ Local classification error:', error);
    throw new Error(`Local classification failed: ${error}`);
  }
}

async function submitRequest(data: any) {
  // In production, this would save to DynamoDB via AWS API Gateway
  // For development, we'll simulate the response
  const requestId = `REQ-${Date.now()}`;
  
  console.log('📤 Medical Request Submitted:', {
    id: requestId,
    ...data,
    timestamp: new Date().toISOString(),
    status: 'pending'
  });

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  return { 
    success: true, 
    id: requestId,
    timestamp: new Date().toISOString(),
    message: 'Request submitted successfully and will be matched with available specialists.'
  };
}