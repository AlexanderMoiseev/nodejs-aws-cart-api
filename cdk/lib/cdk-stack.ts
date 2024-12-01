import * as cdk from 'aws-cdk-lib/core';
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { join } from 'path';
import { Construct } from "constructs";
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

const DB_NAME = 'cartdb2';

export class CartServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'VPC2', {
      maxAzs: 2, // Default is all AZs in the region
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'PublicSubnet2',
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
    });

    const database = new rds.DatabaseInstance(this, 'CartServiceDB2', {
      engine: rds.DatabaseInstanceEngine.postgres({ version: rds.PostgresEngineVersion.VER_16_2 }),
      vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE3, ec2.InstanceSize.MICRO),
      credentials: rds.Credentials.fromGeneratedSecret('cartadmin'),
      databaseName: DB_NAME,
      publiclyAccessible: true,

      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC
      },
      multiAz: false,
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      allowMajorVersionUpgrade: false,
      autoMinorVersionUpgrade: true,
      backupRetention: cdk.Duration.days(7),
      deleteAutomatedBackups: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      deletionProtection: false
    });
    
    const cartServiceLambda = new lambda.Function(this, 'CartServiceLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'src/main.handler',
      timeout: cdk.Duration.seconds(60),
      code: lambda.Code.fromAsset(join(__dirname, '..', '..', 'dist')),
      vpc, // Associate the Lambda function with the VPC
      allowPublicSubnet: true, // Confirm that lambda is in VPC
      securityGroups: [database.connections.securityGroups[0]],
      environment: {
        NODE_ENV: 'production',
        DB_HOST: process.env.DATABASE_HOST!,
        DB_PORT: process.env.DATABASE_PORT!,
        DB_NAME: process.env.DATABASE_NAME!,
        DB_USER: process.env.DATABASE_USERNAME!,
        DB_PASSWORD: process.env.DATABASE_PASSWORD!,
      },
    });

    const restApi = new apigateway.RestApi(this, 'userServiceApi', {
      restApiName: 'User Service',
      description: 'This service serves users.',
    });

    const proxyResource = restApi.root.addResource('{proxy+}');
    proxyResource.addMethod('ANY', new apigateway.LambdaIntegration(cartServiceLambda));
  }
}
