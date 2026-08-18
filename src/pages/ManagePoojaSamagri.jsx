import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MdAdd, MdClose, MdDeleteOutline, MdSave, MdEdit, MdContentCopy, MdListAlt, MdOutlinePostAdd, MdSearch, MdFilterList } from 'react-icons/md';
import { toast } from 'react-hot-toast';
import { getAllPoojaSamagri, createPoojaSamagri, updatePoojaSamagri, deletePoojaSamagri } from '../api/poojaSamagri';

const ManagePoojaSamagri = () => {
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
    if (window.confirm('Are you sure you want to delete this samagri package?')) {
      deleteMutation.mutate(id);
    }
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
      <div className="top-header" style={{ margin: '-2rem -2rem 2rem -2rem' }}>
        <h1 className="header-title">Manage Pooja Samagri</h1>
        
        <div style={{ display: 'flex', gap: '1rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '8px' }}>
          <button 
            className={`btn ${activeTab === 'inventory' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('inventory')}
            style={{ border: 'none', transition: 'all 0.3s' }}
          >
            <MdListAlt size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Master Inventory
          </button>
          <button 
            className={`btn ${activeTab === 'builder' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('builder')}
            style={{ border: 'none', transition: 'all 0.3s' }}
          >
            <MdOutlinePostAdd size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            List Builder
          </button>
        </div>
      </div>

      {activeTab === 'inventory' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', gap: '1.5rem', flex: 1, minWidth: '300px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1, maxWidth: '350px', minWidth: '250px' }}>
                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                  <MdSearch size={20} />
                </div>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Search by Pooja or God Name..."
                  value={inventorySearchQuery}
                  onChange={(e) => setInventorySearchQuery(e.target.value)}
                  style={{ width: '100%', margin: 0, paddingLeft: '40px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px' }}
                />
              </div>
              
              <div style={{ position: 'relative', width: '200px' }}>
                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                  <MdFilterList size={20} />
                </div>
                <select 
                  className="input-field"
                  value={inventoryFilterType}
                  onChange={(e) => setInventoryFilterType(e.target.value)}
                  style={{ width: '100%', margin: 0, paddingLeft: '40px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', cursor: 'pointer', appearance: 'none' }}
                >
                  <option value="All">All Types</option>
                  <option value="Pooja">Pooja Specific</option>
                  <option value="Hawan">Hawan Specific</option>
                  <option value="Common">Common</option>
                </select>
                <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '5px solid var(--text-secondary)' }}></div>
              </div>
            </div>
            <button className="btn btn-primary shadow-hover" onClick={() => setIsModalOpen(true)}>
              <MdAdd size={20} /> Create New Package
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
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
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
                          fontSize: '0.8rem',
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
                          fontSize: '0.9rem',
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
                    <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                        <MdListAlt size={48} style={{ opacity: 0.2 }} />
                        <p>No samagri packages found matching your filters.</p>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          <div className="glass-panel" style={{ padding: '2rem', height: 'fit-content' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
              <div style={{ background: 'var(--primary-color)', padding: '8px', borderRadius: '8px', display: 'flex' }}>
                <MdListAlt size={20} color="#fff" />
              </div>
              <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>List Criteria</h3>
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

            <div className="input-group" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px', marginTop: '1.5rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <input 
                type="checkbox" 
                id="includeHawan"
                checked={includeHawan}
                onChange={(e) => setIncludeHawan(e.target.checked)}
                style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--primary-color)' }}
              />
              <label className="input-label" htmlFor="includeHawan" style={{ marginBottom: 0, cursor: 'pointer', flex: 1 }}>
                Include Hawan Specific Items
              </label>
            </div>

            <button 
              className="btn btn-primary shadow-hover" 
              style={{ width: '100%', marginTop: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '12px' }}
              onClick={copyToClipboard}
            >
              <MdContentCopy size={20} /> Copy Consolidated List
            </button>
          </div>

          <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Matched Packages</h3>
              <span style={{ background: 'var(--primary-color)', color: '#fff', padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600, boxShadow: '0 2px 10px rgba(var(--primary-rgb), 0.3)' }}>
                {samagris.filter(pkg => checkedPackages[pkg._id || pkg.id]).length} Selected
              </span>
            </div>

            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div className="loader" style={{margin: '0 auto'}}></div>
              </div>
            ) : samagris.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                No packages in inventory.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', maxHeight: '500px', paddingRight: '10px' }}>
                {samagris.map(pkg => {
                  const pkgId = pkg._id || pkg.id;
                  const isChecked = checkedPackages[pkgId] || false;
                  return (
                    <div 
                      key={pkgId} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'flex-start', 
                        gap: '1rem', 
                        padding: '1rem', 
                        background: isChecked ? 'rgba(var(--primary-rgb), 0.1)' : 'rgba(255,255,255,0.03)',
                        border: isChecked ? '1px solid var(--primary-color)' : '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease-in-out',
                        boxShadow: isChecked ? '0 4px 12px rgba(var(--primary-rgb), 0.1)' : 'none'
                      }}
                      onClick={() => handleToggleCheck(pkgId)}
                      className="hover-card"
                    >
                      <input 
                        type="checkbox" 
                        checked={isChecked}
                        readOnly
                        style={{ width: '22px', height: '22px', cursor: 'pointer', accentColor: 'var(--primary-color)', marginTop: '4px' }}
                      />
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                           <span style={{ 
                             padding: '2px 8px', 
                             borderRadius: '12px', 
                             fontSize: '0.75rem', 
                             fontWeight: 600,
                             ...getChipStyle(pkg.itemType) 
                           }}>
                             {pkg.itemType}
                           </span>
                           <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                             {pkg.items?.length || 0} items
                           </span>
                        </div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                           <strong style={{color: 'var(--text-primary)'}}>Poojas:</strong> {(pkg.poojaName || []).join(', ') || 'Any'}
                        </div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                           <strong style={{color: 'var(--text-primary)'}}>Gods:</strong> {(pkg.godName || []).join(', ') || 'Any'}
                        </div>
                        {pkg.havanRequired && (
                           <div style={{ fontSize: '0.85rem', color: '#ff9800', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                             <span style={{width: '6px', height: '6px', borderRadius: '50%', background: '#ff9800'}}></span>
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
        <div className="modal-overlay" onClick={closeModal} style={{ zIndex: 1000, padding: '1rem' }}>
          <div className="modal-content glass-panel animate-scale-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header" style={{ padding: '1.5rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <h2 className="modal-title" style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: 'var(--primary-color)', padding: '6px', borderRadius: '8px', display: 'flex' }}>
                   {editingId ? <MdEdit size={20} color="#fff" /> : <MdAdd size={20} color="#fff" />}
                </div>
                {editingId ? 'Edit Samagri Package' : 'Create Samagri Package'}
              </h2>
              <button className="modal-close-btn" onClick={closeModal} style={{ background: 'rgba(255,255,255,0.1)', padding: '8px', borderRadius: '50%' }}>
                <MdClose size={24} />
              </button>
            </div>
            
            <div className="modal-body custom-scrollbar" style={{ padding: '2rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                <div className="input-group">
                  <label className="input-label">Pooja Names (Comma separated)</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="e.g. Satyanarayan, Navratri"
                    value={poojaName}
                    onChange={(e) => setPoojaName(e.target.value)}
                  />
                </div>
                
                <div className="input-group">
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

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                <div className="input-group">
                  <label className="input-label">Item Type <span style={{color:'var(--primary-color)'}}>*</span></label>
                  <select 
                    className="input-field"
                    value={itemType}
                    onChange={(e) => setItemType(e.target.value)}
                    style={{ appearance: 'none', background: 'var(--bg-secondary)', cursor: 'pointer' }}
                  >
                    <option value="Common">Common</option>
                    <option value="Pooja">Pooja Specific</option>
                    <option value="Hawan">Hawan Specific</option>
                  </select>
                </div>
                
                <div className="input-group" style={{ display: 'flex', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', marginTop: 'auto' }}>
                  <input 
                    type="checkbox" 
                    id="havanRequired"
                    checked={havanRequired}
                    onChange={(e) => setHavanRequired(e.target.checked)}
                    style={{ width: '22px', height: '22px', cursor: 'pointer', accentColor: 'var(--primary-color)', marginRight: '12px' }}
                  />
                  <label htmlFor="havanRequired" className="input-label" style={{ marginBottom: 0, cursor: 'pointer', flex: 1, fontSize: '1rem' }}>
                    Havan Required for this package?
                  </label>
                </div>
              </div>

              <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>Package Items</h3>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {items.length} item(s)
                  </span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {items.map((item, index) => (
                    <div key={index} style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div className="input-group" style={{ flex: 2, marginBottom: 0 }}>
                        <input 
                          type="text" 
                          className="input-field" 
                          placeholder="Item Name (e.g. Haldi)"
                          value={item.itemName}
                          onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                          style={{ background: 'rgba(0,0,0,0.2)' }}
                        />
                      </div>
                      <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                        <input 
                          type="text" 
                          className="input-field" 
                          placeholder="Qty (e.g. 50g)"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          style={{ background: 'rgba(0,0,0,0.2)' }}
                        />
                      </div>
                      <button 
                        className="action-btn delete" 
                        onClick={() => handleRemoveItem(index)}
                        style={{ background: 'rgba(244, 67, 54, 0.1)', padding: '10px' }}
                        title="Remove Item"
                      >
                        <MdDeleteOutline size={20} />
                      </button>
                    </div>
                  ))}
                </div>
                
                <button 
                  className="btn btn-secondary" 
                  onClick={handleAddItem}
                  style={{ marginTop: '1rem', width: '100%', borderStyle: 'dashed', borderWidth: '2px', background: 'transparent' }}
                >
                  <MdAdd size={20} /> Add Another Item
                </button>
              </div>

            </div>
            
            <div className="modal-footer" style={{ padding: '1.5rem 2rem', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'flex-end', gap: '1rem', background: 'rgba(0,0,0,0.2)', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px' }}>
              <button className="btn btn-secondary" onClick={closeModal} style={{ padding: '10px 24px' }}>Cancel</button>
              <button 
                className="btn btn-primary shadow-hover" 
                onClick={handleSave}
                disabled={createMutation.isPending || updateMutation.isPending}
                style={{ padding: '10px 24px', minWidth: '150px' }}
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <div className="loader" style={{ width: '20px', height: '20px', borderTopColor: '#fff', margin: '0 auto' }}></div>
                ) : (
                  <>
                    <MdSave size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> 
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
