import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { Outlet, useLocation } from 'react-router-dom';

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Close sidebar on route change for mobile
  useEffect(() => {
    if (window.innerWidth <= 1024) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname]);

  return (
    <div className="admin-layout">
      {isSidebarOpen && <div className="sidebar-overlay" onClick={toggleSidebar}></div>}
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="main-content">
        <Header toggleSidebar={toggleSidebar} />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
