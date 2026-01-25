# Deployment Guide

## Prerequisites

### AWS Account Setup
1. **AWS Account**: Ensure you have an AWS account with appropriate permissions
2. **Bedrock Access**: Enable access to Amazon Bedrock models in your region
3. **AWS CLI**: Install and configure AWS CLI with your credentials
4. **AWS CDK** installed globally: `npm install -g aws-cdk`
5. **Node.js**: Install Node.js (version 18 or later)
6. **Git**: Ensure Git is installed for repository cloning

### Required AWS Permissions
Your AWS user/role needs the following permissions:
- Full access to AWS CDK operations
- Bedrock model invocation and knowledge base management
- Lambda, API Gateway, and DynamoDB permissions
- Amplify permissions for deployment

### Set Up GitHub Integration (Optional)

If you want Amplify to auto-deploy from your GitHub repository:

```bash
# Store your GitHub Personal Access Token in AWS Secrets Manager
aws secretsmanager create-secret \
  --name "github-token" \
  --description "GitHub Personal Access Token for Amplify" \
  --secret-string "your-github-token-here" \
  --region your-aws-profile-region \
  --profile your-aws-profile
```

**To create a GitHub token:**
1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate new token with `repo` permissions
3. Copy the token and use it in the command above

## Quick Deploy with deploy.sh

1. **Configure AWS credentials**
   ```bash
   # For AWS SSO (recommended)
   aws sso login --profile your-profile-name
   export AWS_PROFILE=your-profile-name
   export AWS_REGION=your-aws-region
   ```

   - **Note**: Please ensure both AI models are available in the region you select (Haiku 3.5 & Nova 2 Lite)

2. **Clone the repository**
   ```bash
   git clone https://github.com/ASUCICREPO/Medical-Specialty-Matchmaker.git
   cd Medical-Specialty-Matchmaker
   ```

3. **Set up GitHub token (optional, for Amplify auto-deploy)**
   ```bash
   aws secretsmanager create-secret \
     --name "github-token" \
     --description "GitHub Personal Access Token for Amplify" \
     --secret-string "your-github-token-here" \
     --region your-aws-region
   ```

4. **Run the deployment script**
   ```bash
   bash ./deploy.sh
   ```

## Step-by-step Deployment Guide

### Step 1: Clone and Setup

```bash
# Clone the repository
git clone https://github.com/ASUCICREPO/Medical-Specialty-Matchmaker.git
cd Medical-Specialty-Matchmaker

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies  
cd ../frontend
npm install
cd ..
```

### Step 2: AWS Configuration

#### Configure AWS CLI
```bash
# Configure your AWS credentials
aws configure

# Or use AWS SSO (recommended)
aws configure sso
```

#### Bootstrap CDK (First-time only)
```bash
cd backend
npx cdk bootstrap --profile your-aws-profile
```

### Step 3: Set Up GitHub Integration (Optional)

If you want Amplify to auto-deploy from your GitHub repository:

```bash
# Store your GitHub Personal Access Token in AWS Secrets Manager
aws secretsmanager create-secret \
  --name "github-token" \
  --description "GitHub Personal Access Token for Amplify" \
  --secret-string "your-github-token-here" \
  --region your-aws-profile-region \
  --profile your-aws-profile
```

**To create a GitHub token:**
1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate new token with `repo` permissions
3. Copy the token and use it in the command above

### Step 4: Deploy Backend Infrastructure

```bash
cd backend

# Deploy all AWS resources
npx cdk deploy --profile your-aws-profile 
```

This creates:
- ✅ DynamoDB table for medical requests
- ✅ Lambda functions for chatbot logic
- ✅ API Gateway endpoints
- ✅ IAM roles and policies
- ✅ Amplify app for frontend hosting

### Step 5: Update Repository Settings (If using GitHub integration)

After deployment, update your CDK stack with your repository URL:

1. Fork this repository to your GitHub account
2. Update `backend/lib/backend-stack.ts` line ~133:
   ```typescript
   repository: 'https://github.com/YOUR-USERNAME/Medical-Specialty-Matchmaker',
   ```
3. Redeploy:
   ```bash
   npx cdk deploy --profile your-aws-profile
   ```

### Step 6: Verify Deployment

After deployment completes, you'll see outputs like:
```
✅  MSMBackendStack

Outputs:
MSMBackendStack.AmplifyAppId = <APP-ID>
MSMBackendStack.AmplifyAppUrl = https://main.<APP-ID>.amplifyapp.com
MSMBackendStack.AmplifyConsoleUrl = https://console.aws.amazon.com/amplify/home?region=<REGION>#/<APP-ID>
MSMBackendStack.ApiUrl = https://<COPY-THIS-BASE-URL>/prod/
MSMBackendStack.ChatbotAPIEndpointC82E045D = https://<BASE-URL>/prod/
MSMBackendStack.ChatbotEndpoint = https://<BASE-URL>/prod/chatbot
MSMBackendStack.DataEndpoint = https://<BASE-URL>/prod/data
```

### Step 7: Environment Variables
- Create a `.env` file in the frontend folder and follow `.example.env` by pasting the copied base url into the environment variables

### Step 8: Run Deployment

```bash
aws amplify start-job --app-id your-app-id --branch-name main --job-type RELEASE --region your-region --profile your-aws-profile
```

## 🔧 Local Development

### Frontend Development
```bash
cd frontend
npm run dev
# Open http://localhost:3000
```

### Backend Testing
```bash
cd backend
npm run test
```

## 🛠️ Configuration

### AWS Regions
- **Recommended region**: `us-east-1` (has Claude 3.x models without marketplace requirements)
- **Alternative regions**: `us-west-2`, `us-east-2` 
- **Note**: `us-west-1` only has Claude 4.x models which require AWS Marketplace subscriptions
- To change region, update `backend/bin/backend.ts` and redeploy

### Bedrock Models
The system uses Claude 3.5 Haiku for chatting and Nove 2 Lite for data extraction and classification. To change models, update `backend/lambda/chatbot_orchestrator.py`:
```python
modelId='us.anthropic.claude-3-5-haiku-20241022-v1:0'
modelId='us.amazon.nova-2-lite-v1:0'
```
- Ensure the model you are using is available on the current region

### Response Length
Chatbot response limits are configured in `chatbot_orchestrator.py`

## 🔍 Troubleshooting

### Common Issues

**CDK Bootstrap Error**
```bash
# Run bootstrap with explicit region
npx cdk bootstrap aws://ACCOUNT-ID/ACCOUNT-REGION --profile your-profile
```

**Amplify Build Fails**
- Check that your repository is public or GitHub token has correct permissions
- Verify the repository URL in `backend-stack.ts`

**Bedrock Access Denied**
- Ensure your AWS account has Bedrock access enabled
- Check that the deployment region supports Claude models

**API Gateway 403 Errors**
- Verify CORS configuration in API Gateway
- Check Lambda function permissions

### Logs and Monitoring

- **Lambda Logs**: CloudWatch → Log Groups → `/aws/lambda/MSMBackendStack-*`
- **Amplify Builds**: AWS Console → Amplify → Your App → Build History
- **API Gateway**: AWS Console → API Gateway → Medical Specialty Matchmaker API

## 🔄 Updates and Maintenance

### Updating the Application
```bash
# Pull latest changes
git pull origin main

# Deploy backend updates
cd backend
npx cdk deploy --profile your-profile

# Frontend updates deploy automatically via Amplify
```

### Monitoring Costs
- Lambda: Pay per request (very low cost)
- DynamoDB: Pay per read/write (minimal for typical usage)
- Bedrock: Pay per token (![check out model price comparisons](https://aws.amazon.com/bedrock/pricing/))
- Amplify: Free tier covers most small deployments

## 🔒 Security Considerations

- All API endpoints use HTTPS
- No PII is stored in the database
- AWS IAM follows least-privilege principles
- Bedrock calls are region-restricted
- GitHub tokens are stored in AWS Secrets Manager
