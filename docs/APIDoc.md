# API Documentation

## Overview

The Medical Specialty Matchmaker API provides endpoints for intelligent medical case triage, specialty classification, and data management. The API is built on AWS API Gateway connecting to Lambda backend functions.

## Base URL

```
https://[API_ID].execute-api.[REGION].amazonaws.com/prod/
```

## Authentication

No authentication required for current endpoints.

## 1) Chatbot Endpoints

Endpoints for conversational medical triage, gathering patient information, and intelligent case classification.

### POST /chatbot — Process Chat Message

Process a doctor's message about a patient case, gather information through conversational AI, and automatically classify when sufficient information is collected.

#### **Request body**:
```json
{
  "action": "chat",
  "data": {
    "message": "string - The doctor's message or patient information",
    "conversationHistory": [
      {
        "sender": "user | bot",
        "text": "string - Message content"
      }
    ]
  }
}
```

- **Example request**:
```json
{
  "action": "chat",
  "data": {
    "message": "My patient has a shattered hip from falling down the stairs",
    "conversationHistory": [
      {
        "sender": "bot",
        "text": "Is the patient a child or an adult?"
      },
      {
        "sender": "user",
        "text": "Child (0-17 years)"
      },
      {
        "sender": "bot",
        "text": "Please describe your patient's condition, including their main symptoms and any relevant medical history."
      }
    ]
  }
}
```

#### **Response**:
```json
{
  "response": "string - AI-generated conversational response",
  "source": "bedrock",
  "canClassify": "boolean - Whether enough information has been gathered for classification",
  "extractedData": {
    "ageGroup": "Adult | Child | null",
    "symptoms": "string - Extracted symptoms with age context | null",
    "urgency": "low | medium | high | null",
    "confidence": "number - Confidence score (0.0-1.0)"
  },
  "classification": {
    "specialty": "string - Primary medical specialty",
    "subspecialty": "string - Specific subspecialty | null",
    "reasoning": "string - Explanation for classification",
    "confidence": "number - Classification confidence (0.7-1.0)",
    "urgency_assessment": "low | medium | high",
    "source": "bedrock"
  },
  "needsMoreInfo": "boolean (optional) - True if confidence is below threshold",
  "currentConfidence": "number (optional) - Current confidence level",
  "confidenceTarget": "number (optional) - Target confidence threshold (0.70)"
}
```

- **Example response (gathering information)**:
```json
{
  "response": "I understand your patient is a child who suffered a shattered hip from a fall. To help match you with the right specialist, I need a few more details:\n\n1. How old is the child?\n2. Are there any other injuries besides the hip?\n3. Has the child had any surgery yet, or are you seeking initial consultation?",
  "source": "bedrock",
  "canClassify": false,
  "extractedData": {
    "ageGroup": "Child",
    "symptoms": "Child with shattered hip from fall down stairs",
    "urgency": "high",
    "confidence": 0.65
  },
  "needsMoreInfo": true,
  "currentConfidence": 0.65,
  "confidenceTarget": 0.70
}
```

- **Example response (ready to classify)**:
```json
{
  "response": "Based on the information provided, I recommend connecting with a pediatric orthopedic surgeon who specializes in traumatic injuries in children.",
  "source": "bedrock",
  "canClassify": true,
  "extractedData": {
    "ageGroup": "Child",
    "symptoms": "Child (8 years old) with shattered hip from fall, severe pain, unable to bear weight, no other injuries",
    "urgency": "high",
    "confidence": 0.95
  },
  "classification": {
    "specialty": "Orthopaedic Surgeon",
    "subspecialty": "Pediatric Orthopaedic Surgery",
    "reasoning": "Child with traumatic hip fracture requires specialized pediatric orthopedic care for proper bone healing and growth plate management",
    "confidence": 0.95,
    "urgency_assessment": "high",
    "source": "bedrock"
  }
}
```

### POST /chatbot — Direct Classification

Directly classify a medical case when all information is already available (bypasses conversational flow).

#### **Request body**:
```json
{
  "action": "classify",
  "data": {
    "symptoms": "string - Complete symptom description",
    "ageGroup": "Adult | Child",
    "urgency": "low | medium | high"
  }
}
```

- **Example request**:
```json
{
  "action": "classify",
  "data": {
    "symptoms": "8-year-old child with shattered hip from fall down stairs, severe pain, unable to bear weight, no other injuries",
    "ageGroup": "Child",
    "urgency": "high"
  }
}
```

#### **Response**:
```json
{
  "specialty": "string - Primary medical specialty",
  "subspecialty": "string - Specific subspecialty | null",
  "reasoning": "string - Explanation for classification",
  "confidence": "number - Classification confidence (0.7-1.0)",
  "urgency_assessment": "low | medium | high",
  "source": "bedrock"
}
```

- **Example response**:
```json
{
  "specialty": "Orthopaedic Surgeon",
  "subspecialty": "Pediatric Orthopaedic Surgery",
  "reasoning": "Child with traumatic hip fracture requires specialized pediatric orthopedic care for proper bone healing and growth plate management",
  "confidence": 0.95,
  "urgency_assessment": "high",
  "source": "bedrock"
}
```

## 2) Data Management Endpoints

Endpoints for storing and retrieving medical request data in DynamoDB.

### POST /data — Submit Medical Request

Store a complete medical request with classification results in DynamoDB.

#### **Request body**:
```json
{
  "action": "submit",
  "data": {
    "doctorName": "string - Doctor's name",
    "hospital": "string - Hospital or clinic name",
    "location": "string - Geographic location",
    "email": "string - Contact email",
    "ageGroup": "Adult | Child",
    "symptoms": "string - Patient symptoms description",
    "urgency": "low | medium | high",
    "additionalInfo": "string (optional) - Additional notes",
    "specialty": "string - Classified primary specialty",
    "subspecialty": "string - Classified subspecialty",
    "reasoning": "string - Classification reasoning",
    "confidence": "number - Classification confidence (0.0-1.0)"
  }
}
```

- **Example request**:
```json
{
  "action": "submit",
  "data": {
    "doctorName": "Dr. Sarah Johnson",
    "hospital": "Community Health Clinic",
    "location": "Rural Kenya",
    "email": "dr.johnson@clinic.org",
    "ageGroup": "Child",
    "symptoms": "8-year-old child with shattered hip from fall down stairs, severe pain, unable to bear weight",
    "urgency": "high",
    "additionalInfo": "Patient needs urgent consultation for surgical planning",
    "specialty": "Orthopaedic Surgeon",
    "subspecialty": "Pediatric Orthopaedic Surgery",
    "reasoning": "Child with traumatic hip fracture requires specialized pediatric orthopedic care",
    "confidence": 0.95
  }
}
```

#### **Response**:
```json
{
  "success": true,
  "id": "string - Unique request ID (REQ-YYYYMMDDHHMMSS-microseconds)",
  "message": "Request submitted successfully",
  "timestamp": "string (ISO 8601)"
}
```

- **Example response**:
```json
{
  "success": true,
  "id": "REQ-20260115123045-789456",
  "message": "Request submitted successfully",
  "timestamp": "2026-01-15T12:30:45.789456Z"
}
```

### POST /data — Get Medical Request

Retrieve a specific medical request by ID.

#### **Request body**:
```json
{
  "action": "get",
  "data": {
    "id": "string - Request ID"
  }
}
```

- **Example request**:
```json
{
  "action": "get",
  "data": {
    "id": "REQ-20260115123045-789456"
  }
}
```

#### **Response**:
```json
{
  "success": true,
  "request": {
    "id": "string",
    "doctorName": "string",
    "hospital": "string",
    "location": "string",
    "email": "string",
    "ageGroup": "Adult | Child",
    "symptoms": "string",
    "urgency": "low | medium | high",
    "additionalInfo": "string",
    "specialty": "string",
    "subspecialty": "string",
    "reasoning": "string",
    "confidence": "number",
    "timestamp": "string (ISO 8601)",
    "createdAt": "string (ISO 8601)",
    "updatedAt": "string (ISO 8601)"
  }
}
```

### POST /data — List Medical Requests

List medical requests with optional filtering.

#### **Request body**:
```json
{
  "action": "list",
  "data": {
    "status": "string (optional) - Filter by status",
    "specialty": "string (optional) - Filter by specialty",
    "limit": "number (optional) - Maximum results (default: 50, max: 100)"
  }
}
```

- **Example request**:
```json
{
  "action": "list",
  "data": {
    "specialty": "Orthopaedic Surgeon",
    "limit": 20
  }
}
```

#### **Response**:
```json
{
  "success": true,
  "requests": [
    {
      "id": "string",
      "doctorName": "string",
      "hospital": "string",
      "location": "string",
      "ageGroup": "Adult | Child",
      "symptoms": "string",
      "specialty": "string",
      "subspecialty": "string",
      "urgency": "low | medium | high",
      "confidence": "number",
      "timestamp": "string (ISO 8601)"
    }
  ],
  "count": "number - Number of requests returned"
}
```

## Medical Specialties

The system supports classification across 30+ primary specialties and 200+ subspecialties found [here](https://docs.google.com/spreadsheets/d/1P0gvebpwdb_vR7vhrEwX7baxUqB20pbq/edit?usp=sharing&ouid=116325285806947898650&rtpof=true&sd=true).

## Error Codes

| Code | Name | Description |
|------|------|-------------|
| `400` | Bad Request | Invalid request body, missing required fields, or invalid parameter values |
| `404` | Not Found | Endpoint not found or resource does not exist |
| `500` | Internal Server Error | Server error processing the request (check CloudWatch logs) |
| `503` | Service Unavailable | AWS Bedrock or DynamoDB service unavailable |
| `504` | Gateway Timeout | Request exceeded 29-second API Gateway timeout (Lambda may still be processing) |


## Rate Limits

- **API Gateway**: 10,000 requests per second (default)
- **Lambda Concurrency**: 1,000 concurrent executions (default)
- **DynamoDB**: On-demand billing mode (no hard limits)

For production deployments, consider implementing:
- API key authentication
- Request throttling per client
- Usage plans with quotas

## AI Models Used

The system uses two AWS Bedrock models:

1. **Claude 3.5 Haiku** (`us.anthropic.claude-3-5-haiku-20241022-v1:0`)
   - Used for: Conversational chat responses
   - Max tokens: 2000
   - Temperature: 0.5
   - Top P: 0.999

2. **Amazon Nova 2 Lite** (`us.amazon.nova-2-lite-v1:0`)
   - Used for: Data extraction and classification
   - Max tokens: 2000
   - Temperature: 0.1
   - Top P: 0.9

## Classification Confidence

The system uses a **90% confidence threshold** for subspecialty classification:

- **< 70%**: System continues gathering information through conversation
- **70-89%**: System may classify but indicates lower confidence
- **≥ 90%**: High confidence classification, ready for specialist matching

## CORS Configuration

All endpoints support CORS with the following headers:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: Content-Type
Access-Control-Allow-Methods: OPTIONS,POST,GET
```

For production, restrict `Access-Control-Allow-Origin` to your frontend domain.

## CloudWatch Logs

- **Chatbot Lambda**: `/aws/lambda/MSMBackendStack-ChatbotOrchestratorFn`
- **Data Handler Lambda**: `/aws/lambda/MSMBackendStack-DataHandlerFn`

## Support

For API issues:
1. Check CloudWatch logs for detailed error messages
2. Verify request format matches documentation
3. Ensure AWS Bedrock models are available in your region
