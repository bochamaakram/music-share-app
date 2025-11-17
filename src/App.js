// src/App.js
import React, { useState, useRef, useEffect } from "react";
import UserPanel from "./components/UserPanel";
import MusicPlayer from "./components/MusicPlayer";
import ConnectionStatus from "./components/ConnectionStatus";
import { usePeerConnection } from "./hooks/usePeerConnection";
import "./App.css";

function App() {
  const [localFiles, setLocalFiles] = useState([]);
  const [remoteFiles, setRemoteFiles] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [userNickname, setUserNickname] = useState("");
  const [remoteNickname, setRemoteNickname] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [fileTransferStatus, setFileTransferStatus] = useState("");
  const fileInputRef = useRef();

  const {
    isConnected,
    localId,
    remoteId,
    connectionStatus: peerConnectionStatus,
    connectToPeer,
    disconnect,
    sendFile,
  } = usePeerConnection({
    onFileReceived: (file) => {
      console.log("✅ File received in App component:", file.name);
      setRemoteFiles((prev) => {
        const newFiles = [...prev, file];
        console.log("📁 Remote files updated. Total:", newFiles.length);
        return newFiles;
      });
      setFileTransferStatus(`✅ Received: ${file.name}`);
      setTimeout(() => setFileTransferStatus(""), 3000);
    },
    onConnectionStatusChange: (status, remotePeerId) => {
      console.log("🔄 App connection status:", status, remotePeerId);
      setConnectionStatus(status);
    },
    staticId: userNickname,
  });

  // Load nickname from localStorage
  useEffect(() => {
    const savedNickname = localStorage.getItem("musicShareNickname");
    if (savedNickname) {
      setUserNickname(savedNickname);
    }
  }, []);

  // Clean up object URLs
  useEffect(() => {
    return () => {
      localFiles.forEach((file) => {
        if (file.url && file.url.startsWith("blob:")) {
          URL.revokeObjectURL(file.url);
        }
      });
      remoteFiles.forEach((file) => {
        if (file.url && file.url.startsWith("blob:")) {
          URL.revokeObjectURL(file.url);
        }
      });
    };
  }, [localFiles, remoteFiles]);

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const musicFiles = files.filter((file) => {
      return (
        file.type.startsWith("audio/") ||
        file.name.toLowerCase().match(/\.(mp3|wav|ogg|m4a|aac|flac)$/)
      );
    });

    if (musicFiles.length === 0) {
      alert("Please select valid audio files (MP3, WAV, OGG, M4A, AAC, FLAC)");
      return;
    }

    const filesWithMetadata = musicFiles.map((file) => {
      const url = URL.createObjectURL(file);
      console.log("✅ Created URL for local file:", file.name);

      return {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        type: file.type || "audio/mpeg",
        file: file,
        url: url,
        isLocal: true,
        lastModified: file.lastModified,
      };
    });

    setLocalFiles((prev) => [...prev, ...filesWithMetadata]);
    setFileTransferStatus(
      `✅ Added ${filesWithMetadata.length} file(s) to your library`
    );
    setTimeout(() => setFileTransferStatus(""), 3000);
    event.target.value = "";
  };

  const shareFile = async (file) => {
    if (!isConnected) {
      alert("Not connected to any peer. Please connect first.");
      return;
    }

    console.log("🔄 Starting file share:", file.name);
    setFileTransferStatus(`📤 Sharing ${file.name}...`);

    try {
      const success = await sendFile(file.file);
      if (success) {
        console.log("✅ File share completed:", file.name);
        setFileTransferStatus(`✅ Shared ${file.name} successfully!`);
        setTimeout(() => setFileTransferStatus(""), 3000);
      } else {
        console.error("❌ File share failed:", file.name);
        setFileTransferStatus(`❌ Failed to share ${file.name}`);
        setTimeout(() => setFileTransferStatus(""), 3000);
      }
    } catch (error) {
      console.error("❌ Error sharing file:", error);
      setFileTransferStatus(`❌ Error sharing ${file.name}`);
      setTimeout(() => setFileTransferStatus(""), 3000);
    }
  };

  const playTrack = (track) => {
    console.log("🎵 Playing track:", track.name);
    setCurrentTrack(track);
  };

  const handleNicknameSubmit = (nickname) => {
    const cleanNickname = nickname.trim().toLowerCase().replace(/\s+/g, "-");
    setUserNickname(cleanNickname);
    localStorage.setItem("musicShareNickname", cleanNickname);
  };

  const handleRemoteNicknameConnect = (remoteNickname) => {
    const cleanRemoteNickname = remoteNickname
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-");
    setRemoteNickname(cleanRemoteNickname);
    console.log("🔄 Connecting to:", cleanRemoteNickname);
    connectToPeer(cleanRemoteNickname);
  };

  // Clear remote files when disconnecting
  useEffect(() => {
    if (connectionStatus === "disconnected") {
      setRemoteFiles([]);
    }
  }, [connectionStatus]);

  if (!userNickname) {
    return <NicknameSelection onSubmit={handleNicknameSubmit} />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <h1>🎵 Music Share App</h1>
          <div className="user-info">
            <div className="user-badge">
              Your Nickname: <strong>{userNickname}</strong>
            </div>
            {isConnected && (
              <div className="connection-badge connected">
                ✅ Connected to: <strong>{remoteNickname || remoteId}</strong>
              </div>
            )}
          </div>
        </div>
        <ConnectionStatus
          isConnected={isConnected}
          localId={localId}
          remoteId={remoteId}
          connectionStatus={connectionStatus}
          onConnect={handleRemoteNicknameConnect}
          onDisconnect={disconnect}
          userNickname={userNickname}
          remoteNickname={remoteNickname}
        />
      </header>

      <div className="app-content">
        {/* Connection Status Banner */}
        <div className="connection-banner">
          {connectionStatus === "connecting" && (
            <div className="banner connecting">
              🔄 Connecting to {remoteNickname}... Please wait
            </div>
          )}
          {connectionStatus === "connected" && (
            <div className="banner connected">
              ✅ Successfully connected to {remoteNickname || remoteId}! You can
              now share and play music.
            </div>
          )}
          {connectionStatus === "error" && (
            <div className="banner error">
              ❌ Connection failed. Please check the nickname and try again.
            </div>
          )}
          {connectionStatus === "ready" && (
            <div className="banner ready">
              ✅ Ready to connect! Share your nickname:{" "}
              <strong>{userNickname}</strong>
            </div>
          )}
        </div>

        {/* File Transfer Status */}
        {fileTransferStatus && (
          <div className="file-transfer-status">{fileTransferStatus}</div>
        )}

        <div className="user-panels">
          <UserPanel
            title="Your Music"
            files={localFiles}
            onFileSelect={playTrack}
            onFileShare={shareFile}
            onFileUpload={handleFileUpload}
            fileInputRef={fileInputRef}
            isLocal={true}
            isConnected={isConnected}
          />

          <UserPanel
            title={`${remoteNickname || "Friend"}'s Music`}
            files={remoteFiles}
            onFileSelect={playTrack}
            onFileShare={shareFile}
            isLocal={false}
            isConnected={isConnected}
          />
        </div>

        <MusicPlayer currentTrack={currentTrack} />
      </div>
    </div>
  );
}

// Nickname Selection Component (keep the same as before)
const NicknameSelection = ({ onSubmit }) => {
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanNickname = nickname.trim();

    if (!cleanNickname) {
      setError("Please enter a nickname");
      return;
    }

    if (cleanNickname.length < 2) {
      setError("Nickname must be at least 2 characters long");
      return;
    }

    if (cleanNickname.length > 20) {
      setError("Nickname must be less than 20 characters");
      return;
    }

    if (!/^[a-zA-Z0-9\-_]+$/.test(cleanNickname)) {
      setError(
        "Nickname can only contain letters, numbers, hyphens, and underscores"
      );
      return;
    }

    setError("");
    onSubmit(cleanNickname);
  };

  return (
    <div className="nickname-selection">
      <div className="selection-container">
        <h1>🎵 Music Share App</h1>
        <div className="nickname-form">
          <h2>Choose Your Nickname</h2>
          <p className="instruction">
            This will be your unique ID for connecting with friends. Both users
            need different nicknames!
          </p>

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <input
                type="text"
                placeholder="Enter your nickname (e.g., john, music-lover)"
                value={nickname}
                onChange={(e) => {
                  setNickname(e.target.value);
                  setError("");
                }}
                className="nickname-input"
                maxLength={20}
              />
              {error && <div className="error-message">{error}</div>}
            </div>

            <button type="submit" className="submit-nickname">
              Start Sharing Music ✅
            </button>
          </form>

          <div className="tips">
            <h3>Connection Tips:</h3>
            <ul>
              <li>✅ Use 2-20 characters</li>
              <li>✅ Only letters, numbers, hyphens, underscores</li>
              <li>✅ Both users need DIFFERENT nicknames</li>
              <li>✅ Share your exact nickname with friends</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
