const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();

async function deleteWorkOrder(workOrderId: string) {
  const params = {
    TableName: process.env.NOTES_TABLE,
    Key: {
      id: workOrderId
    }
  }
  try {
    await docClient.delete(params).promise()
    return workOrderId
  } catch (err) {
    console.log('DynamoDB error: ', err)
    return null
  }
}

export default deleteWorkOrder;