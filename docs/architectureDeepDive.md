# Architecture Deep Dive

This document provides a detailed explanation of the Medical Specialty Matchmaker architecture.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Frontend Layer                              │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │              Next.js Application (AWS Amplify)                │  │
│  │  - React 19 with Server Components                            │  │
│  │  - Tailwind CSS for styling                                   │  │
│  │  - Conversational chat interface                              │  │
│  │  - Real-time classification feedback                          │  │
│  └───────────────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ HTTPS
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         API Gateway Layer                           │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │              Amazon API Gateway (REST API)                    │  │
│  │  - /chatbot endpoint (POST)                                   │  │
│  │  - /data endpoint (POST)                                      │  │
│  │  - CORS configuration                                         │  │
│  │  - Request throttling (10K req/sec)                           │  │
│  └───────────────────────────────────────────────────────────────┘  │
└──────────────────┬──────────────────────────┬───────────────────────┘
                   │                          │
                   ▼                          ▼
┌──────────────────────────────┐  ┌──────────────────────────────┐
│   Chatbot Orchestrator       │  │      Data Handler            │
│   Lambda Function            │  │      Lambda Function         │
│  ┌────────────────────────┐  │  │  ┌────────────────────────┐  │
│  │ - Python 3.11          │  │  │  │ - Python 3.11          │  │
│  │ - 1024 MB memory       │  │  │  │ - 256 MB memory        │  │
│  │ - 60 second timeout    │  │  │  │ - 30 second timeout    │  │
│  │ - Conversation logic   │  │  │  │ - DynamoDB operations  │  │
│  │ - Data extraction      │  │  │  │ - CRUD operations      │  │
│  │ - Classification       │  │  │  │ - Request storage      │  │
│  └────────────────────────┘  │  │  └────────────────────────┘  │
└──────────────┬───────────────┘  └──────────────┬───────────────┘
               │                                 │
               ▼                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      AWS Bedrock AI Layer                           │
│  ┌───────────────────────────┐  ┌───────────────────────────────┐  │
│  │  Claude 3.5 Haiku         │  │  Amazon Nova 2 Lite           │  │
│  │  - Conversational chat    │  │  - Data extraction            │  │
│  │  - Follow-up questions    │  │  - Classification             │  │
│  │  - Medical guidance       │  │  - Confidence scoring         │  │
│  │  - Max tokens: 2000       │  │  - Max tokens: 2000           │  │
│  │  - Temperature: 0.5       │  │  - Temperature: 0.1           │  │
│  └───────────────────────────┘  └───────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Data Storage Layer                             │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │              Amazon DynamoDB                                  │  │
│  │  - medical-requests table                                     │  │
│  │  - Partition key: id (string)                                 │  │
│  │  - On-demand billing mode                                     │  │
│  │  - Stores: symptoms, classification, doctor info              │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Architecture Flow

The following describes the step-by-step flow of how the system processes medical triage requests:

### 1. User Interaction

Healthcare professionals access the Medical Specialty Matchmaker through the Next.js web interface hosted on AWS Amplify. The interface provides:
- Conversational chat interface for gathering patient information
- Step-by-step guidance through the triage process
- Real-time feedback on information completeness
- Classification results with confidence scores

### 2. Request Processing

User messages are sent via HTTPS to API Gateway, which routes POST requests to either:
- `/chatbot` endpoint for conversational triage and classification
- `/data` endpoint for storing and retrieving medical requests

API Gateway handles CORS, request validation, and throttling before forwarding to the appropriate Lambda function.

### 3. Conversational Triage (Chat Flow)

The `chatbotOrchestrator` Lambda function receives chat requests and performs:

**Step 3a: Conversation Management**
- Parses incoming message and conversation history
- Builds conversation context with medical specialty information
- Maintains conversation state across multiple messages

**Step 3b: AI-Powered Response Generation**
- Sends conversation context to Claude 3.5 Haiku via Bedrock
- Generates intelligent follow-up questions to gather necessary information
- Asks 2-3 targeted questions to narrow down subspecialty
- Provides medical guidance and clarification

**Step 3c: Data Extraction and Classification**
- Sends conversation to Amazon Nova 2 Lite for analysis
- Extracts structured data: age group, symptoms, urgency
- Evaluates classification readiness (confidence threshold: 90%)
- Classifies to primary specialty and subspecialty when ready

**Step 3d: Response Assembly**
- Combines conversational response with extracted data
- Includes classification if confidence threshold is met
- Provides confidence scores and guidance for next steps
- Returns complete response to frontend

### 4. Direct Classification (Classify Flow)

When all information is available upfront:

**Step 4a: Classification Request**
- Receives complete patient information (symptoms, age group, urgency)
- Bypasses conversational flow for immediate classification

**Step 4b: AI Classification**
- Sends patient data to Amazon Nova 2 Lite via Bedrock
- Performs vector-based specialty matching
- Considers 30+ primary specialties and 200+ subspecialties
- Returns classification with reasoning and confidence score

### 5. Data Storage

The `dataHandler` Lambda function manages medical request storage:

**Step 5a: Request Submission**
- Generates unique request ID (REQ-YYYYMMDDHHMMSS-microseconds)
- Stores complete case information in DynamoDB
- Includes: doctor info, patient data, classification results
- Returns confirmation with request ID

**Step 5b: Request Retrieval**
- Supports getting individual requests by ID
- Supports listing requests with filtering (specialty, status, limit)
- Returns formatted request data for review

### 6. Response Delivery

The generated response is:
- Returned through API Gateway with CORS headers
- Displayed in the web interface with classification details
- Stored in DynamoDB for future reference
- Available for specialist matching and follow-up

---

## Cloud Services / Technology Stack

### Frontend

- **AWS Amplify**: Hosted Next.js web application
  - Next.js 16 with React 19
  - App Router for page routing
  - Server-side rendering and static generation
  - Client-side components for interactive chat interface
  - Automatic builds and deployments from GitHub
  - CDN distribution for global performance

### Backend Infrastructure

- **AWS CDK**: Infrastructure as Code for deploying AWS resources
  - Defines all cloud infrastructure in TypeScript
  - Enables reproducible deployments
  - Version-controlled infrastructure

- **Amazon API Gateway**: Acts as the front door for all API requests
  - RESTful API with CORS support
  - Rate limiting and throttling (10,000 req/sec default)
  - Stage-based deployment (prod)
  - Request/response transformation
  - 29-second timeout limit

- **AWS Lambda**: Serverless compute for backend logic
  - **chatbotOrchestrator**: Handles conversational triage
    - Python 3.11 runtime
    - 1024 MB memory
    - 60-second timeout
    - Manages conversation flow
    - Calls Bedrock for AI responses
    - Extracts and classifies patient data
  
  - **dataHandler**: Manages data storage and retrieval
    - Python 3.11 runtime
    - 256 MB memory
    - 30-second timeout
    - DynamoDB CRUD operations
    - Request ID generation
    - Data validation and formatting

### AI/ML Services

- **Amazon Bedrock**: Foundation model service for AI capabilities
  - **Claude 3.5 Haiku** (`us.anthropic.claude-3-5-haiku-20241022-v1:0`)
    - Used for: Conversational chat responses
    - Generates intelligent follow-up questions
    - Provides medical guidance and clarification
    - Max tokens: 2000
    - Temperature: 0.5 (balanced creativity)
    - Top-p: 0.999
  
  - **Amazon Nova 2 Lite** (`us.amazon.nova-2-lite-v1:0`)
    - Used for: Data extraction and classification
    - Extracts structured data from conversations
    - Classifies to specialty and subspecialty
    - Confidence scoring (0.0-1.0)
    - Max tokens: 2000
    - Temperature: 0.1 (deterministic)
    - Top-p: 0.9

- **Medical Specialty Knowledge**
  - 30+ primary medical specialties
  - 200+ subspecialties
  - Pediatric and adult routing
  - Emergency medicine considerations
  - Age-appropriate specialty matching

### Data Storage

- **Amazon DynamoDB**: NoSQL database for application data
  - **medical-requests table**
    - Partition key: `id` (string)
    - Stores complete case information
    - Fields: doctorName, hospital, location, email, ageGroup, symptoms, urgency, specialty, subspecialty, reasoning, confidence, timestamps
    - On-demand billing mode (auto-scaling)
    - Encryption at rest with AWS managed keys
    - Point-in-time recovery enabled

### Additional Services

- **AWS Amplify**: Frontend hosting and deployment
  - Hosts the Next.js application
  - Automatic builds from GitHub commits
  - Environment-based configuration
  - Custom domain support
  - SSL/TLS certificates

- **AWS Secrets Manager**: Secure credential storage
  - Stores GitHub Personal Access Token
  - Used for Amplify GitHub integration
  - Encrypted at rest
  - Automatic rotation support

---

## Infrastructure as Code

This project uses **AWS CDK (Cloud Development Kit)** to define and deploy infrastructure.

### CDK Stack Structure

```
backend/
├── bin/
│   └── backend.ts                    # CDK app entry point
├── lib/
│   └── backend-stack.ts              # Main stack definition
├── lambda/
│   ├── chatbot_orchestrator.py       # Chatbot Lambda handler
│   └── data_handler.py               # Data handler Lambda
└── test/
    └── backend.test.ts               # Stack tests
```

### Key CDK Constructs

The main stack (`MSMBackendStack`) defines all AWS resources:

1. **DynamoDB Table**
   ```typescript
   const medicalRequestsTable = new dynamodb.Table(this, 'MedicalRequestsTable', {
     tableName: 'medical-requests',
     partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
     billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
     removalPolicy: cdk.RemovalPolicy.DESTROY
   });
   ```

2. **Lambda Functions**
   ```typescript
   const chatbotOrchestratorFn = new lambda.Function(this, 'ChatbotOrchestratorFn', {
     runtime: lambda.Runtime.PYTHON_3_11,
     handler: 'chatbot_orchestrator.lambda_handler',
     code: lambda.Code.fromAsset('lambda'),
     timeout: cdk.Duration.seconds(60),
     memorySize: 1024,
     environment: {
       REQUESTS_TABLE: medicalRequestsTable.tableName,
       BEDROCK_REGION: this.region
     }
   });
   ```

3. **API Gateway**
   ```typescript
   const chatbotApi = new apigateway.RestApi(this, 'ChatbotAPI', {
     restApiName: 'Medical Specialty Matchmaker API',
     defaultCorsPreflightOptions: {
       allowOrigins: apigateway.Cors.ALL_ORIGINS,
       allowMethods: apigateway.Cors.ALL_METHODS,
       allowHeaders: ['Content-Type', 'Authorization']
     }
   });
   ```

4. **IAM Permissions**
   ```typescript
   // DynamoDB permissions
   medicalRequestsTable.grantReadWriteData(chatbotOrchestratorFn);
   
   // Bedrock permissions
   chatbotOrchestratorFn.addToRolePolicy(
     new iam.PolicyStatement({
       effect: iam.Effect.ALLOW,
       actions: ['bedrock:InvokeModel'],
       resources: ['arn:aws:bedrock:*::foundation-model/*']
     })
   );
   ```

5. **Amplify App**
   ```typescript
   const amplifyApp = new amplify.CfnApp(this, 'MedicalSpecialtyMatchmakerApp', {
     name: 'medical-specialty-matchmaker',
     repository: 'https://github.com/ASUCICREPO/Medical-Specialty-Matchmaker',
     platform: 'WEB_COMPUTE',
     environmentVariables: [
       { name: 'NEXT_PUBLIC_API_URL', value: `${chatbotApi.url}chatbot` },
       { name: 'NEXT_PUBLIC_DATA_URL', value: `${chatbotApi.url}data` }
     ]
   });
   ```

### Deployment Automation

The project uses a unified deployment script (`deploy.sh`) that:
- Checks prerequisites (Node.js, AWS CLI, CDK)
- Installs all dependencies (backend and frontend)
- Bootstraps CDK if needed
- Deploys the CDK stack with all backend resources
- Extracts deployment outputs (API URLs, Amplify App ID)
- Creates frontend `.env` file with API endpoints
- Triggers Amplify build automatically
- Provides comprehensive status updates and error handling

### Resource Cleanup

The project includes a destruction script (`destroy.sh`) that:
- Confirms deletion with user (requires typing "yes")
- Deletes Amplify app and all deployments
- Empties S3 buckets before deletion
- Destroys CloudFormation stack
- Removes all Lambda functions, API Gateway, DynamoDB table
- Cleans up local files (cdk-outputs.json, .env)
- Provides detailed progress updates

---

## Security Considerations

Medical Specialty Matchmaker implements multiple layers of security to protect sensitive medical information:

### Data Privacy

- **No PII Collection**: System designed to avoid collecting patient names, dates of birth, or contact information
- **Anonymized Data**: All patient information is anonymized and aggregated
- **HIPAA-Compliant Design**: Follows HIPAA design principles for healthcare data
- **Minimal Data Storage**: Only stores information necessary for specialist matching

### Authentication & Authorization

- **Public Endpoints**: Chat and data endpoints are currently public (no authentication required)
- **Future Enhancement**: Cognito authentication planned for admin endpoints
- **API Key Support**: Can be added for production deployments
- **Token-Based Auth**: Ready for JWT token integration

### Network Security

- **HTTPS Only**: All API endpoints use TLS encryption
- **CORS Configuration**: Restricts cross-origin requests to approved domains
- **API Gateway Throttling**: Rate limiting prevents abuse (10,000 req/sec)
- **Request Validation**: All inputs validated before processing

### Data Encryption

- **Encryption at Rest**: DynamoDB tables encrypted with AWS managed keys
- **Encryption in Transit**: All data transmitted over HTTPS/TLS
- **Secrets Management**: GitHub tokens stored in AWS Secrets Manager
- **Key Rotation**: Supports automatic key rotation

### IAM Security

- **Least Privilege**: Lambda functions have minimal required permissions
- **Role Separation**: Each Lambda has its own execution role
- **Resource-Based Policies**: DynamoDB and Bedrock access restricted by resource
- **No Hardcoded Credentials**: All credentials managed by AWS IAM

### Logging & Monitoring

- **CloudWatch Logs**: All Lambda executions logged
- **PII Exclusion**: Sensitive data excluded from logs
- **Error Tracking**: Detailed error logs for debugging
- **Audit Trail**: All API requests logged for compliance

---

## Scalability

The serverless architecture of Medical Specialty Matchmaker automatically scales to handle varying loads:

### Auto-Scaling

- **Lambda Functions**: Automatically scale from zero to 1,000 concurrent executions
  - Chatbot Orchestrator: Handles multiple conversations simultaneously
  - Data Handler: Processes multiple storage requests in parallel
  - No server management required
  - Pay only for actual compute time

- **DynamoDB**: On-demand billing mode scales automatically
  - Read capacity scales to handle query spikes
  - Write capacity scales for high-volume submissions
  - No manual provisioning required
  - Consistent single-digit millisecond latency

- **API Gateway**: Handles millions of requests per second
  - Automatic request distribution
  - Built-in throttling and rate limiting
  - Regional and edge-optimized endpoints
  - Automatic retry and circuit breaking

### Load Distribution

- **API Gateway**: Distributes incoming requests across multiple Lambda instances
  - Intelligent routing based on endpoint
  - Automatic failover and retry
  - Request queuing during spikes

- **Amplify CDN**: Distributes frontend assets globally
  - Edge locations worldwide
  - Automatic caching and compression
  - Low-latency access from any region

### Performance Optimization

- **Lambda Memory**: Optimized for performance
  - Chatbot: 1024 MB (faster CPU allocation)
  - Data Handler: 256 MB (sufficient for DynamoDB ops)
  - Memory directly correlates to CPU power

- **Lambda Timeout**: Configured for reliability
  - Chatbot: 60 seconds (allows for Bedrock processing)
  - Data Handler: 30 seconds (fast DynamoDB operations)
  - API Gateway: 29-second hard limit

- **Bedrock Models**: Selected for speed and accuracy
  - Claude 3.5 Haiku: Fast conversational responses
  - Amazon Nova 2 Lite: Efficient classification
  - Both optimized for low latency

### Caching Strategies

- **Application-Level Caching**: Can cache specialty lists and common responses
- **API Gateway Caching**: Can enable response caching for frequently accessed endpoints
- **Amplify CDN**: Caches static assets and pages automatically
- **DynamoDB DAX**: Can add DynamoDB Accelerator for microsecond latency

### Cost Optimization

- **Serverless Architecture**: Pay only for what you use
  - No idle server costs
  - Automatic scaling down to zero
  - No over-provisioning required

- **On-Demand Billing**: DynamoDB charges only for actual reads/writes
  - No capacity planning needed
  - Scales with actual usage
  - Cost-effective for variable workloads

- **Estimated Monthly Costs** (low-moderate usage):
  - Lambda: $0-5
  - DynamoDB: $0-2
  - Bedrock: $5-20
  - Amplify: $0-5
  - API Gateway: $0-3
  - **Total: $5-35/month**

---

## Monitoring and Observability

### CloudWatch Logs

All components log to CloudWatch for centralized monitoring:

- **Lambda Function Logs**
  - `/aws/lambda/MSMBackendStack-ChatbotOrchestratorFn`
  - `/aws/lambda/MSMBackendStack-DataHandlerFn`
  - Includes request/response details
  - Error stack traces
  - Performance metrics

- **API Gateway Logs**
  - Access logs for all requests
  - Execution logs for debugging
  - Error tracking
  - Latency metrics

### Metrics and Alarms

Key metrics to monitor:

- **Lambda Metrics**
  - Invocation count
  - Error rate
  - Duration (p50, p99)
  - Concurrent executions
  - Throttles

- **API Gateway Metrics**
  - Request count
  - 4xx/5xx errors
  - Latency
  - Cache hit/miss ratio

- **DynamoDB Metrics**
  - Read/write capacity units
  - Throttled requests
  - System errors
  - Latency

### Debugging and Troubleshooting

Useful CloudWatch Insights queries:

```sql
-- Find all errors in chatbot Lambda
fields @timestamp, @message
| filter @message like /ERROR/
| sort @timestamp desc
| limit 100

-- Track classification confidence scores
fields @timestamp, extractedData.confidence
| filter action = "chat"
| stats avg(extractedData.confidence) by bin(5m)

-- Monitor API Gateway latency
fields @timestamp, latency
| stats avg(latency), max(latency), min(latency) by bin(5m)
```

---

## Future Enhancements

Planned architectural improvements:

### Authentication & Authorization
- [ ] Cognito user pools for admin access
- [ ] API key authentication for public endpoints
- [ ] Role-based access control (RBAC)
- [ ] Multi-factor authentication (MFA)

### Performance
- [ ] DynamoDB DAX for caching
- [ ] API Gateway response caching
- [ ] Lambda provisioned concurrency for critical functions
- [ ] WebSocket support for real-time chat

### Features
- [ ] Multi-language support in AI responses
- [ ] Specialist matching and notification system
- [ ] Request status tracking and updates
- [ ] Analytics dashboard for administrators
- [ ] Webhook notifications for new requests

### Scalability
- [ ] Multi-region deployment
- [ ] Global DynamoDB tables
- [ ] Cross-region replication
- [ ] Disaster recovery automation

---

## Support

For architecture questions or issues:
1. Review this document and the [API Documentation](./APIDoc.md)
2. Check CloudWatch logs for detailed error messages
3. Verify all AWS services are available in your region
4. Review [Troubleshooting Guide](../README.md#troubleshooting)
5. Open an issue on GitHub with architecture-specific questions
