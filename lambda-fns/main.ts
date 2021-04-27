import createWorkOrder from './createWorkOrder';
import deleteWorkOrder from './deleteWorkOrder';
import getWorkOrderById from './getWorkOrderById';
import listWorkOrders from './listWorkOrders';
import updateWorkOrder from './updateWorkOrder';
import WorkOrder from './WorkOrder';

type AppSyncEvent = {
  info: {
    fieldName: string
  },
  arguments: {
    workOrderId: string,
    workOrder: WorkOrder
  }
}

exports.handler = async (event: AppSyncEvent) => {
  switch (event.info.fieldName) {
    case "getWorkOrderById":
      return await getWorkOrderById(event.arguments.workOrderId);
    case "createWorkOrder":
      return await createWorkOrder(event.arguments.workOrder);
    case "listWorkOrders":
      return await listWorkOrders();
    case "deleteWorkOrder":
      return await deleteWorkOrder(event.arguments.workOrderId);
    case "updateWorkOrder":
      return await updateWorkOrder(event.arguments.workOrder);
    default:
      return null;
  }
}