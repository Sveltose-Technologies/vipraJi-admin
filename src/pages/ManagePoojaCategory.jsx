import React, { useState } from 'react';
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
      <div className="top-header" style={{ margin: '-2rem -2rem 2rem -2rem' }}>
        <h1 className="header-title">Manage Pooja Categories</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
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
                      <button className="btn-icon delete" onClick={() => { if(window.confirm('Are you sure?')) deleteCatMutation.mutate(cat._id || cat.id); }}><MdDeleteOutline size={18} /></button>
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
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2>Sub Categories</h2>
            <button className="btn btn-primary" onClick={() => setSubCatModal({ isOpen: true, data: null })}>
              <MdAdd size={20} /> Add Subcategory
            </button>
          </div>
          
          <table className="data-table">
            <thead>
              <tr>
                <th>Subcategory Name</th>
                <th>Category</th>
                <th style={{ width: '100px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingSubCat ? (
                <tr><td colSpan="3">Loading...</td></tr>
              ) : subCategories.length > 0 ? (
                subCategories.map(sub => {
                  const parentCat = categories.find(c => (c._id || c.id) === sub.categoryId);
                  return (
                    <tr key={sub._id || sub.id}>
                      <td>{sub.subCategoryName}</td>
                      <td>{parentCat ? parentCat.categoryName : 'Unknown'}</td>
                      <td>
                        <button className="btn-icon edit" onClick={() => setSubCatModal({ isOpen: true, data: sub })}><MdEdit size={18} /></button>
                        <button className="btn-icon delete" onClick={() => { if(window.confirm('Are you sure?')) deleteSubCatMutation.mutate(sub._id || sub.id); }}><MdDeleteOutline size={18} /></button>
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

      {/* Sub Category Modal */}
      {subCatModal.isOpen && (
        <div className="modal-overlay" onClick={() => setSubCatModal({ isOpen: false, data: null })}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{subCatModal.data ? 'Edit Subcategory' : 'Add Subcategory'}</h2>
              <button className="modal-close-btn" onClick={() => setSubCatModal({ isOpen: false, data: null })}><MdClose size={24} /></button>
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
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={createSubCatMutation.isPending || updateSubCatMutation.isPending}>
                <MdSave size={20} /> Save
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagePoojaCategory;
