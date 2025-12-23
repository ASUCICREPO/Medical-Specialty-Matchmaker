import json
import boto3
import logging
from typing import Dict, List, Optional, Tuple
import re

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize Bedrock client
bedrock = boto3.client('bedrock-runtime', region_name='us-west-2')

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
        
        # Let AI determine if we have enough information to classify
        can_classify = extracted_data.get('canClassify', False)
        
        result = {
            'response': chat_response,
            'source': 'bedrock',
            'canClassify': can_classify,
            'extractedData': extracted_data
        }
        
        # If AI says we can classify, add the classification
        if can_classify:
            result['classification'] = {
                'specialty': extracted_data.get('specialty'),
                'subspecialty': extracted_data.get('subspecialty'),
                'reasoning': extracted_data.get('reasoning', 'AI-determined classification'),
                'confidence': extracted_data.get('confidence', 0.9),
                'source': 'ai_extraction'
            }
        
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
1. Patient age (number only)
2. Symptoms description
3. Urgency level (low/medium/high)
4. Medical specialty (if identifiable from symptoms)
5. Medical subspecialty (if identifiable)
6. Whether we have enough information to classify and move to form

Available specialties: {', '.join(MEDICAL_SPECIALTIES.keys())}

IMPORTANT: Set "canClassify" to true ONLY if you can confidently identify:
- Patient age
- Clear symptoms description
- Appropriate medical specialty
- Appropriate subspecialty (or determine none needed)

Respond ONLY with a JSON object:
{{
    "patientAge": number or null,
    "symptoms": "description" or null,
    "urgency": "low/medium/high" or null,
    "specialty": "specialty name" or null,
    "subspecialty": "subspecialty name" or null,
    "canClassify": true/false,
    "reasoning": "explanation of classification decision",
    "confidence": 0.0-1.0
}}"""

        payload = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 400,
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
            
            # Clean up the data
            if extracted_data.get('patientAge'):
                extracted_data['patientAge'] = str(extracted_data['patientAge'])
            
            # Validate specialty against available options
            if extracted_data.get('specialty') and extracted_data['specialty'] not in MEDICAL_SPECIALTIES:
                # Try to find closest match
                for specialty in MEDICAL_SPECIALTIES.keys():
                    if specialty.lower() in extracted_data['specialty'].lower():
                        extracted_data['specialty'] = specialty
                        break
                else:
                    extracted_data['specialty'] = None
                    extracted_data['canClassify'] = False
            
            # Validate subspecialty against available options
            if extracted_data.get('specialty') and extracted_data.get('subspecialty'):
                available_subspecialties = MEDICAL_SPECIALTIES[extracted_data['specialty']]
                if extracted_data['subspecialty'] not in available_subspecialties:
                    # If subspecialty is invalid, set to None but don't block classification
                    extracted_data['subspecialty'] = None
            
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
        patient_age = data.get('patientAge', 0)
        urgency = data.get('urgency', 'medium')
        
        logger.info(f"Classifying case: age={patient_age}, urgency={urgency}, symptoms={symptoms[:100]}...")
        
        # Use Bedrock for intelligent classification - NO FALLBACK
        classification = classify_with_bedrock(symptoms, patient_age, urgency)
        
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
1. Gather key information: patient age, symptoms, urgency level
2. Identify medical specialty and subspecialty as quickly as possible
3. Ask targeted questions to determine the right specialty
4. Once you identify a specific specialty AND subspecialty, prepare to move to the form
5. Be efficient - don't ask unnecessary questions once you have enough information

Remember: Be concise and move toward specialty identification quickly."""

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
            "max_tokens": 300,
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

def classify_with_bedrock(symptoms: str, patient_age: int, urgency: str) -> Dict:
    """
    Use Bedrock to classify medical case - NO FALLBACK
    """
    try:
        # Create specialty list for prompt
        specialty_list = "\n".join([f"- {specialty}" for specialty in MEDICAL_SPECIALTIES.keys()])
        
        prompt = f"""You are a medical triage AI expert. Based on the patient information below, identify the most appropriate medical specialty and subspecialty.

Patient Information:
- Age: {patient_age} years old
- Symptoms: {symptoms}
- Urgency: {urgency}

Available Medical Specialties and Subspecialties:
{specialty_list}

IMPORTANT INSTRUCTIONS:
1. Identify the PRIMARY specialty that best matches this case
2. If applicable, suggest a subspecialty from the available options for that specialty
3. Provide clear reasoning for your recommendation
4. Consider patient age (pediatric vs adult specialties)
6. For urgent cases, also consider Emergency Medicine

Respond ONLY with a JSON object in this exact format:
{{
    "specialty": "Primary Specialty Name",
    "subspecialty": "Subspecialty Name or null",
    "reasoning": "Brief explanation of why this specialty was chosen",
    "confidence": 0.85,
    "urgency_assessment": "low/medium/high"
}}"""

        payload = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 500,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.3
        }
        
        logger.info(f"Calling Bedrock with payload: {json.dumps(payload, indent=2)}")
        
        response = bedrock.invoke_model(
            modelId='anthropic.claude-3-haiku-20240307-v1:0',  # Use Claude 3 Haiku model
            contentType='application/json',
            accept='application/json',
            body=json.dumps(payload)
        )
        
        response_body = json.loads(response['body'].read())
        bedrock_response = response_body['content'][0]['text']
        
        logger.info(f"Bedrock raw response: {bedrock_response}")
        
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
                    classification['specialty'] = 'Internal Medicine'  # Default
            
            # Validate subspecialty if provided
            if classification.get('subspecialty') and classification['subspecialty'] != 'null':
                available_subspecialties = MEDICAL_SPECIALTIES[classification['specialty']]
                if classification['subspecialty'] not in available_subspecialties:
                    logger.warning(f"Invalid subspecialty: {classification['subspecialty']}")
                    classification['subspecialty'] = None
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