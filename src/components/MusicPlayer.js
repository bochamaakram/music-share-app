// src/components/MusicPlayer.js
import React, { useRef, useEffect } from "react";

const MusicPlayer = ({ currentTrack, isPlaying, onPlayPause }) => {
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrack]);

  useEffect(() => {
    if (audioRef.current && currentTrack) {
      audioRef.current.load();
      if (isPlaying) {
        audioRef.current.play();
      }
    }
  }, [currentTrack]);

  if (!currentTrack) {
    return (
      <div className="music-player empty">
        <p>Select a track to play</p>
      </div>
    );
  }

  return (
    <div className="music-player">
      <div className="player-info">
        <h3>Now Playing</h3>
        <div className="track-info">
          <div className="track-name">{currentTrack.name}</div>
          <div className="track-source">
            {currentTrack.isLocal ? "Your Music" : "Friend's Music"}
          </div>
        </div>
      </div>

      <div className="player-controls">
        <button onClick={onPlayPause} className="play-pause-btn">
          {isPlaying ? "Pause" : "Play"}
        </button>
      </div>

      <audio
        ref={audioRef}
        controls
        style={{ width: "100%", marginTop: "10px" }}
      >
        <source src={currentTrack.url} type={currentTrack.type} />
        Your browser does not support the audio element.
      </audio>
    </div>
  );
};

export default MusicPlayer;
