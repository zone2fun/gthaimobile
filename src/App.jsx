import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
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
import Login from './pages/Login';
import Register from './pages/Register';
import EditProfile from './pages/EditProfile';
import BlockList from './pages/BlockList';
import SearchResults from './pages/SearchResults';

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
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route element={<MainLayout />}>
              {/* Public route - Home only */}
              <Route path="/" element={<Home />} />

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
            <Route path="/user/:id" element={<PrivateRoute><UserProfile /></PrivateRoute>} />
          </Routes>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
