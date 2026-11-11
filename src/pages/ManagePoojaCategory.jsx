import React, { useState } from 'react';
import { useConfirmModal } from '../contexts/ConfirmModalContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { MdAdd, MdEdit, MdDeleteOutline, MdClose, MdSave } from 'react-icons/md';
import {
  getAllPoojaCategories,
  createPoojaCategory,
  updatePoojaCategory,
  deletePoojaCategory,
  getAllPoojaSubCategories,
  createPoojaSubCategory,
  updatePoojaSubCategory,
  deletePoojaSubCategory
} from '../api/poojaCategory';

const ManagePoojaCategory = () => {
  const { showConfirm } = useConfirmModal();
  const queryClient = useQueryClient();

  // Queries
  const { data: rawCategories = [], isLoading: isLoadingCat } = useQuery({
    queryKey: ['poojaCategories'],
    queryFn: getAllPoojaCategories
  });

  const { data: rawSubCategories = [], isLoading: isLoadingSubCat } = useQuery({
    queryKey: ['poojaSubCategories'],
    queryFn: getAllPoojaSubCategories
  });

  const categories = Array.isArray(rawCategories) ? rawCategories : (rawCategories?.data || rawCategories?.categories || []);
  const subCategories = Array.isArray(rawSubCategories) ? rawSubCategories : (rawSubCategories?.data || rawSubCategories?.subCategories || []);

  // State for Modals
  const [catModal, setCatModal] = useState({ isOpen: false, data: null });
  const [subCatModal, setSubCatModal] = useState({ isOpen: false, data: null });

  // --- Category Mutations ---
  const createCatMutation = useMutation({
    mutationFn: createPoojaCategory,
    onSuccess: () => {
      queryClient.invalidateQueries(['poojaCategories']);
      toast.success('Category created successfully');
      setCatModal({ isOpen: false, data: null });
    },
    onError: () => toast.error('Failed to create category')
  });

  const updateCatMutation = useMutation({
    mutationFn: ({ id, data }) => updatePoojaCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['poojaCategories']);
      toast.success('Category updated successfully');
      setCatModal({ isOpen: false, data: null });
    },
    onError: () => toast.error('Failed to update category')
  });

  const deleteCatMutation = useMutation({
    mutationFn: deletePoojaCategory,
    onSuccess: () => {
      queryClient.invalidateQueries(['poojaCategories']);
      toast.success('Category deleted successfully');
    },
    onError: () => toast.error('Failed to delete category')
  });

  // --- Sub Category Mutations ---
  const createSubCatMutation = useMutation({
    mutationFn: createPoojaSubCategory,
    onSuccess: () => {
      queryClient.invalidateQueries(['poojaSubCategories']);
      toast.success('Subcategory created successfully');
      setSubCatModal({ isOpen: false, data: null });
    },
    onError: () => toast.error('Failed to create subcategory')
  });

  const updateSubCatMutation = useMutation({
    mutationFn: ({ id, data }) => updatePoojaSubCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['poojaSubCategories']);
      toast.success('Subcategory updated successfully');
      setSubCatModal({ isOpen: false, data: null });
    },
    onError: () => toast.error('Failed to update subcategory')
  });

  const deleteSubCatMutation = useMutation({
    mutationFn: deletePoojaSubCategory,
    onSuccess: () => {
      queryClient.invalidateQueries(['poojaSubCategories']);
      toast.success('Subcategory deleted successfully');
    },
    onError: () => toast.error('Failed to delete subcategory')
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

  const handleSaveSubCategory = (e) => {
    e.preventDefault();
    const categoryId = e.target.categoryId.value;
    const subCategoryName = e.target.subCategoryName.value;
    if (subCatModal.data) {
      updateSubCatMutation.mutate({ id: subCatModal.data._id || subCatModal.data.id, data: { categoryId, subCategoryName } });
    } else {
      createSubCatMutation.mutate({ categoryId, subCategoryName });
    }
  };

  return (
    <div className="page-content animate-fade-in">
      <div className="top-header" style={{ margin: '-0.95rem -1.25rem 0.9rem -1.25rem' }}>
        <h1 className="header-title">Manage Pooja Categories</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(270px, 100%), 1fr))', gap: '1rem' }}>
        {/* Categories Section */}
        <div className="clean-table-wrap">
          <div className="clean-table-header">
            <span className="clean-table-count">
              Categories (<strong>{categories.length}</strong>)
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
                <tr><td colSpan="2" style={{ textAlign: 'center' }}>No categories found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Sub Categories Section */}
        <div className="clean-table-wrap">
          <div className="clean-table-header">
            <span className="clean-table-count">
              Sub Categories (<strong>{subCategories.length}</strong>)
            </span>
            <button className="btn btn-primary" style={{ padding: '0.32rem 0.7rem', fontSize: '0.78rem' }} onClick={() => setSubCatModal({ isOpen: true, data: null })}>
              <MdAdd size={15} /> Add Subcategory
            </button>
          </div>
          
          <table className="clean-table">
            <thead>
              <tr>
                <th>Subcategory Name</th>
                <th>Category</th>
                <th style={{ width: '90px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingSubCat ? (
                <tr><td colSpan="3">Loading...</td></tr>
              ) : subCategories.length > 0 ? (
                subCategories.map(sub => {
                  const parentCat = categories.find(c => {
                    const cId = c._id || c.id;
                    const subCatId = typeof sub.categoryId === 'object' && sub.categoryId !== null ? (sub.categoryId._id || sub.categoryId.id) : sub.categoryId;
                    return String(cId) === String(subCatId);
                  });
                  return (
                    <tr key={sub._id || sub.id}>
                      <td style={{ fontWeight: 600 }}>{sub.subCategoryName}</td>
                      <td>{parentCat ? parentCat.categoryName : 'Unknown'}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.3rem' }}>
                          <button className="btn-icon-sm edit" onClick={() => setSubCatModal({ isOpen: true, data: sub })}><MdEdit size={15} /></button>
                          <button className="btn-icon-sm delete" onClick={() => showConfirm('Are you sure?', () => { deleteSubCatMutation.mutate(sub._id || sub.id); })}><MdDeleteOutline size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr><td colSpan="3" style={{ textAlign: 'center' }}>No subcategories found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category Modal */}
      {catModal.isOpen && (
        <div className="modal-overlay" onClick={() => setCatModal({ isOpen: false, data: null })}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2 className="modal-title">{catModal.data ? 'Edit Category' : 'Add Category'}</h2>
              <button className="modal-close-btn" onClick={() => setCatModal({ isOpen: false, data: null })}><MdClose size={20} /></button>
            </div>
            <form className="modal-body" onSubmit={handleSaveCategory}>
              <div className="input-group">
                <label className="input-label">Category Name</label>
                <input type="text" name="categoryName" className="input-field" defaultValue={catModal.data?.categoryName || ''} required />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={createCatMutation.isPending || updateCatMutation.isPending}>
                <MdSave size={16} /> Save
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Sub Category Modal */}
      {subCatModal.isOpen && (
        <div className="modal-overlay" onClick={() => setSubCatModal({ isOpen: false, data: null })}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h2 className="modal-title">{subCatModal.data ? 'Edit Subcategory' : 'Add Subcategory'}</h2>
              <button className="modal-close-btn" onClick={() => setSubCatModal({ isOpen: false, data: null })}><MdClose size={20} /></button>
            </div>
            <form className="modal-body" onSubmit={handleSaveSubCategory}>
              <div className="input-group">
                <label className="input-label">Select Category</label>
                <select name="categoryId" className="input-field" defaultValue={subCatModal.data?.categoryId || ''} required>
                  <option value="" disabled>Select a category</option>
                  {categories.map(cat => (
                    <option key={cat._id || cat.id} value={cat._id || cat.id}>{cat.categoryName}</option>
                  ))}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Subcategory Name</label>
                <input type="text" name="subCategoryName" className="input-field" defaultValue={subCatModal.data?.subCategoryName || ''} required />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={createSubCatMutation.isPending || updateSubCatMutation.isPending}>
                <MdSave size={16} /> Save
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagePoojaCategory;
