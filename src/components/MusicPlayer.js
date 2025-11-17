// src/components/MusicPlayer.js
import React, { useRef, useEffect } from "react";

const MusicPlayer = ({ currentTrack }) => {
  const audioRef = useRef(null);

  // Reset audio when track changes
  useEffect(() => {
    if (currentTrack && audioRef.current) {
      console.log("Loading new track:", currentTrack.name);
      console.log("Track URL:", currentTrack.url);
      console.log("Track type:", currentTrack.type);

      // Reset the audio element
      audioRef.current.pause();
      audioRef.current.load();
    }
  }, [currentTrack]);

  // Clean up - store ref in variable to avoid dependency issues
  useEffect(() => {
    const audioElement = audioRef.current;

    return () => {
      if (audioElement) {
        audioElement.pause();
      }
    };
  }, []);

  if (!currentTrack) {
    return (
      <div className="music-player empty">
        <p>🎵 Select a track to play</p>
        <p className="hint">
          Click on any music file from either panel to play it here
        </p>
      </div>
    );
  }

  const handleAudioError = (e) => {
    console.error("Audio error:", e);
    console.error("Audio error details:", e.target.error);
    console.error("Track URL:", currentTrack.url);
    console.error("Track type:", currentTrack.type);
  };

  const handleAudioLoad = () => {
    console.log("Audio loaded successfully");
  };

  const handleAudioPlay = () => {
    console.log("Audio started playing");
  };

  return (
    <div className="music-player">
      <div className="player-info">
        <h3>🎧 Now Playing</h3>
        <div className="track-info">
          <div className="track-name">{currentTrack.name}</div>
          <div className="track-details">
            <span className="track-source">
              {currentTrack.isLocal ? "Your Music" : "Friend's Music"}
            </span>
            <span className="track-size">
              {formatFileSize(currentTrack.size)}
            </span>
          </div>
        </div>
      </div>

      <div className="audio-controls">
        <audio
          ref={audioRef}
          key={currentTrack.id}
          controls
          autoPlay={false}
          preload="metadata"
          onError={handleAudioError}
          onLoadedData={handleAudioLoad}
          onPlay={handleAudioPlay}
          style={{
            width: "100%",
            borderRadius: "8px",
            backgroundColor: "#f8f9fa",
          }}
        >
          <source src={currentTrack.url} type={currentTrack.type} />
          <source src={currentTrack.url} type="audio/mpeg" />
          <source src={currentTrack.url} type="audio/wav" />
          <source src={currentTrack.url} type="audio/ogg" />
          Your browser does not support the audio element.
        </audio>

        <div className="audio-help">
          <p>
            💡 If audio doesn't play: Check if the file format is supported by
            your browser
          </p>
          <p>Supported formats: MP3, WAV, OGG, M4A</p>
        </div>
      </div>
    </div>
  );
};

// Helper function to format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export default MusicPlayer;
