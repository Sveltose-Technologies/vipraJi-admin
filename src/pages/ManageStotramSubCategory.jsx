import React, { useState } from 'react';
import { useConfirmModal } from '../contexts/ConfirmModalContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MdAdd, MdEdit, MdDeleteOutline, MdClose, MdSave, MdMusicNote, MdArrowBack } from 'react-icons/md';
import { getAllStotramCategories } from '../api/stotramCategory';
import {
  getAllStotramSubCategories,
  createStotramSubCategory,
  updateStotramSubCategory,
  deleteStotramSubCategory
} from '../api/stotramSubCategory';

const idOf = (item) => {
  if (!item) return '';
  if (typeof item === 'string') return item;
  return item._id || item.id || '';
};

const ManageStotramSubCategory = () => {
  const navigate = useNavigate();
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
  const [formData, setFormData] = useState({
    categoryId: '',
    title: '',
    textEditor: '',
    audioFile: '',
    pdf: '',
    isFavorite: false,
  });

  const openCreateModal = () => {
    setFormData({
      categoryId: categories.length > 0 ? idOf(categories[0]) : '',
      title: '',
      textEditor: '',
      audioFile: '',
      pdf: '',
      isFavorite: false,
    });
    setModal({ isOpen: true, data: null });
  };

  const openEditModal = (sub) => {
    const rawCat = sub.categoryId;
    const catId = typeof rawCat === 'object' && rawCat ? idOf(rawCat) : (rawCat || '');

    setFormData({
      categoryId: catId,
      title: sub.title || sub.subCategoryName || '',
      textEditor: sub.textEditor || '',
      audioFile: sub.audioFile || '',
      pdf: sub.pdf || '',
      isFavorite: Boolean(sub.isFavorite),
    });
    setModal({ isOpen: true, data: sub });
  };

  // Mutations
  const createMutation = useMutation({
    mutationFn: createStotramSubCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stotramSubCategories'] });
      toast.success('Sub Category created successfully');
      setModal({ isOpen: false, data: null });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to create sub category');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateStotramSubCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stotramSubCategories'] });
      toast.success('Sub Category updated successfully');
      setModal({ isOpen: false, data: null });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to update sub category');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteStotramSubCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stotramSubCategories'] });
      toast.success('Sub Category deleted successfully');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to delete sub category');
    }
  });

  const handleSave = (e) => {
    e.preventDefault();

    if (!formData.categoryId) {
      toast.error('Please select a category');
      return;
    }
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!formData.textEditor.trim()) {
      toast.error('Text Editor content is required');
      return;
    }

    const payload = {
      categoryId: formData.categoryId.trim(),
      title: formData.title.trim(),
      textEditor: formData.textEditor.trim(),
      audioFile: (formData.audioFile || '').trim(),
      pdf: (formData.pdf || '').trim(),
      isFavorite: Boolean(formData.isFavorite),
    };

    if (modal.data) {
      updateMutation.mutate({ id: idOf(modal.data), data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div className="page-content animate-fade-in">
      <div className="top-header" style={{ margin: '-2rem -2rem 2rem -2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            className="btn btn-outline"
            onClick={() => navigate('/manage-stotram')}
            title="Back to Stotram Library"
            style={{ padding: '0.5rem 0.75rem' }}
          >
            <MdArrowBack size={18} />
          </button>
          <h1 className="header-title">Manage Stotram Sub Categories</h1>
        </div>

        <button className="btn btn-primary" onClick={openCreateModal}>
          <MdAdd size={20} /> Add Sub Category
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Audio File</th>
              <th>PDF File</th>
              <th>Favorite</th>
              <th style={{ width: '100px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoadingSubCat || isLoadingCat ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Loading...</td></tr>
            ) : subCategories.length > 0 ? (
              subCategories.map((sub) => {
                const subCatId = typeof sub.categoryId === 'object' && sub.categoryId !== null ? idOf(sub.categoryId) : sub.categoryId;
                const parentCat = categories.find((c) => String(idOf(c)) === String(subCatId));

                return (
                  <tr key={idOf(sub)}>
                    <td>
                      <strong style={{ color: 'var(--text-primary)' }}>{sub.title || sub.subCategoryName}</strong>
                    </td>
                    <td>{parentCat ? parentCat.categoryName : (typeof sub.categoryId === 'object' ? sub.categoryId?.categoryName : 'Unknown')}</td>
                    <td>
                      {sub.audioFile ? (
                        <span style={{ fontSize: '0.75rem', color: 'var(--success-color)', fontWeight: '600' }}>Configured</span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>None</span>
                      )}
                    </td>
                    <td>
                      {sub.pdf ? (
                        <a href={sub.pdf} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', color: '#2563EB', fontWeight: '600' }}>
                          View PDF
                        </a>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>None</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${sub.isFavorite ? 'badge-success' : 'badge-warning'}`}>
                        {sub.isFavorite ? 'Favorite' : 'Normal'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn-icon edit" onClick={() => openEditModal(sub)} title="Edit"><MdEdit size={18} /></button>
                      <button className="btn-icon delete" onClick={() => showConfirm('Delete this sub category?', () => { deleteMutation.mutate(idOf(sub)); })} title="Delete"><MdDeleteOutline size={18} /></button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No sub categories found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modal.isOpen && (
        <div className="modal-overlay" onClick={() => setModal({ isOpen: false, data: null })}>
          <div className="modal-content glass-panel animate-fade-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '620px', width: '92%' }}>
            <div className="modal-header">
              <h2>{modal.data ? 'Edit Sub Category' : 'Add Sub Category'}</h2>
              <button className="modal-close-btn" onClick={() => setModal({ isOpen: false, data: null })}><MdClose size={24} /></button>
            </div>
            <form className="modal-body" onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <div className="input-group">
                <label className="input-label">Select Category *</label>
                <select
                  name="categoryId"
                  className="input-field"
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  required
                >
                  <option value="" disabled>Select a category</option>
                  {categories.map((cat) => (
                    <option key={idOf(cat)} value={idOf(cat)}>{cat.categoryName}</option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Title *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Shiv Tandav Stotram"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Text Editor (Content / Sanskrit Lyrics) *</label>
                <textarea
                  className="input-field"
                  rows="5"
                  placeholder="Enter stotram text or lyrics..."
                  value={formData.textEditor}
                  onChange={(e) => setFormData({ ...formData, textEditor: e.target.value })}
                  required
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Audio File URL</label>
                <input
                  type="url"
                  className="input-field"
                  placeholder="https://example.com/audio/stotram.mp3"
                  value={formData.audioFile}
                  onChange={(e) => setFormData({ ...formData, audioFile: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label className="input-label">PDF File URL</label>
                <input
                  type="url"
                  className="input-field"
                  placeholder="https://example.com/pdf/stotram.pdf"
                  value={formData.pdf}
                  onChange={(e) => setFormData({ ...formData, pdf: e.target.value })}
                />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={formData.isFavorite}
                  onChange={(e) => setFormData({ ...formData, isFavorite: e.target.checked })}
                  style={{ width: '18px', height: '18px' }}
                />
                <span className="input-label" style={{ marginBottom: 0 }}>Mark as Favorite</span>
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setModal({ isOpen: false, data: null })}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  <MdSave size={20} /> {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageStotramSubCategory;
