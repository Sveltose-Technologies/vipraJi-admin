import React from 'react';
import { NavLink } from 'react-router-dom';
import { MdHome, MdPerson, MdSettings, MdLibraryBooks, MdMusicNote } from 'react-icons/md';

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        {/* Placeholder for Logo, user will replace /logo.png with actual file */}
        <img src="/logo.png" alt="VJ Logo" style={{ height: '100px', width: '100px', marginRight: '12px', objectFit: 'contain' }} onError={(e) => { e.target.style.display = 'none' }} />
        <span className="sidebar-logo-text">VIPRA SARTHI</span>
      </div>

      <nav className="sidebar-nav">
        {/* Mock navigation links */}
        <NavLink to="/dashboard" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
          <MdHome size={20} />
          <span>Home</span>
        </NavLink>

        <NavLink to="/manage-pooja" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
          <MdLibraryBooks size={20} />
          <span>Manage Pooja</span>
        </NavLink>

        <NavLink to="/manage-pooja-samagri" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
          <MdLibraryBooks size={20} />
          <span>Pooja Samagri</span>
        </NavLink>

        <NavLink to="/manage-stotram" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
          <MdLibraryBooks size={20} />
          <span>Manage Stotram</span>
        </NavLink>

        <NavLink to="/manage-aarti" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
          <MdMusicNote size={20} />
          <span>Manage Aarti</span>
        </NavLink>

        <NavLink to="/update-profile" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
          <MdPerson size={20} />
          <span>Update Profile</span>
        </NavLink>

        <NavLink to="/settings" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
          <MdSettings size={20} />
          <span>Settings</span>
        </NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar;
