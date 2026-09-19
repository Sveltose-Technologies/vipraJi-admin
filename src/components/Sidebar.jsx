import React from 'react';
import { NavLink } from 'react-router-dom';
import { MdHome, MdPerson, MdSettings, MdLibraryBooks, MdMusicNote } from 'react-icons/md';

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <img src="/logo.png" alt="VJ Logo" style={{ height: '80px', width: 'auto', objectFit: 'contain' }} onError={(e) => { e.target.style.display = 'none' }} />
      </div>

      <nav className="sidebar-nav">
        
        <div className="sidebar-section">
          <div className="sidebar-section-title">Main</div>
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
            <MdHome size={20} />
            <span>Home</span>
          </NavLink>
          <NavLink to="/manage-users" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
            <MdPerson size={20} />
            <span>Manage Users</span>
          </NavLink>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-title">Pooja & Content</div>
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
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-title">Yajman</div>
          <NavLink to="/manage-yajman" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
            <MdPerson size={20} />
            <span>Manage Yajman</span>
          </NavLink>
          <NavLink to="/manage-yajman-categories" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
            <MdLibraryBooks size={20} />
            <span>Yajman Categories</span>
          </NavLink>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-title">System & Settings</div>
          <NavLink to="/manage-support-ticket-categories" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
            <MdLibraryBooks size={20} />
            <span>Support Tickets</span>
          </NavLink>
          <NavLink to="/update-profile" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
            <MdPerson size={20} />
            <span>Update Profile</span>
          </NavLink>
        </div>

        <style>{`
          .sidebar-section {
            display: flex;
            flex-direction: column;
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 0.5rem;
            margin-bottom: 0.5rem;
          }
          
          .sidebar-section:last-child {
            border-bottom: none;
            padding-bottom: 0;
            margin-bottom: 0;
          }

          .sidebar-section-title {
            padding: 0.5rem 1.5rem;
            font-size: 0.75rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--text-secondary);
            margin-top: 0.5rem;
          }
        `}</style>
      </nav>
    </aside>
  );
};

export default Sidebar;
