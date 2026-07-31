import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import AdminDashboard from './pages/AdminDashboard';
import NewComplaint from './pages/NewComplaint';
import Login from './pages/Login';
import Register from './pages/Register';

function App() {
  return (
    <div>
      {/* Navbar will now show on all pages, including login */}
      <Navbar />
      
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/new-complaint" element={<NewComplaint />} />
        <Route path="*" element={<Login />} />
      </Routes>
    </div>
  );
}

export default App;