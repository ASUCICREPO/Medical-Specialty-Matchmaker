import * as cdk from 'aws-cdk-lib/core';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as amplify from 'aws-cdk-lib/aws-amplify';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export class MSMBackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Get allowed origins from environment or use localhost for development
    const allowedOrigins = process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',')
      : ['http://localhost:3000']; // Default for local development

    // DynamoDB table for storing medical requests
    const medicalRequestsTable = new dynamodb.Table(this, 'MedicalRequestsTable', {
      tableName: 'medical-requests',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    // Chatbot Orchestrator Lambda (Python)
    const chatbotOrchestratorFn = new lambda.Function(this, 'ChatbotOrchestratorFn', {
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'chatbot_orchestrator.lambda_handler',
      code: lambda.Code.fromAsset('lambda'),
      environment: {
        REQUESTS_TABLE: medicalRequestsTable.tableName,
        BEDROCK_REGION: this.region,
        ALLOWED_ORIGINS: allowedOrigins.join(',')
      },
      timeout: cdk.Duration.seconds(60),  // Increased from 30 to 60 seconds
      memorySize: 1024,  // Increased from 512 to 1024 MB for better performance
    });

    // Data Handler Lambda (Python)
    const dataHandlerFn = new lambda.Function(this, 'DataHandlerFn', {
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'data_handler.lambda_handler',
      code: lambda.Code.fromAsset('lambda'),
      environment: {
        REQUESTS_TABLE: medicalRequestsTable.tableName,
        ALLOWED_ORIGINS: allowedOrigins.join(',')
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
    });

    // Grant DynamoDB permissions
    medicalRequestsTable.grantReadWriteData(chatbotOrchestratorFn);
    medicalRequestsTable.grantReadWriteData(dataHandlerFn);

    // Grant Bedrock permissions to orchestrator
    chatbotOrchestratorFn.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'bedrock:InvokeModel',
          'bedrock:InvokeModelWithResponseStream'
        ],
        resources: [
          // Allow all Bedrock models in all regions (simplest approach)
          'arn:aws:bedrock:*::foundation-model/*',
          `arn:aws:bedrock:*:${this.account}:inference-profile/*`,
        ],
      })
    );

    // Also add a broader Bedrock policy for model access
    chatbotOrchestratorFn.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'bedrock:ListFoundationModels',
          'bedrock:GetFoundationModel'
        ],
        resources: ['*'],
      })
    );

    // API Gateway
    const chatbotApi = new apigateway.RestApi(this, 'ChatbotAPI', {
      restApiName: 'Medical Specialty Matchmaker API',
      description: 'API for medical specialty matching chatbot',
      defaultCorsPreflightOptions: {
        allowOrigins: allowedOrigins,
        allowMethods: ['GET', 'POST', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization'],
        allowCredentials: false,
        maxAge: cdk.Duration.hours(1),
      },
    });

    // Create API resources and methods
    const chatbotResource = chatbotApi.root.addResource('chatbot');
    const dataResource = chatbotApi.root.addResource('data');

    // Chatbot orchestrator integration (API Key disabled for now - will add auth later)
    const chatbotIntegration = new apigateway.LambdaIntegration(chatbotOrchestratorFn);
    const chatbotMethod = chatbotResource.addMethod('POST', chatbotIntegration, {
      apiKeyRequired: false, // TODO: Add proper authentication (Cognito or API Key)
    });

    // Data handler integration (API Key disabled for now - will add auth later)
    const dataIntegration = new apigateway.LambdaIntegration(dataHandlerFn);
    const dataMethod = dataResource.addMethod('POST', dataIntegration, {
      apiKeyRequired: false, // TODO: Add proper authentication (Cognito or API Key)
    });

    // Output the API URL
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: chatbotApi.url,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'ChatbotEndpoint', {
      value: `${chatbotApi.url}chatbot`,
      description: 'Chatbot API Endpoint',
    });

    new cdk.CfnOutput(this, 'DataEndpoint', {
      value: `${chatbotApi.url}data`,
      description: 'Data Handler API Endpoint',
    });

    // GitHub token handling - Use dynamic reference to avoid exposing token
    // This approach uses CloudFormation dynamic references which are resolved at runtime
    // The token value never appears in the CloudFormation template or outputs
    
    // Check if GitHub secret exists (optional)
    let hasGitHubToken = false;
    let githubTokenReference: string | undefined;
    
    try {
      const githubSecret = secretsmanager.Secret.fromSecretNameV2(
        this, 
        'GitHubToken', 
        'github-token'
      );
      
      // Use CloudFormation dynamic reference instead of unsafeUnwrap()
      // This resolves the secret at runtime without exposing it in the template
      githubTokenReference = `{{resolve:secretsmanager:${githubSecret.secretArn}:SecretString}}`;
      hasGitHubToken = true;
    } catch (error) {
      // Secret doesn't exist - Amplify will be created without GitHub integration
      console.warn('GitHub token not found in Secrets Manager. Amplify will be created without automatic deployments.');
    }

    // Amplify App for Frontend Deployment
    // Build props conditionally based on GitHub token availability
    const baseAmplifyProps = {
      name: 'medical-specialty-matchmaker',
      description: 'Medical Specialty Matchmaker Frontend',
      platform: 'WEB_COMPUTE',
      buildSpec: `version: 1
applications:
  - appRoot: frontend
    frontend:
      phases:
        preBuild:
          commands:
            - npm ci
        build:
          commands:
            - npm run build
      artifacts:
        baseDirectory: .next
        files:
          - '**/*'
      cache:
        paths:
          - node_modules/**/*
          - .next/cache/**/*`,
      environmentVariables: [
        {
          name: 'AMPLIFY_MONOREPO_APP_ROOT',
          value: 'frontend'
        },
        {
          name: 'NEXT_PUBLIC_API_URL',
          value: `${chatbotApi.url}chatbot`
        },
        {
          name: 'NEXT_PUBLIC_DATA_URL',
          value: `${chatbotApi.url}data`
        }
      ]
    };

    // Create Amplify app with or without GitHub integration
    // Using CloudFormation dynamic reference - token is resolved at runtime
    // and never appears in the template or outputs
    const amplifyApp = hasGitHubToken && githubTokenReference
      ? new amplify.CfnApp(this, 'MedicalSpecialtyMatchmakerApp', {
          ...baseAmplifyProps,
          repository: 'https://github.com/ASUCICREPO/Medical-Specialty-Matchmaker',
          // Use dynamic reference - token is NOT exposed in CloudFormation template
          accessToken: githubTokenReference,
        })
      : new amplify.CfnApp(this, 'MedicalSpecialtyMatchmakerApp', baseAmplifyProps);

    // Create main branch (only if GitHub is connected)
    if (hasGitHubToken) {
      const amplifyBranch = new amplify.CfnBranch(this, 'MainBranch', {
        appId: amplifyApp.attrAppId,
        branchName: 'main',
        enableAutoBuild: true,
        enablePerformanceMode: true,
        framework: 'Next.js - SSR'
      });

      // Output Amplify App URL with branch
      new cdk.CfnOutput(this, 'AmplifyAppUrl', {
        value: `https://${amplifyBranch.branchName}.${amplifyApp.attrDefaultDomain}`,
        description: 'Amplify App URL',
      });
    } else {
      // Output Amplify App URL without branch (manual deployment)
      new cdk.CfnOutput(this, 'AmplifyAppUrl', {
        value: `https://main.${amplifyApp.attrDefaultDomain}`,
        description: 'Amplify App URL (manual deployment required)',
      });
    }

    new cdk.CfnOutput(this, 'AmplifyAppId', {
      value: amplifyApp.attrAppId,
      description: 'Amplify App ID',
    });

    new cdk.CfnOutput(this, 'AmplifyConsoleUrl', {
      value: `https://console.aws.amazon.com/amplify/home?region=${this.region}#/${amplifyApp.attrAppId}`,
      description: 'Amplify Console URL',
    });

    new cdk.CfnOutput(this, 'AllowedOrigins', {
      value: allowedOrigins.join(','),
      description: 'Allowed CORS Origins',
    });

    // Output GitHub integration status
    new cdk.CfnOutput(this, 'GitHubIntegration', {
      value: hasGitHubToken ? 'Enabled - Automatic deployments from GitHub' : 'Disabled - Manual deployment required',
      description: 'GitHub Integration Status',
    });
  }
}
