# Medical Specialty Matchmaker - Backend

AWS CDK infrastructure for the Medical Specialty Matchmaker chatbot application.

## 🏗️ Infrastructure Overview

This backend deploys a complete AWS infrastructure stack using CDK, including:
- **AI-Powered Chatbot**: AWS Bedrock with Claude 3.5 Haiku
- **API Gateway**: RESTful endpoints with CORS
- **Lambda Functions**: Python-based serverless compute
- **DynamoDB**: NoSQL database for medical requests
- **Amplify**: Frontend hosting with GitHub integration

## 📋 Prerequisites

- **AWS CLI** configured with appropriate permissions
- **Node.js 18+** and npm
- **AWS CDK** installed globally: `npm install -g aws-cdk`
- **Python 3.11** (for Lambda runtime)

### Required AWS Permissions

Your AWS user/role needs permissions for:
- CloudFormation (full access)
- IAM (create/manage roles and policies)
- Lambda (create/manage functions)
- API Gateway (create/manage APIs)
- DynamoDB (create/manage tables)
- Bedrock (invoke models)
- Amplify (create/manage apps)
- Secrets Manager (create/read secrets)

## 🚀 Quick Deployment

```bash
# 1. Install dependencies
npm install

# 2. Bootstrap CDK (first time only)
npx cdk bootstrap --profile your-aws-profile

# 3. Deploy everything
npx cdk deploy --profile your-aws-profile
```

## 🔧 Detailed Setup

### Step 1: Environment Setup
```bash
# Clone and navigate
git clone <repository-url>
cd Medical-Specialty-Matchmaker/backend

# Install dependencies
npm install

# Verify CDK installation
npx cdk --version
```

### Step 2: AWS Configuration
```bash
# Configure AWS CLI (if not done)
aws configure --profile your-profile

# Test AWS access
aws sts get-caller-identity --profile your-profile
```

### Step 3: CDK Bootstrap
```bash
# Bootstrap CDK in your account/region
npx cdk bootstrap aws://ACCOUNT-ID/REGION --profile your-profile

# Example:
npx cdk bootstrap aws://123456789012/us-east-1 --profile my-profile
```

### Step 4: GitHub Integration (Optional)
```bash
# Store GitHub token for Amplify auto-deployment
aws secretsmanager create-secret \
  --name "github-token" \
  --description "GitHub Personal Access Token for Amplify" \
  --secret-string "ghp_your_token_here" \
  --region us-east-1 \
  --profile your-profile
```

### Step 5: Deploy Infrastructure
```bash
# Deploy all resources
npx cdk deploy --profile your-profile

# Deploy with approval prompts disabled
npx cdk deploy --require-approval never --profile your-profile
```

## 📊 Deployed Resources

### Core Infrastructure
- **DynamoDB Table**: `medical-requests` (pay-per-request billing)
- **Lambda Functions**:
  - `ChatbotOrchestratorFn`: Main chatbot logic (Python 3.11, 512MB)
  - `DataHandlerFn`: Database operations (Python 3.11, 256MB)
- **API Gateway**: REST API with `/chatbot` and `/data` endpoints
- **IAM Roles**: Least-privilege access for Lambda functions

### AI/ML Components
- **AWS Bedrock**: Claude 3.5 Haiku model access
- **Response Limits**:
  - Conversational: 1000 tokens
  - Classification: 800 tokens
  - Data extraction: 1200 tokens

### Frontend Hosting
- **Amplify App**: Automatic builds from GitHub
- **Environment Variables**: Auto-injected API endpoints
- **Build Configuration**: Optimized for Next.js monorepo

## 🔌 API Endpoints

After deployment, you'll receive endpoints like:
```
ChatbotEndpoint: https://abc123.execute-api.us-east-1.amazonaws.com/prod/chatbot
DataEndpoint: https://abc123.execute-api.us-east-1.amazonaws.com/prod/data
AmplifyAppUrl: https://main.d1xzejvebp9qxx.amplifyapp.com
```

### Chatbot API Usage
```bash
# Send message to chatbot
curl -X POST https://your-api-url/chatbot \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I have a child with fever and rash",
    "conversationId": "unique-id",
    "ageGroup": "Child"
  }'
```

### Data Submission
```bash
# Submit medical request
curl -X POST https://your-api-url/data \
  -H "Content-Type: application/json" \
  -d '{
    "doctorName": "Dr. Smith",
    "hospitalName": "City Hospital",
    "email": "doctor@hospital.com",
    "ageGroup": "Child",
    "symptoms": "fever and rash for 3 days",
    "specialty": "Pediatrician",
    "subspecialty": "Pediatric Infectious Diseases"
  }'
```

## 🛠️ Development Commands

### Build and Test
```bash
# Compile TypeScript
npm run build

# Watch for changes
npm run watch

# Run tests
npm run test

# Lint code
npm run lint
```

### CDK Operations
```bash
# View planned changes
npx cdk diff --profile your-profile

# Generate CloudFormation template
npx cdk synth

# List all stacks
npx cdk list

# Destroy infrastructure (careful!)
npx cdk destroy --profile your-profile
```

## 📈 Monitoring and Logs

### CloudWatch Logs
```bash
# View Lambda logs
aws logs tail /aws/lambda/MSMBackendStack-ChatbotOrchestratorFn --follow --profile your-profile

# View API Gateway logs
aws logs tail API-Gateway-Execution-Logs --follow --profile your-profile
```

### DynamoDB Operations
```bash
# Scan all medical requests
aws dynamodb scan --table-name medical-requests --profile your-profile

# Get specific request
aws dynamodb get-item \
  --table-name medical-requests \
  --key '{"id": {"S": "request-id"}}' \
  --profile your-profile
```

### Amplify Build Status
```bash
# Check build status
aws amplify list-apps --profile your-profile

# Get build details
aws amplify get-job --app-id your-app-id --branch-name main --job-id job-id --profile your-profile
```

## 🏗️ Architecture Diagram

```
┌─────────────────┐
│   GitHub Repo   │
│   (Source)      │
└────────┬────────┘
         │
         │ Auto-deploy
         ▼
┌─────────────────┐    ┌──────────────────┐
│  AWS Amplify    │    │   API Gateway    │
│  (Frontend)     │◄──►│  /chatbot POST   │
└─────────────────┘    │  /data POST      │
                       └────────┬─────────┘
                                │
                                │ Invoke
                                ▼
                       ┌──────────────────┐
                       │ Lambda Functions │
                       │ - Chatbot Logic  │
                       │ - Data Handler   │
                       └────────┬─────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
                ▼               ▼               ▼
        ┌──────────────┐ ┌─────────────┐ ┌──────────────┐
        │  DynamoDB    │ │ AWS Bedrock │ │ Secrets Mgr  │
        │ (Database)   │ │ (Claude AI) │ │ (GitHub Key) │
        └──────────────┘ └─────────────┘ └──────────────┘
```

## 💰 Cost Estimation

### Monthly Costs (10,000 requests)
- **Lambda**: ~$0.20 (1M free requests/month)
- **DynamoDB**: ~$1.25 (pay-per-request)
- **API Gateway**: ~$0.035 (1M free requests/month)
- **Bedrock**: ~$2.50 (Claude 3.5 Haiku pricing)
- **Amplify**: Free (under 5GB storage)

**Total estimated cost**: ~$4/month for 10,000 requests

### Cost Optimization Tips
- Use DynamoDB on-demand pricing for variable workloads
- Enable Lambda provisioned concurrency only if needed
- Monitor Bedrock token usage
- Use CloudWatch to track actual usage

## 🔒 Security Features

### Built-in Security
- **HTTPS Only**: All API endpoints use TLS encryption
- **IAM Roles**: Least-privilege access for all resources
- **VPC**: Lambda functions can be deployed in VPC if needed
- **Secrets Management**: GitHub tokens stored in AWS Secrets Manager

### Production Security Checklist
- [ ] Restrict CORS to specific domains
- [ ] Add API authentication (Cognito/API Keys)
- [ ] Enable DynamoDB encryption at rest
- [ ] Add AWS WAF for DDoS protection
- [ ] Implement request throttling
- [ ] Enable CloudTrail for audit logging
- [ ] Set up CloudWatch alarms

## 🐛 Troubleshooting

### Common Deployment Issues

**CDK Bootstrap Error**
```bash
# Solution: Bootstrap with explicit account/region
npx cdk bootstrap aws://123456789012/us-east-1 --profile your-profile
```

**Bedrock Access Denied**
```bash
# Solution: Enable Bedrock in your AWS account
aws bedrock list-foundation-models --region us-east-1 --profile your-profile
```

**Amplify Build Fails**
- Check GitHub token permissions
- Verify repository URL in `backend-stack.ts`
- Ensure repository is accessible

**Lambda Timeout**
- Check CloudWatch logs for specific errors
- Increase timeout in CDK stack if needed
- Verify Bedrock model availability

### Debug Commands
```bash
# Check CDK context
npx cdk context

# Validate CloudFormation template
npx cdk synth | aws cloudformation validate-template --template-body file:///dev/stdin

# Test Lambda locally (if using SAM)
sam local invoke ChatbotOrchestratorFn
```

## 🔄 Updates and Maintenance

### Updating the Stack
```bash
# Pull latest changes
git pull origin main

# Deploy updates
npx cdk deploy --profile your-profile
```

### Rollback Strategy
```bash
# View deployment history
aws cloudformation describe-stack-events --stack-name MSMBackendStack --profile your-profile

# Rollback to previous version (if needed)
aws cloudformation cancel-update-stack --stack-name MSMBackendStack --profile your-profile
```

### Backup Strategy
- DynamoDB: Enable point-in-time recovery
- Lambda: Code is version-controlled in Git
- Infrastructure: CDK code serves as infrastructure backup

## 🚀 Advanced Configuration

### Multi-Environment Setup
```bash
# Deploy to different environments
npx cdk deploy --context environment=dev --profile dev-profile
npx cdk deploy --context environment=prod --profile prod-profile
```

### Custom Domain Setup
```typescript
// Add to backend-stack.ts
const certificate = Certificate.fromCertificateArn(this, 'Certificate', 'arn:aws:acm:...');
const domainName = api.addDomainName('CustomDomain', {
  domainName: 'api.yourdomain.com',
  certificate: certificate,
});
```

### VPC Deployment
```typescript
// Add VPC configuration to Lambda functions
const vpc = Vpc.fromLookup(this, 'VPC', { isDefault: true });
const lambdaFunction = new Function(this, 'Function', {
  vpc: vpc,
  // ... other config
});
```

## 📚 Additional Resources

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [AWS Bedrock User Guide](https://docs.aws.amazon.com/bedrock/)
- [DynamoDB Developer Guide](https://docs.aws.amazon.com/dynamodb/)
- [API Gateway Developer Guide](https://docs.aws.amazon.com/apigateway/)
- [AWS Amplify Documentation](https://docs.aws.amazon.com/amplify/)
