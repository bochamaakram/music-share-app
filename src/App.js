// src/App.js
import React, { useState, useRef } from "react";
import UserPanel from "./components/UserPanel";
import MusicPlayer from "./components/MusicPlayer";
import ConnectionStatus from "./components/ConnectionStatus";
import { usePeerConnection } from "./hooks/usePeerConnection";
import "./App.css";

function App() {
  const [localFiles, setLocalFiles] = useState([]);
  const [remoteFiles, setRemoteFiles] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const fileInputRef = useRef();

  const {
    isConnected,
    localId,
    remoteId,
    connectToPeer,
    disconnect,
    sendFile,
  } = usePeerConnection({
    onFileReceived: (file) => {
      console.log("File received:", file);
      setRemoteFiles((prev) => [...prev, file]);
    },
  });

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const musicFiles = files.filter((file) => file.type.startsWith("audio/"));

    const filesWithMetadata = musicFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      file: file,
      url: URL.createObjectURL(file),
      isLocal: true,
    }));

    setLocalFiles((prev) => [...prev, ...filesWithMetadata]);

    // Reset the file input
    event.target.value = "";
  };

  const shareFile = (file) => {
    if (isConnected) {
      const success = sendFile(file.file);
      if (success) {
        console.log("File shared successfully:", file.name);
      } else {
        console.error("Failed to share file:", file.name);
        alert("Failed to share file. Please check connection.");
      }
    } else {
      alert("Not connected to any peer. Please connect first.");
    }
  };

  const playTrack = (track) => {
    setCurrentTrack(track);
    setIsPlaying(true);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎵 Music Share App</h1>
        <ConnectionStatus
          isConnected={isConnected}
          localId={localId}
          remoteId={remoteId}
          onConnect={connectToPeer}
          onDisconnect={disconnect}
        />
      </header>

      <div className="app-content">
        <div className="user-panels">
          <UserPanel
            title="Your Music"
            files={localFiles}
            onFileSelect={playTrack}
            onFileShare={shareFile}
            onFileUpload={handleFileUpload}
            fileInputRef={fileInputRef}
            isLocal={true}
          />

          <UserPanel
            title="Friend's Music"
            files={remoteFiles}
            onFileSelect={playTrack}
            onFileShare={shareFile}
            isLocal={false}
          />
        </div>

        <MusicPlayer
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
        />
      </div>
    </div>
  );
}

export default App;
