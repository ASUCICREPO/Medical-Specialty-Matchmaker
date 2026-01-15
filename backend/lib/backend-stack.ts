// import * as lambda from 'aws-cdk-lib/aws-lambda';
// import * as apigateway from 'aws-cdk-lib/aws-apigateway';
// import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
// import * as iam from 'aws-cdk-lib/aws-iam';

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
        BEDROCK_REGION: this.region
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
    });

    // Data Handler Lambda (Python)
    const dataHandlerFn = new lambda.Function(this, 'DataHandlerFn', {
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'data_handler.lambda_handler',
      code: lambda.Code.fromAsset('lambda'),
      environment: {
        REQUESTS_TABLE: medicalRequestsTable.tableName,
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
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });

    // Create API resources and methods
    const chatbotResource = chatbotApi.root.addResource('chatbot');
    const dataResource = chatbotApi.root.addResource('data');

    // Chatbot orchestrator integration
    const chatbotIntegration = new apigateway.LambdaIntegration(chatbotOrchestratorFn);
    chatbotResource.addMethod('POST', chatbotIntegration);

    // Data handler integration
    const dataIntegration = new apigateway.LambdaIntegration(dataHandlerFn);
    dataResource.addMethod('POST', dataIntegration);

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

    // Get GitHub token from Secrets Manager
    const githubSecret = secretsmanager.Secret.fromSecretNameV2(
      this, 
      'GitHubToken', 
      'github-token'
    );

    // Amplify App for Frontend Deployment
    const amplifyApp = new amplify.CfnApp(this, 'MedicalSpecialtyMatchmakerApp', {
      name: 'medical-specialty-matchmaker',
      description: 'Medical Specialty Matchmaker Frontend',
      repository: 'https://github.com/ASUCICREPO/Medical-Specialty-Matchmaker',
      accessToken: githubSecret.secretValue.unsafeUnwrap(),
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
            - echo "NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL" > .env.production
            - echo "NEXT_PUBLIC_DATA_URL=$NEXT_PUBLIC_DATA_URL" >> .env.production
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
    });

    // Create main branch
    const amplifyBranch = new amplify.CfnBranch(this, 'MainBranch', {
      appId: amplifyApp.attrAppId,
      branchName: 'main',
      enableAutoBuild: true,
      enablePerformanceMode: true,
      framework: 'Next.js - SSR'
    });

    // Output Amplify App URL
    new cdk.CfnOutput(this, 'AmplifyAppUrl', {
      value: `https://${amplifyBranch.branchName}.${amplifyApp.attrDefaultDomain}`,
      description: 'Amplify App URL',
    });

    new cdk.CfnOutput(this, 'AmplifyAppId', {
      value: amplifyApp.attrAppId,
      description: 'Amplify App ID',
    });

    new cdk.CfnOutput(this, 'AmplifyConsoleUrl', {
      value: `https://console.aws.amazon.com/amplify/home?region=${this.region}#/${amplifyApp.attrAppId}`,
      description: 'Amplify Console URL',
    });
  }
}
