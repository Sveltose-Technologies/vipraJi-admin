import React, { useState } from 'react';
import { useConfirmModal } from '../contexts/ConfirmModalContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MdAdd, MdEdit, MdDeleteOutline, MdClose, MdSave, MdLibraryBooks } from 'react-icons/md';
import { getAllPoojaCategories, getAllPoojaSubCategories } from '../api/poojaCategory';
import { getAllPoojas, createPooja, updatePooja, deletePooja } from '../api/pooja';

const SECTION_TYPES = ["Heading", "Description", "Dhyan", "Mantra", "Notes"];

const ManagePooja = () => {
  const { showConfirm } = useConfirmModal();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Queries
  const { data: rawCategories = [], isLoading: isCatLoading } = useQuery({
    queryKey: ['poojaCategories'],
    queryFn: getAllPoojaCategories
  });

  const { data: rawSubCategories = [], isLoading: isSubCatLoading } = useQuery({
    queryKey: ['poojaSubCategories'],
    queryFn: getAllPoojaSubCategories
  });

  const { data: rawPoojas = [], isLoading: isPoojaLoading } = useQuery({
    queryKey: ['poojas'],
    queryFn: getAllPoojas
  });

  const categories = Array.isArray(rawCategories) ? rawCategories : (rawCategories?.data || rawCategories?.categories || []);
  const subCategories = Array.isArray(rawSubCategories) ? rawSubCategories : (rawSubCategories?.data || rawSubCategories?.subCategories || []);
  const poojas = Array.isArray(rawPoojas) ? rawPoojas : (rawPoojas?.data || rawPoojas?.poojas || []);

  const [modal, setModal] = useState({ isOpen: false, data: null });
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  
  // States for nested modals
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [subCatModalOpen, setSubCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newSubCatName, setNewSubCatName] = useState('');

  // Mutations
  const createMutation = useMutation({
    mutationFn: createPooja,
    onSuccess: () => {
      queryClient.invalidateQueries(['poojas']);
      toast.success('Pooja created successfully');
      setModal({ isOpen: false, data: null });
    },
    onError: () => toast.error('Failed to create pooja')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updatePooja(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['poojas']);
      toast.success('Pooja updated successfully');
      setModal({ isOpen: false, data: null });
    },
    onError: () => toast.error('Failed to update pooja')
  });

  const deleteMutation = useMutation({
    mutationFn: deletePooja,
    onSuccess: () => {
      queryClient.invalidateQueries(['poojas']);
      toast.success('Pooja deleted successfully');
    },
    onError: () => toast.error('Failed to delete pooja')
  });

  const handleSave = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const isFavorite = e.target.isFavorite.checked;
    const isAvailableOffline = e.target.isAvailableOffline.checked;
    formData.set('isFavorite', isFavorite);
    formData.set('isAvailableOffline', isAvailableOffline);
    
    if (modal.data) {
      // If we are editing, only send files if they are selected
      const pdf = formData.get('pdf');
      if (pdf && pdf.size === 0) {
        formData.delete('pdf');
      }
      updateMutation.mutate({ id: modal.data._id || modal.data.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredSubCategories = selectedCategoryId
    ? subCategories.filter(sub => {
        const catId = typeof sub.categoryId === 'object' && sub.categoryId !== null
          ? (sub.categoryId._id || sub.categoryId.id)
          : sub.categoryId;
        return String(catId) === String(selectedCategoryId);
      })
    : [];

  const handleModalOpen = (data = null) => {
    let catId = '';
    if (data && data.categoryId) {
      catId = typeof data.categoryId === 'object' && data.categoryId !== null
        ? (data.categoryId._id || data.categoryId.id)
        : data.categoryId;
    }
    setSelectedCategoryId(String(catId));
    setModal({ isOpen: true, data });
  };

  return (
    <div className="page-content animate-fade-in">
      <div className="top-header" style={{ margin: '-2rem -2rem 2rem -2rem' }}>
        <h1 className="header-title">Manage Pooja</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn" onClick={() => navigate('/manage-pooja-categories')} style={{ backgroundColor: 'white', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
            <MdLibraryBooks size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Manage Categories
          </button>
          <button className="btn btn-primary" onClick={() => handleModalOpen(null)}>
            <MdAdd size={20} /> Add Pooja
          </button>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Sub Category</th>
              <th>Section Type</th>
              <th style={{ width: '100px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isPoojaLoading || isCatLoading || isSubCatLoading ? (
              <tr><td colSpan="5">Loading...</td></tr>
            ) : poojas.length > 0 ? (
              poojas.map(pooja => {
                const parentCat = categories.find(c => {
                  const cId = c._id || c.id;
                  const poojaCatId = typeof pooja.categoryId === 'object' && pooja.categoryId !== null ? (pooja.categoryId._id || pooja.categoryId.id) : pooja.categoryId;
                  return String(cId) === String(poojaCatId);
                });
                const parentSubCat = subCategories.find(s => {
                  const sId = s._id || s.id;
                  const poojaSubCatId = typeof pooja.subCategoryId === 'object' && pooja.subCategoryId !== null ? (pooja.subCategoryId._id || pooja.subCategoryId.id) : pooja.subCategoryId;
                  return String(sId) === String(poojaSubCatId);
                });
                return (
                  <tr key={pooja._id || pooja.id}>
                    <td>{pooja.title}</td>
                    <td>{parentCat ? parentCat.categoryName : 'Unknown'}</td>
                    <td>{parentSubCat ? parentSubCat.subCategoryName : 'Unknown'}</td>
                    <td>{pooja.sectionType}</td>
                    <td>
                      <button className="btn-icon edit" onClick={() => handleModalOpen(pooja)}><MdEdit size={18} /></button>
                      <button className="btn-icon delete" onClick={() => showConfirm('Are you sure?', () => { deleteMutation.mutate(pooja._id || pooja.id); })}><MdDeleteOutline size={18} /></button>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr><td colSpan="5" style={{ textAlign: 'center' }}>No poojas found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modal.isOpen && (
        <div className="modal-overlay" onClick={() => setModal({ isOpen: false, data: null })}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h2 className="modal-title">{modal.data ? 'Edit Pooja' : 'Add Pooja'}</h2>
              <button className="modal-close-btn" onClick={() => setModal({ isOpen: false, data: null })}><MdClose size={24} /></button>
            </div>
            <form className="modal-body" onSubmit={handleSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label className="input-label">Select Category</label>
                  <select 
                    name="categoryId" 
                    className="input-field" 
                    value={selectedCategoryId} 
                    onChange={(e) => {
                      if (e.target.value === 'ADD_NEW') {
                        setCatModalOpen(true);
                        // We do not reset the value here immediately, otherwise ADD_NEW is lost.
                        // However, since selectedCategoryId is controlled, the UI won't change unless we update it.
                        // We will keep it as is, or reset it so the user can select again if they cancel.
                        e.target.value = selectedCategoryId; // Revert to the current valid selection
                      } else {
                        setSelectedCategoryId(e.target.value);
                      }
                    }} 
                    required
                  >
                    <option value="" disabled>Select a category</option>
                    {categories.map(cat => (
                      <option key={cat._id || cat.id} value={cat._id || cat.id}>{cat.categoryName}</option>
                    ))}
                    <option value="ADD_NEW" style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>+ Add New Category</option>
                  </select>
                </div>
                
                <div className="input-group">
                  <label className="input-label">Select Sub Category</label>
                  <select 
                    name="subCategoryId" 
                    className="input-field" 
                    defaultValue={modal.data?.subCategoryId ? (typeof modal.data.subCategoryId === 'object' ? (modal.data.subCategoryId._id || modal.data.subCategoryId.id) : modal.data.subCategoryId) : ''} 
                    onChange={(e) => {
                      if (e.target.value === 'ADD_NEW') {
                        if (!selectedCategoryId) {
                          toast.error("Please select a category first");
                          e.target.value = '';
                          return;
                        }
                        setSubCatModalOpen(true);
                        e.target.value = '';
                      }
                    }}
                    required
                  >
                    <option value="" disabled>Select a sub category</option>
                    {filteredSubCategories.map(sub => (
                      <option key={sub._id || sub.id} value={sub._id || sub.id}>{sub.subCategoryName}</option>
                    ))}
                    <option value="ADD_NEW" style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>+ Add New Sub Category</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label className="input-label">Section Type</label>
                  <select name="sectionType" className="input-field" defaultValue={modal.data?.sectionType || ''} required>
                    <option value="" disabled>Select Section Type</option>
                    {SECTION_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Title</label>
                  <input type="text" name="title" className="input-field" defaultValue={modal.data?.title || ''} required />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Content</label>
                <textarea name="content" className="input-field" rows="3" defaultValue={modal.data?.content || ''} required></textarea>
              </div>

              <div className="input-group">
                <label className="input-label">Text Editor (HTML/Rich Text)</label>
                <textarea name="textEditor" className="input-field" rows="4" defaultValue={modal.data?.textEditor || ''} required></textarea>
              </div>

              <div className="input-group">
                <label className="input-label">PDF File</label>
                <input type="file" name="pdf" className="input-field" accept="application/pdf" {...(!modal.data ? { required: true } : {})} />
              </div>

              <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
                <div className="input-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
                  <input type="checkbox" name="isFavorite" id="isFavorite" defaultChecked={modal.data?.isFavorite || false} style={{ width: '20px', height: '20px' }} />
                  <label className="input-label" htmlFor="isFavorite" style={{ marginBottom: 0 }}>Is Favorite</label>
                </div>

                <div className="input-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
                  <input type="checkbox" name="isAvailableOffline" id="isAvailableOffline" defaultChecked={modal.data?.isAvailableOffline || false} style={{ width: '20px', height: '20px' }} />
                  <label className="input-label" htmlFor="isAvailableOffline" style={{ marginBottom: 0 }}>Available Offline</label>
                </div>
              </div>
              
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem' }} disabled={createMutation.isPending || updateMutation.isPending}>
                <MdSave size={20} /> {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Pooja'}
              </button>
            </form>
          </div>
        </div>
      )}
      {catModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 110 }} onClick={() => setCatModalOpen(false)}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Add Category</h2>
              <button className="modal-close-btn" type="button" onClick={() => setCatModalOpen(false)}><MdClose size={24} /></button>
            </div>
            <form className="modal-body" onSubmit={async (e) => {
              e.preventDefault();
              const loadingToast = toast.loading('Creating category...');
              try {
                const { createPoojaCategory } = await import('../api/poojaCategory');
                const res = await createPoojaCategory({ categoryName: newCatName.trim() });
                queryClient.invalidateQueries(['poojaCategories']);
                toast.success('Category created', { id: loadingToast });
                const newId = res?.data?._id || res?.data?.id || res?._id || res?.id || res?.category?._id || res?.category?.id;
                if (newId) setSelectedCategoryId(String(newId));
                setCatModalOpen(false);
                setNewCatName('');
              } catch (err) {
                toast.error('Failed to create category', { id: loadingToast });
              }
            }}>
              <div className="input-group">
                <label className="input-label">Category Name</label>
                <input type="text" className="input-field" value={newCatName} onChange={e => setNewCatName(e.target.value)} required autoFocus />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem' }}>Save Category</button>
            </form>
          </div>
        </div>
      )}

      {subCatModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 110 }} onClick={() => setSubCatModalOpen(false)}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Add Sub Category</h2>
              <button className="modal-close-btn" type="button" onClick={() => setSubCatModalOpen(false)}><MdClose size={24} /></button>
            </div>
            <form className="modal-body" onSubmit={async (e) => {
              e.preventDefault();
              const loadingToast = toast.loading('Creating sub-category...');
              try {
                const { createPoojaSubCategory } = await import('../api/poojaCategory');
                const res = await createPoojaSubCategory({ categoryId: selectedCategoryId, subCategoryName: newSubCatName.trim() });
                queryClient.invalidateQueries(['poojaSubCategories']);
                toast.success('Sub-category created', { id: loadingToast });
                setSubCatModalOpen(false);
                setNewSubCatName('');
              } catch (err) {
                toast.error('Failed to create sub-category', { id: loadingToast });
              }
            }}>
              <div className="input-group">
                <label className="input-label">Sub Category Name</label>
                <input type="text" className="input-field" value={newSubCatName} onChange={e => setNewSubCatName(e.target.value)} required autoFocus />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem' }}>Save Sub Category</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagePooja;
