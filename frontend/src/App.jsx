import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import AppLayout from './layouts/AppLayout';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import RoadMap from './pages/RoadMap';
import CameraMonitoring from './pages/CameraMonitoring';
import RiskAnalysis from './pages/RiskAnalysis';
import WeatherIntelligence from './pages/WeatherIntelligence';
import HazardDetection from './pages/HazardDetection';
import Recommendations from './pages/Recommendations';
import WorkOrders from './pages/WorkOrders';
import TrafficSimulation from './pages/TrafficSimulation';
import BeforeAfterComparison from './pages/BeforeAfterComparison';
import DepartmentAnalytics from './pages/DepartmentAnalytics';
import AlertsNotifications from './pages/AlertsNotifications';
import OfficialReports from './pages/OfficialReports';
import UserManagement from './pages/UserManagement';
import SettingsPage from './pages/SettingsPage';
import MediaInspector from './pages/MediaInspector';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#070b14] text-cyan-400 font-semibold text-xs">
        Connecting to Tamil Nadu Road Safety Network...
      </div>
    );
  }
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="map" element={<RoadMap />} />
            <Route path="cameras" element={<CameraMonitoring />} />
            <Route path="manual-inspection" element={<MediaInspector />} />
            <Route path="risk-analysis" element={<RiskAnalysis />} />
            <Route path="weather" element={<WeatherIntelligence />} />
            <Route path="hazards" element={<HazardDetection />} />
            <Route path="recommendations" element={<Recommendations />} />
            <Route path="work-orders" element={<WorkOrders />} />
            <Route path="simulation" element={<TrafficSimulation />} />
            <Route path="before-after" element={<BeforeAfterComparison />} />
            <Route path="analytics" element={<DepartmentAnalytics />} />
            <Route path="alerts" element={<AlertsNotifications />} />
            <Route path="reports" element={<OfficialReports />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
