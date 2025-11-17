// src/components/ConnectionStatus.js
import React, { useState } from "react";

const ConnectionStatus = ({
  isConnected,
  localId,
  remoteId,
  connectionStatus,
  onConnect,
  onDisconnect,
  userNickname,
  remoteNickname,
}) => {
  const [peerNickname, setPeerNickname] = useState("");

  const handleConnect = () => {
    if (peerNickname.trim()) {
      onConnect(peerNickname.trim());
      setPeerNickname("");
    }
  };

  const getStatusMessage = () => {
    switch (connectionStatus) {
      case "connected":
        return `✅ Connected to ${remoteNickname || remoteId}`;
      case "connecting":
        return "🔄 Connecting...";
      case "error":
        return "❌ Connection failed";
      case "ready":
        return "✅ Ready to connect";
      default:
        return "❌ Disconnected";
    }
  };

  return (
    <div className="connection-status">
      <div className="status-info">
        <span className={`status-indicator ${connectionStatus}`}>
          {getStatusMessage()}
        </span>
      </div>

      <div className="connection-controls">
        {!isConnected ? (
          <div className="connect-section">
            <div className="connect-instruction">
              <p>
                Share your nickname: <strong>{userNickname}</strong>
              </p>
              <p>Enter your friend's nickname to connect:</p>
            </div>
            <div className="connect-form">
              <input
                type="text"
                placeholder="Enter friend's nickname"
                value={peerNickname}
                onChange={(e) => setPeerNickname(e.target.value)}
                className="peer-nickname-input"
              />
              <button
                onClick={handleConnect}
                disabled={
                  !peerNickname.trim() || connectionStatus === "connecting"
                }
                className="connect-btn"
              >
                {connectionStatus === "connecting"
                  ? "Connecting..."
                  : "Connect"}
              </button>
            </div>
          </div>
        ) : (
          <div className="connected-info">
            <span>
              Connected to: <strong>{remoteNickname || remoteId}</strong>
            </span>
            <button onClick={onDisconnect} className="disconnect-btn">
              Disconnect
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectionStatus;
