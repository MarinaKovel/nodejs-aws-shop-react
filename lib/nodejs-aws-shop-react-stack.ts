import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as path from 'path';

const DEFAULT_TTL = 120; // 2 minutes

export class NodejsAwsShopReactStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create an S3 bucket for the website
    const websiteBucket = new s3.Bucket(this, 'my-first-aws-app-mk1', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL
    });

    // Create origin for API Gateway
    const apiGatewayOrigin = new origins.HttpOrigin('7so3qk9a67.execute-api.eu-central-1.amazonaws.com', {
      protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY
    });

    // Create origin for Elastic Beanstalk
    const ebOrigin = new origins.HttpOrigin('marinakovel-bff-api-prod.eu-central-1.elasticbeanstalk.com', {
      protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY
    });

    const cachePolicy = new cloudfront.CachePolicy(this, "CachePolicy", {
      cachePolicyName: "BffCachePolicy",
      headerBehavior: cloudfront.CacheHeaderBehavior.allowList(
        "Authorization",
        "Cache-Control"
      ),
      enableAcceptEncodingGzip: true,
      enableAcceptEncodingBrotli: true,
      queryStringBehavior: cloudfront.CacheQueryStringBehavior.all(),
      cookieBehavior: cloudfront.CacheCookieBehavior.none(),
      defaultTtl: cdk.Duration.seconds(DEFAULT_TTL),
      maxTtl: cdk.Duration.seconds(DEFAULT_TTL),
      minTtl: cdk.Duration.seconds(0),
    });

    // Create a CloudFront distribution
    const distribution = new cloudfront.Distribution(this, 'MyWebDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(websiteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      additionalBehaviors: {
        '/api/*': {
          origin: apiGatewayOrigin,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER
        },
        '/product*': {
          origin: ebOrigin,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.ALLOW_ALL,
          cachePolicy,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,

        },
        '/cart/order/*': {
          origin: ebOrigin,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.ALLOW_ALL,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER
        },
        '/cart*': {
          origin: ebOrigin,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.ALLOW_ALL,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
        }
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html'
        }
      ]
    });

    // Deploy site contents to S3
    new s3deploy.BucketDeployment(this, 'my-first-aws-app-mk', {
      sources: [s3deploy.Source.asset(path.join(__dirname, '../dist'))],
      destinationBucket: websiteBucket,
      distribution,
      distributionPaths: ['/*']
    });

    // Output the CloudFront URL
    new cdk.CfnOutput(this, 'DistributionDomainName', {
      value: distribution.distributionDomainName
    });
  }
}
