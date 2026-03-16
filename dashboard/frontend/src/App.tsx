import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Layout from "./components/Layout";

import Login from "./pages/Login";
import Profile from "./pages/Profile";
import LiveStream from "./pages/monitoring/LiveStream";
import ProductionLog from "./pages/production/ProductionLog";
import SessionManagement from "./pages/production/SessionManagement";
import Timeline from "./pages/production/Timeline";
import CameraSettings from "./pages/configuration/CameraSettings";
import ModelConfig from "./pages/configuration/ModelConfig";
import Templates from "./pages/configuration/Templates";
import VirtualLine from "./pages/configuration/VirtualLine";
import QualityDashboard from "./pages/quality/QualityDashboard";
import AnomalyDetection from "./pages/quality/AnomalyDetection";
import AlertManagement from "./pages/alerts/AlertManagement";
import ProductionReports from "./pages/reports/ProductionReports";
import DataExport from "./pages/reports/DataExport";
import AuditTrail from "./pages/reports/AuditTrail";
import UserManagement from "./pages/administration/UserManagement";
import SystemSettings from "./pages/administration/SystemSettings";
import DeviceManagement from "./pages/administration/DeviceManagement";
import ApiManagement from "./pages/administration/ApiManagement";
import PerformanceAnalytics from "./pages/analytics/PerformanceAnalytics";
import SystemHealth from "./pages/maintenance/SystemHealth";
import DatabaseManagement from "./pages/maintenance/DatabaseManagement";
import Diagnostics from "./pages/maintenance/Diagnostics";
import ThirdParty from "./pages/integration/ThirdParty";

// ── Helper: protected page with Layout ────────────────────────────────────────
function P({
  route, perm, children,
}: {
  route: string;
  perm?: string;
  children: React.ReactNode;
}) {
  return (
    <Layout activeRoute={route}>
      <ProtectedRoute permission={perm}>
        {children}
      </ProtectedRoute>
    </Layout>
  );
}

// ── Router ─────────────────────────────────────────────────────────────────────
function Router() {
  return (
    <Switch>
      {/* Public */}
      <Route path="/login" component={Login} />

      {/* Dashboard */}
      <Route path="/">
        <P route="dashboard" perm="dashboard_view"><Dashboard /></P>
      </Route>

      {/* Profile — accessible to any authenticated user */}
      <Route path="/profile">
        <P route="profile"><Profile /></P>
      </Route>

      {/* Monitoring */}
      <Route path="/monitoring/live">
        <P route="live-stream" perm="livestream_view"><LiveStream /></P>
      </Route>

      {/* Production */}
      <Route path="/production/log">
        <P route="production-log" perm="logs_view"><ProductionLog /></P>
      </Route>
      <Route path="/production/sessions">
        <P route="sessions" perm="sessions_manage"><SessionManagement /></P>
      </Route>
      <Route path="/production/timeline">
        <P route="timeline" perm="timeline_view"><Timeline /></P>
      </Route>

      {/* Configuration */}
      <Route path="/config/camera">
        <P route="camera-settings" perm="config_camera"><CameraSettings /></P>
      </Route>
      <Route path="/config/model">
        <P route="model-config" perm="config_model"><ModelConfig /></P>
      </Route>
      <Route path="/config/templates">
        <P route="templates" perm="config_templates"><Templates /></P>
      </Route>
      <Route path="/config/line">
        <P route="virtual-line" perm="config_line"><VirtualLine /></P>
      </Route>

      {/* Quality */}
      <Route path="/quality/dashboard">
        <P route="quality-dash" perm="quality_view"><QualityDashboard /></P>
      </Route>
      <Route path="/quality/anomalies">
        <P route="anomalies" perm="anomalies_view"><AnomalyDetection /></P>
      </Route>

      {/* Alerts */}
      <Route path="/alerts/management">
        <P route="alert-mgmt" perm="alerts_view"><AlertManagement /></P>
      </Route>

      {/* Reports */}
      <Route path="/reports/production">
        <P route="reports" perm="reports_view"><ProductionReports /></P>
      </Route>
      <Route path="/reports/export">
        <P route="export" perm="reports_export"><DataExport /></P>
      </Route>
      <Route path="/reports/audit">
        <P route="audit" perm="reports_view"><AuditTrail /></P>
      </Route>

      {/* Administration */}
      <Route path="/admin/users">
        <P route="users" perm="users_manage"><UserManagement /></P>
      </Route>
      <Route path="/admin/system">
        <P route="system" perm="system_settings"><SystemSettings /></P>
      </Route>
      <Route path="/admin/devices">
        <P route="devices" perm="devices_manage"><DeviceManagement /></P>
      </Route>
      <Route path="/admin/api">
        <P route="api-mgmt" perm="system_settings"><ApiManagement /></P>
      </Route>

      {/* Analytics */}
      <Route path="/analytics/performance">
        <P route="analytics" perm="analytics_view"><PerformanceAnalytics /></P>
      </Route>

      {/* Maintenance */}
      <Route path="/maintenance/health">
        <P route="health" perm="maintenance_view"><SystemHealth /></P>
      </Route>
      <Route path="/maintenance/database">
        <P route="database" perm="database_manage"><DatabaseManagement /></P>
      </Route>
      <Route path="/maintenance/diagnostics">
        <P route="diagnostics" perm="maintenance_view"><Diagnostics /></P>
      </Route>

      {/* Integration */}
      <Route path="/integration/third-party">
        <P route="integration" perm="system_settings"><ThirdParty /></P>
      </Route>

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

// ── App ────────────────────────────────────────────────────────────────────────
function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
