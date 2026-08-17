import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MdAdd, MdClose, MdDeleteOutline, MdSave, MdEdit, MdContentCopy, MdListAlt } from 'react-icons/md';
import { toast } from 'react-hot-toast';
import { getAllPoojaSamagri, createPoojaSamagri, updatePoojaSamagri, deletePoojaSamagri } from '../api/poojaSamagri';

const ManagePoojaSamagri = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'builder'
  
  // Inventory Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form State for Inventory
  const [name, setName] = useState('');
  const [defaultQty, setDefaultQty] = useState('1 packet');
  const [itemType, setItemType] = useState('Common');
  const [associatedDeities, setAssociatedDeities] = useState('');
  const [associatedPoojas, setAssociatedPoojas] = useState('');

  // Builder State
  const [filterPooja, setFilterPooja] = useState('');
  const [filterDeity, setFilterDeity] = useState('');
  const [includeHawan, setIncludeHawan] = useState(false);
  const [checkedItems, setCheckedItems] = useState({});

  // Fetch Data
  const { data: rawSamagri = [], isLoading } = useQuery({
    queryKey: ['poojaSamagri'],
    queryFn: getAllPoojaSamagri
  });

  const samagris = Array.isArray(rawSamagri) ? rawSamagri : (rawSamagri?.data || rawSamagri?.samagris || []);

  // Builder auto-select logic
  useEffect(() => {
    if (activeTab !== 'builder') return;

    const newChecked = {};
    const fPooja = filterPooja.toLowerCase().trim();
    const fDeity = filterDeity.toLowerCase().trim();

    samagris.forEach(item => {
      let shouldSelect = false;

      // Rule 1: Common items always selected
      if (item.itemType === 'Common') {
        shouldSelect = true;
      }

      // Rule 2: Hawan items selected if includeHawan is true
      if (item.itemType === 'Hawan' && includeHawan) {
        shouldSelect = true;
      }

      // Rule 3: Associated Poojas match
      if (fPooja && item.associatedPoojas && Array.isArray(item.associatedPoojas)) {
        if (item.associatedPoojas.some(p => p.toLowerCase().includes(fPooja))) {
          shouldSelect = true;
        }
      }

      // Rule 4: Associated Deities match
      if (fDeity && item.associatedDeities && Array.isArray(item.associatedDeities)) {
        if (item.associatedDeities.some(d => d.toLowerCase().includes(fDeity))) {
          shouldSelect = true;
        }
      }

      newChecked[item._id || item.id] = shouldSelect;
    });

    setCheckedItems(newChecked);
  }, [filterPooja, filterDeity, includeHawan, samagris, activeTab]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: createPoojaSamagri,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['poojaSamagri'] });
      toast.success('Item created successfully!');
      closeModal();
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to create item');
    }
  });

  const updateMutation = useMutation({
    mutationFn: updatePoojaSamagri,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['poojaSamagri'] });
      toast.success('Item updated successfully!');
      closeModal();
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to update item');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deletePoojaSamagri,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['poojaSamagri'] });
      toast.success('Item deleted successfully!');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to delete item');
    }
  });

  const handleEdit = (item) => {
    setEditingId(item._id || item.id);
    setName(item.name || '');
    setDefaultQty(item.defaultQty || '');
    setItemType(item.itemType || 'Common');
    setAssociatedDeities(Array.isArray(item.associatedDeities) ? item.associatedDeities.join(', ') : (item.associatedDeities || ''));
    setAssociatedPoojas(Array.isArray(item.associatedPoojas) ? item.associatedPoojas.join(', ') : (item.associatedPoojas || ''));
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      deleteMutation.mutate(id);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setName('');
    setDefaultQty('1 packet');
    setItemType('Common');
    setAssociatedDeities('');
    setAssociatedPoojas('');
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }

    const payload = {
      name,
      defaultQty,
      itemType,
      associatedDeities: associatedDeities.split(',').map(s => s.trim()).filter(Boolean),
      associatedPoojas: associatedPoojas.split(',').map(s => s.trim()).filter(Boolean),
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleToggleCheck = (id) => {
    setCheckedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const copyToClipboard = () => {
    const selected = samagris.filter(item => checkedItems[item._id || item.id]);
    if (selected.length === 0) {
      toast.error("No items selected to copy");
      return;
    }

    let text = `Pooja Samagri List:\n`;
    if (filterPooja) text += `Pooja: ${filterPooja}\n`;
    if (filterDeity) text += `Deity: ${filterDeity}\n`;
    text += `\n`;

    selected.forEach((item, index) => {
      text += `${index + 1}. ${item.name} - ${item.defaultQty}\n`;
    });

    navigator.clipboard.writeText(text).then(() => {
      toast.success("List copied to clipboard!");
    }).catch(err => {
      toast.error("Failed to copy");
    });
  };

  return (
    <div className="page-content animate-fade-in">
      <div className="top-header" style={{ margin: '-2rem -2rem 2rem -2rem' }}>
        <h1 className="header-title">Pooja Samagri</h1>
        
        <div style={{ display: 'flex', gap: '1rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '8px' }}>
          <button 
            className={`btn ${activeTab === 'inventory' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('inventory')}
            style={{ border: 'none' }}
          >
            <MdListAlt size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Master Inventory
          </button>
          <button 
            className={`btn ${activeTab === 'builder' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('builder')}
            style={{ border: 'none' }}
          >
            <MdAdd size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            List Builder
          </button>
        </div>
      </div>

      {activeTab === 'inventory' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
              <MdAdd size={20} /> Add New Item
            </button>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Default Qty</th>
                  <th>Type</th>
                  <th>Deities</th>
                  <th>Poojas</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center' }}>Loading...</td>
                  </tr>
                ) : samagris.length > 0 ? (
                  samagris.map(item => (
                    <tr key={item._id || item.id}>
                      <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{item.name}</td>
                      <td>{item.defaultQty}</td>
                      <td>
                        <span style={{
                          padding: '4px 8px', 
                          borderRadius: '4px',
                          fontSize: '0.85rem',
                          background: item.itemType === 'Common' ? 'rgba(76, 175, 80, 0.2)' : 
                                      item.itemType === 'Hawan' ? 'rgba(244, 67, 54, 0.2)' : 'rgba(33, 150, 243, 0.2)',
                          color: item.itemType === 'Common' ? '#81c784' : 
                                 item.itemType === 'Hawan' ? '#e57373' : '#64b5f6'
                        }}>
                          {item.itemType}
                        </span>
                      </td>
                      <td>{(item.associatedDeities || []).join(', ') || '-'}</td>
                      <td>{(item.associatedPoojas || []).join(', ') || '-'}</td>
                      <td>
                        <button className="action-btn edit" onClick={() => handleEdit(item)} disabled={deleteMutation.isPending}>
                          <MdEdit size={18} />
                        </button>
                        <button className="action-btn delete" onClick={() => handleDelete(item._id || item.id)} disabled={deleteMutation.isPending}>
                          <MdDeleteOutline size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                      No items found in inventory.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'builder' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
          {/* Using grid 1fr for responsiveness, but can wrap in media queries if needed */}
          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem' }}>
            <div className="glass-panel" style={{ padding: '1.5rem', height: 'fit-content' }}>
              <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>List Criteria</h3>
              
              <div className="input-group">
                <label className="input-label">Pooja Name</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. Satyanarayan"
                  value={filterPooja}
                  onChange={(e) => setFilterPooja(e.target.value)}
                />
              </div>
              
              <div className="input-group">
                <label className="input-label">Deity</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. Vishnu"
                  value={filterDeity}
                  onChange={(e) => setFilterDeity(e.target.value)}
                />
              </div>

              <div className="input-group" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '10px', marginTop: '1.5rem' }}>
                <input 
                  type="checkbox" 
                  id="includeHawan"
                  checked={includeHawan}
                  onChange={(e) => setIncludeHawan(e.target.checked)}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
                <label className="input-label" htmlFor="includeHawan" style={{ marginBottom: 0, cursor: 'pointer' }}>
                  Include Hawan Items
                </label>
              </div>

              <button 
                className="btn btn-primary" 
                style={{ width: '100%', marginTop: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                onClick={copyToClipboard}
              >
                <MdContentCopy size={20} /> Copy List
              </button>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                <h3 style={{ color: 'var(--text-primary)' }}>Generated Checklist</h3>
                <span style={{ background: 'var(--primary-color)', color: '#fff', padding: '4px 12px', borderRadius: '12px', fontSize: '0.9rem' }}>
                  {samagris.filter(item => checkedItems[item._id || item.id]).length} Items Selected
                </span>
              </div>

              {isLoading ? (
                <p>Loading items...</p>
              ) : samagris.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)' }}>No items in inventory. Add items first.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  {samagris.map(item => {
                    const itemId = item._id || item.id;
                    const isChecked = checkedItems[itemId] || false;
                    return (
                      <div 
                        key={itemId} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '1rem', 
                          padding: '0.8rem 1rem', 
                          background: isChecked ? 'rgba(var(--primary-rgb), 0.1)' : 'rgba(255,255,255,0.02)',
                          border: isChecked ? '1px solid var(--primary-color)' : '1px solid var(--border-color)',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onClick={() => handleToggleCheck(itemId)}
                      >
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          readOnly
                          style={{ width: '20px', height: '20px', cursor: 'pointer', pointerEvents: 'none' }}
                        />
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{item.name}</span>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            Type: {item.itemType} | Deities: {(item.associatedDeities || []).join(', ') || '-'} | Poojas: {(item.associatedPoojas || []).join(', ') || '-'}
                          </span>
                        </div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {item.defaultQty}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Inventory Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2 className="modal-title">{editingId ? 'Edit Item' : 'Add Item'}</h2>
              <button className="modal-close-btn" onClick={closeModal}><MdClose size={24} /></button>
            </div>
            
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label className="input-label">Item Name <span style={{color:'red'}}>*</span></label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="e.g. Rice / Haldi"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Default Qty</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="e.g. 1kg"
                    value={defaultQty}
                    onChange={(e) => setDefaultQty(e.target.value)}
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Item Type <span style={{color:'red'}}>*</span></label>
                <select 
                  className="input-field"
                  value={itemType}
                  onChange={(e) => setItemType(e.target.value)}
                >
                  <option value="Common">Common</option>
                  <option value="Pooja">Pooja Specific</option>
                  <option value="Hawan">Hawan Specific</option>
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Associated Deities (Comma separated)</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. Vishnu, Shiva, Ganesha"
                  value={associatedDeities}
                  onChange={(e) => setAssociatedDeities(e.target.value)}
                />
                <small style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Used to auto-select items when building a list for a deity.</small>
              </div>

              <div className="input-group">
                <label className="input-label">Associated Poojas (Comma separated)</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. Satyanarayan, Diwali"
                  value={associatedPoojas}
                  onChange={(e) => setAssociatedPoojas(e.target.value)}
                />
                <small style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Used to auto-select items when building a list for a pooja.</small>
              </div>

              <button 
                className="btn btn-primary" 
                style={{ width: '100%', marginTop: '1rem' }}
                onClick={handleSave}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                <MdSave size={20} /> {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Item'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagePoojaSamagri;
