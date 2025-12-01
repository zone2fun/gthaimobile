import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './components/AdminLayout';
import AdminLogin from './pages/AdminLogin';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import ContentModeration from './pages/ContentModeration';
import AnnouncementManager from './pages/AnnouncementManager';
import Settings from './pages/Settings';
import ApprovePhoto from './pages/ApprovePhoto';
import ApprovePosts from './pages/ApprovePosts';
import VerifiedRequests from './pages/VerifiedRequests';

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole }) => {
    const token = localStorage.getItem('adminToken');
    const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // Check role if required
    if (requiredRole && adminUser.role !== requiredRole && adminUser.role !== 'admin') {
        return <Navigate to="/" replace />;
    }

    return children;
};

function App() {
    return (
        <Router>
            <Routes>
                {/* Public Route */}
                <Route path="/login" element={<AdminLogin />} />

                {/* Protected Routes */}
                <Route path="/" element={
                    <ProtectedRoute>
                        <AdminLayout />
                    </ProtectedRoute>
                }>
                    <Route index element={<Dashboard />} />
                    <Route path="users" element={<UserManagement />} />
                    <Route path="moderation" element={<ContentModeration />} />
                    <Route path="announcements" element={<AnnouncementManager />} />
                    <Route path="approve-photo" element={<ApprovePhoto />} />
                    <Route path="approve-posts" element={<ApprovePosts />} />
                    <Route path="verified-requests" element={<VerifiedRequests />} />
                    <Route path="settings" element={
                        <ProtectedRoute requiredRole="admin">
                            <Settings />
                        </ProtectedRoute>
                    } />
                </Route>
            </Routes>
        </Router>
    );
}

export default App;
