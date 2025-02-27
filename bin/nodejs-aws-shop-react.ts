#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { NodejsAwsShopReactStack } from '../lib/nodejs-aws-shop-react-stack';

const app = new cdk.App();
new NodejsAwsShopReactStack(app, 'NodejsAwsShopReactStack', {
  env: {
    region: 'eu-central-1',
    account: process.env.CDK_DEFAULT_ACCOUNT,
  },
});