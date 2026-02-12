import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import Layout from "./components/Layout";

// Import new pages
import LiveStream from "./pages/monitoring/LiveStream";
import ProductionLog from "./pages/production/ProductionLog";
import SessionManagement from "./pages/production/SessionManagement";
import Timeline from "./pages/production/Timeline";
import CameraSettings from "./pages/configuration/CameraSettings";
import ModelConfig from "./pages/configuration/ModelConfig";
import Templates from "./pages/configuration/Templates";
import VirtualLine from "./pages/configuration/VirtualLine";
import QualityDashboard from "./pages/quality/QualityDashboard";
import ManualVerification from "./pages/quality/ManualVerification";
import AnomalyDetection from "./pages/quality/AnomalyDetection";
import AlertManagement from "./pages/alerts/AlertManagement";
import ProductionReports from "./pages/reports/ProductionReports";
import DataExport from "./pages/reports/DataExport";
import UserManagement from "./pages/administration/UserManagement";
import SystemSettings from "./pages/administration/SystemSettings";
import PerformanceAnalytics from "./pages/analytics/PerformanceAnalytics";
import SystemHealth from "./pages/maintenance/SystemHealth";
import ThirdParty from "./pages/integration/ThirdParty";


function Router() {
  return (
    <Switch>
      <Route path="/">
        <Layout activeRoute="dashboard">
          <Dashboard />
        </Layout>
      </Route>

      {/* Monitoring */}
      <Route path="/monitoring/live">
        <Layout activeRoute="live-stream">
          <LiveStream />
        </Layout>
      </Route>

      {/* Production */}
      <Route path="/production/log">
        <Layout activeRoute="production-log">
          <ProductionLog />
        </Layout>
      </Route>
      <Route path="/production/sessions">
        <Layout activeRoute="sessions">
          <SessionManagement />
        </Layout>
      </Route>
      <Route path="/production/timeline">
        <Layout activeRoute="timeline">
          <Timeline />
        </Layout>
      </Route>

      {/* Configuration */}
      <Route path="/config/camera">
        <Layout activeRoute="camera-settings">
          <CameraSettings />
        </Layout>
      </Route>
      <Route path="/config/model">
        <Layout activeRoute="model-config">
          <ModelConfig />
        </Layout>
      </Route>
      <Route path="/config/templates">
        <Layout activeRoute="templates">
          <Templates />
        </Layout>
      </Route>
      <Route path="/config/line">
        <Layout activeRoute="virtual-line">
          <VirtualLine />
        </Layout>
      </Route>

      {/* Quality */}
      <Route path="/quality/dashboard">
        <Layout activeRoute="quality-dash">
          <QualityDashboard />
        </Layout>
      </Route>
      <Route path="/quality/verification">
        <Layout activeRoute="verification">
          <ManualVerification />
        </Layout>
      </Route>
      <Route path="/quality/anomalies">
        <Layout activeRoute="anomalies">
          <AnomalyDetection />
        </Layout>
      </Route>

      {/* Alerts */}
      <Route path="/alerts/management">
        <Layout activeRoute="alert-mgmt">
          <AlertManagement />
        </Layout>
      </Route>

      {/* Reports */}
      <Route path="/reports/production">
        <Layout activeRoute="reports">
          <ProductionReports />
        </Layout>
      </Route>
      <Route path="/reports/export">
        <Layout activeRoute="export">
          <DataExport />
        </Layout>
      </Route>

      {/* Administration */}
      <Route path="/admin/users">
        <Layout activeRoute="users">
          <UserManagement />
        </Layout>
      </Route>
      <Route path="/admin/system">
        <Layout activeRoute="system">
          <SystemSettings />
        </Layout>
      </Route>

      {/* Analytics */}
      <Route path="/analytics/performance">
        <Layout activeRoute="analytics">
          <PerformanceAnalytics />
        </Layout>
      </Route>

      {/* Maintenance */}
      <Route path="/maintenance/health">
        <Layout activeRoute="health">
          <SystemHealth />
        </Layout>
      </Route>

      {/* Integration */}
      <Route path="/integration/third-party">
        <Layout activeRoute="integration">
          <ThirdParty />
        </Layout>
      </Route>

      <Route path="/404" component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
