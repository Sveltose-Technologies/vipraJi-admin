import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MdLogout, MdPersonOutline } from 'react-icons/md';

const Header = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('adminUser');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user", e);
      }
    }
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
    // Clear session logic here (localStorage.removeItem('token'), etc.)
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <header className="main-header">
      <div className="header-title">
        Admin Dashboard
      </div>

      <div className="header-right">
        <div className="user-dropdown-container" ref={dropdownRef}>
          <div
            className="user-dropdown-trigger"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <div className="user-info">
              <span className="user-name">{user?.fullName || user?.displayName || user?.email?.split('@')[0] || 'Admin User'}</span>
              <span className="user-role">{user?.role || 'Admin'}</span>
            </div>
            <div className="user-avatar">
              {(user?.fullName || user?.displayName || user?.email || 'A').charAt(0).toUpperCase()}
            </div>
          </div>

          <div className={`dropdown-menu ${dropdownOpen ? 'show' : ''}`}>
            <div className="dropdown-header">
              <strong style={{ fontSize: '0.875rem' }}>Manage Account</strong>
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
