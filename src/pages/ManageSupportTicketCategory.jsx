import React, { useState } from 'react';
import { useConfirmModal } from '../contexts/ConfirmModalContext';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { MdAdd, MdEdit, MdDeleteOutline, MdClose, MdSave } from 'react-icons/md';
import {
  getAllSupportTicketCategories,
  createSupportTicketCategory,
  updateSupportTicketCategory,
  deleteSupportTicketCategory,
} from '../api/supportTicketCategory';

const ManageSupportTicketCategory = () => {
  const { showConfirm } = useConfirmModal();
  const queryClient = useQueryClient();

  // Queries
  const { data: rawCategories = [], isLoading: isLoadingCat } = useQuery({
    queryKey: ['supportTicketCategories'],
    queryFn: getAllSupportTicketCategories
  });

  const categories = Array.isArray(rawCategories) ? rawCategories : (rawCategories?.data || rawCategories?.categories || []);

  // State for Modal
  const [catModal, setCatModal] = useState({ isOpen: false, data: null });

  // --- Category Mutations ---
  const createCatMutation = useMutation({
    mutationFn: createSupportTicketCategory,
    onSuccess: () => {
      queryClient.invalidateQueries(['supportTicketCategories']);
      toast.success('Support Ticket Category created successfully');
      setCatModal({ isOpen: false, data: null });
    },
    onError: () => toast.error('Failed to create Support Ticket Category')
  });

  const updateCatMutation = useMutation({
    mutationFn: ({ id, data }) => updateSupportTicketCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['supportTicketCategories']);
      toast.success('Support Ticket Category updated successfully');
      setCatModal({ isOpen: false, data: null });
    },
    onError: () => toast.error('Failed to update Support Ticket Category')
  });

  const deleteCatMutation = useMutation({
    mutationFn: deleteSupportTicketCategory,
    onSuccess: () => {
      queryClient.invalidateQueries(['supportTicketCategories']);
      toast.success('Support Ticket Category deleted successfully');
    },
    onError: () => toast.error('Failed to delete Support Ticket Category')
  });

  // Handlers
  const handleSaveCategory = (e) => {
    e.preventDefault();
    const categoryName = e.target.categoryName.value;
    const isActive = e.target.isActive.checked;
    
    if (catModal.data) {
      updateCatMutation.mutate({ 
        id: catModal.data._id || catModal.data.id, 
        data: { categoryName, isActive } 
      });
    } else {
      createCatMutation.mutate({ categoryName, isActive });
    }
  };

  return (
    <div className="page-content animate-fade-in">
      <div className="top-header" style={{ margin: '-0.95rem -1.25rem 0.9rem -1.25rem' }}>
        <h1 className="header-title">Manage Support Ticket Categories</h1>
      </div>

      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <div className="clean-table-wrap">
          <div className="clean-table-header">
            <span className="clean-table-count">
              Showing <strong>{categories.length}</strong> support ticket categories
            </span>
            <button className="btn btn-primary" style={{ padding: '0.32rem 0.7rem', fontSize: '0.78rem' }} onClick={() => setCatModal({ isOpen: true, data: null })}>
              <MdAdd size={15} /> Add Category
            </button>
          </div>
          
          <table className="clean-table">
            <thead>
              <tr>
                <th>Category Name</th>
                <th>Status</th>
                <th style={{ width: '96px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingCat ? (
                <tr><td colSpan="3">Loading...</td></tr>
              ) : categories.length > 0 ? (
                categories.map(cat => (
                  <tr key={cat._id || cat.id}>
                    <td style={{ fontWeight: 600 }}>{cat.categoryName}</td>
                    <td>
                      <span className={`clean-flag-pill ${cat.isActive ? 'is-active' : 'is-draft'}`} style={{ cursor: 'default' }}>
                        {cat.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.3rem' }}>
                        <button className="btn-icon-sm edit" onClick={() => setCatModal({ isOpen: true, data: cat })}><MdEdit size={15} /></button>
                        <button className="btn-icon-sm delete" onClick={() => showConfirm('Are you sure?', () => { deleteCatMutation.mutate(cat._id || cat.id); })}><MdDeleteOutline size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', padding: '1.25rem', color: 'var(--text-secondary)' }}>
                    No support ticket categories found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Category */}
      {catModal.isOpen && createPortal(
        <div className="modal-overlay">
          <div className="modal-content animate-slide-up" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3>{catModal.data ? 'Edit' : 'Add'} Support Ticket Category</h3>
              <button className="btn-icon" onClick={() => setCatModal({ isOpen: false, data: null })}>
                <MdClose size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveCategory} style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="modal-body">
                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                  <label className="input-label">Category Name *</label>
                  <input 
                    type="text" 
                    name="categoryName" 
                    defaultValue={catModal.data?.categoryName || ''} 
                    required 
                    className="input-field"
                    placeholder="e.g. Payment Issue, Tech Support"
                  />
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="checkbox" 
                    name="isActive" 
                    id="isActive"
                    defaultChecked={catModal.data ? catModal.data.isActive : true} 
                    style={{ width: '16px', height: '16px' }}
                  />
                  <label htmlFor="isActive" style={{ margin: 0, cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-primary)' }}>Is Active?</label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setCatModal({ isOpen: false, data: null })}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={createCatMutation.isPending || updateCatMutation.isPending}>
                  <MdSave size={17} /> {catModal.data ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ManageSupportTicketCategory;
