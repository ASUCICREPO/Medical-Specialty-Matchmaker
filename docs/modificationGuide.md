# Project Modification Guide

This guide is for developers who want to extend, customize, or modify the Medical Specialty Matchmaker.

---

## Introduction

This document provides guidance on how to modify and extend the Medical Specialty Matchmaker. Whether you want to add new features, change existing behavior, or customize the application for your needs, this guide will help you understand the codebase and make changes effectively.

---

## Table of Contents

- [Project Structure Overview](#project-structure-overview)
- [Frontend Modifications](#frontend-modifications)
- [Backend Modifications](#backend-modifications)
- [Adding New Features](#adding-new-features)
- [Changing AI/ML Models](#changing-aiml-models)
- [Database Modifications](#database-modifications)
- [Best Practices](#best-practices)

---

## Project Structure Overview

```
├── backend/
│   ├── bin/
│   │   └── backend.ts                    # CDK app entry point
│   ├── lib/
│   │   └── backend-stack.ts              # Infrastructure definitions (main stack)
│   ├── lambda/
│   │   ├── chatbot_orchestrator.py       # Chatbot Lambda handler
│   │   └── data_handler.py               # Data management Lambda handler
│   ├── test/
│   │   └── backend.test.ts               # Stack tests
│   ├── cdk.json                          # CDK configuration
│   └── package.json
├── frontend/
│   ├── app/                              # Next.js App Router
│   │   ├── components/                   # React components
│   │   ├── api/                          # API routes
│   │   ├── page.tsx                      # Main chat page
│   │   ├── layout.tsx                    # Root layout
│   │   └── globals.css                   # Global styles
│   ├── public/                           # Static assets
│   ├── .env                              # Environment variables (generated)
│   └── package.json
├── docs/                                 # Documentation
│   ├── APIDoc.md
│   ├── architectureDeepDive.md
│   ├── modificationGuide.md
│   └── userGuide.md
├── deploy.sh                             # Deployment script
├── destroy.sh                            # Resource cleanup script
└── README.md
```

---

## Frontend Modifications

### Changing the UI Theme

**Location**: `frontend/app/globals.css`

The theme uses Tailwind CSS with custom colors. To modify the theme:

1. Update color values in `globals.css`
2. Modify Tailwind config in `tailwind.config.ts` if using custom color classes
3. Update component styles that use inline styles

**Example**:
```css
/* frontend/app/globals.css */
:root {
  --primary-color: #2563eb; /* Change primary color */
  --secondary-color: #64748b;
  --accent-color: #10b981;
}
```

### Adding New Pages

**Location**: `frontend/app/`

1. Create a new directory under `frontend/app/` (e.g., `about/`)
2. Add a `page.tsx` file with your page component
3. Use Next.js App Router conventions for routing
4. Add navigation links in the header or footer if needed

**Example**:
```typescript
// frontend/app/about/page.tsx
export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">About Medical Specialty Matchmaker</h1>
      <p>Connecting healthcare professionals worldwide...</p>
    </div>
  );
}
```

### Modifying Components

**Location**: `frontend/app/components/`

Key components to modify:
- Chat interface components
- Form components
- Layout components

To modify a component:
1. Edit the corresponding file in `frontend/app/components/`
2. Components use React 19 with TypeScript
3. Test changes locally with `npm run dev`

**Example**:
```typescript
// frontend/app/components/ChatMessage.tsx
interface ChatMessageProps {
  message: string;
  sender: 'user' | 'bot';
  timestamp?: string;
}

export function ChatMessage({ message, sender, timestamp }: ChatMessageProps) {
  return (
    <div className={`message ${sender}`}>
      <p>{message}</p>
      {timestamp && <span className="timestamp">{timestamp}</span>}
    </div>
  );
}
```

### Adding API Integration

**Location**: `frontend/app/api/` or component files

To add new API calls:

1. Create API utility functions
2. Use environment variables for endpoints
3. Handle errors appropriately

**Example**:
```typescript
// frontend/app/lib/api.ts
export async function sendChatMessage(message: string, history: any[]) {
  const response = await fetch(process.env.CHAT_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'chat',
      data: { message, conversationHistory: history }
    })
  });
  
  if (!response.ok) {
    throw new Error('Failed to send message');
  }
  
  return response.json();
}
```

---

## Backend Modifications

### Adding New Lambda Functions

**Location**: `backend/lambda/`

1. Create a new Python file in `backend/lambda/` (e.g., `new_handler.py`)
2. Implement the `lambda_handler` function
3. Add the Lambda to the CDK stack in `backend/lib/backend-stack.ts`
4. Add API Gateway integration if needed

**Example**:
```python
# backend/lambda/new_handler.py
import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    """
    New Lambda handler
    """
    try:
        logger.info(f"Received event: {json.dumps(event)}")
        
        body = json.loads(event.get('body', '{}'))
        
        # Your logic here
        result = process_request(body)
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(result)
        }
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

def process_request(data):
    # Implementation
    return {'success': True}
```

### Modifying the CDK Stack

**Location**: `backend/lib/backend-stack.ts`

The main stack defines all AWS resources. To add a new Lambda:

1. Define the Lambda function with appropriate configuration
2. Add environment variables if needed
3. Grant IAM permissions for required AWS services
4. Add API Gateway integration if exposing an endpoint

**Example**:
```typescript
// In backend-stack.ts
const newHandlerFn = new lambda.Function(this, 'NewHandlerFn', {
  runtime: lambda.Runtime.PYTHON_3_11,
  handler: 'new_handler.lambda_handler',
  code: lambda.Code.fromAsset('lambda'),
  environment: {
    TABLE_NAME: medicalRequestsTable.tableName,
  },
  timeout: cdk.Duration.seconds(30),
  memorySize: 256,
});

// Grant permissions
medicalRequestsTable.grantReadWriteData(newHandlerFn);

// Add API Gateway endpoint
const newResource = chatbotApi.root.addResource('new-endpoint');
newResource.addMethod('POST', new apigateway.LambdaIntegration(newHandlerFn));

// Output the endpoint
new cdk.CfnOutput(this, 'NewEndpoint', {
  value: `${chatbotApi.url}new-endpoint`,
  description: 'New Handler Endpoint',
});
```

### Adding New API Endpoints

1. Define the Lambda function (see above)
2. Add API Gateway resource and method in the stack
3. Configure CORS if needed
4. Update `docs/APIDoc.md` with the new endpoint documentation

**Example**:
```typescript
// Add resource with CORS
const newResource = chatbotApi.root.addResource('new-endpoint');

// Add OPTIONS method for CORS preflight
newResource.addMethod('OPTIONS', new apigateway.MockIntegration({
  integrationResponses: [{
    statusCode: '200',
    responseParameters: {
      'method.response.header.Access-Control-Allow-Headers': "'Content-Type'",
      'method.response.header.Access-Control-Allow-Methods': "'POST,OPTIONS'",
      'method.response.header.Access-Control-Allow-Origin': "'*'",
    },
  }],
  passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
  requestTemplates: {
    'application/json': '{"statusCode": 200}',
  },
}), {
  methodResponses: [{
    statusCode: '200',
    responseParameters: {
      'method.response.header.Access-Control-Allow-Headers': true,
      'method.response.header.Access-Control-Allow-Methods': true,
      'method.response.header.Access-Control-Allow-Origin': true,
    },
  }],
});

// Add POST method
newResource.addMethod('POST', new apigateway.LambdaIntegration(newHandlerFn));
```

---

## Adding New Features

### Feature: Adding Multi-Language Support

**Files to modify**:
- `frontend/app/components/LanguageSwitcher.tsx` (create new)
- `frontend/app/layout.tsx`
- `backend/lambda/chatbot_orchestrator.py`

**Steps**:

1. **Create Language Switcher Component**:
```typescript
// frontend/app/components/LanguageSwitcher.tsx
'use client';

import { useState } from 'react';

export function LanguageSwitcher() {
  const [language, setLanguage] = useState('en');
  
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
  ];
  
  return (
    <select 
      value={language} 
      onChange={(e) => setLanguage(e.target.value)}
      className="px-3 py-2 border rounded"
    >
      {languages.map(lang => (
        <option key={lang.code} value={lang.code}>
          {lang.name}
        </option>
      ))}
    </select>
  );
}
```

2. **Update Backend to Handle Language**:
```python
# In chatbot_orchestrator.py
def handle_chat_conversation(data: Dict, context) -> Dict:
    message = data.get('message', '')
    language = data.get('language', 'en')  # Add language parameter
    
    # Use language in prompts
    system_prompt = get_system_prompt(language)
    # ... rest of implementation
```

### Feature: Adding Request Status Tracking

**Files to modify**:
- `backend/lambda/data_handler.py`
- `backend/lib/backend-stack.ts` (add GSI to DynamoDB)
- `frontend/app/components/RequestStatus.tsx` (create new)

**Steps**:

1. **Add Status Field to DynamoDB**:
```python
# In data_handler.py
item = {
    'id': request_id,
    'status': 'pending',  # Add status field
    'doctorName': data.get('doctorName', ''),
    # ... other fields
}
```

2. **Add GSI for Status Queries**:
```typescript
// In backend-stack.ts
medicalRequestsTable.addGlobalSecondaryIndex({
  indexName: 'status-index',
  partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
  sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
});
```

3. **Add Status Update Function**:
```python
# In data_handler.py
def handle_update_status(data: dict) -> dict:
    request_id = data.get('id')
    new_status = data.get('status')
    
    table.update_item(
        Key={'id': request_id},
        UpdateExpression='SET #status = :status, updatedAt = :updated',
        ExpressionAttributeNames={'#status': 'status'},
        ExpressionAttributeValues={
            ':status': new_status,
            ':updated': datetime.utcnow().isoformat()
        }
    )
    
    return {'success': True, 'status': new_status}
```

### Feature: Adding Email Notifications

**Files to modify**:
- `backend/lib/backend-stack.ts` (add SES permissions)
- `backend/lambda/notification_handler.py` (create new)

**Steps**:

1. **Create Notification Lambda**:
```python
# backend/lambda/notification_handler.py
import boto3
import json

ses = boto3.client('ses')

def lambda_handler(event, context):
    """Send email notification for new requests"""
    try:
        record = json.loads(event['Records'][0]['body'])
        
        response = ses.send_email(
            Source='noreply@yourdomain.com',
            Destination={'ToAddresses': ['admin@yourdomain.com']},
            Message={
                'Subject': {'Data': 'New Medical Request'},
                'Body': {
                    'Text': {'Data': f"New request: {record['id']}"}
                }
            }
        )
        
        return {'statusCode': 200}
    except Exception as e:
        print(f"Error: {str(e)}")
        return {'statusCode': 500}
```

2. **Add SES Permissions in CDK**:
```typescript
// In backend-stack.ts
notificationFn.addToRolePolicy(
  new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    actions: ['ses:SendEmail', 'ses:SendRawEmail'],
    resources: ['*'],
  })
);
```

---

## Changing AI/ML Models

### Switching Bedrock Models

**Location**: `backend/lambda/chatbot_orchestrator.py`

The system uses two models:
- **Claude 3.5 Haiku** for conversational chat
- **Amazon Nova 2 Lite** for classification

To change models:

1. **Update Model IDs**:
```python
# In chatbot_orchestrator.py

# For chat (line ~650)
def call_bedrock_for_chat(conversation_context: str) -> str:
    response = bedrock.invoke_model(
        modelId='anthropic.claude-3-opus-20240229-v1:0',  # Change to Opus
        # ... rest of config
    )

# For classification (line ~750)
def classify_with_bedrock(symptoms: str, age_group: str, urgency: str) -> Dict:
    response = bedrock.invoke_model(
        modelId='anthropic.claude-3-sonnet-20240229-v1:0',  # Change to Sonnet
        # ... rest of config
    )
```

2. **Update IAM Permissions** (if using different model):
```typescript
// In backend-stack.ts
chatbotOrchestratorFn.addToRolePolicy(
  new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    actions: ['bedrock:InvokeModel'],
    resources: [
      'arn:aws:bedrock:*::foundation-model/anthropic.claude-3-opus-*',
    ],
  })
);
```

3. **Verify Model Availability**:
```bash
# Check available models in your region
aws bedrock list-foundation-models --region us-west-2
```

### Modifying Prompts

**Location**: `backend/lambda/chatbot_orchestrator.py`

Prompts significantly affect response quality. To modify:

1. **Chat System Prompt** (line ~600):
```python
def build_conversation_context(conversation_history: List[Dict], current_message: str) -> str:
    system_prompt = f"""You are a medical triage assistant helping doctors connect with volunteer specialists.

Your goals:
1. Gather key information through systematic questioning
2. Ask 2-3 targeted follow-up questions
3. Be thorough and methodical

CUSTOM INSTRUCTIONS:
- Focus on [your specific requirements]
- Prioritize [your priorities]
- Consider [your considerations]

Available Medical Specialties and Subspecialties:
{specialty_list_str}
"""
```

2. **Classification Prompt** (line ~750):
```python
prompt = f"""You are a medical triage AI expert.

CUSTOM CLASSIFICATION RULES:
- [Your custom rules]
- [Your specialty preferences]
- [Your confidence thresholds]

Patient Information:
- Age Group: {age_group}
- Symptoms: {symptoms}
- Urgency: {urgency}
"""
```

### Adjusting Model Parameters

**Location**: `backend/lambda/chatbot_orchestrator.py`

Key parameters to tune:

1. **Temperature** (creativity vs consistency):
```python
# For chat (more creative)
payload = {
    "temperature": 0.7,  # Increase for more creative responses
    "top_p": 0.95,
}

# For classification (more deterministic)
payload = {
    "temperature": 0.05,  # Decrease for more consistent classification
    "top_p": 0.85,
}
```

2. **Max Tokens** (response length):
```python
payload = {
    "max_tokens": 3000,  # Increase for longer responses
}
```

3. **Confidence Threshold** (line ~450):
```python
# Adjust classification threshold
can_classify = (
    extraction_and_classification.get('canClassify', False) and 
    extraction_and_classification.get('confidence', 0) >= 0.85  # Change from 0.70
)
```

---

## Database Modifications

### Adding New Tables

**Location**: `backend/lib/backend-stack.ts`

To add a new DynamoDB table:

```typescript
// In backend-stack.ts
const specialistsTable = new dynamodb.Table(this, 'SpecialistsTable', {
  tableName: 'medical-specialists',
  partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
  sortKey: { name: 'specialty', type: dynamodb.AttributeType.STRING },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
});

// Add GSI for querying by specialty
specialistsTable.addGlobalSecondaryIndex({
  indexName: 'specialty-index',
  partitionKey: { name: 'specialty', type: dynamodb.AttributeType.STRING },
  sortKey: { name: 'availability', type: dynamodb.AttributeType.STRING },
});

// Grant permissions to Lambda
specialistsTable.grantReadWriteData(chatbotOrchestratorFn);

// Add environment variable
chatbotOrchestratorFn.addEnvironment('SPECIALISTS_TABLE', specialistsTable.tableName);
```

### Modifying Existing Schema

DynamoDB is schema-less, but you should:

1. **Add New Attributes**:
```python
# In data_handler.py
item = {
    'id': request_id,
    'doctorName': data.get('doctorName', ''),
    'newField': data.get('newField', ''),  # Add new field
    # ... existing fields
}
```

2. **Add GSI for New Query Patterns**:
```typescript
// In backend-stack.ts
medicalRequestsTable.addGlobalSecondaryIndex({
  indexName: 'urgency-index',
  partitionKey: { name: 'urgency', type: dynamodb.AttributeType.STRING },
  sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
});
```

**Note**: You can only add one GSI per deployment. Deploy GSIs separately if adding multiple.

### Adding Data Validation

**Location**: `backend/lambda/data_handler.py`

Add validation before storing data:

```python
def validate_request_data(data: dict) -> tuple[bool, str]:
    """Validate request data before storage"""
    required_fields = ['doctorName', 'email', 'ageGroup', 'symptoms']
    
    for field in required_fields:
        if not data.get(field):
            return False, f"Missing required field: {field}"
    
    # Validate email format
    email = data.get('email', '')
    if '@' not in email:
        return False, "Invalid email format"
    
    # Validate age group
    if data.get('ageGroup') not in ['Adult', 'Child']:
        return False, "Invalid age group"
    
    return True, ""

def handle_submit_request(data: dict) -> dict:
    # Validate data
    is_valid, error_message = validate_request_data(data)
    if not is_valid:
        raise ValueError(error_message)
    
    # ... rest of implementation
```

---

## Best Practices

### 1. Test Locally Before Deploying

```bash
# Synthesize CDK to validate
cd backend
npm run build
npx cdk synth

# Test frontend locally
cd frontend
npm run dev
```

### 2. Use Environment Variables

```typescript
// In backend-stack.ts
chatbotOrchestratorFn.addEnvironment('CONFIDENCE_THRESHOLD', '0.90');
chatbotOrchestratorFn.addEnvironment('MAX_QUESTIONS', '5');
```

```python
# In Lambda
import os

CONFIDENCE_THRESHOLD = float(os.environ.get('CONFIDENCE_THRESHOLD', '0.90'))
MAX_QUESTIONS = int(os.environ.get('MAX_QUESTIONS', '5'))
```

### 3. Follow Existing Patterns

- Maintain consistent file structure
- Use TypeScript for CDK
- Use Python 3.11 for Lambda
- Follow naming conventions

### 4. Update Documentation

When making changes:
- Update `docs/APIDoc.md` for API changes
- Update `docs/architectureDeepDive.md` for architecture changes
- Update `README.md` for user-facing changes
- Add comments in code for complex logic

### 5. Version Control

```bash
# Make small, focused commits
git add backend/lambda/chatbot_orchestrator.py
git commit -m "feat: add multi-language support to chatbot"

# Use conventional commit messages
# feat: new feature
# fix: bug fix
# docs: documentation changes
# refactor: code refactoring
# test: adding tests
```

### 6. Error Handling

Always include proper error handling:

```python
def lambda_handler(event, context):
    try:
        # Your logic
        result = process_request(event)
        return create_response(200, result)
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        return create_response(400, {'error': str(e)})
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return create_response(500, {'error': 'Internal server error'})
```

### 7. Logging

Use structured logging:

```python
import logging
import json

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Log with context
logger.info(json.dumps({
    'event': 'classification_complete',
    'request_id': request_id,
    'specialty': classification['specialty'],
    'confidence': classification['confidence']
}))
```

### 8. Security

- Never commit secrets or API keys
- Use AWS Secrets Manager for sensitive data
- Validate all user inputs
- Use least-privilege IAM permissions
- Enable CloudWatch logging for audit trails

### 9. Performance

- Optimize Lambda memory for performance
- Use DynamoDB on-demand billing for variable workloads
- Enable API Gateway caching for frequently accessed endpoints
- Monitor CloudWatch metrics for bottlenecks

### 10. Cost Optimization

- Use appropriate Lambda memory (don't over-provision)
- Set reasonable Lambda timeouts
- Use DynamoDB on-demand for unpredictable workloads
- Monitor AWS Cost Explorer regularly

---

## Testing Your Changes

### Local Testing

```bash
# Frontend
cd frontend
npm run dev
# Access at http://localhost:3000

# Backend (synthesize CDK)
cd backend
npm install
npm run build
npx cdk synth
# Review the CloudFormation template
```

### Deployment Testing

```bash
# Deploy backend changes
cd backend
npm run build
npx cdk deploy --require-approval never

# For faster Lambda-only updates (hotswap)
npx cdk deploy --hotswap

# Deploy everything with script
cd ..
bash ./deploy.sh
```

### Testing Checklist

- [ ] CDK synth completes without errors
- [ ] Lambda functions deploy successfully
- [ ] API Gateway endpoints are accessible
- [ ] Frontend can connect to API
- [ ] Chat functionality works end-to-end
- [ ] Classification produces expected results
- [ ] Data is stored correctly in DynamoDB
- [ ] CloudWatch logs show no errors
- [ ] No security vulnerabilities introduced

### Manual Testing

1. **Test Chat Flow**:
   - Start a new conversation
   - Provide patient information step-by-step
   - Verify AI asks appropriate follow-up questions
   - Confirm classification appears when ready
   - Check confidence scores

2. **Test Direct Classification**:
   - Submit complete patient information
   - Verify immediate classification
   - Check specialty and subspecialty accuracy

3. **Test Data Storage**:
   - Submit a request
   - Verify it appears in DynamoDB
   - Test retrieval by ID
   - Test listing with filters

4. **Test Error Handling**:
   - Submit invalid data
   - Test with missing required fields
   - Verify appropriate error messages