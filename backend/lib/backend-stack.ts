// import * as lambda from 'aws-cdk-lib/aws-lambda';
// import * as apigateway from 'aws-cdk-lib/aws-apigateway';
// import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
// import * as iam from 'aws-cdk-lib/aws-iam';

import * as cdk from 'aws-cdk-lib/core';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
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
          `arn:aws:bedrock:${this.region}:*:foundation-model/anthropic.claude-3-haiku-20240307-v1:0`,
          `arn:aws:bedrock:${this.region}:*:foundation-model/anthropic.claude-3-5-haiku-20241022-v1:0`,
          `arn:aws:bedrock:${this.region}:*:foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0`,
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
  }
}
