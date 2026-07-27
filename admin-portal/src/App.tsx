import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './components/admin/AdminLayout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Instructor console routes */}
        <Route path="/instructor/*" element={
          <AdminLayout 
            onExit={() => window.location.reload()} 
            isInstructor={true} 
            isAdminSubdomain={true} 
          />
        } />
        {/* Admin console routes */}
        <Route path="/*" element={
          <AdminLayout 
            onExit={() => window.location.reload()} 
            isAdminSubdomain={true} 
          />
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
