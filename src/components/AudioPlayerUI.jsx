import React, { useState, useRef, useEffect } from 'react';
import { MdPlayArrow, MdPause, MdSpeed, MdRepeat, MdVolumeUp } from 'react-icons/md';

const AudioPlayerUI = ({ title, audioUrl }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isSlowMode, setIsSlowMode] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = isSlowMode ? 0.75 : 1.0;
    }
  }, [isSlowMode]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = isRepeat;
    }
  }, [isRepeat]);

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => console.log('Audio play error:', e));
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const duration = audioRef.current.duration;
      if (duration) {
        setProgress((current / duration) * 100);
      }
    }
  };

  const handleEnded = () => {
    if (!isRepeat) {
      setIsPlaying(false);
      setProgress(100);
    }
  };

  return (
    <div className="audio-player-wrapper animate-fade-in">
      <audio 
        ref={audioRef} 
        src={audioUrl || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'} 
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
      />
      <div className="audio-progress-bar">
        <div className="audio-progress-fill" style={{ width: `${progress}%` }}></div>
      </div>
      <div className="audio-controls-container">
        <div className="audio-info">
          <span className="audio-status text-gradient">{isPlaying ? 'Now Playing' : 'Paused'}</span>
          <h4 className="audio-title">{title || 'Preview Audio'}</h4>
        </div>
        <div className="audio-actions">
          <button 
            className={`audio-btn ${isSlowMode ? 'active' : ''}`}
            onClick={() => setIsSlowMode(!isSlowMode)}
            title="Slow Mode (0.75x)"
          >
            <MdSpeed size={20} />
            <span className="audio-btn-text">0.75x</span>
          </button>
          
          <button 
            className="audio-play-btn"
            onClick={togglePlay}
          >
            {isPlaying ? <MdPause size={28} /> : <MdPlayArrow size={28} />}
          </button>
          
          <button 
            className={`audio-btn ${isRepeat ? 'active' : ''}`}
            onClick={() => setIsRepeat(!isRepeat)}
            title="Repeat Mode"
          >
            <MdRepeat size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayerUI;
