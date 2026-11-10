import React, { useState, useEffect } from 'react';
import { useConfirmModal } from '../contexts/ConfirmModalContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MdAdd, MdClose, MdDeleteOutline, MdSave, MdEdit, MdContentCopy, MdListAlt, MdOutlinePostAdd, MdSearch, MdFilterList } from 'react-icons/md';
import { toast } from 'react-hot-toast';
import { getAllPoojaSamagri, createPoojaSamagri, updatePoojaSamagri, deletePoojaSamagri } from '../api/poojaSamagri';

const ManagePoojaSamagri = () => {
  const { showConfirm } = useConfirmModal();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'builder'
  
  // Inventory Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Inventory Filter State
  const [inventorySearchQuery, setInventorySearchQuery] = useState('');
  const [inventoryFilterType, setInventoryFilterType] = useState('All');

  // Form State for Inventory (New Schema)
  const [poojaName, setPoojaName] = useState('');
  const [godName, setGodName] = useState('');
  const [itemType, setItemType] = useState('Common');
  const [havanRequired, setHavanRequired] = useState(false);
  const [items, setItems] = useState([{ itemName: '', quantity: '' }]);

  // Builder State
  const [filterPooja, setFilterPooja] = useState('');
  const [filterDeity, setFilterDeity] = useState('');
  const [includeHawan, setIncludeHawan] = useState(false);
  const [checkedPackages, setCheckedPackages] = useState({});

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

    samagris.forEach(pkg => {
      let shouldSelect = false;

      // Rule 1: Common items always selected
      if (pkg.itemType === 'Common') {
        shouldSelect = true;
      }

      // Rule 2: Hawan items selected if includeHawan is true
      if (pkg.itemType === 'Hawan' && includeHawan) {
        shouldSelect = true;
      }

      // Rule 3: Pooja matches
      if (fPooja && pkg.poojaName && Array.isArray(pkg.poojaName)) {
        if (pkg.poojaName.some(p => p.toLowerCase().includes(fPooja))) {
          shouldSelect = true;
        }
      }

      // Rule 4: Deity matches
      if (fDeity && pkg.godName && Array.isArray(pkg.godName)) {
        if (pkg.godName.some(d => d.toLowerCase().includes(fDeity))) {
          shouldSelect = true;
        }
      }

      // Check havanRequired logic
      if (pkg.havanRequired && !includeHawan && !shouldSelect) {
         // if havan is required for this package but user didn't ask for hawan, we might not select it automatically 
         // unless it strictly matched pooja/deity.
      }

      newChecked[pkg._id || pkg.id] = shouldSelect;
    });

    setCheckedPackages(newChecked);
  }, [filterPooja, filterDeity, includeHawan, samagris, activeTab]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: createPoojaSamagri,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['poojaSamagri'] });
      toast.success('Samagri package created successfully!');
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
      toast.success('Samagri package updated successfully!');
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
      toast.success('Samagri package deleted successfully!');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to delete item');
    }
  });

  const handleEdit = (pkg) => {
    setEditingId(pkg._id || pkg.id);
    setPoojaName(Array.isArray(pkg.poojaName) ? pkg.poojaName.join(', ') : (pkg.poojaName || ''));
    setGodName(Array.isArray(pkg.godName) ? pkg.godName.join(', ') : (pkg.godName || ''));
    setItemType(pkg.itemType || 'Common');
    setHavanRequired(pkg.havanRequired || false);
    
    if (pkg.items && Array.isArray(pkg.items) && pkg.items.length > 0) {
      setItems(pkg.items.map(i => ({ itemName: i.itemName || '', quantity: i.quantity || '' })));
    } else {
      setItems([{ itemName: '', quantity: '' }]);
    }
    
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    showConfirm('Are you sure you want to delete this samagri package?', () => {
      deleteMutation.mutate(id);
    });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setPoojaName('');
    setGodName('');
    setItemType('Common');
    setHavanRequired(false);
    setItems([{ itemName: '', quantity: '' }]);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleAddItem = () => {
    setItems([...items, { itemName: '', quantity: '' }]);
  };

  const handleRemoveItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    if (newItems.length === 0) {
      newItems.push({ itemName: '', quantity: '' });
    }
    setItems(newItems);
  };

  const handleSave = () => {
    // Filter out empty items
    const validItems = items.filter(i => i.itemName.trim() !== '');
    
    if (validItems.length === 0) {
      toast.error('Please add at least one valid item');
      return;
    }

    const payload = {
      poojaName: poojaName.split(',').map(s => s.trim()).filter(Boolean),
      godName: godName.split(',').map(s => s.trim()).filter(Boolean),
      itemType,
      havanRequired,
      items: validItems
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleToggleCheck = (id) => {
    setCheckedPackages(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const copyToClipboard = () => {
    const selectedPkgs = samagris.filter(pkg => checkedPackages[pkg._id || pkg.id]);
    if (selectedPkgs.length === 0) {
      toast.error("No packages selected to copy");
      return;
    }

    const poojaItems = {};
    const hawanItems = {};
    
    // Determine if hawan is required overall for this list
    const isHawanNeeded = includeHawan || selectedPkgs.some(p => p.havanRequired);

    selectedPkgs.forEach(pkg => {
      const isHawanPackage = pkg.itemType === 'Hawan';
      const isPoojaPackage = pkg.itemType === 'Pooja';
      const isCommonPackage = pkg.itemType === 'Common';

      (pkg.items || []).forEach(item => {
        if (item.itemName) {
          const addToList = (listObj) => {
            if (listObj[item.itemName]) {
              listObj[item.itemName] += ` + ${item.quantity}`;
            } else {
              listObj[item.itemName] = item.quantity;
            }
          };

          if (isPoojaPackage) {
            addToList(poojaItems);
          } else if (isHawanPackage) {
            addToList(hawanItems);
          } else if (isCommonPackage) {
            // Common items always go to Pooja Items
            addToList(poojaItems);
            // Common items also go to Hawan Items if hawan is required
            if (isHawanNeeded) {
              addToList(hawanItems);
            }
          }
        }
      });
    });

    if (Object.keys(poojaItems).length === 0 && Object.keys(hawanItems).length === 0) {
       toast.error("No valid items found in selected packages");
       return;
    }

    let text = `Pooja Samagri List:\n`;
    if (filterPooja) text += `For Pooja: ${filterPooja}\n`;
    if (filterDeity) text += `For Deity: ${filterDeity}\n`;
    text += `==============================\n\n`;

    if (Object.keys(poojaItems).length > 0) {
      text += `--- Pooja Items ---\n`;
      let idx = 1;
      for (const [name, qty] of Object.entries(poojaItems)) {
        text += `${idx++}. ${name} - ${qty}\n`;
      }
      text += `\n`;
    }

    if (Object.keys(hawanItems).length > 0) {
      text += `--- Hawan Items ---\n`;
      let idx = 1;
      for (const [name, qty] of Object.entries(hawanItems)) {
        text += `${idx++}. ${name} - ${qty}\n`;
      }
      text += `\n`;
    }

    navigator.clipboard.writeText(text).then(() => {
      toast.success("List copied to clipboard!");
    }).catch(err => {
      toast.error("Failed to copy");
    });
  };

  const getChipStyle = (type) => {
    switch(type) {
      case 'Common': return { bg: 'rgba(76, 175, 80, 0.15)', color: '#4caf50', border: '1px solid rgba(76,175,80,0.3)' };
      case 'Hawan': return { bg: 'rgba(244, 67, 54, 0.15)', color: '#f44336', border: '1px solid rgba(244,67,54,0.3)' };
      case 'Pooja': return { bg: 'rgba(33, 150, 243, 0.15)', color: '#2196f3', border: '1px solid rgba(33,150,243,0.3)' };
      default: return { bg: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' };
    }
  };

  return (
    <div className="page-content animate-fade-in">
      <div className="top-header" style={{ margin: '-0.95rem -1.25rem 0.9rem -1.25rem' }}>
        <h1 className="header-title">Manage Pooja Samagri</h1>
        
        <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.25rem', borderRadius: '8px' }}>
          <button 
            className={`btn ${activeTab === 'inventory' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('inventory')}
            style={{ border: activeTab === 'inventory' ? 'none' : undefined, transition: 'all 0.2s' }}
          >
            <MdListAlt size={17} />
            Master Inventory
          </button>
          <button 
            className={`btn ${activeTab === 'builder' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('builder')}
            style={{ border: activeTab === 'builder' ? 'none' : undefined, transition: 'all 0.2s' }}
          >
            <MdOutlinePostAdd size={17} />
            List Builder
          </button>
        </div>
      </div>

      {activeTab === 'inventory' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.75rem', background: 'rgba(255,255,255,0.02)', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', gap: '0.75rem', flex: 1, minWidth: '260px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1, maxWidth: '300px', minWidth: '210px' }}>
                <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                  <MdSearch size={17} />
                </div>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Search by Pooja or God Name..."
                  value={inventorySearchQuery}
                  onChange={(e) => setInventorySearchQuery(e.target.value)}
                  style={{ width: '100%', margin: 0, paddingLeft: '34px', borderRadius: '20px' }}
                />
              </div>
              
              <div style={{ position: 'relative', width: '175px' }}>
                <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                  <MdFilterList size={17} />
                </div>
                <select 
                  className="input-field"
                  value={inventoryFilterType}
                  onChange={(e) => setInventoryFilterType(e.target.value)}
                  style={{ width: '100%', margin: 0, paddingLeft: '34px', borderRadius: '20px', cursor: 'pointer', appearance: 'none' }}
                >
                  <option value="All">All Types</option>
                  <option value="Pooja">Pooja Specific</option>
                  <option value="Hawan">Hawan Specific</option>
                  <option value="Common">Common</option>
                </select>
                <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: '4px solid var(--text-secondary)' }}></div>
              </div>
            </div>
            <button className="btn btn-primary shadow-hover" onClick={() => setIsModalOpen(true)}>
              <MdAdd size={17} /> Create New Package
            </button>
          </div>

          <div className="table-container" style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Poojas</th>
                  <th>Gods/Deities</th>
                  <th>Havan Required</th>
                  <th>Items Count</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '1.35rem' }}>
                      <div className="loader" style={{margin: '0 auto'}}></div>
                    </td>
                  </tr>
                ) : (() => {
                  const filteredInventory = samagris.filter(pkg => {
                    if (inventoryFilterType !== 'All' && pkg.itemType !== inventoryFilterType) return false;
                    if (inventorySearchQuery.trim() !== '') {
                      const query = inventorySearchQuery.toLowerCase().trim();
                      const matchPooja = pkg.poojaName && pkg.poojaName.some(p => p.toLowerCase().includes(query));
                      const matchGod = pkg.godName && pkg.godName.some(g => g.toLowerCase().includes(query));
                      if (!matchPooja && !matchGod) return false;
                    }
                    return true;
                  });

                  return filteredInventory.length > 0 ? (
                    filteredInventory.map(pkg => (
                      <tr key={pkg._id || pkg.id}>
                        <td>
                        <span style={{
                          padding: '4px 10px', 
                          borderRadius: '20px',
                          fontWeight: '600',
                          ...getChipStyle(pkg.itemType)
                        }}>
                          {pkg.itemType || 'Common'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {(pkg.poojaName && pkg.poojaName.length > 0) ? pkg.poojaName.map((p, i) => (
                             <span key={i} className="chip">{p}</span>
                          )) : <span style={{ color: 'var(--text-secondary)' }}>-</span>}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {(pkg.godName && pkg.godName.length > 0) ? pkg.godName.map((g, i) => (
                             <span key={i} className="chip">{g}</span>
                          )) : <span style={{ color: 'var(--text-secondary)' }}>-</span>}
                        </div>
                      </td>
                      <td>
                        {pkg.havanRequired ? (
                           <span style={{ color: '#4caf50', fontWeight: 'bold' }}>Yes</span>
                        ) : (
                           <span style={{ color: 'var(--text-secondary)' }}>No</span>
                        )}
                      </td>
                      <td>
                        <span style={{ 
                          background: 'rgba(255,255,255,0.1)', 
                          padding: '4px 12px', 
                          borderRadius: '12px',
                          fontWeight: 500
                        }}>
                          {pkg.items ? pkg.items.length : 0} items
                        </span>
                      </td>
                      <td>
                        <button className="action-btn edit" onClick={() => handleEdit(pkg)} disabled={deleteMutation.isPending} title="Edit Package">
                          <MdEdit size={18} />
                        </button>
                        <button className="action-btn delete" onClick={() => handleDelete(pkg._id || pkg.id)} disabled={deleteMutation.isPending} title="Delete Package">
                          <MdDeleteOutline size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '1.5rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.55rem' }}>
                        <MdListAlt size={36} style={{ opacity: 0.25 }} />
                        <p style={{ fontSize: '0.84rem', margin: 0 }}>No samagri packages found matching your filters.</p>
                      </div>
                    </td>
                  </tr>
                );
                })()}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'builder' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          <div className="glass-panel" style={{ padding: '1rem 1.15rem', height: 'fit-content' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.85rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.6rem' }}>
              <div style={{ background: 'var(--primary-color)', padding: '6px', borderRadius: '6px', display: 'flex' }}>
                <MdListAlt size={17} color="#fff" />
              </div>
              <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.95rem' }}>List Criteria</h3>
            </div>
            
            <div className="input-group">
              <label className="input-label">Target Pooja Name</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="e.g. Satyanarayan, Diwali"
                value={filterPooja}
                onChange={(e) => setFilterPooja(e.target.value)}
              />
            </div>
            
            <div className="input-group">
              <label className="input-label">Target Deity</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="e.g. Vishnu, Laxmi"
                value={filterDeity}
                onChange={(e) => setFilterDeity(e.target.value)}
              />
            </div>

            <div className="input-group" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '10px', marginTop: '0.75rem', background: 'rgba(0,0,0,0.02)', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <input 
                type="checkbox" 
                id="includeHawan"
                checked={includeHawan}
                onChange={(e) => setIncludeHawan(e.target.checked)}
                style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--primary-color)' }}
              />
              <label className="input-label" htmlFor="includeHawan" style={{ marginBottom: 0, cursor: 'pointer', flex: 1 }}>
                Include Hawan Specific Items
              </label>
            </div>

            <button 
              className="btn btn-primary shadow-hover" 
              style={{ width: '100%', marginTop: '0.9rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
              onClick={copyToClipboard}
            >
              <MdContentCopy size={17} /> Copy Consolidated List
            </button>
          </div>

          <div className="glass-panel" style={{ padding: '1rem 1.15rem', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.6rem' }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.95rem' }}>Matched Packages</h3>
              <span style={{ background: 'var(--primary-color)', color: '#fff', padding: '2px 10px', borderRadius: '16px', fontSize: '0.75rem', fontWeight: 600 }}>
                {samagris.filter(pkg => checkedPackages[pkg._id || pkg.id]).length} Selected
              </span>
            </div>

            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '1.5rem' }}>
                <div className="loader" style={{margin: '0 auto'}}></div>
              </div>
            ) : samagris.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '1.5rem', fontSize: '0.84rem' }}>
                No packages in inventory.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', overflowY: 'auto', maxHeight: '420px', paddingRight: '6px' }}>
                {samagris.map(pkg => {
                  const pkgId = pkg._id || pkg.id;
                  const isChecked = checkedPackages[pkgId] || false;
                  return (
                    <div 
                      key={pkgId} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'flex-start', 
                        gap: '0.65rem', 
                        padding: '0.65rem 0.8rem', 
                        background: isChecked ? 'rgba(130, 0, 30, 0.04)' : '#fff',
                        border: isChecked ? '1px solid var(--primary-color)' : '1px solid var(--border-color)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease-in-out',
                      }}
                      onClick={() => handleToggleCheck(pkgId)}
                      className="hover-card"
                    >
                      <input 
                        type="checkbox" 
                        checked={isChecked}
                        readOnly
                        style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--primary-color)', marginTop: '3px' }}
                      />
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.82rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                           <span style={{ 
                             padding: '2px 7px', 
                             borderRadius: '10px', 
                             fontSize: '0.7rem',
                             fontWeight: 600,
                             ...getChipStyle(pkg.itemType) 
                           }}>
                             {pkg.itemType}
                           </span>
                           <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 500 }}>
                             {pkg.items?.length || 0} items
                           </span>
                        </div>
                        <div style={{ color: 'var(--text-secondary)' }}>
                           <strong style={{color: 'var(--text-primary)'}}>Poojas:</strong> {(pkg.poojaName || []).join(', ') || 'Any'}
                        </div>
                        <div style={{ color: 'var(--text-secondary)' }}>
                           <strong style={{color: 'var(--text-primary)'}}>Gods:</strong> {(pkg.godName || []).join(', ') || 'Any'}
                        </div>
                        {pkg.havanRequired && (
                           <div style={{ color: '#d97706', fontSize: '0.74rem', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                             <span style={{width: '5px', height: '5px', borderRadius: '50%', background: '#d97706'}}></span>
                             Havan Required
                           </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Inventory Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal} style={{ zIndex: 1000, padding: '0.75rem' }}>
          <div className="modal-content glass-panel animate-scale-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '680px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ background: 'var(--primary-color)', padding: '5px', borderRadius: '6px', display: 'flex' }}>
                   {editingId ? <MdEdit size={16} color="#fff" /> : <MdAdd size={16} color="#fff" />}
                </div>
                {editingId ? 'Edit Samagri Package' : 'Create Samagri Package'}
              </h2>
              <button className="modal-close-btn" onClick={closeModal}>
                <MdClose size={20} />
              </button>
            </div>
            
            <div className="modal-body custom-scrollbar" style={{ padding: '1rem 1.15rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Pooja Names (Comma separated)</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="e.g. Satyanarayan, Navratri"
                    value={poojaName}
                    onChange={(e) => setPoojaName(e.target.value)}
                  />
                </div>
                
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">God Names (Comma separated)</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="e.g. Vishnu, Durga"
                    value={godName}
                    onChange={(e) => setGodName(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Item Type <span style={{color:'var(--primary-color)'}}>*</span></label>
                  <select 
                    className="input-field"
                    value={itemType}
                    onChange={(e) => setItemType(e.target.value)}
                    style={{ cursor: 'pointer' }}
                  >
                    <option value="Common">Common</option>
                    <option value="Pooja">Pooja Specific</option>
                    <option value="Hawan">Hawan Specific</option>
                  </select>
                </div>
                
                <div className="input-group" style={{ display: 'flex', alignItems: 'center', padding: '0.55rem 0.85rem', borderRadius: '6px', border: '1px solid var(--border-color)', marginTop: 'auto', marginBottom: 0 }}>
                  <input 
                    type="checkbox" 
                    id="havanRequired"
                    checked={havanRequired}
                    onChange={(e) => setHavanRequired(e.target.checked)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--primary-color)', marginRight: '8px' }}
                  />
                  <label htmlFor="havanRequired" className="input-label" style={{ marginBottom: 0, cursor: 'pointer', flex: 1 }}>
                    Havan Required for this package?
                  </label>
                </div>
              </div>

              <div style={{ marginTop: '0.25rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.55rem' }}>
                  <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.92rem' }}>Package Items</h3>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                    {items.length} item(s)
                  </span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {items.map((item, index) => (
                    <div key={index} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: '#f9fafb', padding: '0.45rem 0.6rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                      <div className="input-group" style={{ flex: 2, marginBottom: 0 }}>
                        <input 
                          type="text" 
                          className="input-field" 
                          placeholder="Item Name (e.g. Haldi)"
                          value={item.itemName}
                          onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                        />
                      </div>
                      <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                        <input 
                          type="text" 
                          className="input-field" 
                          placeholder="Qty (e.g. 50g)"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        />
                      </div>
                      <button 
                        className="action-btn delete" 
                        onClick={() => handleRemoveItem(index)}
                        style={{ background: 'rgba(244, 67, 54, 0.1)', padding: '6px' }}
                        title="Remove Item"
                      >
                        <MdDeleteOutline size={17} />
                      </button>
                    </div>
                  ))}
                </div>
                
                <button 
                  className="btn btn-outline" 
                  onClick={handleAddItem}
                  style={{ marginTop: '0.6rem', width: '100%', borderStyle: 'dashed' }}
                >
                  <MdAdd size={17} /> Add Another Item
                </button>
              </div>

            </div>
            
            <div className="modal-footer" style={{ padding: '0.7rem 1.15rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button className="btn btn-outline" onClick={closeModal}>Cancel</button>
              <button 
                className="btn btn-primary shadow-hover" 
                onClick={handleSave}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <div className="loader" style={{ width: '16px', height: '16px', borderTopColor: '#fff', margin: '0 auto' }}></div>
                ) : (
                  <>
                    <MdSave size={16} /> 
                    {editingId ? 'Update Package' : 'Save Package'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx="true">{`
        .chip {
          background: rgba(255,255,255,0.1);
          color: var(--text-primary);
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 0.8rem;
          white-space: nowrap;
          border: 1px solid rgba(255,255,255,0.05);
        }
        .filter-pill {
          background: transparent;
          color: var(--text-secondary);
          border: none;
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .filter-pill:hover {
          color: var(--text-primary);
          background: rgba(255,255,255,0.05);
        }
        .filter-pill.active {
          background: var(--primary-color);
          color: white;
          box-shadow: 0 2px 8px rgba(var(--primary-rgb), 0.3);
        }
        .hover-card:hover {
          transform: translateY(-2px);
          background: rgba(255,255,255,0.05) !important;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.1);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.2);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.3);
        }
      `}</style>
    </div>
  );
};

export default ManagePoojaSamagri;
