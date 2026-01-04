# Medical Specialty Matchmaker

A chatbot application that helps healthcare professionals in resource-constrained settings connect with volunteer medical experts worldwide. The system uses AI to classify medical cases and match them with appropriate specialists.

## Mission

We provide sustainable medical expertise to resource-constrained hospitals and clinics globally, through a corps of volunteer healthcare professionals supported by telehealth technology. Local clinicians are upskilled so they can serve more of their own community and patients receive advanced healthcare.

## Features

- **Intelligent Case Classification**: AI-powered analysis of symptoms to identify appropriate medical specialties
- **Guided Form Filling**: Step-by-step chatbot interface to collect necessary information
- **Privacy-First Design**: No personally identifiable patient information is collected
- **Multi-Specialty Matching**: Supports matching across various medical specialties including:
  - Pediatrics
  - Dermatology
  - Infectious Disease
  - Cardiology
  - Neurology
  - Gastroenterology
  - Orthopedics
  - Pulmonology
  - Emergency Medicine
  - General Medicine

## Architecture

### Frontend (Next.js)
- **Framework**: Next.js 16 with React 19
- **Styling**: Tailwind CSS with WTI brand colors
- **Components**: Modular chatbot interface with form validation
- **Hosting**: AWS Amplify with automatic deployments

### Backend (AWS CDK)
- **Infrastructure**: AWS CDK for cloud resources
- **AI/ML**: AWS Bedrock with Claude 3.5 Haiku for intelligent conversations and classification
- **Database**: DynamoDB for storing medical requests
- **API**: AWS API Gateway with Lambda functions
- **Classification**: AI-powered symptom analysis and specialty matching with 98% confidence threshold

## 🚀 Deployment Guide

### Prerequisites

Before deploying, ensure you have:

- **Node.js 18+** installed
- **AWS CLI** installed and configured
- **AWS CDK** installed globally: `npm install -g aws-cdk`
- **Git** for cloning the repository
- **AWS Account** with appropriate permissions

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
  --region us-east-1 \
  --profile your-aws-profile
```

**To create a GitHub token:**
1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate new token with `repo` permissions
3. Copy the token and use it in the command above

### Step 4: Deploy Backend Infrastructure

```bash
cd backend

# Deploy all AWS resources (takes 3-5 minutes)
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
2. Update `backend/lib/backend-stack.ts` line ~122:
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
MSMBackendStack.AmplifyAppUrl = https://main.d1xzejvebp9qxx.amplifyapp.com
MSMBackendStack.ApiUrl = https://##########.execute-api.<REGION>.amazonaws.com/prod/
MSMBackendStack.ChatbotEndpoint = https://##########.execute-api.<REGION>.amazonaws.com/prod/chatbot
MSMBackendStack.DataEndpoint = https://##########.execute-api.<REGION>.amazonaws.com/prod/data
```

Your application is now live at the `AmplifyAppUrl`!

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

### Environment Variables

The system automatically manages environment variables:
- API endpoints are injected during Amplify build
- No manual `.env` configuration needed for production

## 🛠️ Configuration

### AWS Regions
- Default deployment region: `us-east-1`
- To change region, update `backend/bin/backend.ts`

### Bedrock Models
The system uses Claude 3.5 Haiku by default. To change models, update `backend/lambda/chatbot_orchestrator.py`:
```python
model_id = "anthropic.claude-3-5-haiku-20241022-v1:0"
```

### Response Length
Chatbot response limits are configured in `chatbot_orchestrator.py`:
- Conversational: 1000 tokens
- Classification: 800 tokens  
- Data extraction: 1200 tokens

## 🔍 Troubleshooting

### Common Issues

**CDK Bootstrap Error**
```bash
# Run bootstrap with explicit region
npx cdk bootstrap aws://ACCOUNT-ID/us-east-1 --profile your-profile
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
- Bedrock: Pay per token (~$0.25 per 1M tokens)
- Amplify: Free tier covers most small deployments

## 🔒 Security Considerations

- All API endpoints use HTTPS
- No PII is stored in the database
- AWS IAM follows least-privilege principles
- Bedrock calls are region-restricted
- GitHub tokens are stored in AWS Secrets Manager

## 📞 Support

For deployment issues:
1. Check the troubleshooting section above
2. Review AWS CloudWatch logs
3. Verify all prerequisites are met
4. Ensure AWS permissions are correctly configured

## Privacy & Security

- No personally identifiable patient information is collected
- All data is anonymized and aggregated
- HIPAA-compliant design principles
- Secure data transmission and storage

## Contributing

This project is designed to serve healthcare professionals in underserved communities. Contributions are welcome, especially from medical professionals and developers with healthcare experience.

## License

This project is developed for humanitarian purposes to improve global healthcare access.