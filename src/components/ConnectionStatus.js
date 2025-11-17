// src/components/ConnectionStatus.js
import React, { useState } from "react";

const ConnectionStatus = ({
  isConnected,
  localId,
  remoteId,
  onConnect,
  onDisconnect,
}) => {
  const [peerIdInput, setPeerIdInput] = useState("");

  const handleConnect = () => {
    if (peerIdInput.trim()) {
      onConnect(peerIdInput.trim());
      setPeerIdInput("");
    }
  };

  return (
    <div className="connection-status">
      <div className="status-info">
        <span
          className={`status-indicator ${
            isConnected ? "connected" : "disconnected"
          }`}
        >
          {isConnected ? "Connected" : "Disconnected"}
        </span>

        {localId && <span className="local-id">Your ID: {localId}</span>}
      </div>

      <div className="connection-controls">
        {!isConnected ? (
          <div className="connect-form">
            <input
              type="text"
              placeholder="Enter friend's ID"
              value={peerIdInput}
              onChange={(e) => setPeerIdInput(e.target.value)}
              className="peer-id-input"
            />
            <button
              onClick={handleConnect}
              disabled={!peerIdInput.trim()}
              className="connect-btn"
            >
              Connect
            </button>
          </div>
        ) : (
          <div className="connected-info">
            <span>Connected to: {remoteId}</span>
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
