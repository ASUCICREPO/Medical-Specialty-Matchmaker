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
bedrock = boto3.client('bedrock-runtime', region_name=os.environ.get('BEDROCK_REGION'))

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
        
        # Get the origin from the request for CORS validation
        request_origin = event.get('headers', {}).get('origin') or event.get('headers', {}).get('Origin')
        
        # Parse the request
        body = json.loads(event.get('body', '{}'))
        action = body.get('action')
        data = body.get('data', {})
        
        if action == 'chat':
            return handle_chat_conversation(data, request_origin)
        elif action == 'classify':
            return handle_specialty_classification(data, request_origin)
        else:
            return create_response(400, {'error': 'Invalid action'}, request_origin)
            
    except Exception as e:
        logger.error(f"Error in lambda_handler: {str(e)}")
        return create_response(500, {'error': 'Internal server error'}, None)

def handle_chat_conversation(data: Dict, request_origin: Optional[str] = None) -> Dict:
    """
    Handle conversational chat to gather patient information and extract structured data
    """
    try:
        message = data.get('message', '')
        conversation_history = data.get('conversationHistory', [])
        
        # Build conversation context for Bedrock
        conversation_context = build_conversation_context(conversation_history, message)
        
        # Call Bedrock for intelligent response
        chat_response = call_bedrock_for_chat(conversation_context)
        
        # Single call to extract data AND classify if ready
        extraction_and_classification = extract_and_classify_from_conversation(
            conversation_history + [{'sender': 'user', 'text': message}]
        )
        
        # Determine if we can classify
        can_classify = extraction_and_classification.get('canClassify', False) and extraction_and_classification.get('confidence', 0) >= 0.70
        
        result = {
            'response': chat_response,
            'source': 'bedrock',
            'canClassify': can_classify,
            'extractedData': {
                'ageGroup': extraction_and_classification.get('ageGroup'),
                'symptoms': extraction_and_classification.get('symptoms'),
                'urgency': extraction_and_classification.get('urgency'),
                'confidence': extraction_and_classification.get('confidence', 0)
            }
        }
        
        # If we can classify, include the classification
        if can_classify and extraction_and_classification.get('classification'):
            result['classification'] = extraction_and_classification['classification']
        else:
            # If confidence is low, provide guidance
            confidence = extraction_and_classification.get('confidence', 0)
            if confidence > 0 and confidence < 0.70:
                result['needsMoreInfo'] = True
                result['currentConfidence'] = confidence
                result['confidenceTarget'] = 0.70
        
        return create_response(200, result, request_origin)
        
    except Exception as e:
        logger.error(f"Error in handle_chat_conversation: {str(e)}")
        return create_response(500, {
            'error': 'Chat processing failed',
            'message': str(e)
        }, request_origin)

def extract_and_classify_from_conversation(conversation_history: List[Dict]) -> Dict:
    """
    Single Bedrock call to extract data AND classify if ready - combines extraction + classification
    """
    try:
        # Combine all conversation messages
        conversation_text = ""
        for msg in conversation_history:
            role = "Doctor" if msg['sender'] == 'user' else "Assistant"
            conversation_text += f"{role}: {msg['text']}\n"
        
        # Create specialty list with subspecialties for classification
        specialty_list = []
        for specialty, subspecialties in MEDICAL_SPECIALTIES.items():
            specialty_list.append(f"- {specialty}")
            if subspecialties:
                for subspecialty in subspecialties:
                    specialty_list.append(f"  • {subspecialty}")
        
        specialty_list_str = "\n".join(specialty_list)
        
        combined_prompt = f"""You are a medical AI that extracts data from conversations AND classifies cases when ready.

Conversation:
{conversation_text}

Available Medical Specialties and Subspecialties:
{specialty_list_str}

TASK 1: Extract Information
1. Patient age group - "Adult" or "Child"
2. Symptoms description with age group context
3. Urgency level (low/medium/high)

TASK 2: Evaluate Classification Readiness
Determine if symptoms are CLEAR or VAGUE:

- Set "canClassify" to true if you have:
  * Age group (Adult/Child)
  * Key symptoms with sufficient context
  * Basic severity/duration information
- At least 4-5 specific clinical details that point to a particular subspecialty

CONFIDENCE THRESHOLD: Only classify when you have narrowed it down to one specialty and subspecialty with a 90% confidence.

CLEAR (canClassify: true, confidence: 0.85-1.0):
- Multiple specific details present
- Can confidently match to one subspecialty

VAGUE (canClassify: false, confidence: 0.3-0.7):
- Lacks specific details
- Could match multiple subspecialties

TASK 3: Classify (ONLY if canClassify is true)
If you determine canClassify is true, identify:
- PRIMARY specialty from the list above
- SPECIFIC subspecialty from the list above
- Brief reasoning
- Confidence score

IMPORTANT:
- For children: PRIMARY="Pediatrician", SUBSPECIALTY="Pediatric [appropriate area]"
- For urgent cases, consider Emergency Medicine subspecialties
- Always provide subspecialty when classifying
- Base classification on symptoms and age group

SYMPTOMS FORMATTING:
Always format symptoms with age group context:
- "Adult with [symptoms]" for adults
- "Child with [symptoms]" for children

Respond ONLY with a JSON object:
{{
    "ageGroup": "Adult" or "Child" or null,
    "symptoms": "Age group with description" or null,
    "urgency": "low/medium/high" or null,
    "canClassify": true/false,
    "confidence": 0.0-1.0,
    "reasoning": "brief explanation of readiness",
    "classification": {{
        "specialty": "PRIMARY Specialty Name",
        "subspecialty": "SPECIFIC Subspecialty Name",
        "reasoning": "why this specialty/subspecialty",
        "confidence": 0.7-1.0,
        "urgency_assessment": "low/medium/high",
        "source": "bedrock"
    }} or null
}}

If canClassify is false, set classification to null."""

        payload = {
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "text": combined_prompt
                        }
                    ]
                }
            ],
            "inferenceConfig": {
                "max_new_tokens": 2000,  # Increased for combined response
                "temperature": 0.1,
                "top_p": 0.9
            }
        }
        
        response = bedrock.invoke_model(
            modelId='us.amazon.nova-2-lite-v1:0',  # Use Amazon Nova 2 Lite
            contentType='application/json',
            accept='application/json',
            body=json.dumps(payload)
        )
        
        # Read and log the raw response
        raw_response_body = response['body'].read()
        logger.info(f"Raw combined extraction+classification response: {raw_response_body[:500]}")
        
        # Parse the response body
        try:
            response_body = json.loads(raw_response_body)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse response body as JSON: {e}")
            logger.error(f"Raw response: {raw_response_body}")
            return {'canClassify': False, 'error': f'Invalid response format: {str(e)}'}
        
        # Nova response format
        if 'output' in response_body:
            combined_response = response_body['output']['message']['content'][0]['text']
        else:
            combined_response = response_body['content'][0]['text']
        
        logger.info(f"Combined extraction+classification response: {combined_response}")
        
        # Parse the JSON response
        try:
            json_match = re.search(r'\{[\s\S]*\}', combined_response)
            if json_match:
                json_str = json_match.group(0)
                result = json.loads(json_str)
            else:
                result = json.loads(combined_response)
            
            logger.info(f"Parsed combined result: {result}")
            
            # Validate classification if present
            if result.get('classification'):
                classification = result['classification']
                
                # Validate specialty exists
                if classification['specialty'] not in MEDICAL_SPECIALTIES:
                    logger.warning(f"Invalid specialty: {classification['specialty']}")
                    # Try to find closest match
                    for specialty in MEDICAL_SPECIALTIES.keys():
                        if specialty.lower() in classification['specialty'].lower():
                            classification['specialty'] = specialty
                            break
                    else:
                        # Default based on age group
                        classification['specialty'] = 'Pediatrician' if result.get('ageGroup') == 'Child' else 'Internist'
                
                # Validate subspecialty with flexible matching
                if classification.get('subspecialty') and classification['subspecialty'] != 'null':
                    available_subspecialties = MEDICAL_SPECIALTIES[classification['specialty']]
                    subspecialty = classification['subspecialty']
                    
                    if subspecialty not in available_subspecialties:
                        # Try flexible matching
                        matched = False
                        for available_sub in available_subspecialties:
                            if (subspecialty.lower() in available_sub.lower() or 
                                available_sub.lower() in subspecialty.lower()):
                                classification['subspecialty'] = available_sub
                                matched = True
                                logger.info(f"Matched subspecialty '{subspecialty}' to '{available_sub}'")
                                break
                        
                        if not matched:
                            logger.warning(f"Subspecialty '{subspecialty}' not in list for {classification['specialty']}")
                else:
                    classification['subspecialty'] = None
                
                classification['source'] = 'bedrock'
                result['classification'] = classification
            
            return result
            
        except (json.JSONDecodeError, KeyError, ValueError) as e:
            logger.error(f"Failed to parse combined response: {e}")
            logger.error(f"Raw response: {combined_response}")
            return {'canClassify': False, 'error': f'Parse error: {str(e)}'}
        
    except Exception as e:
        logger.error(f"Combined extraction+classification error: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return {'canClassify': False, 'error': str(e)}

def handle_specialty_classification(data: Dict, request_origin: Optional[str] = None) -> Dict:
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
        
        return create_response(200, classification, request_origin)
        
    except Exception as e:
        logger.error(f"Error in handle_specialty_classification: {str(e)}")
        return create_response(500, {
            'error': 'Classification failed',
            'message': str(e),
            'details': 'Bedrock classification is required but failed'
        }, request_origin)

def build_conversation_context(conversation_history: List[Dict], current_message: str) -> str:
    """
    Build conversation context for Bedrock with focus on medical data extraction
    """
    # Create specialty list with subspecialties for context
    specialty_list = []
    for specialty, subspecialties in MEDICAL_SPECIALTIES.items():
        specialty_list.append(f"- {specialty} [")
        if subspecialties:
            for subspecialty in subspecialties:
                specialty_list.append(f"  • {subspecialty}")
        specialty_list.append(f"]")

    specialty_list_str = "\n".join(specialty_list)

    system_prompt = f"""You are a medical triage assistant helping doctors connect with volunteer specialists.

Available Medical Specialties and Subspecialties:
{specialty_list_str}

Your goals:
1. Gather key information through systematic questioning
2. Ask 2-3 targeted follow-up questions to narrow down to one subspecialty classification
3. Be thorough and methodical - ask multiple specific questions before considering classification
4. Focus on gathering enough information to distinguish between subspecialties within a specialty

CONFIDENCE TARGET: Aim for 90% confidence in subspecialty selection before classification.

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
If they have no more information, classify to the best of your ability.

QUESTIONING STRATEGY:
- Ask 2-3 specific follow-up questions before considering classification
- Focus on details that help distinguish between subspecialties
- Gather information systematically and thoroughly

WORD LIMIT: Keep "reasoning" field under 300 words maximum."""

    context = system_prompt + "\n\nConversation so far:\n"
    
    for msg in conversation_history:
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
            "max_tokens": 2000,
            "messages": [
                {
                    "role": "user",
                    "content": conversation_context
                }
            ],
            "temperature": 0.5,
            "top_p": 0.999
        }
        
        logger.info(f"Calling Bedrock for chat with context length: {len(conversation_context)}")
        
        response = bedrock.invoke_model(
            modelId='us.anthropic.claude-3-5-haiku-20241022-v1:0',  # Use Claude 3.5 Haiku for chat
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
        # Create specialty list with subspecialties for context
        specialty_list = []
        for specialty, subspecialties in MEDICAL_SPECIALTIES.items():
            specialty_list.append(f"- {specialty} [")
            if subspecialties:
                for subspecialty in subspecialties:
                    specialty_list.append(f"  • {subspecialty}")
            specialty_list.append(f"]")

        specialty_list_str = "\n".join(specialty_list)

        prompt = f"""You are a medical triage AI expert. Based on the patient information below, identify the most appropriate PRIMARY medical specialty and SPECIFIC subspecialty.

Patient Information:
- Age Group: {age_group}
- Symptoms: {symptoms}
- Urgency: {urgency}

Available Medical Specialties and Subspecialties:
{specialty_list_str}

INSTRUCTIONS:
1. Identify the PRIMARY specialty that best matches this case
2. Provide a SPECIFIC subspecialty from the list above when applicable
3. For children: PRIMARY="Pediatrician", SUBSPECIALTY="Pediatric [appropriate area]"
4. For urgent cases, consider Emergency Medicine subspecialties
5. Base subspecialty choice on the specific symptoms and patient presentation
6. Consider the age group when making specialty decisions
7. Use your medical knowledge to make the best match with available information

Respond ONLY with a JSON object in this exact format:
{{
    "specialty": "PRIMARY Specialty Name",
    "subspecialty": "SPECIFIC Subspecialty Name" or null,
    "reasoning": "Brief explanation of why this specialty and subspecialty were chosen",
    "confidence": 0.9,
    "urgency_assessment": "low/medium/high"
}}"""

        payload = {
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "text": prompt
                        }
                    ]
                }
            ],
            "inferenceConfig": {
                "max_new_tokens": 1200,
                "temperature": 0.1,
                "top_p": 0.9
            }
        }
        
        logger.info(f"Calling Bedrock classification with age_group: {age_group}, symptoms: {symptoms[:100]}...")
        
        response = bedrock.invoke_model(
            modelId='us.amazon.nova-2-lite-v1:0',  # Use Amazon Nova 2 Lite for classification
            contentType='application/json',
            accept='application/json',
            body=json.dumps(payload)
        )
        
        # Read and log the raw response
        raw_response_body = response['body'].read()
        logger.info(f"Raw Bedrock response body: {raw_response_body[:500]}")
        
        # Parse the response body
        try:
            response_body = json.loads(raw_response_body)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Bedrock response body as JSON: {e}")
            logger.error(f"Raw response: {raw_response_body}")
            raise Exception(f"Bedrock returned invalid response format: {str(e)}")
        
        # Nova response format is different from Claude
        if 'output' in response_body:
            # Nova format
            bedrock_response = response_body['output']['message']['content'][0]['text']
        else:
            # Claude format (fallback)
            bedrock_response = response_body['content'][0]['text']
        
        logger.info(f"Bedrock classification response: {bedrock_response}")
        
        # Parse JSON response - extract JSON from markdown if needed
        try:
            # Try to extract JSON from the response (might have markdown formatting)
            json_match = re.search(r'\{[\s\S]*\}', bedrock_response)
            if json_match:
                json_str = json_match.group(0)
                classification = json.loads(json_str)
            else:
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

def create_response(status_code: int, body: Dict, request_origin: Optional[str] = None) -> Dict:
    """
    Create standardized API response with secure CORS headers
    
    Args:
        status_code: HTTP status code
        body: Response body dictionary
        request_origin: The Origin header from the incoming request
    
    Returns:
        API Gateway response with appropriate CORS headers
    """
    # Get allowed origins from environment variable
    allowed_origins_str = os.environ.get('ALLOWED_ORIGINS', 'http://localhost:3000')
    allowed_origins = [origin.strip() for origin in allowed_origins_str.split(',')]
    
    # Determine which origin to return in the header
    # CORS spec only allows a single origin in Access-Control-Allow-Origin
    if request_origin and request_origin in allowed_origins:
        # Request is from an allowed origin - return that specific origin
        origin = request_origin
        logger.info(f"CORS: Allowing origin {origin}")
    elif len(allowed_origins) == 1:
        # Only one allowed origin - use it
        origin = allowed_origins[0]
    else:
        # Multiple allowed origins but no matching request origin
        # Use the first one (typically production URL)
        origin = allowed_origins[0]
        if request_origin:
            logger.warning(f"CORS: Request from unauthorized origin {request_origin}. Allowed: {allowed_origins}")
    
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
            'Vary': 'Origin'  # Important for caching with multiple allowed origins
        },
        'body': json.dumps(body)
    }