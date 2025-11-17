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
}) => {
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
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
              accept="audio/*"
              multiple
              style={{ display: "none" }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="upload-btn"
            >
              Upload Music
            </button>
          </div>
        )}
      </div>

      <div className="file-list">
        {files.length === 0 ? (
          <div className="empty-state">
            <p>No music files {isLocal ? "uploaded" : "shared"} yet</p>
          </div>
        ) : (
          files.map((file) => (
            <div key={file.id} className="file-item">
              <div className="file-info" onClick={() => onFileSelect(file)}>
                <div className="file-name">{file.name}</div>
                <div className="file-size">{formatFileSize(file.size)}</div>
              </div>

              {isLocal && (
                <button
                  onClick={() => onFileShare(file)}
                  className="share-btn"
                  title="Share with friend"
                >
                  Share
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
