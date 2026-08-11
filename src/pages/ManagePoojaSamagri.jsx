import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MdAdd, MdClose, MdDeleteOutline, MdSave, MdEdit } from 'react-icons/md';
import { toast } from 'react-hot-toast';
import { getAllPoojaSamagri, createPoojaSamagri, updatePoojaSamagri, deletePoojaSamagri } from '../api/poojaSamagri';

const ManagePoojaSamagri = () => {
  const queryClient = useQueryClient();
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [poojaName, setPoojaName] = useState('');
  const [samagriList, setSamagriList] = useState([]);
  const [havanRequired, setHavanRequired] = useState(false);
  const [havanSamagriList, setHavanSamagriList] = useState([]);

  // Fetch Data
  const { data: rawSamagri = [], isLoading } = useQuery({
    queryKey: ['poojaSamagri'],
    queryFn: getAllPoojaSamagri
  });

  const samagris = Array.isArray(rawSamagri) ? rawSamagri : (rawSamagri?.data || rawSamagri?.samagris || []);

  // Mutations
  const createMutation = useMutation({
    mutationFn: createPoojaSamagri,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['poojaSamagri'] });
      toast.success('Pooja Samagri created successfully!');
      closeBuilder();
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to create Pooja Samagri');
    }
  });

  const updateMutation = useMutation({
    mutationFn: updatePoojaSamagri,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['poojaSamagri'] });
      toast.success('Pooja Samagri updated successfully!');
      closeBuilder();
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to update Pooja Samagri');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deletePoojaSamagri,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['poojaSamagri'] });
      toast.success('Pooja Samagri deleted successfully!');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to delete Pooja Samagri');
    }
  });

  const handleAddSamagriItem = (isHavan) => {
    const newItem = { itemName: '', quantity: '' };
    if (isHavan) {
      setHavanSamagriList([...havanSamagriList, newItem]);
    } else {
      setSamagriList([...samagriList, newItem]);
    }
  };

  const handleUpdateSamagriItem = (isHavan, index, field, value) => {
    if (isHavan) {
      const updatedList = [...havanSamagriList];
      updatedList[index][field] = value;
      setHavanSamagriList(updatedList);
    } else {
      const updatedList = [...samagriList];
      updatedList[index][field] = value;
      setSamagriList(updatedList);
    }
  };

  const handleRemoveSamagriItem = (isHavan, index) => {
    if (isHavan) {
      setHavanSamagriList(havanSamagriList.filter((_, i) => i !== index));
    } else {
      setSamagriList(samagriList.filter((_, i) => i !== index));
    }
  };

  const handleEdit = (samagri) => {
    setEditingId(samagri._id || samagri.id);
    setPoojaName(samagri.poojaName || '');
    setSamagriList(samagri.samagriList || []);
    setHavanRequired(samagri.havanRequired || false);
    setHavanSamagriList(samagri.havanSamagriList || []);
    setIsBuilderOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this Pooja Samagri?')) {
      deleteMutation.mutate(id);
    }
  };

  const closeBuilder = () => {
    setIsBuilderOpen(false);
    setEditingId(null);
    setPoojaName('');
    setSamagriList([]);
    setHavanRequired(false);
    setHavanSamagriList([]);
  };

  const handleSave = () => {
    if (!poojaName.trim()) {
      toast.error('Pooja Name is required');
      return;
    }

    const payload = {
      poojaName,
      samagriList,
      havanRequired,
      havanSamagriList: havanRequired ? havanSamagriList : [],
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div className="page-content animate-fade-in">
      {!isBuilderOpen ? (
        <>
          <div className="top-header" style={{ margin: '-2rem -2rem 2rem -2rem' }}>
            <h1 className="header-title">Manage Pooja Samagri</h1>
            <button className="btn btn-primary" onClick={() => setIsBuilderOpen(true)}>
              <MdAdd size={20} /> Create New Samagri List
            </button>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Pooja Name</th>
                  <th>Total Samagri Items</th>
                  <th>Havan Required</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center' }}>Loading...</td>
                  </tr>
                ) : samagris.length > 0 ? (
                  samagris.map(samagri => (
                    <tr key={samagri._id || samagri.id}>
                      <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{samagri.poojaName}</td>
                      <td>{samagri.samagriList?.length || 0} Items</td>
                      <td>{samagri.havanRequired ? 'Yes' : 'No'}</td>
                      <td>
                        <button className="action-btn edit" onClick={() => handleEdit(samagri)} disabled={deleteMutation.isPending}>
                          <MdEdit size={18} />
                        </button>
                        <button className="action-btn delete" onClick={() => handleDelete(samagri._id || samagri.id)} disabled={deleteMutation.isPending}>
                          <MdDeleteOutline size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                      No Pooja Samagri lists found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="pooja-builder-container">
          <div className="builder-header glass-panel">
            <div className="builder-header-left">
              <button className="btn-icon" onClick={closeBuilder} title="Close Builder">
                <MdClose size={24} />
              </button>
              <h2 className="builder-title">{editingId ? 'Edit Pooja Samagri' : 'Create Pooja Samagri'}</h2>
            </div>
            <button className="btn btn-primary" onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
              <MdSave size={20} /> {editingId ? 'Update' : 'Save'} List
            </button>
          </div>

          <div className="builder-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Metadata Section */}
            <div className="builder-card glass-panel metadata-card">
              <h3>Basic Details</h3>
              <div className="metadata-grid">
                <div className="input-group">
                  <label className="input-label">Pooja Name</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="e.g. Satyanarayan Pooja"
                    value={poojaName}
                    onChange={(e) => setPoojaName(e.target.value)}
                  />
                </div>
                <div className="input-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '1.5rem' }}>
                  <input 
                    type="checkbox" 
                    id="havanRequired"
                    checked={havanRequired}
                    onChange={(e) => setHavanRequired(e.target.checked)}
                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  />
                  <label className="input-label" htmlFor="havanRequired" style={{ marginBottom: 0, cursor: 'pointer' }}>
                    Havan Required for this Pooja
                  </label>
                </div>
              </div>
            </div>

            {/* General Samagri List */}
            <div className="builder-card glass-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3>General Samagri List</h3>
                <button className="btn btn-secondary" onClick={() => handleAddSamagriItem(false)}>
                  <MdAdd size={18} /> Add Item
                </button>
              </div>
              
              {samagriList.length === 0 ? (
                <div className="empty-sections" style={{ padding: '2rem', textAlign: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                  <p>No samagri items added yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {samagriList.map((item, index) => (
                    <div key={`general-${index}`} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                      <div className="input-group" style={{ flex: 2 }}>
                        <input 
                          type="text" 
                          className="input-field" 
                          placeholder="Item Name (e.g. Haldi)"
                          value={item.itemName}
                          onChange={(e) => handleUpdateSamagriItem(false, index, 'itemName', e.target.value)}
                        />
                      </div>
                      <div className="input-group" style={{ flex: 1 }}>
                        <input 
                          type="text" 
                          className="input-field" 
                          placeholder="Quantity (e.g. 50g)"
                          value={item.quantity}
                          onChange={(e) => handleUpdateSamagriItem(false, index, 'quantity', e.target.value)}
                        />
                      </div>
                      <button 
                        className="btn-icon delete" 
                        onClick={() => handleRemoveSamagriItem(false, index)}
                        style={{ marginTop: '0.2rem' }}
                        title="Remove Item"
                      >
                        <MdDeleteOutline size={22} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Havan Samagri List */}
            {havanRequired && (
              <div className="builder-card glass-panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3>Havan Samagri List</h3>
                  <button className="btn btn-secondary" onClick={() => handleAddSamagriItem(true)}>
                    <MdAdd size={18} /> Add Havan Item
                  </button>
                </div>
                
                {havanSamagriList.length === 0 ? (
                  <div className="empty-sections" style={{ padding: '2rem', textAlign: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                    <p>No havan samagri items added yet.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {havanSamagriList.map((item, index) => (
                      <div key={`havan-${index}`} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                        <div className="input-group" style={{ flex: 2 }}>
                          <input 
                            type="text" 
                            className="input-field" 
                            placeholder="Havan Item Name (e.g. Havan Kund)"
                            value={item.itemName}
                            onChange={(e) => handleUpdateSamagriItem(true, index, 'itemName', e.target.value)}
                          />
                        </div>
                        <div className="input-group" style={{ flex: 1 }}>
                          <input 
                            type="text" 
                            className="input-field" 
                            placeholder="Quantity (e.g. 1 unit)"
                            value={item.quantity}
                            onChange={(e) => handleUpdateSamagriItem(true, index, 'quantity', e.target.value)}
                          />
                        </div>
                        <button 
                          className="btn-icon delete" 
                          onClick={() => handleRemoveSamagriItem(true, index)}
                          style={{ marginTop: '0.2rem' }}
                          title="Remove Item"
                        >
                          <MdDeleteOutline size={22} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagePoojaSamagri;
