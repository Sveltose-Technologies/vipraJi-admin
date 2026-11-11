import React from "react";
import { NavLink } from "react-router-dom";
import {
  MdDashboard,
  MdPerson,
  MdGroup,
  MdManageAccounts,
  MdNotificationsActive,
  MdLibraryBooks,
  MdShoppingBasket,
  MdMenuBook,
  MdMusicNote,
  MdCardMembership,
  MdForum,
  MdConfirmationNumber,
  MdClose,
  MdSelfImprovement,
  MdWavingHand,
} from "react-icons/md";

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const handleNavClick = () => {
    if (window.innerWidth <= 1024 && isOpen) {
      toggleSidebar();
    }
  };

  return (
    <aside className={`sidebar ${isOpen ? "open" : ""}`} aria-label="Main navigation">
      <div className="sidebar-header">
        <div className="sidebar-brand-mark">
          <img
            src="/logo.png"
            alt="Vipra Sarthi"
            className="sidebar-brand-icon"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        </div>
        <div className="sidebar-brand-full">
          <img
            src="/sidebar-logo.png?v=2"
            alt="Vipra Sarthi Typography Logo"
            className="sidebar-brand-wordmark"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        </div>
        <button
          type="button"
          className="sidebar-close-btn mobile-only"
          onClick={toggleSidebar}
          aria-label="Close sidebar"
          style={{
            background: "none",
            border: "none",
            color: "var(--primary-color)",
            cursor: "pointer",
            marginLeft: "auto",
            padding: "0 0.75rem",
          }}
        >
          <MdClose size={20} />
        </button>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section">
          <div className="sidebar-section-title">Main</div>
          <NavLink
            to="/dashboard"
            title="Dashboard"
            onClick={handleNavClick}
            className={({ isActive }) =>
              isActive ? "sidebar-link active" : "sidebar-link"
            }
          >
            <span className="sidebar-icon"><MdDashboard size={18} /></span>
            <span className="sidebar-label">Dashboard</span>
          </NavLink>
          <NavLink
            to="/manage-users"
            title="Manage Users"
            onClick={handleNavClick}
            className={({ isActive }) =>
              isActive ? "sidebar-link active" : "sidebar-link"
            }
          >
            <span className="sidebar-icon"><MdPerson size={18} /></span>
            <span className="sidebar-label">Manage Users</span>
          </NavLink>
          <NavLink
            to="/manage-notifications"
            title="Notifications"
            onClick={handleNavClick}
            className={({ isActive }) =>
              isActive ? "sidebar-link active" : "sidebar-link"
            }
          >
            <span className="sidebar-icon"><MdNotificationsActive size={18} /></span>
            <span className="sidebar-label">Notifications</span>
          </NavLink>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-title">Pooja & Content</div>
          <NavLink
            to="/manage-welcome-screen"
            title="Welcome Screen"
            onClick={handleNavClick}
            className={({ isActive }) =>
              isActive ? "sidebar-link active" : "sidebar-link"
            }
          >
            <span className="sidebar-icon"><MdWavingHand size={18} /></span>
            <span className="sidebar-label">Welcome Screen</span>
          </NavLink>
          <NavLink
            to="/manage-spiritual-cards"
            title="Spiritual Cards"
            onClick={handleNavClick}
            className={({ isActive }) =>
              isActive ? "sidebar-link active" : "sidebar-link"
            }
          >
            <span className="sidebar-icon"><MdSelfImprovement size={18} /></span>
            <span className="sidebar-label">Spiritual Cards</span>
          </NavLink>
          <NavLink
            to="/manage-pooja"
            title="Manage Pooja"
            onClick={handleNavClick}
            className={({ isActive }) =>
              isActive ? "sidebar-link active" : "sidebar-link"
            }
          >
            <span className="sidebar-icon"><MdLibraryBooks size={18} /></span>
            <span className="sidebar-label">Manage Pooja</span>
          </NavLink>
          <NavLink
            to="/manage-pooja-samagri"
            title="Pooja Samagri"
            onClick={handleNavClick}
            className={({ isActive }) =>
              isActive ? "sidebar-link active" : "sidebar-link"
            }
          >
            <span className="sidebar-icon"><MdShoppingBasket size={18} /></span>
            <span className="sidebar-label">Pooja Samagri</span>
          </NavLink>
          <NavLink
            to="/manage-stotram"
            title="Manage Stotram"
            onClick={handleNavClick}
            className={({ isActive }) =>
              isActive ? "sidebar-link active" : "sidebar-link"
            }
          >
            <span className="sidebar-icon"><MdMenuBook size={18} /></span>
            <span className="sidebar-label">Manage Stotram</span>
          </NavLink>
          <NavLink
            to="/manage-aarti"
            title="Manage Aarti"
            onClick={handleNavClick}
            className={({ isActive }) =>
              isActive ? "sidebar-link active" : "sidebar-link"
            }
          >
            <span className="sidebar-icon"><MdMusicNote size={18} /></span>
            <span className="sidebar-label">Manage Aarti</span>
          </NavLink>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-title">Yajman</div>
          <NavLink
            to="/manage-yajman"
            title="Manage Yajman"
            onClick={handleNavClick}
            className={({ isActive }) =>
              isActive ? "sidebar-link active" : "sidebar-link"
            }
          >
            <span className="sidebar-icon"><MdGroup size={18} /></span>
            <span className="sidebar-label">Manage Yajman</span>
          </NavLink>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-title">Community</div>
          <NavLink
            to="/manage-community"
            title="Manage Community"
            onClick={handleNavClick}
            className={({ isActive }) =>
              isActive ? "sidebar-link active" : "sidebar-link"
            }
          >
            <span className="sidebar-icon"><MdForum size={18} /></span>
            <span className="sidebar-label">Manage Community</span>
          </NavLink>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-title">Subscriptions & Billing</div>
          <NavLink
            to="/manage-subscriptions"
            title="Manage Subscriptions"
            onClick={handleNavClick}
            className={({ isActive }) =>
              isActive ? "sidebar-link active" : "sidebar-link"
            }
          >
            <span className="sidebar-icon"><MdCardMembership size={18} /></span>
            <span className="sidebar-label">Manage Subscriptions</span>
          </NavLink>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-title">System & Settings</div>
          <NavLink
            to="/manage-support-tickets"
            title="Support Tickets"
            onClick={handleNavClick}
            className={({ isActive }) =>
              isActive ? "sidebar-link active" : "sidebar-link"
            }
          >
            <span className="sidebar-icon"><MdConfirmationNumber size={18} /></span>
            <span className="sidebar-label">Support Tickets</span>
          </NavLink>
          <NavLink
            to="/update-profile"
            title="Update Profile"
            onClick={handleNavClick}
            className={({ isActive }) =>
              isActive ? "sidebar-link active" : "sidebar-link"
            }
          >
            <span className="sidebar-icon"><MdManageAccounts size={18} /></span>
            <span className="sidebar-label">Update Profile</span>
          </NavLink>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
