import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MdLogout, MdPersonOutline, MdMenu } from 'react-icons/md';

const Header = ({ toggleSidebar }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = () => {
      const storedUser = localStorage.getItem('adminUser');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          const actualUser = parsed?.data || parsed?.user || parsed;
          setUser(actualUser);
        } catch (e) {
          console.error("Failed to parse user", e);
        }
      }
    };

    loadUser();
    window.addEventListener('storage', loadUser);
    return () => window.removeEventListener('storage', loadUser);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const getDynamicTitle = () => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') return 'Dashboard';
    
    const routeTitles = {
      '/manage-users': 'Users',
      '/manage-notifications': 'Notifications',
      '/manage-community': 'Community',
      '/manage-pooja': 'Pooja',
      '/manage-pooja-categories': 'Pooja Categories',
      '/manage-pooja-samagri': 'Pooja Samagri',
      '/manage-stotram': 'Stotram',
      '/manage-stotram-categories': 'Stotram Categories',
      '/manage-stotram-subcategories': 'Stotram Sub-Categories',
      '/manage-aarti': 'Aarti',
      '/manage-aarti-categories': 'Aarti Categories',
      '/manage-yajman': 'Yajman',
      '/manage-yajman-categories': 'Yajman Categories',
      '/manage-subscriptions': 'Subscriptions',
      '/manage-subscription-plans': 'Subscription Plans',
      '/manage-support-tickets': 'Support Tickets',
      '/manage-support-ticket-categories': 'Support Ticket Categories',
      '/manage-terms-and-conditions': 'Terms and Conditions',
      '/manage-privacy-policy': 'Privacy Policy',
      '/update-profile': 'Update Profile',
      '/settings': 'Settings',
    };

    if (routeTitles[path]) {
      return routeTitles[path];
    }

    const segments = path.split('/').filter(Boolean);
    if (segments.length > 0) {
      let name = segments[0].replace(/^manage-/, '');
      name = name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      return name;
    }
    
    return 'Dashboard';
  };

  const getAdminName = () => {
    const displayName = user?.displayName?.trim();
    if (displayName && displayName.toLowerCase() !== 'admin user') {
      return displayName;
    }
    const fullName = user?.fullName?.trim();
    if (fullName && fullName.toLowerCase() !== 'admin user') {
      return fullName;
    }
    const name = user?.name?.trim();
    if (name && name.toLowerCase() !== 'admin user') {
      return name;
    }
    const emailPrefix = user?.email?.split('@')[0];
    if (emailPrefix) {
      return emailPrefix;
    }
    return 'Admin';
  };

  const getRoleLabel = () => {
    const role = user?.role;
    if (role && typeof role === 'string') {
      return role.charAt(0).toUpperCase() + role.slice(1);
    }
    return 'Admin';
  };

  return (
    <header className="main-header">
      <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button className="mobile-menu-btn" onClick={toggleSidebar} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'none', padding: '0.25rem' }}>
          <MdMenu size={28} color="var(--vipra-color)" />
        </button>
        <div className="header-title">
          {getDynamicTitle()}
        </div>
      </div>

      <div className="header-right">
        <div className="user-dropdown-container" ref={dropdownRef}>
          <div
            className="user-dropdown-trigger"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <div className="user-info">
              <span className="user-name">{getAdminName()}</span>
              <span className="user-role">{getRoleLabel()}</span>
            </div>
            <div className="user-avatar">
              {(getAdminName() || 'A').charAt(0).toUpperCase()}
            </div>
          </div>

          <div className={`dropdown-menu ${dropdownOpen ? 'show' : ''}`}>
            <div className="dropdown-header">
              <strong style={{ }}>Manage Account</strong>
            </div>
            <button
              className="dropdown-item"
              onClick={() => {
                setDropdownOpen(false);
                navigate('/update-profile');
              }}
            >
              <MdPersonOutline size={18} />
              Edit Profile
            </button>
            <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '0.25rem 0' }}></div>
            <button
              className="dropdown-item text-red"
              onClick={handleLogout}
            >
              <MdLogout size={18} />
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
