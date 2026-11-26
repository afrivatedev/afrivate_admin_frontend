import React, { useCallback, useEffect, useState } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { SESSION_ENDED_EVENT, clearLegacySession, fetchMe } from './api';
import Layout from './components/Layout';
import ActionLog from './pages/ActionLog';
import Broadcasts from './pages/Broadcasts';
import Connections from './pages/Connections';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import UserDetail from './pages/UserDetail';
import Users from './pages/Users';

export default function App() {
  // 'checking' until the server confirms whether a valid session cookie exists.
  const [session, setSession] = useState({ status: 'checking', admin: null });

  useEffect(() => {
    clearLegacySession();
    let active = true;
    fetchMe()
      .then((admin) => active && setSession({ status: 'in', admin }))
      .catch(() => active && setSession({ status: 'out', admin: null }));

    const onEnded = () => setSession({ status: 'out', admin: null });
    window.addEventListener(SESSION_ENDED_EVENT, onEnded);
    return () => {
      active = false;
      window.removeEventListener(SESSION_ENDED_EVENT, onEnded);
    };
  }, []);

  const signIn = useCallback((admin) => setSession({ status: 'in', admin }), []);
  const signOut = useCallback(() => setSession({ status: 'out', admin: null }), []);

  if (session.status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 text-sm">
        Loading…
      </div>
    );
  }

  const signedIn = session.status === 'in';

  return (
    <HashRouter>
      <Routes>
        <Route
          path="/login"
          element={signedIn ? <Navigate to="/" replace /> : <Login onSignedIn={signIn} />}
        />
        <Route
          path="/"
          element={
            signedIn ? (
              <Layout admin={session.admin} onSignedOut={signOut} />
            ) : (
              <Navigate to="/login" replace />
            )
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
