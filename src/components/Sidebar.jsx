import React from "react";
import { NavLink } from "react-router-dom";
import {
  MdDashboard,
  MdPerson,
  MdNotificationsActive,
  MdLibraryBooks,
  MdMusicNote,
  MdCardMembership,
  MdForum,
  MdConfirmationNumber,
  MdClose,
  MdSelfImprovement,
  MdWavingHand,
} from "react-icons/md";

const Sidebar = ({ isOpen, toggleSidebar }) => {
  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header" style={{ justifyContent: "center" }}>
        <img
          src="/sidebar-logo.png?v=2"
          alt="Vipra Sarthi Typography Logo"
          style={{ width: "100%", maxHeight: "40px", objectFit: "contain" }}
          onError={(e) => {
            e.target.style.display = "none";
          }}
        />
        <button className="sidebar-close-btn mobile-only" onClick={toggleSidebar} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', marginLeft: 'auto' }}>
          <MdClose size={20} />
        </button>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section">
          <div className="sidebar-section-title">Main</div>
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              isActive ? "sidebar-link active" : "sidebar-link"
            }
          >
            <MdDashboard size={17} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink
            to="/manage-users"
            className={({ isActive }) =>
              isActive ? "sidebar-link active" : "sidebar-link"
            }
          >
            <MdPerson size={17} />
            <span>Manage Users</span>
          </NavLink>
          <NavLink
            to="/manage-notifications"
            className={({ isActive }) =>
              isActive ? "sidebar-link active" : "sidebar-link"
            }
          >
            <MdNotificationsActive size={17} />
            <span>Notifications</span>
          </NavLink>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-title">Pooja & Content</div>
          <NavLink
            to="/manage-welcome-screen"
            className={({ isActive }) =>
              isActive ? "sidebar-link active" : "sidebar-link"
            }
          >
            <MdWavingHand size={17} />
            <span>Welcome Screen</span>
          </NavLink>
          <NavLink
            to="/manage-spiritual-cards"
            className={({ isActive }) =>
              isActive ? "sidebar-link active" : "sidebar-link"
            }
          >
            <MdSelfImprovement size={17} />
            <span>Spiritual Cards</span>
          </NavLink>
          <NavLink
            to="/manage-pooja"
            className={({ isActive }) =>
              isActive ? "sidebar-link active" : "sidebar-link"
            }
          >
            <MdLibraryBooks size={17} />
            <span>Manage Pooja</span>
          </NavLink>
          <NavLink
            to="/manage-pooja-samagri"
            className={({ isActive }) =>
              isActive ? "sidebar-link active" : "sidebar-link"
            }
          >
            <MdLibraryBooks size={17} />
            <span>Pooja Samagri</span>
          </NavLink>
          <NavLink
            to="/manage-stotram"
            className={({ isActive }) =>
              isActive ? "sidebar-link active" : "sidebar-link"
            }
          >
            <MdLibraryBooks size={17} />
            <span>Manage Stotram</span>
          </NavLink>
          <NavLink
            to="/manage-aarti"
            className={({ isActive }) =>
              isActive ? "sidebar-link active" : "sidebar-link"
            }
          >
            <MdMusicNote size={17} />
            <span>Manage Aarti</span>
          </NavLink>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-title">Yajman</div>
          <NavLink
            to="/manage-yajman"
            className={({ isActive }) =>
              isActive ? "sidebar-link active" : "sidebar-link"
            }
          >
            <MdPerson size={17} />
            <span>Manage Yajman</span>
          </NavLink>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-title">Community</div>
          <NavLink
            to="/manage-community"
            className={({ isActive }) =>
              isActive ? "sidebar-link active" : "sidebar-link"
            }
          >
            <MdForum size={17} />
            <span>Manage Community</span>
          </NavLink>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-title">Subscriptions & Billing</div>
          <NavLink
            to="/manage-subscriptions"
            className={({ isActive }) =>
              isActive ? "sidebar-link active" : "sidebar-link"
            }
          >
            <MdCardMembership size={17} />
            <span>Manage Subscriptions</span>
          </NavLink>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-title">System & Settings</div>
          <NavLink
            to="/manage-support-tickets"
            className={({ isActive }) =>
              isActive ? "sidebar-link active" : "sidebar-link"
            }
          >
            <MdConfirmationNumber size={17} />
            <span>Support Tickets</span>
          </NavLink>
          <NavLink
            to="/update-profile"
            className={({ isActive }) =>
              isActive ? "sidebar-link active" : "sidebar-link"
            }
            onClick={() => { if (window.innerWidth <= 1024) toggleSidebar(); }}
          >
            <MdPerson size={17} />
            <span>Update Profile</span>
          </NavLink>
        </div>

        <style>{`
          .sidebar-section {
            display: flex;
            flex-direction: column;
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 0.3rem;
            margin-bottom: 0.3rem;
          }
          
          .sidebar-section:last-child {
            border-bottom: none;
            padding-bottom: 0;
            margin-bottom: 0;
          }

          .sidebar-section-title {
            padding: 0.28rem 1rem;
            font-size: 0.68rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--text-secondary);
            margin-top: 0.2rem;
          }
        `}</style>
      </nav>
    </aside>
  );
};

export default Sidebar;
