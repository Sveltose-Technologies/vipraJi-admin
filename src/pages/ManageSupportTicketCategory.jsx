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
      <div className="top-header" style={{ margin: '-2rem -2rem 2rem -2rem' }}>
        <h1 className="header-title">Manage Support Ticket Categories</h1>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2>Categories</h2>
            <button className="btn btn-primary" onClick={() => setCatModal({ isOpen: true, data: null })}>
              <MdAdd size={20} /> Add Category
            </button>
          </div>
          
          <table className="data-table">
            <thead>
              <tr>
                <th>Category Name</th>
                <th>Status</th>
                <th style={{ width: '100px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingCat ? (
                <tr><td colSpan="3">Loading...</td></tr>
              ) : categories.length > 0 ? (
                categories.map(cat => (
                  <tr key={cat._id || cat.id}>
                    <td>{cat.categoryName}</td>
                    <td>
                      <span className={`badge ${cat.isActive ? 'badge-success' : 'badge-danger'}`} style={{ 
                        padding: '4px 8px', 
                        borderRadius: '4px',
                        backgroundColor: cat.isActive ? 'rgba(40, 167, 69, 0.2)' : 'rgba(220, 53, 69, 0.2)',
                        color: cat.isActive ? '#28a745' : '#dc3545',
                        fontWeight: 'bold'
                      }}>
                        {cat.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button className="btn-icon edit" onClick={() => setCatModal({ isOpen: true, data: cat })}><MdEdit size={18} /></button>
                      <button className="btn-icon delete" onClick={() => showConfirm('Are you sure?', () => { deleteCatMutation.mutate(cat._id || cat.id); })}><MdDeleteOutline size={18} /></button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.5)' }}>
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
          <div className="modal-content animate-slide-up" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>{catModal.data ? 'Edit' : 'Add'} Support Ticket Category</h3>
              <button className="btn-icon" onClick={() => setCatModal({ isOpen: false, data: null })}>
                <MdClose size={24} />
              </button>
            </div>
            <form onSubmit={handleSaveCategory} style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="modal-body">
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label>Category Name *</label>
                  <input 
                    type="text" 
                    name="categoryName" 
                    defaultValue={catModal.data?.categoryName || ''} 
                    required 
                    className="input-field"
                    placeholder="e.g. Payment Issue, Tech Support"
                  />
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input 
                    type="checkbox" 
                    name="isActive" 
                    id="isActive"
                    defaultChecked={catModal.data ? catModal.data.isActive : true} 
                    style={{ width: '18px', height: '18px' }}
                  />
                  <label htmlFor="isActive" style={{ margin: 0, cursor: 'pointer', color: 'var(--text-primary)' }}>Is Active?</label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setCatModal({ isOpen: false, data: null })}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={createCatMutation.isPending || updateCatMutation.isPending}>
                  <MdSave size={20} /> {catModal.data ? 'Update' : 'Save'}
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
