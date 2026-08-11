import React, { useState } from 'react';
import AudioPlayerUI from '../components/AudioPlayerUI';
import { MdAdd, MdPlayArrow, MdFavorite, MdClose } from 'react-icons/md';

const MOCK_AARTIS = [
  {
    id: 'a1',
    title: 'Jai Ganesh Deva',
    category: 'Ganesh Aarti',
    imageUrl: 'https://images.unsplash.com/photo-1579564639904-e5357c9ee364?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
  },
  {
    id: 'a2',
    title: 'Om Jai Jagdish Hare',
    category: 'Vishnu Aarti',
    imageUrl: 'https://images.unsplash.com/photo-1629532587783-a79fa4f519eb?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
  },
  {
    id: 'a3',
    title: 'Aarti Kije Hanuman Lala Ki',
    category: 'Hanuman Aarti',
    imageUrl: 'https://images.unsplash.com/photo-1599839619722-39751411ea63?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
  }
];

const ManageAarti = () => {
  const [playingAarti, setPlayingAarti] = useState(null);

  return (
    <div className="page-content animate-fade-in">
      <div className="top-header" style={{ margin: '-2rem -2rem 2rem -2rem' }}>
        <h1 className="header-title">Manage Aarti</h1>
        <button className="btn btn-primary">
          <MdAdd size={20} /> Upload Aarti
        </button>
      </div>

      {/* Large Card Layout Grid */}
      <div className="aarti-grid">
        {MOCK_AARTIS.map(aarti => (
          <div key={aarti.id} className="aarti-large-card glass-panel">
            <div className="aarti-image-container">
              <img src={aarti.imageUrl} alt={aarti.title} className="aarti-image" />
              <div className="aarti-overlay">
                <div className="aarti-top-actions">
                  <span className="badge">{aarti.category}</span>
                  <button className="aarti-favorite-btn">
                    <MdFavorite size={20} color="#ef4444" />
                  </button>
                </div>
                
                <div className="aarti-bottom-info">
                  <h3 className="aarti-card-title">{aarti.title}</h3>
                  <button 
                    className="aarti-play-btn"
                    onClick={() => setPlayingAarti(aarti)}
                  >
                    <MdPlayArrow size={32} color="#fff" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Audio Player Preview Modal */}
      {playingAarti && (
        <div className="modal-overlay" onClick={() => setPlayingAarti(null)}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', backgroundColor: 'transparent', boxShadow: 'none' }}>
            <div style={{ position: 'relative' }}>
              <button className="modal-close-btn" onClick={() => setPlayingAarti(null)} style={{ position: 'absolute', top: '-40px', right: 0, color: '#fff', background: 'rgba(0,0,0,0.5)', borderRadius: '50%', padding: '0.5rem' }}>
                <MdClose size={24} />
              </button>
              <AudioPlayerUI title={playingAarti.title} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageAarti;
