#!/bin/bash
# Medical Specialty Matchmaker - Complete Deployment Pipeline
# Unified deployment for backend infrastructure and frontend application

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Configuration
TIMESTAMP=$(date +%Y%m%d%H%M%S)
STACK_NAME="MSMBackendStack"
GITHUB_SECRET_NAME="github-token"

# Check for AWS profile
if [ -z "${AWS_PROFILE:-}" ]; then
  echo -e "${YELLOW}[WARNING]${NC} AWS_PROFILE not set. Using default profile."
  echo "If you're using AWS SSO, set it with: export AWS_PROFILE=your-profile-name"
  echo ""
fi

# Dynamically detect region
AWS_REGION=${AWS_REGION:-$(aws configure get region 2>/dev/null || echo "")}
if [ -z "$AWS_REGION" ]; then
  echo -e "${RED}[ERROR]${NC} AWS region not found."
  echo "Please set AWS_REGION environment variable:"
  echo "  export AWS_REGION=us-east-1"
  echo ""
  echo "Or configure AWS CLI:"
  echo "  aws configure set region us-east-1"
  if [ -n "${AWS_PROFILE:-}" ]; then
    echo "  aws configure set region us-east-1 --profile $AWS_PROFILE"
  fi
  exit 1
fi

# Test AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
  echo -e "${RED}[ERROR]${NC} AWS credentials are not valid or have expired."
  if [ -n "${AWS_PROFILE:-}" ]; then
    echo "Please run: aws sso login --profile $AWS_PROFILE"
  else
    echo "Please configure AWS credentials or run: aws sso login"
  fi
  exit 1
fi

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Global variables
API_GATEWAY_URL=""
CHATBOT_ENDPOINT=""
DATA_ENDPOINT=""
AMPLIFY_APP_ID=""
AMPLIFY_URL=""

# Function to print colored output
print_status() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
  echo -e "${RED}[ERROR]${NC} $1"
  exit 1
}

print_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_cdk() {
  echo -e "${PURPLE}[CDK]${NC} $1"
}

# --- Phase 1: Prerequisites Check ---
print_status "Phase 1: Checking Prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
  print_error "Node.js is not installed. Please install Node.js 18+ first."
fi
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  print_error "Node.js version must be 18 or higher. Current: $(node -v)"
fi
print_success "Node.js $(node -v) detected"

# Check AWS CLI
if ! command -v aws &> /dev/null; then
  print_error "AWS CLI is not installed. Please install AWS CLI first."
fi
print_success "AWS CLI detected"

# Check CDK
if ! command -v cdk &> /dev/null; then
  print_warning "AWS CDK not found globally. Installing locally..."
  npm install -g aws-cdk
fi
print_success "AWS CDK detected"

# Check GitHub token in Secrets Manager
print_status "Checking for GitHub token in Secrets Manager..."
GITHUB_TOKEN_EXISTS=false
if aws secretsmanager describe-secret --secret-id "$GITHUB_SECRET_NAME" --region "$AWS_REGION" &> /dev/null; then
  print_success "GitHub token found in Secrets Manager"
  print_status "Amplify will be configured with automatic GitHub deployments"
  GITHUB_TOKEN_EXISTS=true
else
  print_warning "GitHub token not found in Secrets Manager"
  echo ""
  echo "Amplify will be created WITHOUT automatic GitHub deployments."
  echo "You can manually deploy the frontend or add GitHub integration later."
  echo ""
  echo "To enable automatic deployments from GitHub:"
  echo "  1. Create a GitHub Personal Access Token with 'repo' permissions"
  echo "     (GitHub Settings → Developer settings → Personal access tokens)"
  echo "  2. Store it in AWS Secrets Manager:"
  echo "     aws secretsmanager create-secret --name github-token --secret-string 'YOUR_TOKEN' --region $AWS_REGION"
  echo "  3. Redeploy: bash ./deploy.sh"
  echo ""
  read -p "Continue without GitHub integration? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_error "Deployment cancelled. Please set up GitHub token first."
  fi
  print_status "Continuing without GitHub integration..."
fi

# --- Phase 2: Install Dependencies ---
print_status "Phase 2: Installing Dependencies..."

print_status "Installing backend dependencies..."
cd backend
npm install
print_success "Backend dependencies installed"

print_status "Installing frontend dependencies..."
cd ../frontend
npm install
cd ..
print_success "Frontend dependencies installed"

# --- Phase 3: CDK Bootstrap (if needed) ---
print_status "Phase 3: Checking CDK Bootstrap..."

if ! aws cloudformation describe-stacks --stack-name CDKToolkit --region "$AWS_REGION" &> /dev/null 2>&1; then
  print_status "CDK not bootstrapped. Bootstrapping now..."
  cd backend
  npx cdk bootstrap aws://$AWS_ACCOUNT_ID/$AWS_REGION
  cd ..
  print_success "CDK bootstrapped successfully"
else
  print_success "CDK already bootstrapped"
fi

# --- Phase 4: Deploy Backend with CDK ---
print_cdk "Phase 4: Deploying Backend Infrastructure..."

cd backend
print_status "Building TypeScript..."
npm run build

print_status "Deploying CDK stack: $STACK_NAME"
print_status "This will create:"
print_status "  - DynamoDB table for medical requests"
print_status "  - Lambda functions (chatbot orchestrator, data handler)"
print_status "  - API Gateway with CORS enabled"
print_status "  - Amplify app for frontend hosting"
print_status "  - IAM roles and Bedrock permissions"
echo ""

npx cdk deploy --require-approval never --outputs-file cdk-outputs.json

if [ $? -ne 0 ]; then
  print_error "CDK deployment failed"
fi

print_success "Backend infrastructure deployed successfully"

# --- Phase 5: Extract Deployment Outputs ---
print_status "Phase 5: Extracting Deployment Information..."

if [ -f "cdk-outputs.json" ]; then
  API_GATEWAY_URL=$(cat cdk-outputs.json | grep -o '"ApiUrl": "[^"]*' | cut -d'"' -f4)
  CHATBOT_ENDPOINT=$(cat cdk-outputs.json | grep -o '"ChatbotEndpoint": "[^"]*' | cut -d'"' -f4)
  DATA_ENDPOINT=$(cat cdk-outputs.json | grep -o '"DataEndpoint": "[^"]*' | cut -d'"' -f4)
  AMPLIFY_APP_ID=$(cat cdk-outputs.json | grep -o '"AmplifyAppId": "[^"]*' | cut -d'"' -f4)
  AMPLIFY_URL=$(cat cdk-outputs.json | grep -o '"AmplifyAppUrl": "[^"]*' | cut -d'"' -f4)
fi

# Fallback to CloudFormation if outputs file parsing fails
if [ -z "$API_GATEWAY_URL" ]; then
  print_status "Extracting outputs from CloudFormation..."
  API_GATEWAY_URL=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" \
    --output text --region "$AWS_REGION")
  
  CHATBOT_ENDPOINT=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query "Stacks[0].Outputs[?OutputKey=='ChatbotEndpoint'].OutputValue" \
    --output text --region "$AWS_REGION")
  
  DATA_ENDPOINT=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query "Stacks[0].Outputs[?OutputKey=='DataEndpoint'].OutputValue" \
    --output text --region "$AWS_REGION")
  
  AMPLIFY_APP_ID=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query "Stacks[0].Outputs[?OutputKey=='AmplifyAppId'].OutputValue" \
    --output text --region "$AWS_REGION")
  
  AMPLIFY_URL=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query "Stacks[0].Outputs[?OutputKey=='AmplifyAppUrl'].OutputValue" \
    --output text --region "$AWS_REGION")
fi

print_success "Deployment outputs extracted"

cd ..

# --- Phase 6: Configure Frontend Environment ---
print_status "Phase 6: Configuring Environment Files..."

# Configure backend .env file
cd backend

# Determine allowed origins
if [ -n "$AMPLIFY_URL" ] && [ "$AMPLIFY_URL" != "None" ]; then
  ALLOWED_ORIGINS="$AMPLIFY_URL,http://localhost:3000"
else
  ALLOWED_ORIGINS="http://localhost:3000"
fi

cat > .env << EOF
# AWS Account ID (12-digit number)
CDK_DEFAULT_ACCOUNT=$AWS_ACCOUNT_ID

# AWS Region (e.g., us-east-1, us-west-2, eu-west-1)
CDK_DEFAULT_REGION=$AWS_REGION

# CORS Configuration (Security)
# Comma-separated list of allowed origins for API requests
ALLOWED_ORIGINS=$ALLOWED_ORIGINS
EOF

print_success "Backend environment configured"
print_status "Created backend/.env file with CDK environment variables"
print_status "CORS allowed origins: $ALLOWED_ORIGINS"

cd ../frontend

# Create .env file with API endpoints
cat > .env << EOF
NEXT_PUBLIC_API_URL=$CHATBOT_ENDPOINT
NEXT_PUBLIC_DATA_URL=$DATA_ENDPOINT
EOF

print_success "Frontend environment configured"
print_status "Created frontend/.env file with API endpoints"

cd ..

# --- Phase 7: Trigger Amplify Build ---
print_status "Phase 7: Triggering Amplify Build..."

if [ -n "$AMPLIFY_APP_ID" ] && [ "$AMPLIFY_APP_ID" != "None" ]; then
  if [ "$GITHUB_TOKEN_EXISTS" = true ]; then
    print_status "Starting Amplify deployment for app: $AMPLIFY_APP_ID"
    
    # Start Amplify build
    JOB_ID=$(aws amplify start-job \
      --app-id "$AMPLIFY_APP_ID" \
      --branch-name main \
      --job-type RELEASE \
      --region "$AWS_REGION" \
      --query 'jobSummary.jobId' \
      --output text 2>&1)
    
    if [ $? -eq 0 ] && [ -n "$JOB_ID" ] && [ "$JOB_ID" != "None" ]; then
      print_success "Amplify build started. Job ID: $JOB_ID"
      print_status "Monitoring build progress..."
      
      # Monitor build status
      BUILD_STATUS="PENDING"
      RETRY_COUNT=0
      MAX_RETRIES=60  # 5 minutes max
      
      while [ "$BUILD_STATUS" != "SUCCEED" ] && [ "$BUILD_STATUS" != "FAILED" ] && [ "$BUILD_STATUS" != "CANCELLED" ] && [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        sleep 5
        BUILD_STATUS=$(aws amplify get-job \
          --app-id "$AMPLIFY_APP_ID" \
          --branch-name main \
          --job-id "$JOB_ID" \
          --region "$AWS_REGION" \
          --query 'job.summary.status' \
          --output text 2>/dev/null || echo "PENDING")
        
        if [ "$BUILD_STATUS" = "RUNNING" ] || [ "$BUILD_STATUS" = "PROVISIONING" ]; then
          echo -n "."
        fi
        
        RETRY_COUNT=$((RETRY_COUNT + 1))
      done
      
      echo ""
      
      if [ "$BUILD_STATUS" = "SUCCEED" ]; then
        print_success "Amplify build completed successfully"
      elif [ "$BUILD_STATUS" = "FAILED" ]; then
        print_warning "Amplify build failed. Check Amplify console for details."
      else
        print_warning "Build is still in progress. Check Amplify console for status."
      fi
    else
      print_warning "Could not start Amplify build automatically"
      print_status "You can manually trigger a build from the Amplify console"
    fi
  else
    print_warning "GitHub integration not configured - skipping automatic build"
    echo ""
    echo "To deploy the frontend manually:"
    echo "  1. Connect your GitHub repository in the Amplify console"
    echo "  2. Or deploy manually: cd frontend && npm run build"
    echo "  3. Or add GitHub token and redeploy: bash ./deploy.sh"
    echo ""
  fi
else
  print_warning "Amplify App ID not found. Skipping automatic build trigger."
fi

# --- Final Summary ---
echo ""
echo "=========================================="
print_success "DEPLOYMENT COMPLETE!"
echo "=========================================="
echo ""
echo "Deployment Summary:"
echo "  Stack Name: $STACK_NAME"
echo "  AWS Region: $AWS_REGION"
echo "  AWS Account: $AWS_ACCOUNT_ID"
echo ""
echo "Backend Resources:"
echo "  API Gateway URL: $API_GATEWAY_URL"
echo "  Chatbot Endpoint: $CHATBOT_ENDPOINT"
echo "  Data Endpoint: $DATA_ENDPOINT"
echo ""
echo "Frontend:"
echo "  Amplify App ID: $AMPLIFY_APP_ID"
echo "  Frontend URL: $AMPLIFY_URL"
echo ""
echo "What was deployed:"
echo "  ✅ DynamoDB table for medical requests"
echo "  ✅ Lambda functions (chatbot orchestrator, data handler)"
echo "  ✅ API Gateway with CORS configuration"
echo "  ✅ Bedrock permissions for Claude AI"
echo "  ✅ Amplify app for frontend hosting"
echo "  ✅ IAM roles and policies"
echo "  ✅ Backend .env file with CDK environment variables"
echo "  ✅ Frontend .env file with API endpoints"
echo ""
echo "Next Steps:"
echo "  1. Verify the frontend is accessible at: $AMPLIFY_URL"
echo "  2. Test the chatbot functionality"
echo "  3. Monitor CloudWatch logs for any issues"
echo "  4. Check Amplify console: https://console.aws.amazon.com/amplify/home?region=$AWS_REGION#/$AMPLIFY_APP_ID"
echo ""
echo "Useful Commands:"
echo "  - View Lambda logs: aws logs tail /aws/lambda/$STACK_NAME-ChatbotOrchestratorFn --follow"
echo "  - Redeploy: ./deploy.sh"
echo "  - Destroy stack: cd backend && npx cdk destroy"
echo ""
print_success "Deployment script completed!"
