# Medical Specialty Matchmaker APIs

This document provides comprehensive API documentation for the Medical Specialty Matchmaker system.

---

## Overview

The Medical Specialty Matchmaker API provides endpoints for intelligent medical case triage, specialty classification, and data management. The API is built on AWS API Gateway with Lambda backend functions, supporting CORS for web applications and AI-powered classification using AWS Bedrock.

---

## Base URL

```
https://[API_ID].execute-api.[REGION].amazonaws.com/prod/
```

**Example:**
```
https://e4neim8r21.execute-api.us-west-2.amazonaws.com/prod/
```

> **Note**: Replace `[API_ID]` and `[REGION]` with your actual API Gateway endpoint after deployment. The stage is always `prod`.

---

## Authentication

All endpoints are currently public and do not require authentication. Future versions may implement Cognito authentication for admin endpoints.

### Headers Required

| Header | Description | Required |
|--------|-------------|----------|
| `Content-Type` | `application/json` | Yes (POST requests) |
| `Origin` | Origin domain for CORS | Yes (browser requests) |

---

## 1) Chatbot Endpoints

Endpoints for conversational medical triage, gathering patient information, and intelligent case classification.

---

### POST /chatbot — Process Chat Message

- **Purpose**: Process a doctor's message about a patient case, gather information through conversational AI, and automatically classify when sufficient information is collected.

- **Authentication**: Not required

- **Request body**:
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

- **Response**:
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

- **Status codes**:
  - `200 OK` - Message processed successfully
  - `400 Bad Request` - Invalid request body or missing required fields
  - `500 Internal Server Error` - Server error processing the message

---

### POST /chatbot — Direct Classification

- **Purpose**: Directly classify a medical case when all information is already available (bypasses conversational flow).

- **Authentication**: Not required

- **Request body**:
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

- **Response**:
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

- **Status codes**:
  - `200 OK` - Classification successful
  - `400 Bad Request` - Invalid request body or missing required fields
  - `500 Internal Server Error` - Classification failed

---

## 2) Data Management Endpoints

Endpoints for storing and retrieving medical request data in DynamoDB.

---

### POST /data — Submit Medical Request

- **Purpose**: Store a complete medical request with classification results in DynamoDB.

- **Authentication**: Not required

- **Request body**:
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

- **Response**:
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

- **Status codes**:
  - `200 OK` - Request stored successfully
  - `400 Bad Request` - Invalid request body or missing required fields
  - `500 Internal Server Error` - Database error

---

### POST /data — Get Medical Request

- **Purpose**: Retrieve a specific medical request by ID.

- **Authentication**: Not required

- **Request body**:
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

- **Response**:
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

- **Status codes**:
  - `200 OK` - Request retrieved successfully
  - `400 Bad Request` - Missing request ID
  - `404 Not Found` - Request not found
  - `500 Internal Server Error` - Database error

---

### POST /data — List Medical Requests

- **Purpose**: List medical requests with optional filtering.

- **Authentication**: Not required

- **Request body**:
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

- **Response**:
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

- **Status codes**:
  - `200 OK` - Requests retrieved successfully
  - `400 Bad Request` - Invalid filter parameters
  - `500 Internal Server Error` - Database error

---

## Medical Specialties

The system supports classification across 30+ primary specialties and 200+ subspecialties:

### Primary Specialties

- Allergy and Immunology
- Anesthesiologist
- Colon and Rectal Surgery
- Dermatologist
- Emergency Medicine Physician
- Family Physician
- Internist
- Medical Geneticist
- Neurological Surgeon
- Nuclear Medicine Specialist
- Obstetrician/Gynecologist
- Ophthalmologist
- Oral and Maxillofacial Surgeon
- Orthopaedic Surgeon
- Otolaryngologist–Head and Neck Surgeon
- Pathologist
- Pediatrician
- Physiatrist
- Plastic Surgeon
- Preventive Medicine Physician
- Neurologist
- Psychiatrist
- Diagnostic Radiologist
- Interventional and Diagnostic Radiologist
- Radiation Oncologist
- Radiology (IV. Medical Physics)
- Surgeon
- Thoracic/Cardiac Surgeon
- Urologist

### Pediatric Specialties

For child patients (age group: "Child"), the system automatically routes to pediatric subspecialties:

- Pediatric Cardiology
- Pediatric Critical Care Medicine
- Pediatric Emergency Medicine
- Pediatric Endocrinology
- Pediatric Gastroenterology
- Pediatric Hematology–Oncology
- Pediatric Infectious Diseases
- Pediatric Nephrology
- Pediatric Pulmonology
- Pediatric Rheumatology
- Pediatric Surgery
- And many more...

---

## Response Format

All API responses follow this general structure:

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data fields
  }
}
```

### Error Response
```json
{
  "error": "string - Error type",
  "message": "string - Detailed error message",
  "details": "string (optional) - Additional error context"
}
```

---

## Error Codes

| Code | Name | Description |
|------|------|-------------|
| `400` | Bad Request | Invalid request body, missing required fields, or invalid parameter values |
| `404` | Not Found | Endpoint not found or resource does not exist |
| `500` | Internal Server Error | Server error processing the request (check CloudWatch logs) |
| `503` | Service Unavailable | AWS Bedrock or DynamoDB service unavailable |
| `504` | Gateway Timeout | Request exceeded 29-second API Gateway timeout (Lambda may still be processing) |

---

## Rate Limits

- **API Gateway**: 10,000 requests per second (default)
- **Lambda Concurrency**: 1,000 concurrent executions (default)
- **DynamoDB**: On-demand billing mode (no hard limits)

For production deployments, consider implementing:
- API key authentication
- Request throttling per client
- Usage plans with quotas

---

## AI Models Used

The system uses two AWS Bedrock models:

1. **Claude 3.5 Haiku** (`us.anthropic.claude-3-5-haiku-20241022-v1:0`)
   - Used for: Conversational chat responses
   - Max tokens: 2000
   - Temperature: 0.5

2. **Amazon Nova 2 Lite** (`us.amazon.nova-2-lite-v1:0`)
   - Used for: Data extraction and classification
   - Max tokens: 2000
   - Temperature: 0.1

---

## Classification Confidence

The system uses a **90% confidence threshold** for subspecialty classification:

- **< 70%**: System continues gathering information through conversation
- **70-89%**: System may classify but indicates lower confidence
- **≥ 90%**: High confidence classification, ready for specialist matching

---

## CORS Configuration

All endpoints support CORS with the following headers:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: Content-Type
Access-Control-Allow-Methods: OPTIONS,POST,GET
```

For production, restrict `Access-Control-Allow-Origin` to your frontend domain.

---

## Monitoring and Logs

### CloudWatch Logs

- **Chatbot Lambda**: `/aws/lambda/MSMBackendStack-ChatbotOrchestratorFn`
- **Data Handler Lambda**: `/aws/lambda/MSMBackendStack-DataHandlerFn`

### Useful Log Queries

```bash
# Tail chatbot logs
aws logs tail /aws/lambda/MSMBackendStack-ChatbotOrchestratorFn --follow

# Filter for errors
aws logs filter-log-events \
  --log-group-name /aws/lambda/MSMBackendStack-ChatbotOrchestratorFn \
  --filter-pattern "ERROR"

# View classification results
aws logs filter-log-events \
  --log-group-name /aws/lambda/MSMBackendStack-ChatbotOrchestratorFn \
  --filter-pattern "Final classification"
```

---

## Example Workflows

### Workflow 1: Conversational Triage

1. **Initial message**: Doctor describes patient age group
2. **System response**: Asks for symptom details
3. **Follow-up messages**: System asks 2-3 targeted questions
4. **Classification**: Once confidence ≥ 90%, system provides specialty match
5. **Submission**: Frontend submits complete request to `/data`

### Workflow 2: Direct Classification

1. **Single request**: Doctor provides all information upfront
2. **Classification**: System immediately classifies with available data
3. **Submission**: Frontend submits complete request to `/data`

---

## Security Considerations

- **No PII**: System designed to avoid collecting patient names, dates of birth, or contact information
- **HTTPS Only**: All endpoints use TLS encryption
- **Input Validation**: All inputs validated before processing
- **Error Handling**: Sensitive error details not exposed to clients
- **Logging**: PII excluded from CloudWatch logs

---

## Future Enhancements

Planned API improvements:

- [ ] Cognito authentication for admin endpoints
- [ ] API key authentication for public endpoints
- [ ] Webhook notifications for new requests
- [ ] Real-time WebSocket support for chat
- [ ] Multi-language support in API responses
- [ ] Request status tracking and updates
- [ ] Specialist matching and notification system

---

## Support

For API issues:
1. Check CloudWatch logs for detailed error messages
2. Verify request format matches documentation
3. Ensure AWS Bedrock models are available in your region
4. Review [Troubleshooting Guide](../README.md#troubleshooting)
5. Open an issue on GitHub with request/response examples
