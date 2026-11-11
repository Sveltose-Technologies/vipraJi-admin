import React, { useState } from 'react';
import { useConfirmModal } from '../contexts/ConfirmModalContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MdAdd, MdEdit, MdDeleteOutline, MdClose, MdSave, MdArrowBack } from 'react-icons/md';
import {
  getAllStotramCategories,
  createStotramCategory,
  updateStotramCategory,
  deleteStotramCategory
} from '../api/stotramCategory';

const ManageStotramCategory = () => {
  const navigate = useNavigate();
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
      queryClient.invalidateQueries({ queryKey: ['stotramCategories'] });
      toast.success('Category created successfully');
      setCatModal({ isOpen: false, data: null });
    },
    onError: (err) => toast.error(err?.response?.data?.message || err?.message || 'Failed to create category')
  });

  const updateCatMutation = useMutation({
    mutationFn: ({ id, data }) => updateStotramCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stotramCategories'] });
      toast.success('Category updated successfully');
      setCatModal({ isOpen: false, data: null });
    },
    onError: (err) => toast.error(err?.response?.data?.message || err?.message || 'Failed to update category')
  });

  const deleteCatMutation = useMutation({
    mutationFn: deleteStotramCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stotramCategories'] });
      toast.success('Category deleted successfully');
    },
    onError: (err) => toast.error(err?.response?.data?.message || err?.message || 'Failed to delete category')
  });

  // Handlers
  const handleSaveCategory = (e) => {
    e.preventDefault();
    const categoryName = e.target.categoryName.value.trim();
    if (!categoryName) {
      toast.error('Category name is required');
      return;
    }
    if (catModal.data) {
      updateCatMutation.mutate({ id: catModal.data._id || catModal.data.id, data: { categoryName } });
    } else {
      createCatMutation.mutate({ categoryName });
    }
  };

  return (
    <div className="page-content animate-fade-in">
      <div className="top-header" style={{ margin: '-0.95rem -1.25rem 0.9rem -1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            className="btn btn-outline"
            onClick={() => navigate('/manage-stotram')}
            title="Back to Stotram Library"
            style={{ padding: '0.35rem 0.6rem' }}
          >
            <MdArrowBack size={16} />
          </button>
          <h1 className="header-title">Manage Stotram Categories</h1>
        </div>

        <button className="btn btn-primary" onClick={() => setCatModal({ isOpen: true, data: null })}>
          <MdAdd size={17} /> Add Category
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
        <div className="clean-table-wrap">
          <div className="clean-table-header">
            <span className="clean-table-count">
              Showing <strong>{categories.length}</strong> stotram categories
            </span>
          </div>
          <table className="clean-table">
            <thead>
              <tr>
                <th>Category Name</th>
                <th style={{ width: '100px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingCat ? (
                <tr><td colSpan="2" style={{ textAlign: 'center', padding: '1.25rem' }}>Loading categories...</td></tr>
              ) : categories.length > 0 ? (
                categories.map((cat) => (
                  <tr key={cat._id || cat.id}>
                    <td>
                      <strong style={{ color: 'var(--text-primary)' }}>{cat.categoryName}</strong>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.3rem' }}>
                        <button className="btn-icon-sm edit" onClick={() => setCatModal({ isOpen: true, data: cat })} title="Edit"><MdEdit size={15} /></button>
                        <button className="btn-icon-sm delete" onClick={() => showConfirm(`Delete category "${cat.categoryName}"?`, () => { deleteCatMutation.mutate(cat._id || cat.id); })} title="Delete"><MdDeleteOutline size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="2" style={{ textAlign: 'center', padding: '1.25rem' }}>No categories found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category Modal */}
      {catModal.isOpen && (
        <div className="modal-overlay" onClick={() => setCatModal({ isOpen: false, data: null })}>
          <div className="modal-content glass-panel animate-fade-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', width: '92%' }}>
            <div className="modal-header">
              <h2 className="modal-title">{catModal.data ? 'Edit Category' : 'Add Category'}</h2>
              <button className="modal-close-btn" onClick={() => setCatModal({ isOpen: false, data: null })}><MdClose size={20} /></button>
            </div>
            <form className="modal-body" onSubmit={handleSaveCategory} style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Category Name *</label>
                <input
                  type="text"
                  name="categoryName"
                  className="input-field"
                  defaultValue={catModal.data?.categoryName || ''}
                  placeholder="e.g. Shiva Stotras, Vishnu Stotras"
                  required
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.4rem' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setCatModal({ isOpen: false, data: null })}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={createCatMutation.isPending || updateCatMutation.isPending}
                >
                  <MdSave size={16} /> Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageStotramCategory;
