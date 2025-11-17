// src/components/UserPanel.js
import React from "react";

const UserPanel = ({
  title,
  files,
  onFileSelect,
  onFileShare,
  onFileUpload,
  fileInputRef,
  isLocal,
  isConnected,
}) => {
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileExtension = (filename) => {
    return filename.split(".").pop().toUpperCase();
  };

  return (
    <div className="user-panel">
      <div className="panel-header">
        <h2>{title}</h2>
        {isLocal && (
          <div className="panel-actions">
            <input
              type="file"
              ref={fileInputRef}
              onChange={onFileUpload}
              accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac"
              multiple
              style={{ display: "none" }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="upload-btn"
            >
              📁 Upload Music
            </button>
          </div>
        )}
      </div>

      <div className="panel-info">
        {isLocal ? (
          <div className="file-count">
            {files.length} file(s) in your library
          </div>
        ) : (
          <div className="file-count">
            {files.length} file(s) shared by friend
            {!isConnected && <div className="warning">🔴 Not connected</div>}
          </div>
        )}
      </div>

      <div className="file-list">
        {files.length === 0 ? (
          <div className="empty-state">
            {isLocal ? (
              <>
                <p>No music files uploaded yet</p>
                <p className="hint">
                  Click "Upload Music" to add your music files
                </p>
              </>
            ) : (
              <>
                <p>No music files shared yet</p>
                {isConnected ? (
                  <p className="hint">
                    Your friend hasn't shared any files yet
                  </p>
                ) : (
                  <p className="hint">Connect to a friend to see their music</p>
                )}
              </>
            )}
          </div>
        ) : (
          files.map((file) => (
            <div key={file.id} className="file-item">
              <div className="file-info" onClick={() => onFileSelect(file)}>
                <div className="file-name">{file.name}</div>
                <div className="file-details">
                  <span className="file-type">
                    {getFileExtension(file.name)}
                  </span>
                  <span className="file-size">{formatFileSize(file.size)}</span>
                  {file.isLocal ? (
                    <span className="file-status local">Your File</span>
                  ) : (
                    <span className="file-status remote">From Friend</span>
                  )}
                </div>
              </div>

              {isLocal && (
                <button
                  onClick={() => onFileShare(file)}
                  className="share-btn"
                  title="Share with friend"
                  disabled={!isConnected}
                >
                  {isConnected ? "📤 Share" : "Connect to Share"}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default UserPanel;
