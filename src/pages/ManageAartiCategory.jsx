import React, { useState } from 'react';
import { useConfirmModal } from '../contexts/ConfirmModalContext';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { MdAdd, MdEdit, MdDeleteOutline, MdClose, MdSave } from 'react-icons/md';
import {
  getAllAartiCategories,
  createAartiCategory,
  updateAartiCategory,
  deleteAartiCategory,
} from '../api/aartiCategory';

const ManageAartiCategory = () => {
  const { showConfirm } = useConfirmModal();
  const queryClient = useQueryClient();

  // Queries
  const { data: rawCategories = [], isLoading: isLoadingCat } = useQuery({
    queryKey: ['aartiCategories'],
    queryFn: getAllAartiCategories
  });

  const categories = Array.isArray(rawCategories) ? rawCategories : (rawCategories?.data || rawCategories?.categories || []);

  // State for Modal
  const [catModal, setCatModal] = useState({ isOpen: false, data: null });

  // --- Category Mutations ---
  const createCatMutation = useMutation({
    mutationFn: createAartiCategory,
    onSuccess: () => {
      queryClient.invalidateQueries(['aartiCategories']);
      toast.success('Aarti Category created successfully');
      setCatModal({ isOpen: false, data: null });
    },
    onError: () => toast.error('Failed to create Aarti Category')
  });

  const updateCatMutation = useMutation({
    mutationFn: ({ id, data }) => updateAartiCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['aartiCategories']);
      toast.success('Aarti Category updated successfully');
      setCatModal({ isOpen: false, data: null });
    },
    onError: () => toast.error('Failed to update Aarti Category')
  });

  const deleteCatMutation = useMutation({
    mutationFn: deleteAartiCategory,
    onSuccess: () => {
      queryClient.invalidateQueries(['aartiCategories']);
      toast.success('Aarti Category deleted successfully');
    },
    onError: () => toast.error('Failed to delete Aarti Category')
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

  return (
    <div className="page-content animate-fade-in">
      <div className="top-header" style={{ margin: '-0.95rem -1.25rem 0.9rem -1.25rem' }}>
        <h1 className="header-title">Manage Aarti Categories</h1>
      </div>

      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <div className="glass-panel" style={{ padding: '0.9rem 1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
            <h2 style={{ fontSize: '0.98rem', margin: 0 }}>Categories</h2>
            <button className="btn btn-primary" onClick={() => setCatModal({ isOpen: true, data: null })}>
              <MdAdd size={16} /> Add Category
            </button>
          </div>
          
          <table className="data-table">
            <thead>
              <tr>
                <th>Category Name</th>
                <th style={{ width: '90px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingCat ? (
                <tr><td colSpan="2">Loading...</td></tr>
              ) : categories.length > 0 ? (
                categories.map(cat => (
                  <tr key={cat._id || cat.id}>
                    <td>{cat.categoryName}</td>
                    <td>
                      <button className="btn-icon edit" onClick={() => setCatModal({ isOpen: true, data: cat })}><MdEdit size={16} /></button>
                      <button className="btn-icon delete" onClick={() => showConfirm('Are you sure?', () => { deleteCatMutation.mutate(cat._id || cat.id); })}><MdDeleteOutline size={16} /></button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="2" style={{ textAlign: 'center' }}>No categories found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category Modal */}
      {catModal.isOpen && createPortal(
        <div className="modal-overlay" onClick={() => setCatModal({ isOpen: false, data: null })}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: '380px' }}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ fontWeight: 600 }}>{catModal.data ? 'Edit Category' : 'Add Category'}</h2>
              <button className="modal-close-btn" onClick={() => setCatModal({ isOpen: false, data: null })}><MdClose size={20} /></button>
            </div>
            <form className="modal-body" onSubmit={handleSaveCategory}>
              <div className="input-group">
                <label className="input-label">Category Name</label>
                <input type="text" name="categoryName" className="input-field" defaultValue={catModal.data?.categoryName || ''} required placeholder="e.g. Ganesh Aarti" />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={createCatMutation.isPending || updateCatMutation.isPending}>
                <MdSave size={16} /> Save
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ManageAartiCategory;
