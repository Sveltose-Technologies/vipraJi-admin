import React, { useState } from 'react';
import { useConfirmModal } from '../contexts/ConfirmModalContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { MdAdd, MdEdit, MdDeleteOutline, MdClose, MdSave } from 'react-icons/md';
import {
  getAllStotramCategories,
  createStotramCategory,
  updateStotramCategory,
  deleteStotramCategory
} from '../api/stotramCategory';

const ManageStotramCategory = () => {
  const { showConfirm } = useConfirmModal();
  const queryClient = useQueryClient();

  // Queries
  const { data: rawCategories = [], isLoading: isLoadingCat } = useQuery({
    queryKey: ['stotramCategories'],
    queryFn: getAllStotramCategories
  });

  const categories = Array.isArray(rawCategories) ? rawCategories : (rawCategories?.data || rawCategories?.categories || []);

  // State for Modals
  const [catModal, setCatModal] = useState({ isOpen: false, data: null });

  // --- Category Mutations ---
  const createCatMutation = useMutation({
    mutationFn: createStotramCategory,
    onSuccess: () => {
      queryClient.invalidateQueries(['stotramCategories']);
      toast.success('Category created successfully');
      setCatModal({ isOpen: false, data: null });
    },
    onError: () => toast.error('Failed to create category')
  });

  const updateCatMutation = useMutation({
    mutationFn: ({ id, data }) => updateStotramCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['stotramCategories']);
      toast.success('Category updated successfully');
      setCatModal({ isOpen: false, data: null });
    },
    onError: () => toast.error('Failed to update category')
  });

  const deleteCatMutation = useMutation({
    mutationFn: deleteStotramCategory,
    onSuccess: () => {
      queryClient.invalidateQueries(['stotramCategories']);
      toast.success('Category deleted successfully');
    },
    onError: () => toast.error('Failed to delete category')
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
      <div className="top-header" style={{ margin: '-2rem -2rem 2rem -2rem' }}>
        <h1 className="header-title">Manage Stotram Categories</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        {/* Categories Section */}
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
                <th style={{ width: '100px' }}>Actions</th>
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
                      <button className="btn-icon edit" onClick={() => setCatModal({ isOpen: true, data: cat })}><MdEdit size={18} /></button>
                      <button className="btn-icon delete" onClick={() => showConfirm('Are you sure?', () => { deleteCatMutation.mutate(cat._id || cat.id); })}><MdDeleteOutline size={18} /></button>
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
      {catModal.isOpen && (
        <div className="modal-overlay" onClick={() => setCatModal({ isOpen: false, data: null })}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{catModal.data ? 'Edit Category' : 'Add Category'}</h2>
              <button className="modal-close-btn" onClick={() => setCatModal({ isOpen: false, data: null })}><MdClose size={24} /></button>
            </div>
            <form className="modal-body" onSubmit={handleSaveCategory}>
              <div className="input-group">
                <label className="input-label">Category Name</label>
                <input type="text" name="categoryName" className="input-field" defaultValue={catModal.data?.categoryName || ''} required />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={createCatMutation.isPending || updateCatMutation.isPending}>
                <MdSave size={20} /> Save
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageStotramCategory;
