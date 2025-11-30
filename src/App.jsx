import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import PrivateRoute from './components/PrivateRoute';
import Home from './pages/Home';
import Favourites from './pages/Favourites';
import Special from './pages/Special';
import Chat from './pages/Chat';
import ChatDetail from './pages/ChatDetail';
import Profile from './pages/Profile';
import UserProfile from './pages/UserProfile';
import PostDetail from './pages/PostDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import EditProfile from './pages/EditProfile';
import BlockList from './pages/BlockList';
import SearchResults from './pages/SearchResults';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import LocationTracker from './components/LocationTracker';
import AdManager from './components/AdManager';
import SafetyPolicy from './pages/SafetyPolicy';
import Maintenance from './pages/Maintenance';

const MainLayout = () => {
  return (
    <>
      <Header />
      <div className="app-content">
        <Outlet />
      </div>
      <BottomNav />
    </>
  );
};

function App() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [checkingMaintenance, setCheckingMaintenance] = useState(true);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const checkMaintenanceMode = async () => {
      try {
        const response = await fetch(`${API_URL}/api/settings/public`);
        if (response.ok) {
          const data = await response.json();
          setMaintenanceMode(data.maintenanceMode || false);
        }
      } catch (error) {
        console.error('Error checking maintenance mode:', error);
      } finally {
        setCheckingMaintenance(false);
      }
    };

    checkMaintenanceMode();

    // Check every 30 seconds
    const interval = setInterval(checkMaintenanceMode, 30000);
    return () => clearInterval(interval);
  }, []);

  if (checkingMaintenance) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: 'white' }}>Loading...</div>;
  }

  if (maintenanceMode) {
    return <Maintenance />;
  }

  return (
    <AuthProvider>
      <SocketProvider>
        <LocationTracker />
        <Router>
          <AdManager />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />

            <Route element={<MainLayout />}>
              {/* Public route - Home only */}
              <Route path="/" element={<Home />} />
              <Route path="/safety-policy" element={<SafetyPolicy />} />

              {/* Protected routes */}
              <Route path="/favourites" element={<PrivateRoute><Favourites /></PrivateRoute>} />
              <Route path="/special" element={<PrivateRoute><Special /></PrivateRoute>} />
              <Route path="/chat" element={<PrivateRoute><Chat /></PrivateRoute>} />
              <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
              <Route path="/edit-profile" element={<PrivateRoute><EditProfile /></PrivateRoute>} />
              <Route path="/blocked-users" element={<PrivateRoute><BlockList /></PrivateRoute>} />
              <Route path="/search" element={<PrivateRoute><SearchResults /></PrivateRoute>} />
            </Route>

            {/* Protected routes outside MainLayout */}
            <Route path="/chat/:id" element={<PrivateRoute><ChatDetail /></PrivateRoute>} />
            <Route path="/user/:id" element={<UserProfile />} />
            <Route path="/post/:id" element={<PrivateRoute><PostDetail /></PrivateRoute>} />

            {/* Catch-all route - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
