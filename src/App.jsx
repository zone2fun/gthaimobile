import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
import Favourites from './pages/Favourites';
import Special from './pages/Special';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import UserProfile from './pages/UserProfile';

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/favourites" element={<Favourites />} />
        <Route path="/special" element={<Special />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/user/:id" element={<UserProfile />} />
      </Routes>
      <BottomNav />
    </Router>
  );
}

export default App;
