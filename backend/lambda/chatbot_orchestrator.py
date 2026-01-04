import json
import boto3
import logging
import os
from typing import Dict, List, Optional, Tuple
import re

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize Bedrock client - use the same region as the Lambda
bedrock = boto3.client('bedrock-runtime', region_name=os.environ.get('AWS_REGION'))

# Medical specialties and subspecialties mapping
MEDICAL_SPECIALTIES = {
    "Allergy and Immunology": [
        "Allergist-Immunologist (Internist)",
        "Allergist-Immunologist (Pediatrician)"
    ],
    "Anesthesiologist": [
        "Adult Cardiac Anesthesiology",
        "Critical Care Medicine",
        "Hospice and Palliative Medicine",
        "Neurocritical Care",
        "Pain Medicine",
        "Pediatric Anesthesiology",
        "Sleep Medicine"
    ],
    "Colon and Rectal Surgery": [
        "Colon and Rectal Surgeon (prior certification as General Surgeon)"
    ],
    "Dermatologist": [
        "Dermatopathology",
        "Micrographic Dermatologic Surgery",
        "Pediatric Dermatology"
    ],
    "Emergency Medicine Physician": [
        "Anesthesiology Critical Care Medicine",
        "Emergency Medical Services",
        "Hospice and Palliative Medicine",
        "Internal Medicine–Critical Care Medicine",
        "Medical Toxicology",
        "Neurocritical Care",
        "Pain Medicine",
        "Pediatric Emergency Medicine",
        "Sports Medicine",
        "Undersea and Hyperbaric Medicine"
    ],
    "Family Physician": [
        "Adolescent Medicine",
        "Geriatric Medicine",
        "Hospice and Palliative Medicine",
        "Pain Medicine",
        "Sleep Medicine",
        "Sports Medicine",
        "Tropical Medicine"
    ],
    "Internist": [
        "Adolescent Medicine",
        "Adult Congenital Heart Disease",
        "Advanced Heart Failure and Transplant Cardiology",
        "Cardiovascular Disease",
        "Clinical Cardiac Electrophysiology",
        "Critical Care Medicine",
        "Endocrinology, Diabetes and Metabolism",
        "Gastroenterology",
        "Geriatric Medicine",
        "Hematology",
        "Hospice and Palliative Medicine",
        "Infectious Disease",
        "Interventional Cardiology",
        "Medical Oncology",
        "Nephrology",
        "Neurocritical Care",
        "Pulmonary Disease",
        "Rheumatology",
        "Sleep Medicine",
        "Sports Medicine",
        "Transplant Hepatology"
    ],
    "Medical Geneticist": [
        "Clinical Biochemical Genetics",
        "Clinical Cytogenetics and Genomics",
        "Clinical Genetics and Genomics",
        "Clinical Molecular Genetics and Genomics",
        "Laboratory Genetics and Genomics",
        "Medical Biochemical Genetics",
        "Molecular Genetic Pathology"
    ],
    "Neurological Surgeon": [
        "Neurocritical Care",
        "Pediatric Neurological Surgery",
        "CNS Endovascular Surgery"
    ],
    "Nuclear Medicine Specialist": [],
    "Obstetrician/Gynecologist": [
        "Complex Family Planning",
        "Critical Care Medicine",
        "Female Pelvic Medicine and Reconstructive Surgery",
        "Gynecologic Oncology",
        "Hospice and Palliative Medicine",
        "Maternal–Fetal Medicine",
        "Reproductive Endocrinology and Infertility",
        "Menopausal and Geriatric Gynecology",
        "Minimally Invasive Gynecologic Surgery",
        "Obstetric Fistula",
        "Pediatric and Adolescent Gynecology"
    ],
    "Ophthalmologist": [
        "Anterior Segment Specialist",
        "Cataracts and Refractive Surgery",
        "Cornea and External Disease",
        "Glaucoma",
        "Neuro-Ophthalmology",
        "Ocular Oncology",
        "Oculoplastic, Reconstructive and Orbital Surgery",
        "Ophthalmic Pathology",
        "Ophthalmic Trauma",
        "Pediatrics and Strabismus",
        "Uveitis and Immunology",
        "Vitreoretinal Specialist"
    ],
    "Oral and Maxillofacial Surgeon": [],
    "Orthopaedic Surgeon": [
        "Orthopaedic Sports Medicine",
        "Surgery of the Hand",
        "Foot and Ankle Area of Focus"
    ],
    "Otolaryngologist–Head and Neck Surgeon": [
        "Complex Pediatric Otolaryngology",
        "Neurotology",
        "Plastic Surgery Within the Head and Neck",
        "Sleep Medicine"
    ],
    "Pathologist": [
        "Blood Banking/Transfusion Medicine",
        "Clinical Informatics",
        "Cytopathology",
        "Dermatopathology",
        "Hematopathology",
        "Neuropathology",
        "Pathology–Chemical",
        "Pathology–Forensic",
        "Pathology–Hematology",
        "Pathology–Medical Microbiology",
        "Pathology–Molecular Genetic",
        "Pathology–Pediatric",
        "Pathology–Radioisotopic"
    ],
    "Pediatrician": [
        "Adolescent Medicine",
        "Child Abuse Pediatrics",
        "Developmental–Behavioral Pediatrics",
        "Hospice and Palliative Medicine",
        "Medical Toxicology",
        "Neonatal–Perinatal Medicine",
        "Neurodevelopmental Disabilities",
        "Pediatric Cardiology",
        "Pediatric Critical Care Medicine",
        "Pediatric Emergency Medicine",
        "Pediatric Endocrinology",
        "Pediatric Gastroenterology",
        "Pediatric Hematology–Oncology",
        "Pediatric Hospital Medicine",
        "Pediatric Infectious Diseases",
        "Pediatric Nephrology",
        "Pediatric Pulmonology",
        "Pediatric Rheumatology",
        "Pediatric Transplant Hepatology",
        "Sleep Medicine",
        "Sports Medicine"
    ],
    "Physiatrist": [
        "Brain Injury Medicine",
        "Hospice and Palliative Medicine",
        "Neuromuscular Medicine",
        "Pain Medicine",
        "Pediatric Rehabilitation Medicine",
        "Spinal Cord Injury Medicine",
        "Sports Medicine"
    ],
    "Plastic Surgeon": [
        "Plastic Surgery Within the Head and Neck",
        "Surgery of the Hand"
    ],
    "Preventive Medicine Physician": [
        "Aerospace Medicine",
        "Occupational Medicine",
        "Public Health and General Preventive Medicine",
        "Addiction Medicine",
        "Clinical Informatics",
        "Medical Toxicology",
        "Undersea and Hyperbaric Medicine"
    ],
    "Neurologist": [
        "Brain Injury Medicine",
        "Clinical Neurophysiology",
        "Epilepsy",
        "Hospice and Palliative Medicine",
        "Neurocritical Care",
        "Neurodevelopmental Disabilities",
        "Neuromuscular Medicine",
        "Pain Medicine",
        "Sleep Medicine",
        "Vascular Neurology"
    ],
    "Psychiatrist": [
        "Addiction Psychiatry",
        "Child and Adolescent Psychiatry",
        "Clinical Neurophysiology",
        "Consultation-Liaison Psychiatry",
        "Forensic Psychiatry",
        "Geriatric Psychiatry",
        "Hospice and Palliative Medicine",
        "Pain Medicine",
        "Sleep Medicine"
    ],
    "Diagnostic Radiologist": [
        "Hospice and Palliative Medicine",
        "Neuroradiology",
        "Nuclear Radiology",
        "Pain Medicine",
        "Pediatric Radiology",
        "Vascular and Interventional Radiology"
    ],
    "Interventional and Diagnostic Radiologist": [
        "Hospice and Palliative Medicine",
        "Neuroradiology",
        "Nuclear Radiology",
        "Pain Medicine",
        "Pediatric Radiology"
    ],
    "Radiation Oncologist": [
        "Hospice and Palliative Medicine",
        "Pain Medicine"
    ],
    "Radiology (IV. Medical Physics)": [
        "Diagnostic Medical Physics",
        "Nuclear Medical Physics",
        "Therapeutic Medical Physics"
    ],
    "Surgeon ": [
        "General Surgery",
        "Vascular Surgery",
        "Complex General Surgical Oncology",
        "Hospice and Palliative Medicine",
        "Pediatric Surgery",
        "Surgery of the Hand",
        "Surgical Critical Care"
    ],
    "Thoracic/Cardiac Surgeon": [
        "Congenital Cardiac Surgery"
    ],
    "Urologist": [
        "Female Pelvic Medicine and Reconstructive Surgery",
        "Pediatric Urology"
    ]
}

def lambda_handler(event, context):
    """
    Main Lambda handler for chatbot orchestration
    """
    try:
        logger.info(f"Received event: {json.dumps(event)}")
        
        # Parse the request
        body = json.loads(event.get('body', '{}'))
        action = body.get('action')
        data = body.get('data', {})
        
        if action == 'chat':
            return handle_chat_conversation(data)
        elif action == 'classify':
            return handle_specialty_classification(data)
        else:
            return create_response(400, {'error': 'Invalid action'})
            
    except Exception as e:
        logger.error(f"Error in lambda_handler: {str(e)}")
        return create_response(500, {'error': 'Internal server error'})

def handle_chat_conversation(data: Dict) -> Dict:
    """
    Handle conversational chat to gather patient information and extract structured data
    """
    try:
        message = data.get('message', '')
        conversation_history = data.get('conversationHistory', [])
        
        # Build conversation context for Bedrock
        conversation_context = build_conversation_context(conversation_history, message)
        
        # Call Bedrock for intelligent response AND data extraction
        chat_response = call_bedrock_for_chat(conversation_context)
        
        # Extract structured data from the entire conversation using AI
        extracted_data = extract_structured_data_from_conversation(conversation_history + [{'sender': 'user', 'text': message}])
        
        # Let AI determine if we have enough information to classify with 98% confidence
        can_classify = extracted_data.get('canClassify', False) and extracted_data.get('confidence', 0) >= 0.98
        
        result = {
            'response': chat_response,
            'source': 'bedrock',
            'canClassify': can_classify,
            'extractedData': extracted_data
        }
        
        # If AI says we can classify with 98% confidence, use the focused classification method
        if can_classify:
            # Use the same accurate classification method as re-evaluation
            classification = classify_with_bedrock(
                extracted_data.get('symptoms', ''),
                extracted_data.get('ageGroup', 'Adult'),  # Use age group instead of patient age
                extracted_data.get('urgency', 'medium')
            )
            result['classification'] = classification
        else:
            # If confidence is low, provide guidance on what additional information is needed
            confidence = extracted_data.get('confidence', 0)
            if confidence > 0 and confidence < 0.98:
                result['needsMoreInfo'] = True
                result['currentConfidence'] = confidence
                result['confidenceTarget'] = 0.98
                result['additionalInfoNeeded'] = extracted_data.get('additionalInfoNeeded', 'More detailed symptom information needed for accurate subspecialty classification')
        
        return create_response(200, result)
        
    except Exception as e:
        logger.error(f"Error in handle_chat_conversation: {str(e)}")
        return create_response(500, {
            'error': 'Chat processing failed',
            'message': str(e)
        })

def extract_structured_data_from_conversation(conversation_history: List[Dict]) -> Dict:
    """
    Use Bedrock to extract structured data from conversation and determine readiness
    """
    try:
        # Combine all conversation messages
        conversation_text = ""
        for msg in conversation_history:
            role = "Doctor" if msg['sender'] == 'user' else "Assistant"
            conversation_text += f"{role}: {msg['text']}\n"
        
        extraction_prompt = f"""You are a medical data extraction AI. Analyze this conversation and extract structured information.

Conversation:
{conversation_text}

Extract the following information if mentioned and determine if we have enough to classify:
1. Patient age group (REQUIRED) - "Adult" or "Child" based on button selection
2. Symptoms description - include age group context (e.g., "Adult with chest pain" or "Child with fever")
3. Urgency level (low/medium/high)
4. Whether we have enough information to classify and move to form

CRITICAL REQUIREMENTS FOR CLASSIFICATION:
- ONLY set "canClassify" to true if you have COMPREHENSIVE information including:
  * Age group (Adult/Child)
  * DETAILED symptoms with sufficient context and specificity
  * Duration, onset, and progression of symptoms
  * Associated symptoms and their timing
  * Relevant medical history, medications, allergies
  * Physical examination findings if available
  * Enough information to confidently distinguish between multiple subspecialties within a specialty
  * At least 5-7 specific clinical details that point to a particular subspecialty

CONFIDENCE THRESHOLD: Only classify when you can achieve 98% confidence in subspecialty selection.

EXAMPLES OF INSUFFICIENT INFORMATION (canClassify: false):
- "Child with unexplained rash and high fever" - need rash characteristics, distribution, timing, associated symptoms, vital signs
- "Adult with chest pain" - need character, location, radiation, triggers, duration, associated symptoms
- "Child with breathing problems" - need onset, triggers, severity, associated symptoms, response to treatments
- "Adult with headache" - need type, location, triggers, frequency, associated symptoms, neurological signs
- "Child with stomach pain" - need location, character, timing, associated symptoms, examination findings

EXAMPLES OF SUFFICIENT INFORMATION (canClassify: true):
- "5-year-old with widespread erythematous maculopapular rash for 3 days, fever 104°F, cervical lymphadenopathy, pharyngitis, no response to antihistamines, no recent medications, fully immunized"
- "45-year-old with crushing substernal chest pain radiating to left arm, 30 minutes duration, diaphoresis, nausea, no relief with rest, history of hypertension and smoking"

Age Group Examples:
- "Adult (18+ years)" → ageGroup: "Adult"
- "Child (0-17 years)" → ageGroup: "Child"
- "Adult with symptoms" → ageGroup: "Adult"
- "Child with symptoms" → ageGroup: "Child"

SYMPTOMS FORMATTING:
Always format symptoms with age group context:
- "Adult with [symptoms]" for adults
- "Child with [symptoms]" for children

Respond ONLY with a JSON object:
{{
    "ageGroup": "Adult" or "Child" or null,
    "symptoms": "Age group with description (e.g., 'Adult with chest pain and shortness of breath')" or null,
    "urgency": "low/medium/high" or null,
    "canClassify": true/false,
    "reasoning": "explanation of why classification is or is not possible with current information, including confidence assessment",
    "confidence": 0.0-1.0,
    "confidenceThreshold": 0.98,
    "additionalInfoNeeded": "specific information needed to reach 98% confidence" or null
}}"""

        payload = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 1000,
            "messages": [
                {
                    "role": "user",
                    "content": extraction_prompt
                }
            ],
            "temperature": 0.1  # Low temperature for consistent extraction
        }
        
        response = bedrock.invoke_model(
            modelId='anthropic.claude-3-haiku-20240307-v1:0',
            contentType='application/json',
            accept='application/json',
            body=json.dumps(payload)
        )
        
        response_body = json.loads(response['body'].read())
        extraction_response = response_body['content'][0]['text']
        
        logger.info(f"Data extraction response: {extraction_response}")
        
        # Parse the JSON response
        try:
            extracted_data = json.loads(extraction_response)
            
            # Clean up the data - no need to process patientAge anymore
            logger.info(f"Extracted structured data: {extracted_data}")
            return extracted_data
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse extraction response: {e}")
            return {'canClassify': False}
        
    except Exception as e:
        logger.error(f"Data extraction error: {str(e)}")
        return {'canClassify': False}

def handle_specialty_classification(data: Dict) -> Dict:
    """
    Handle medical specialty classification - BEDROCK ONLY
    """
    try:
        symptoms = data.get('symptoms', '')
        age_group = data.get('ageGroup', 'Adult')  # Use age group instead of patient age
        urgency = data.get('urgency', 'medium')
        
        logger.info(f"Classifying case: ageGroup={age_group}, urgency={urgency}, symptoms={symptoms[:100]}...")
        
        # Use Bedrock for intelligent classification - NO FALLBACK
        classification = classify_with_bedrock(symptoms, age_group, urgency)
        
        return create_response(200, classification)
        
    except Exception as e:
        logger.error(f"Error in handle_specialty_classification: {str(e)}")
        return create_response(500, {
            'error': 'Classification failed',
            'message': str(e),
            'details': 'Bedrock classification is required but failed'
        })

def build_conversation_context(conversation_history: List[Dict], current_message: str) -> str:
    """
    Build conversation context for Bedrock with focus on medical data extraction
    """
    system_prompt = """You are a medical triage assistant helping doctors connect with volunteer specialists.

Your goals:
1. Gather COMPREHENSIVE information through systematic questioning
2. Ask targeted follow-up questions to achieve 98% confidence in subspecialty classification
3. DO NOT classify until you have extensive clinical details
4. Be thorough and methodical - ask multiple specific questions before considering classification
5. Focus on gathering enough information to distinguish between subspecialties within a specialty

CONFIDENCE TARGET: Aim for 98% confidence in subspecialty selection before classification.

SYSTEMATIC QUESTIONING APPROACH:
- Start with broad symptom description
- Ask about onset, duration, progression, severity
- Inquire about triggers, alleviating factors, timing patterns
- Ask about associated symptoms in detail
- Gather relevant medical history, medications, allergies
- Ask about physical examination findings
- Ask specific questions to differentiate between subspecialties

CRITICAL: Do not suggest classification based on limited information. 
Always ask multiple follow-up questions to gather comprehensive clinical details.

QUESTIONING STRATEGY:
- Ask 3-5 specific follow-up questions before considering classification
- Focus on details that help distinguish between subspecialties
- Gather information systematically and thoroughly

Remember: Thorough information gathering over speed - ask comprehensive questions for confident subspecialty matching."""

    context = system_prompt + "\n\nConversation so far:\n"
    
    for msg in conversation_history[-4:]:  # Keep last 4 messages for context
        role = "Doctor" if msg['sender'] == 'user' else "Assistant"
        context += f"{role}: {msg['text']}\n"
    
    context += f"Doctor: {current_message}\nAssistant:"
    
    return context

def call_bedrock_for_chat(conversation_context: str) -> str:
    """
    Call Bedrock for conversational response - NO FALLBACK
    """
    try:
        payload = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 800,
            "messages": [
                {
                    "role": "user",
                    "content": conversation_context
                }
            ],
            "temperature": 0.7
        }
        
        logger.info(f"Calling Bedrock for chat with context length: {len(conversation_context)}")
        
        response = bedrock.invoke_model(
            modelId='anthropic.claude-3-haiku-20240307-v1:0',  # Use Claude 3 Haiku model
            contentType='application/json',
            accept='application/json',
            body=json.dumps(payload)
        )
        
        response_body = json.loads(response['body'].read())
        bedrock_response = response_body['content'][0]['text']
        
        logger.info(f"Bedrock chat response: {bedrock_response[:100]}...")
        return bedrock_response
        
    except Exception as e:
        logger.error(f"Bedrock chat error: {str(e)}")
        raise Exception(f"Bedrock chat failed: {str(e)}")  # No fallback!

def classify_with_bedrock(symptoms: str, age_group: str, urgency: str) -> Dict:
    """
    Use Bedrock to classify medical case - NO FALLBACK
    """
    try:
        # Create specialty list for prompt
        specialty_list = "\n".join([f"- {specialty}" for specialty in MEDICAL_SPECIALTIES.keys()])
        
        # Create specialty list for prompt
        specialty_list = "\n".join([f"- {specialty}" for specialty in MEDICAL_SPECIALTIES.keys()])
        
        prompt = f"""You are a medical triage AI expert. Based on the patient information below, identify the most appropriate PRIMARY medical specialty and SPECIFIC subspecialty.

Patient Information:
- Age Group: {age_group}
- Symptoms: {symptoms}
- Urgency: {urgency}

Available Medical Specialties:
{specialty_list}

CRITICAL INSTRUCTIONS:
1. Identify the PRIMARY specialty that best matches this case
2. ALWAYS provide a SPECIFIC subspecialty - this is REQUIRED, not optional
3. For children: PRIMARY="Pediatrician", SUBSPECIALTY="Pediatric [appropriate area]"
4. For urgent cases, consider Emergency Medicine subspecialties
5. Base subspecialty choice on the specific symptoms and patient presentation
6. Consider the age group when making specialty decisions
7. CONFIDENCE REQUIREMENT: Only classify if you can achieve 98% confidence in subspecialty selection
8. If confidence is below 98%, indicate what additional information is needed

Respond ONLY with a JSON object in this exact format:
{{
    "specialty": "PRIMARY Specialty Name",
    "subspecialty": "SPECIFIC Subspecialty Name",
    "reasoning": "Detailed explanation of why this PRIMARY specialty and SPECIFIC subspecialty were chosen based on age group and symptoms",
    "confidence": 0.98,
    "urgency_assessment": "low/medium/high",
    "additional_info_needed": "List any additional information that would increase confidence" or null
}}"""

        payload = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 1200,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.1
        }
        
        logger.info(f"Calling Bedrock classification with age_group: {age_group}, symptoms: {symptoms[:100]}...")
        
        response = bedrock.invoke_model(
            modelId='anthropic.claude-3-haiku-20240307-v1:0',  # Use Claude 3 Haiku model
            contentType='application/json',
            accept='application/json',
            body=json.dumps(payload)
        )
        
        response_body = json.loads(response['body'].read())
        bedrock_response = response_body['content'][0]['text']
        
        logger.info(f"Bedrock classification response: {bedrock_response}")
        
        # Parse JSON response
        try:
            classification = json.loads(bedrock_response)
            
            # Validate specialty exists
            if classification['specialty'] not in MEDICAL_SPECIALTIES:
                logger.warning(f"Invalid specialty from Bedrock: {classification['specialty']}")
                # Try to find closest match
                for specialty in MEDICAL_SPECIALTIES.keys():
                    if specialty.lower() in classification['specialty'].lower():
                        classification['specialty'] = specialty
                        break
                else:
                    # Default based on age group
                    classification['specialty'] = 'Pediatrician' if age_group == 'Child' else 'Internist'
            
            # Validate subspecialty if provided with flexible matching
            if classification.get('subspecialty') and classification['subspecialty'] != 'null':
                available_subspecialties = MEDICAL_SPECIALTIES[classification['specialty']]
                subspecialty = classification['subspecialty']
                
                # Check for exact match first
                if subspecialty not in available_subspecialties:
                    # Try flexible matching (case-insensitive, partial matches)
                    matched = False
                    for available_sub in available_subspecialties:
                        if (subspecialty.lower() in available_sub.lower() or 
                            available_sub.lower() in subspecialty.lower()):
                            classification['subspecialty'] = available_sub
                            matched = True
                            logger.info(f"Matched subspecialty '{subspecialty}' to '{available_sub}'")
                            break
                    
                    # If no match found, keep the AI's subspecialty but log it
                    if not matched:
                        logger.warning(f"AI provided subspecialty '{subspecialty}' not in predefined list for {classification['specialty']}. Keeping AI's choice.")
                        # Don't set to None - trust the AI's judgment
            else:
                classification['subspecialty'] = None
            
            classification['source'] = 'bedrock'
            logger.info(f"Final classification: {classification}")
            return classification
            
        except (json.JSONDecodeError, KeyError, ValueError) as e:
            logger.error(f"Failed to parse Bedrock classification response: {e}")
            logger.error(f"Raw response was: {bedrock_response}")
            raise Exception(f"Bedrock returned invalid JSON: {str(e)}")
        
    except Exception as e:
        logger.error(f"Bedrock classification error: {str(e)}")
        raise Exception(f"Bedrock classification failed: {str(e)}")  # No fallback!

def create_response(status_code: int, body: Dict) -> Dict:
    """
    Create standardized API response
    """
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
        },
        'body': json.dumps(body)
    }