import React, { createContext, useState, useContext } from 'react';
import { MdDeleteOutline } from 'react-icons/md';

const ConfirmModalContext = createContext();

export const useConfirmModal = () => useContext(ConfirmModalContext);

export const ConfirmModalProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [onConfirmCallback, setOnConfirmCallback] = useState(null);

  const showConfirm = (msg, onConfirm) => {
    setMessage(msg);
    setOnConfirmCallback(() => onConfirm);
    setIsOpen(true);
  };

  const hideConfirm = () => {
    setIsOpen(false);
    setMessage('');
    setOnConfirmCallback(null);
  };

  const handleConfirm = () => {
    if (onConfirmCallback) onConfirmCallback();
    hideConfirm();
  };

  return (
    <ConfirmModalContext.Provider value={{ showConfirm }}>
      {children}
      {isOpen && (
        <div className="modal-overlay" style={{ zIndex: 9999, backdropFilter: 'blur(4px)' }}>
          <div className="modal-content animate-fade-in" style={{ maxWidth: '400px', textAlign: 'center', padding: '2.5rem 2rem', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>

            <div style={{
              width: '64px', height: '64px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.5rem auto'
            }}>
              <MdDeleteOutline size={32} style={{ color: 'var(--error-color)' }} />
            </div>

            <h3 style={{ marginBottom: '0.75rem', color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: '700' }}>
              Delete Confirmation
            </h3>

            <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5' }}>
              {message === 'Are you sure?' ? "Do you really want to delete this item?" : message}
            </p>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                className="btn"
                style={{ backgroundColor: '#F3F4F6', color: '#4B5563', flex: 1, padding: '0.75rem', borderRadius: '10px', fontWeight: '600' }}
                onClick={hideConfirm}
              >
                Keep It
              </button>
              <button
                className="btn"
                style={{ backgroundColor: 'var(--error-color)', color: 'white', flex: 1, padding: '0.75rem', borderRadius: '10px', fontWeight: '600', boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.3)' }}
                onClick={handleConfirm}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmModalContext.Provider>
  );
};
