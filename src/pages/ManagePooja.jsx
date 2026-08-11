import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MdAdd, MdClose, MdDeleteOutline, MdDragIndicator, MdFavorite, MdSave } from 'react-icons/md';
import { getAllPoojaCategories, getAllPoojaSubCategories } from '../api/poojaCategory';

const SECTION_TYPES = [
  'Heading',
  'Description',
  'Dhyan',
  'Mantra',
  'Notes'
];

const MOCK_POOJAS = [
  { id: 'p1', title: 'Ganesh Chaturthi Pooja', category: 'Ganesh Pooja', subcategory: 'Shodashopchar Pooja', sectionsCount: 12 },
  { id: 'p2', title: 'Daily Vishnu Pooja', category: 'Vishnu Pooja', subcategory: 'Panchopchar Pooja', sectionsCount: 5 },
];

const ManagePooja = () => {
  const { data: rawCategories = [], isLoading: isCatLoading } = useQuery({
    queryKey: ['poojaCategories'],
    queryFn: getAllPoojaCategories
  });

  const { data: rawSubCategories = [], isLoading: isSubCatLoading } = useQuery({
    queryKey: ['poojaSubCategories'],
    queryFn: getAllPoojaSubCategories
  });

  const categories = Array.isArray(rawCategories) ? rawCategories : (rawCategories?.data || rawCategories?.categories || []);
  const subCategories = Array.isArray(rawSubCategories) ? rawSubCategories : (rawSubCategories?.data || rawSubCategories?.subCategories || []);

  const [selectedCategory, setSelectedCategory] = useState('');
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  
  // Builder State
  const [builderTitle, setBuilderTitle] = useState('');
  const [builderCategory, setBuilderCategory] = useState('');
  const [builderSubcategory, setBuilderSubcategory] = useState('');
  const [sections, setSections] = useState([]);

  useEffect(() => {
    if (categories.length > 0) {
      if (!selectedCategory) setSelectedCategory(categories[0].categoryName);
      if (!builderCategory) setBuilderCategory(categories[0].categoryName);
    }
  }, [categories, selectedCategory, builderCategory]);

  useEffect(() => {
    if (subCategories.length > 0 && !builderSubcategory) {
      setBuilderSubcategory(subCategories[0].subCategoryName);
    }
  }, [subCategories, builderSubcategory]);

  const filteredPoojas = MOCK_POOJAS.filter(p => p.category === selectedCategory);

  const handleAddSection = (type) => {
    setSections([...sections, { id: Date.now().toString(), type, content: '' }]);
  };

  const handleRemoveSection = (id) => {
    setSections(sections.filter(s => s.id !== id));
  };

  const handleUpdateSection = (id, content) => {
    setSections(sections.map(s => s.id === id ? { ...s, content } : s));
  };

  return (
    <div className="page-content animate-fade-in">
      {!isBuilderOpen ? (
        <>
          <div className="top-header" style={{ margin: '-2rem -2rem 2rem -2rem' }}>
            <h1 className="header-title">Manage Pooja Library</h1>
            <button className="btn btn-primary" onClick={() => setIsBuilderOpen(true)}>
              <MdAdd size={20} /> Create New Pooja
            </button>
          </div>

          <div className="tabs-container">
            {isCatLoading ? (
              <span>Loading categories...</span>
            ) : (
              categories.map(cat => (
                <button 
                  key={cat._id || cat.id}
                  className={`tab-btn ${selectedCategory === cat.categoryName ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat.categoryName)}
                >
                  {cat.categoryName}
                </button>
              ))
            )}
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Subcategory</th>
                  <th>Total Sections</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPoojas.length > 0 ? (
                  filteredPoojas.map(pooja => (
                    <tr key={pooja.id}>
                      <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{pooja.title}</td>
                      <td>{pooja.subcategory}</td>
                      <td>{pooja.sectionsCount} Sections</td>
                      <td>
                        <button className="action-btn edit">Edit</button>
                        <button className="action-btn delete">Delete</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                      No poojas found in this category.
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
              <button className="btn-icon" onClick={() => setIsBuilderOpen(false)} title="Close Builder">
                <MdClose size={24} />
              </button>
              <h2 className="builder-title">Dynamic Pooja Builder</h2>
            </div>
            <button className="btn btn-primary" onClick={() => setIsBuilderOpen(false)}>
              <MdSave size={20} /> Save Pooja
            </button>
          </div>

          <div className="builder-content">
            {/* Metadata Section */}
            <div className="builder-card glass-panel metadata-card">
              <h3>Pooja Details</h3>
              <div className="metadata-grid">
                <div className="input-group">
                  <label className="input-label">Pooja Title</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="e.g. Special Navratri Pooja"
                    value={builderTitle}
                    onChange={(e) => setBuilderTitle(e.target.value)}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Category</label>
                  <select className="input-field" value={builderCategory} onChange={e => setBuilderCategory(e.target.value)}>
                    {categories.map(c => <option key={c._id || c.id} value={c.categoryName}>{c.categoryName}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Subcategory</label>
                  <select className="input-field" value={builderSubcategory} onChange={e => setBuilderSubcategory(e.target.value)}>
                    {subCategories.map(c => <option key={c._id || c.id} value={c.subCategoryName}>{c.subCategoryName}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Sections Section */}
            <div className="builder-sections-area">
              <div className="section-header-row">
                <h3>Content Sections ({sections.length})</h3>
                <div className="add-section-dropdown">
                  <select 
                    className="input-field section-select" 
                    onChange={(e) => {
                      if(e.target.value) {
                        handleAddSection(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    defaultValue=""
                  >
                    <option value="" disabled>+ Add Section...</option>
                    {SECTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="sections-list">
                {sections.length === 0 ? (
                  <div className="empty-sections glass-panel">
                    <p>No sections added yet. Start by adding a Heading or Description.</p>
                  </div>
                ) : (
                  sections.map((section, index) => (
                    <div key={section.id} className={`section-block glass-panel type-${section.type.toLowerCase()}`}>
                      <div className="section-block-header">
                        <div className="section-block-drag">
                          <MdDragIndicator size={20} color="var(--text-secondary)" />
                          <span className="section-type-badge">{section.type}</span>
                        </div>
                        <div className="section-block-actions">
                          {(section.type === 'Mantra' || section.type === 'Dhyan') && (
                            <div className="favoritable-indicator" title="End-users can favorite this">
                              <MdFavorite size={16} /> User Favoritable
                            </div>
                          )}
                          <button className="btn-icon delete" onClick={() => handleRemoveSection(section.id)}>
                            <MdDeleteOutline size={20} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="section-block-body">
                        {section.type === 'Heading' ? (
                          <input 
                            type="text" 
                            className="input-field heading-input" 
                            placeholder="Enter Heading..." 
                            value={section.content}
                            onChange={(e) => handleUpdateSection(section.id, e.target.value)}
                          />
                        ) : section.type === 'Notes' ? (
                          <textarea 
                            className="input-field notes-input" 
                            placeholder="Add Pandit's personal notes here..." 
                            rows="3"
                            value={section.content}
                            onChange={(e) => handleUpdateSection(section.id, e.target.value)}
                          />
                        ) : (
                          <textarea 
                            className={`input-field content-textarea ${section.type === 'Mantra' || section.type === 'Dhyan' ? 'sanskrit-font' : ''}`} 
                            placeholder={`Enter ${section.type} content...`} 
                            rows="4"
                            value={section.content}
                            onChange={(e) => handleUpdateSection(section.id, e.target.value)}
                          />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagePooja;
