import type { AppRole } from "@/types/auth";

export const appRoles = {
  admin: "ADMIN",
  maintenanceManager: "RESPONSABLE_MAINTENANCE",
  technician: "TECHNICIAN",
  storekeeper: "STOREKEEPER",
  operator: "OPERATOR",
  direction: "DIRECTION",
} as const satisfies Record<string, AppRole>;

export const routeAccessControl = {
  dashboard: [
    appRoles.admin,
    appRoles.maintenanceManager,
    appRoles.technician,
    appRoles.storekeeper,
    appRoles.operator,
    appRoles.direction,
  ],
  predictiveMaintenance: [
    appRoles.admin,
    appRoles.maintenanceManager,
    appRoles.technician,
    appRoles.direction,
  ],
  aiAssistant: [
    appRoles.admin,
    appRoles.maintenanceManager,
    appRoles.technician,
    appRoles.direction,
    appRoles.operator,
  ],
  equipments: [appRoles.admin, appRoles.maintenanceManager, appRoles.direction],
  breakdowns: [appRoles.admin, appRoles.maintenanceManager, appRoles.operator],
  workOrders: [appRoles.admin, appRoles.maintenanceManager, appRoles.technician],
  stockParts: [appRoles.admin, appRoles.storekeeper],
  maintenancePlans: [appRoles.admin, appRoles.maintenanceManager],
  notifications: [
    appRoles.admin,
    appRoles.maintenanceManager,
    appRoles.technician,
    appRoles.storekeeper,
    appRoles.operator,
    appRoles.direction,
  ],
  auditLogs: [appRoles.admin],
  users: [appRoles.admin],
} as const;

export type RouteAccessKey = keyof typeof routeAccessControl;

export const featureAccessControl = {
  exportCsv: [appRoles.admin, appRoles.maintenanceManager, appRoles.direction],
  equipmentManage: [appRoles.admin, appRoles.maintenanceManager],
  breakdownRead: [appRoles.admin, appRoles.maintenanceManager],
  breakdownDeclare: [appRoles.operator],
  breakdownManage: [appRoles.admin, appRoles.maintenanceManager],
  workOrderRead: [appRoles.admin, appRoles.maintenanceManager, appRoles.technician],
  workOrderManage: [appRoles.admin, appRoles.maintenanceManager],
  workOrderStart: [appRoles.technician],
  workOrderCloseWithReport: [appRoles.technician],
  stockRead: [appRoles.admin, appRoles.storekeeper],
  stockManage: [appRoles.admin, appRoles.storekeeper],
  maintenancePlanRead: [appRoles.admin, appRoles.maintenanceManager],
  maintenancePlanManage: [appRoles.admin, appRoles.maintenanceManager],
  userManage: [appRoles.admin],
  equipmentDocumentRead: [appRoles.admin, appRoles.maintenanceManager, appRoles.technician],
  equipmentDocumentUpload: [appRoles.admin, appRoles.maintenanceManager, appRoles.technician],
  equipmentDocumentDelete: [appRoles.admin, appRoles.maintenanceManager],
  equipmentDocumentGenerateAi: [appRoles.admin, appRoles.maintenanceManager],
  aiAssistantAsk: [appRoles.admin, appRoles.maintenanceManager, appRoles.technician, appRoles.direction],
  aiAssistantDiagnosis: [appRoles.admin, appRoles.maintenanceManager, appRoles.technician, appRoles.operator],
} as const;

export type FeatureAccessKey = keyof typeof featureAccessControl;
