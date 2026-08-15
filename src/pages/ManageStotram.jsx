import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import AudioPlayerUI from '../components/AudioPlayerUI';
import { MdAdd, MdMusicNote, MdClose, MdLibraryBooks } from 'react-icons/md';
import { getAllStotramCategories } from '../api/stotramCategory';

const MOCK_STOTRAS = [
  {
    id: 's1',
    title: 'Sankat Nashan Stotram',
    category: 'Ganesh Stotras',
    content: `Pranamya shirasa devam Gauri putram Vinayakam.\nBhavthavasam smare nityam ayuh kama artha sidhaye.\nPrathamam Vakratundam cha, Ekadantam dwitiyakam.\nTritiyam Krishna Pingaksham, Gajavaktram Chaturthakam.`
  },
  {
    id: 's2',
    title: 'Ganapati Atharvashirsha',
    category: 'Ganesh Stotras',
    content: `Om Namaste Ganapataye.\nTvameva pratyaksham tattvamasi.\nTvameva kevalam kartasi.`
  },
  {
    id: 's3',
    title: 'Ganesh Kavach',
    category: 'Ganesh Stotras',
    content: `Esoumati prasarpaami kavacham sarvakaamikam.\nShrunu vakshyaami te devi kavacham sarvasiddhidam.`
  },
  {
    id: 's4',
    title: 'Ganesh Pancharatnam',
    category: 'Ganesh Stotras',
    content: `Muda Karatta Modakam Sada Vimukti Sadhakam\nKala Dharavatamsakam Vilasi Loka Rakshakam`
  },
  {
    id: 's5',
    title: 'Vakratunda Mahakaya',
    category: 'Ganesh Stotras',
    content: `Vakratunda Mahakaya,\nSuryakoti Samaprabha,\nNirvighnam Kuru Me Deva,\nSarvakaryeshu Sarvada.`
  }
];

const ManageStotram = () => {
  const navigate = useNavigate();
  const { data: rawCategories = [], isLoading: isCatLoading } = useQuery({
    queryKey: ['stotramCategories'],
    queryFn: getAllStotramCategories
  });

  const categories = Array.isArray(rawCategories) ? rawCategories : (rawCategories?.data || rawCategories?.categories || []);

  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStotra, setSelectedStotra] = useState(null);

  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0].categoryName);
    }
  }, [categories, selectedCategory]);

  const filteredStotras = MOCK_STOTRAS.filter(s => s.category === selectedCategory);

  return (
    <div className="page-content animate-fade-in">
      <div className="top-header" style={{ margin: '-2rem -2rem 2rem -2rem' }}>
        <h1 className="header-title">Manage Stotram</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn" onClick={() => navigate('/manage-stotram-categories')} style={{ backgroundColor: 'white', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
            <MdLibraryBooks size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Manage Categories
          </button>
          <button className="btn" onClick={() => navigate('/manage-stotram-subcategories')} style={{ backgroundColor: 'white', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
            <MdLibraryBooks size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Manage Sub Categories
          </button>
          <button className="btn btn-primary">
            <MdAdd size={20} /> Upload Stotra
          </button>
        </div>
      </div>

      {/* Category Tabs */}
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

      {/* List Layout for Stotras */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div className="stotram-list">
          {filteredStotras.length > 0 ? (
            filteredStotras.map(stotra => (
              <div 
                key={stotra.id} 
                className="stotram-list-item"
                onClick={() => setSelectedStotra(stotra)}
              >
                <div className="stotram-item-icon">
                  <MdMusicNote size={24} />
                </div>
                <div className="stotram-item-info">
                  <h3 className="stotram-title">{stotra.title}</h3>
                  <span className="stotram-category">{stotra.category}</span>
                </div>
                <button className="stotram-play-preview-btn">Preview Content</button>
              </div>
            ))
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No stotras found for this category.
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal for Complete Content and Audio */}
      {selectedStotra && (
        <div className="modal-overlay" onClick={() => setSelectedStotra(null)}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2 className="modal-title">{selectedStotra.title}</h2>
              <button className="modal-close-btn" onClick={() => setSelectedStotra(null)}>
                <MdClose size={24} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: 0 }}>
              <div className="stotram-sanskrit-content">
                {selectedStotra.content.split('\n').map((line, idx) => (
                  <p key={idx}>{line}</p>
                ))}
              </div>
              <AudioPlayerUI title={selectedStotra.title} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageStotram;
