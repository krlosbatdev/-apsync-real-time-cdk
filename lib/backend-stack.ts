import * as cdk from '@aws-cdk/core';
import * as appsync from '@aws-cdk/aws-appsync';
import * as ddb from '@aws-cdk/aws-dynamodb';
import * as lambda from '@aws-cdk/aws-lambda';
import { MappingTemplate } from '@aws-cdk/aws-appsync';

export class BackendStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Creates the AppSync API
    const api = new appsync.GraphqlApi(this, 'Api', {
      name: 'cdk-workOrders-appsync-api',
      schema: appsync.Schema.fromAsset('graphql/schema.graphql'),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.API_KEY,
          apiKeyConfig: {
            expires: cdk.Expiration.after(cdk.Duration.days(365))
          }
        },
      },
      xrayEnabled: true,
    });

    // Prints out the AppSync GraphQL endpoint to the terminal
    new cdk.CfnOutput(this, "GraphQLAPIURL", {
      value: api.graphqlUrl
    });

    // Prints out the AppSync GraphQL API key to the terminal
    new cdk.CfnOutput(this, "GraphQLAPIKey", {
      value: api.apiKey || ''
    });

    // Prints out the stack region to the terminal
    new cdk.CfnOutput(this, "Stack Region", {
      value: this.region
    });

    const workOrdersLambda = new lambda.Function(this, 'AppSyncWorkOrdersHandler', {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'main.handler',
      code: lambda.Code.fromAsset('lambda-fns'),
      memorySize: 1024
    });

    //Set a new http datasource
    const httpDs = api.addHttpDataSource(
      'ds',
      'https://api.coinlore.net',
      {
        name: 'httpDsWithStepF',
        description: 'from appsync to StepFunctions Workflow',
        authorizationConfig: {
          signingRegion: 'us-east-1',
          signingServiceName: 'states'
        }
      }
    );

    httpDs.createResolver({
      typeName: 'Query',
      fieldName: 'listCoinsJSON',
      requestMappingTemplate: MappingTemplate.fromFile('appsync-templates/request-coinJSON.vtl'),
      responseMappingTemplate: MappingTemplate.fromFile('appsync-templates/response-coinJSON.vtl')
    });

    httpDs.createResolver({
      typeName: 'Query',
      fieldName: 'listCoins',
      requestMappingTemplate: MappingTemplate.fromFile('appsync-templates/request-coin.vtl'),
      responseMappingTemplate: MappingTemplate.fromFile('appsync-templates/response-coin.vtl')
    });

    // Set the new Lambda function as a data source for the AppSync API
    const lambdaDs = api.addLambdaDataSource('lambdaDatasource', workOrdersLambda);

    lambdaDs.createResolver({
      typeName: "Query",
      fieldName: "getWorkOrderById"
    });

    lambdaDs.createResolver({
      typeName: "Query",
      fieldName: "listWorkOrders"
    });

    lambdaDs.createResolver({
      typeName: "Mutation",
      fieldName: "createWorkOrder"
    });

    lambdaDs.createResolver({
      typeName: "Mutation",
      fieldName: "deleteWorkOrder"
    });

    lambdaDs.createResolver({
      typeName: "Mutation",
      fieldName: "updateWorkOrder"
    });

    const workOrdersTable = new ddb.Table(this, 'CDKWorkOrdersTable', {
      billingMode: ddb.BillingMode.PAY_PER_REQUEST,
      partitionKey: {
        name: 'id',
        type: ddb.AttributeType.STRING,
      },
    });
    // enable the Lambda function to access the DynamoDB table (using IAM)
    workOrdersTable.grantFullAccess(workOrdersLambda)

    // Create an environment variable that we will use in the function code
    workOrdersLambda.addEnvironment('NOTES_TABLE', workOrdersTable.tableName);
  }
}
