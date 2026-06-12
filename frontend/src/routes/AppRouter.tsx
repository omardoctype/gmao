import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { LoginPage } from "@/pages/auth/LoginPage";
import { AiAssistantPage } from "@/pages/ai-assistant/AiAssistantPage";
import { AuditLogsPage } from "@/pages/audit-logs/AuditLogsPage";
import { BreakdownsPage } from "@/pages/breakdowns/BreakdownsPage";
import { DashboardPage } from "@/pages/dashboard/DashboardPage";
import { EquipmentsPage } from "@/pages/equipments/EquipmentsPage";
import { MaintenancePlansPage } from "@/pages/maintenance-plans/MaintenancePlansPage";
import { MyProfilePage } from "@/pages/my-profile/MyProfilePage";
import { NotFoundPage } from "@/pages/not-found/NotFoundPage";
import { NotificationsPage } from "@/pages/notifications/NotificationsPage";
import { PredictiveMaintenancePage } from "@/pages/predictive-maintenance/PredictiveMaintenancePage";
import { StockPartsPage } from "@/pages/stock/StockPartsPage";
import { UsersPage } from "@/pages/users/UsersPage";
import { WorkOrdersPage } from "@/pages/work-orders/WorkOrdersPage";
import { routeAccessControl } from "@/routes/access-control";
import { PrivateRoute } from "@/routes/guards/PrivateRoute";
import { PublicRoute } from "@/routes/guards/PublicRoute";
import { routePaths } from "@/routes/route-paths";

export function AppRouter() {
  return (
    <Routes>
      <Route
        path={routePaths.login}
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />

      <Route
        path={routePaths.root}
        element={
          <PrivateRoute>
            <AppLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to={routePaths.dashboard} replace />} />
        <Route
          path={routePaths.dashboard.slice(1)}
          element={
            <PrivateRoute allowedRoles={routeAccessControl.dashboard}>
              <DashboardPage />
            </PrivateRoute>
          }
        />
        <Route
          path={routePaths.predictiveMaintenance.slice(1)}
          element={
            <PrivateRoute allowedRoles={routeAccessControl.predictiveMaintenance}>
              <PredictiveMaintenancePage />
            </PrivateRoute>
          }
        />
        <Route
          path={routePaths.aiAssistant.slice(1)}
          element={
            <PrivateRoute allowedRoles={routeAccessControl.aiAssistant}>
              <AiAssistantPage />
            </PrivateRoute>
          }
        />
        <Route
          path={routePaths.notifications.slice(1)}
          element={
            <PrivateRoute allowedRoles={routeAccessControl.notifications}>
              <NotificationsPage />
            </PrivateRoute>
          }
        />
        <Route
          path={routePaths.auditLogs.slice(1)}
          element={
            <PrivateRoute allowedRoles={routeAccessControl.auditLogs}>
              <AuditLogsPage />
            </PrivateRoute>
          }
        />
        <Route
          path={routePaths.users.slice(1)}
          element={
            <PrivateRoute allowedRoles={routeAccessControl.users}>
              <UsersPage />
            </PrivateRoute>
          }
        />
        <Route
          path={routePaths.myProfile.slice(1)}
          element={
            <PrivateRoute>
              <MyProfilePage />
            </PrivateRoute>
          }
        />
        <Route
          path={routePaths.equipments.slice(1)}
          element={
            <PrivateRoute allowedRoles={routeAccessControl.equipments}>
              <EquipmentsPage />
            </PrivateRoute>
          }
        />
        <Route
          path={routePaths.breakdowns.slice(1)}
          element={
            <PrivateRoute allowedRoles={routeAccessControl.breakdowns}>
              <BreakdownsPage />
            </PrivateRoute>
          }
        />
        <Route
          path={routePaths.workOrders.slice(1)}
          element={
            <PrivateRoute allowedRoles={routeAccessControl.workOrders}>
              <WorkOrdersPage />
            </PrivateRoute>
          }
        />
        <Route
          path={routePaths.stockParts.slice(1)}
          element={
            <PrivateRoute allowedRoles={routeAccessControl.stockParts}>
              <StockPartsPage />
            </PrivateRoute>
          }
        />
        <Route
          path={routePaths.maintenancePlans.slice(1)}
          element={
            <PrivateRoute allowedRoles={routeAccessControl.maintenancePlans}>
              <MaintenancePlansPage />
            </PrivateRoute>
          }
        />
        <Route path="stock" element={<Navigate to={routePaths.stockParts} replace />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
