import React from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { getSession } from './api';
import Layout from './components/Layout';
import ActionLog from './pages/ActionLog';
import Broadcasts from './pages/Broadcasts';
import Connections from './pages/Connections';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import UserDetail from './pages/UserDetail';
import Users from './pages/Users';

function RequireAuth({ children }) {
  return getSession()?.access_token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="users/:id" element={<UserDetail />} />
          <Route path="connections" element={<Connections />} />
          <Route path="broadcasts" element={<Broadcasts />} />
          <Route path="actions" element={<ActionLog />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
