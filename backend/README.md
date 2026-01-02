# Medical Specialty Matchmaker - Backend

AWS CDK infrastructure for the Medical Specialty Matchmaker chatbot application.

## Deployed Infrastructure ✅

**Status**: Successfully deployed to AWS
**Region**: us-west-2
**API Endpoint**: `https://muw0420zn8.execute-api.us-west-2.amazonaws.com/prod/`

### Resources Created

1. **DynamoDB Table**
   - `medical-requests` - Stores medical consultation requests

2. **Lambda Function**
   - `ChatbotFunction` - Handles medical case classification and request processing
   - Runtime: Node.js 18.x
   - Memory: 128 MB (default)

3. **API Gateway**
   - REST API with CORS enabled
   - POST endpoint: `/chatbot`
   - Supports two actions: `classify` and `submit`

4. **IAM Roles & Policies**
   - Lambda execution role with DynamoDB read/write permissions
   - API Gateway invoke permissions

## API Usage

### Classify Medical Request
```bash
curl -X POST https://muw0420zn8.execute-api.us-west-2.amazonaws.com/prod/chatbot \
  -H "Content-Type: application/json" \
  -d '{
    "action": "classify",
    "data": {
      "symptoms": "child with high fever and rash",
      "patientAge": 8,
      "urgency": "high"
    }
  }'
```

**Response:**
```json
{
  "recommendedSpecialties": ["Pediatrics", "Infectious Disease", "Dermatology"],
  "confidence": 0.8
}
```

### Submit Medical Request
```bash
curl -X POST https://muw0420zn8.execute-api.us-west-2.amazonaws.com/prod/chatbot \
  -H "Content-Type: application/json" \
  -d '{
    "action": "submit",
    "data": {
      "doctorName": "Dr. Smith",
      "location": "City Hospital, Kenya",
      "email": "doctor@hospital.com",
      "patientAge": "8",
      "symptoms": "fever and rash",
      "urgency": "high",
      "additionalInfo": "Symptoms started 3 days ago",
      "recommendedSpecialties": ["Pediatrics", "Infectious Disease"]
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "id": "1234567890"
}
```

## Development Commands

### Build
```bash
npm run build
```

### Watch Mode
```bash
npm run watch
```

### Run Tests
```bash
npm run test
```

### Deploy to AWS
```bash
npx cdk deploy --profile wti
```

### View Differences
```bash
npx cdk diff --profile wti
```

### Synthesize CloudFormation
```bash
npx cdk synth
```

### Destroy Stack
```bash
npx cdk destroy --profile wti
```

## Monitoring

### View Lambda Logs
```bash
aws logs tail /aws/lambda/BackendStack-ChatbotFunction --follow --profile wti
```

### Query DynamoDB
```bash
# Scan all requests
aws dynamodb scan --table-name medical-requests --profile wti

# Get specific request
aws dynamodb get-item \
  --table-name medical-requests \
  --key '{"id": {"S": "REQUEST_ID"}}' \
  --profile wti
```

## Architecture

```
┌─────────────┐
│   Client    │
│  (Frontend) │
└──────┬──────┘
       │
       │ HTTPS
       ▼
┌─────────────────┐
│  API Gateway    │
│  /chatbot POST  │
└────────┬────────┘
         │
         │ Invoke
         ▼
┌──────────────────┐
│ Lambda Function  │
│ - Classify       │
│ - Submit         │
└────────┬─────────┘
         │
         │ Read/Write
         ▼
┌──────────────────┐
│    DynamoDB      │
│ - Requests       │
└──────────────────┘
```

## Medical Specialty Classification

The Lambda function classifies cases based on:

- **Age**: Pediatrics for patients < 18 years
- **Symptoms**: Keyword matching for specialty identification
  - Dermatology: rash, skin, lesion, eczema
  - Infectious Disease: fever, infection, sepsis
  - Cardiology: heart, chest pain, cardiac
  - Neurology: seizure, headache, stroke
  - Gastroenterology: abdominal, stomach, diarrhea
  - Orthopedics: bone, fracture, joint
  - Pulmonology: breathing, lung, cough
- **Urgency**: Emergency Medicine for high-urgency cases

## Cost Estimation

With pay-per-request pricing:
- **DynamoDB**: $1.25 per million write requests, $0.25 per million read requests
- **Lambda**: Free tier: 1M requests/month, then $0.20 per 1M requests
- **API Gateway**: Free tier: 1M requests/month, then $3.50 per million

**Estimated monthly cost for 10,000 requests**: < $1

## Security

- CORS enabled for all origins (development mode)
- IAM roles follow least privilege principle
- No PII stored in database design
- HTTPS encryption in transit

### Production Security Recommendations
1. Restrict CORS to specific domains
2. Add API authentication (API keys or Cognito)
3. Enable DynamoDB encryption at rest
4. Add AWS WAF for DDoS protection
5. Implement request throttling

## Troubleshooting

### Deployment Issues
- Ensure AWS credentials are configured: `aws configure --profile wti`
- Check CDK version: `npx cdk --version`
- Bootstrap CDK if first deployment: `npx cdk bootstrap --profile wti`

### Lambda Errors
- Check CloudWatch logs for detailed error messages
- Verify IAM permissions for DynamoDB access
- Test Lambda function directly in AWS Console

### API Gateway Issues
- Verify CORS configuration
- Check API Gateway logs in CloudWatch
- Test endpoint with curl or Postman

## Future Enhancements

- [ ] Integrate with AWS Bedrock for advanced AI classification
- [ ] Add SNS notifications for specialist matching
- [ ] Implement SQS queue for async processing
- [ ] Add CloudWatch alarms for monitoring
- [ ] Create separate dev/staging/prod environments
- [ ] Add API authentication with Cognito
- [ ] Implement rate limiting and throttling
