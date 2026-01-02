#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { MSMBackendStack } from '../lib/backend-stack';

const app = new cdk.App();
new MSMBackendStack(app, 'MSMBackendStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});
