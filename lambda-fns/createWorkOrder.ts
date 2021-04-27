const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();
import WorkOrder from './WorkOrder';

async function createWorkOrder(workOrder: WorkOrder) {
  const params = {
    TableName: process.env.NOTES_TABLE,
    Item: workOrder
  }
  try {
    await docClient.put(params).promise();
    return workOrder;
  } catch (err) {
    console.log('DynamoDB error: ', err);
    return null;
  }
}

export default createWorkOrder;