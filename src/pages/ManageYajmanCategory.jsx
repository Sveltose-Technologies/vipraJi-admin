import React, { useState } from 'react';
import { useConfirmModal } from '../contexts/ConfirmModalContext';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { MdAdd, MdEdit, MdDeleteOutline, MdClose, MdSave } from 'react-icons/md';
import {
  getAllYajmanCategories,
  createYajmanCategory,
  updateYajmanCategory,
  deleteYajmanCategory,
} from '../api/yajmanCategory';

const ManageYajmanCategory = ({ isEmbedded = false }) => {
  const { showConfirm } = useConfirmModal();
  const queryClient = useQueryClient();

  // Queries
  const { data: rawCategories = [], isLoading: isLoadingCat } = useQuery({
    queryKey: ['yajmanCategories'],
    queryFn: getAllYajmanCategories
  });

  const categories = Array.isArray(rawCategories) ? rawCategories : (rawCategories?.data || rawCategories?.categories || []);

  // State for Modal
  const [catModal, setCatModal] = useState({ isOpen: false, data: null });

  // --- Category Mutations ---
  const createCatMutation = useMutation({
    mutationFn: createYajmanCategory,
    onSuccess: () => {
      queryClient.invalidateQueries(['yajmanCategories']);
      toast.success('Yajman Category created successfully');
      setCatModal({ isOpen: false, data: null });
    },
    onError: () => toast.error('Failed to create Yajman Category')
  });

  const updateCatMutation = useMutation({
    mutationFn: ({ id, data }) => updateYajmanCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['yajmanCategories']);
      toast.success('Yajman Category updated successfully');
      setCatModal({ isOpen: false, data: null });
    },
    onError: () => toast.error('Failed to update Yajman Category')
  });

  const deleteCatMutation = useMutation({
    mutationFn: deleteYajmanCategory,
    onSuccess: () => {
      queryClient.invalidateQueries(['yajmanCategories']);
      toast.success('Yajman Category deleted successfully');
    },
    onError: () => toast.error('Failed to delete Yajman Category')
  });

  // Handlers
  const handleSaveCategory = (e) => {
    e.preventDefault();
    const categoryName = e.target.categoryName.value;
    if (catModal.data) {
      updateCatMutation.mutate({ id: catModal.data._id || catModal.data.id, data: { categoryName } });
    } else {
      createCatMutation.mutate({ categoryName });
    }
  };

  const content = (
    <>
      {!isEmbedded && (
        <div className="top-header" style={{ margin: '-0.95rem -1.25rem 0.9rem -1.25rem' }}>
          <h1 className="header-title">Manage Yajman Categories</h1>
        </div>
      )}

      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <div className="clean-table-wrap">
          <div className="clean-table-header">
            <span className="clean-table-count">
              Showing <strong>{categories.length}</strong> Yajman categories
            </span>
            <button className="btn btn-primary" style={{ padding: '0.32rem 0.7rem', fontSize: '0.78rem' }} onClick={() => setCatModal({ isOpen: true, data: null })}>
              <MdAdd size={15} /> Add Category
            </button>
          </div>
          
          <table className="clean-table">
            <thead>
              <tr>
                <th>Category Name</th>
                <th style={{ width: '90px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingCat ? (
                <tr><td colSpan="2">Loading...</td></tr>
              ) : categories.length > 0 ? (
                categories.map(cat => (
                  <tr key={cat._id || cat.id}>
                    <td style={{ fontWeight: 600 }}>{cat.categoryName}</td>
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
                  <td colSpan="2" style={{ textAlign: 'center', padding: '1.25rem', color: 'var(--text-secondary)' }}>
                    No Yajman categories found
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
          <div className="modal-content glass-panel animate-slide-up" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{catModal.data ? 'Edit' : 'Add'} Yajman Category</h3>
              <button className="modal-close-btn" onClick={() => setCatModal({ isOpen: false, data: null })}>
                <MdClose size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveCategory} style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="modal-body">
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Category Name *</label>
                  <input 
                    type="text" 
                    name="categoryName" 
                    defaultValue={catModal.data?.categoryName || ''} 
                    required 
                    className="input-field"
                    placeholder="e.g. VIP, Regular"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setCatModal({ isOpen: false, data: null })}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={createCatMutation.isPending || updateCatMutation.isPending}>
                  <MdSave size={16} /> {catModal.data ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );

  if (isEmbedded) {
    return <div className="animate-fade-in" style={{ padding: '0.25rem 0' }}>{content}</div>;
  }
  return <div className="page-content animate-fade-in">{content}</div>;
};

export default ManageYajmanCategory;
