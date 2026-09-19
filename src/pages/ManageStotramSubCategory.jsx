import React, { useState } from 'react';
import { useConfirmModal } from '../contexts/ConfirmModalContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { MdAdd, MdEdit, MdDeleteOutline, MdClose, MdSave } from 'react-icons/md';
import { getAllStotramCategories } from '../api/stotramCategory';
import {
  getAllStotramSubCategories,
  createStotramSubCategory,
  updateStotramSubCategory,
  deleteStotramSubCategory
} from '../api/stotramSubCategory';

const ManageStotramSubCategory = () => {
  const { showConfirm } = useConfirmModal();
  const queryClient = useQueryClient();

  // Queries
  const { data: rawCategories = [], isLoading: isLoadingCat } = useQuery({
    queryKey: ['stotramCategories'],
    queryFn: getAllStotramCategories
  });

  const { data: rawSubCategories = [], isLoading: isLoadingSubCat } = useQuery({
    queryKey: ['stotramSubCategories'],
    queryFn: getAllStotramSubCategories
  });

  const categories = Array.isArray(rawCategories) ? rawCategories : (rawCategories?.data || rawCategories?.categories || []);
  const subCategories = Array.isArray(rawSubCategories) ? rawSubCategories : (rawSubCategories?.data || rawSubCategories?.subCategories || []);

  const [modal, setModal] = useState({ isOpen: false, data: null });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createStotramSubCategory,
    onSuccess: () => {
      queryClient.invalidateQueries(['stotramSubCategories']);
      toast.success('Sub Category created successfully');
      setModal({ isOpen: false, data: null });
    },
    onError: () => toast.error('Failed to create sub category')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateStotramSubCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['stotramSubCategories']);
      toast.success('Sub Category updated successfully');
      setModal({ isOpen: false, data: null });
    },
    onError: () => toast.error('Failed to update sub category')
  });

  const deleteMutation = useMutation({
    mutationFn: deleteStotramSubCategory,
    onSuccess: () => {
      queryClient.invalidateQueries(['stotramSubCategories']);
      toast.success('Sub Category deleted successfully');
    },
    onError: () => toast.error('Failed to delete sub category')
  });

  const handleSave = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const isFavorite = e.target.isFavorite.checked;
    formData.set('isFavorite', isFavorite);
    
    if (modal.data) {
      // If we are editing, only send files if they are selected
      const audioFile = formData.get('audioFile');
      if (audioFile && audioFile.size === 0) {
        formData.delete('audioFile');
      }
      const pdf = formData.get('pdf');
      if (pdf && pdf.size === 0) {
        formData.delete('pdf');
      }
      updateMutation.mutate({ id: modal.data._id || modal.data.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="page-content animate-fade-in">
      <div className="top-header" style={{ margin: '-2rem -2rem 2rem -2rem' }}>
        <h1 className="header-title">Manage Stotram Sub Categories</h1>
        <button className="btn btn-primary" onClick={() => setModal({ isOpen: true, data: null })}>
          <MdAdd size={20} /> Add Sub Category
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Favorite</th>
              <th style={{ width: '100px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoadingSubCat || isLoadingCat ? (
              <tr><td colSpan="4">Loading...</td></tr>
            ) : subCategories.length > 0 ? (
              subCategories.map(sub => {
                const parentCat = categories.find(c => {
                  const cId = c._id || c.id;
                  const subCatId = typeof sub.categoryId === 'object' && sub.categoryId !== null ? (sub.categoryId._id || sub.categoryId.id) : sub.categoryId;
                  return String(cId) === String(subCatId);
                });
                return (
                  <tr key={sub._id || sub.id}>
                    <td>{sub.title || sub.subCategoryName}</td>
                    <td>{parentCat ? parentCat.categoryName : 'Unknown'}</td>
                    <td>{sub.isFavorite ? 'Yes' : 'No'}</td>
                    <td>
                      <button className="btn-icon edit" onClick={() => setModal({ isOpen: true, data: sub })}><MdEdit size={18} /></button>
                      <button className="btn-icon delete" onClick={() => showConfirm('Are you sure?', () => { deleteMutation.mutate(sub._id || sub.id); })}><MdDeleteOutline size={18} /></button>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr><td colSpan="4" style={{ textAlign: 'center' }}>No sub categories found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modal.isOpen && (
        <div className="modal-overlay" onClick={() => setModal({ isOpen: false, data: null })}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>{modal.data ? 'Edit Sub Category' : 'Add Sub Category'}</h2>
              <button className="modal-close-btn" onClick={() => setModal({ isOpen: false, data: null })}><MdClose size={24} /></button>
            </div>
            <form className="modal-body" onSubmit={handleSave}>
              <div className="input-group">
                <label className="input-label">Select Category</label>
                <select name="categoryId" className="input-field" defaultValue={modal.data?.categoryId || ''} required>
                  <option value="" disabled>Select a category</option>
                  {categories.map(cat => (
                    <option key={cat._id || cat.id} value={cat._id || cat.id}>{cat.categoryName}</option>
                  ))}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Title</label>
                <input type="text" name="title" className="input-field" defaultValue={modal.data?.title || modal.data?.subCategoryName || ''} required />
              </div>
              <div className="input-group">
                <label className="input-label">Text Editor (Content)</label>
                <textarea name="textEditor" className="input-field" rows="4" defaultValue={modal.data?.textEditor || ''} required></textarea>
              </div>
              <div className="input-group">
                <label className="input-label">Audio File</label>
                <input type="file" name="audioFile" className="input-field" accept="audio/*" {...(!modal.data ? { required: true } : {})} />
              </div>
              <div className="input-group">
                <label className="input-label">PDF File</label>
                <input type="file" name="pdf" className="input-field" accept="application/pdf" {...(!modal.data ? { required: true } : {})} />
              </div>
              <div className="input-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
                <input type="checkbox" name="isFavorite" id="isFavorite" defaultChecked={modal.data?.isFavorite || false} style={{ width: '20px', height: '20px' }} />
                <label className="input-label" htmlFor="isFavorite" style={{ marginBottom: 0 }}>Is Favorite</label>
              </div>
              
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={createMutation.isPending || updateMutation.isPending}>
                <MdSave size={20} /> {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageStotramSubCategory;
