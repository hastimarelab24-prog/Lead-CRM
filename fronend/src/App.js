import React from "react";
import { AuthProvider } from "./context/AuthContext";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Login from "./Pages/Login";
import Register from "./Pages/Register";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./Pages/Dashboard";
import Leads from "./Pages/Leads";
import Team from "./Pages/Team";
import AssignLead from "./Pages/AssignLead";
import AuditLogs from "./Pages/AuditLogs";
import CreateUser from "./Pages/CreateUser";
import FollowUps from "./Pages/FollowUp";
import LeadActivity from "./Pages/LeadActivity";

function App() {
  return (
    <AuthProvider>
         {/* <BrowserRouter> */}
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<ProtectedRoute />}>
            <Route
              path="/dashboard"
              element={<Dashboard />}
            />

            <Route path="/leads" element={<Leads />} />

            <Route
              path="/follow-up"
              element={<FollowUps />}
            />

            <Route
              path="/leads/:leadId/activities"
              element={<LeadActivity />}
            />

            <Route
              element={
                <ProtectedRoute
                  allowedRoles={["administrator"]}
                />
              }
            >
              <Route path="/team" element={<Team />} />
              <Route
                path="/team/create"
                element={<CreateUser />}
              />
              <Route
                path="/audit-logs"
                element={<AuditLogs />}
              />
            </Route>

            <Route
              element={
                <ProtectedRoute
                  allowedRoles={["administrator", "manager"]}
                />
              }
            >
              <Route
                path="/assign-lead"
                element={<AssignLead />}
              />
            </Route>
          </Route>

          <Route
            path="/"
            element={<Navigate to="/dashboard" replace />}
          />

          <Route
            path="*"
            element={<Navigate to="/dashboard" replace />}
          />
        </Routes>
        {/* </BrowserRouter> */}
      </AuthProvider>
    
  );
}

export default App;