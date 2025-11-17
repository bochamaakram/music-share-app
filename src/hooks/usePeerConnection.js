// src/hooks/usePeerConnection.js
import { useState, useEffect, useRef, useCallback } from "react";

let Peer;
if (typeof window !== "undefined") {
  Peer = require("peerjs").default;
}

export const usePeerConnection = ({
  onFileReceived,
  onConnectionStatusChange,
  staticId = null,
}) => {
  const [peer, setPeer] = useState(null);
  const [connection, setConnection] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [localId, setLocalId] = useState(staticId || "");
  const [remoteId, setRemoteId] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const peerRef = useRef();
  const connectionRef = useRef();

  const updateConnectionStatus = useCallback(
    (status, remotePeerId = "") => {
      console.log("Connection status update:", status, remotePeerId);
      setConnectionStatus(status);
      setIsConnected(status === "connected");
      setRemoteId(remotePeerId);
      if (onConnectionStatusChange) {
        onConnectionStatusChange(status, remotePeerId);
      }
    },
    [onConnectionStatusChange]
  );

  const setupConnectionHandlers = useCallback(
    (conn) => {
      conn.on("data", (data) => {
        console.log("📦 Received data type:", data.type);

        if (data.type === "file" && onFileReceived) {
          try {
            console.log("📁 Processing file:", data.fileName);

            let fileBlob;
            if (data.content instanceof ArrayBuffer) {
              fileBlob = new Blob([new Uint8Array(data.content)], {
                type: data.fileType,
              });
            } else if (Array.isArray(data.content)) {
              fileBlob = new Blob([new Uint8Array(data.content)], {
                type: data.fileType,
              });
            } else if (data.content) {
              fileBlob = new Blob([data.content], { type: data.fileType });
            } else {
              console.error("❌ No content in file data");
              return;
            }

            const url = URL.createObjectURL(fileBlob);

            const fileObject = {
              id: Math.random().toString(36).substr(2, 9),
              name: data.fileName,
              size: data.fileSize,
              type: data.fileType,
              blob: fileBlob,
              url: url,
              isLocal: false,
              lastModified: Date.now(),
            };

            console.log("✅ File processed successfully:", fileObject.name);
            onFileReceived(fileObject);
          } catch (error) {
            console.error("❌ Error processing received file:", error);
          }
        }
      });

      conn.on("close", () => {
        console.log("🔌 Connection closed by peer");
        connectionRef.current = null;
        setConnection(null);
        updateConnectionStatus("disconnected");
      });

      conn.on("error", (err) => {
        console.error("❌ Connection error:", err);
        updateConnectionStatus("error");
      });

      // Add heartbeat to keep connection alive
      const heartbeat = setInterval(() => {
        if (conn.open) {
          try {
            conn.send({ type: "ping", timestamp: Date.now() });
          } catch (error) {
            console.log("Heartbeat failed, connection might be closed");
            clearInterval(heartbeat);
          }
        } else {
          clearInterval(heartbeat);
        }
      }, 30000);

      conn.on("close", () => {
        clearInterval(heartbeat);
      });
    },
    [onFileReceived, updateConnectionStatus]
  );

  const handleIncomingConnection = useCallback(
    (conn) => {
      console.log("🤝 Handling incoming connection from:", conn.peer);

      conn.on("open", () => {
        console.log("✅ Incoming connection opened with:", conn.peer);
        connectionRef.current = conn;
        setConnection(conn);
        updateConnectionStatus("connected", conn.peer);
        setupConnectionHandlers(conn);
      });

      conn.on("error", (err) => {
        console.error("❌ Incoming connection error:", err);
        updateConnectionStatus("error");
      });
    },
    [updateConnectionStatus, setupConnectionHandlers]
  );

  useEffect(() => {
    if (!Peer) {
      console.error("PeerJS not available");
      return;
    }

    // Generate a simpler ID for production
    const peerId =
      staticId || `user-${Math.random().toString(36).substr(2, 6)}`;

    console.log("🔄 Initializing Peer with ID:", peerId);

    // Production-ready PeerJS configuration
    const newPeer = new Peer(peerId, {
      // Try different hosts in order
      host: "0.peerjs.com",
      port: 443,
      path: "/",
      secure: true,
      debug: 3,
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:global.stun.twilio.com:3478" },
          {
            urls: "turn:numb.viagenie.ca",
            credential: "muazkh",
            username: "webrtc@live.com",
          },
        ],
        iceCandidatePoolSize: 10,
        iceTransportPolicy: "all",
      },
    });

    newPeer.on("open", (id) => {
      console.log("✅ Peer connected with ID:", id);
      setLocalId(id);
      setPeer(newPeer);
      updateConnectionStatus("ready");
    });

    newPeer.on("connection", (conn) => {
      console.log("📨 Incoming connection from:", conn.peer);
      handleIncomingConnection(conn);
    });

    newPeer.on("error", (err) => {
      console.error("❌ PeerJS error:", err);

      switch (err.type) {
        case "unavailable-id":
          updateConnectionStatus("error");
          alert(
            `Nickname "${staticId}" is already taken. Please choose a different one.`
          );
          break;
        case "peer-unavailable":
          updateConnectionStatus("error");
          break;
        case "network":
          updateConnectionStatus("error");
          console.log("Network error, retrying...");
          break;
        case "ssl-unavailable":
          // Fallback to non-SSL
          console.log("SSL unavailable, trying non-SSL...");
          break;
        default:
          updateConnectionStatus("error");
          console.log("Unknown PeerJS error:", err);
      }
    });

    newPeer.on("disconnected", () => {
      console.log("🔌 Peer disconnected, attempting to reconnect...");
      updateConnectionStatus("disconnected");
      // Attempt to reconnect after a delay
      setTimeout(() => {
        if (newPeer.disconnected) {
          newPeer.reconnect();
        }
      }, 5000);
    });

    newPeer.on("close", () => {
      console.log("🔒 Peer closed");
      updateConnectionStatus("disconnected");
    });

    peerRef.current = newPeer;

    return () => {
      console.log("🧹 Cleaning up peer connection");
      if (connectionRef.current) {
        connectionRef.current.close();
      }
      if (newPeer && !newPeer.destroyed) {
        newPeer.destroy();
      }
    };
  }, [staticId, updateConnectionStatus, handleIncomingConnection]);

  const connectToPeer = useCallback(
    (peerId) => {
      if (!peerRef.current) {
        console.error("❌ Peer not initialized");
        updateConnectionStatus("error");
        return;
      }

      if (!peerId.trim()) {
        console.error("❌ Invalid peer ID");
        return;
      }

      // Don't allow connecting to self
      if (peerId === localId) {
        alert("You can't connect to yourself! Use a different nickname.");
        return;
      }

      console.log("🔄 Attempting to connect to:", peerId);
      updateConnectionStatus("connecting");

      try {
        const conn = peerRef.current.connect(peerId, {
          reliable: true,
          serialization: "binary",
          metadata: {
            client: "music-share-app",
            version: "1.0",
          },
        });

        let connectionTimeout = setTimeout(() => {
          if (!conn.open) {
            console.error("❌ Connection timeout");
            updateConnectionStatus("error");
            alert(
              "Connection timeout. Please check if the other user is online and try again."
            );
          }
        }, 10000);

        conn.on("open", () => {
          console.log("✅ Outgoing connection opened to:", peerId);
          clearTimeout(connectionTimeout);
          connectionRef.current = conn;
          setConnection(conn);
          updateConnectionStatus("connected", peerId);
          setupConnectionHandlers(conn);
        });

        conn.on("error", (err) => {
          console.error("❌ Outgoing connection error:", err);
          clearTimeout(connectionTimeout);
          updateConnectionStatus("error");

          if (err.type === "peer-unavailable") {
            alert(
              `User "${peerId}" is not available or not found. Make sure they are online and using the correct nickname.`
            );
          } else {
            alert(`Failed to connect to ${peerId}. Please try again.`);
          }
        });
      } catch (error) {
        console.error("❌ Failed to create connection:", error);
        updateConnectionStatus("error");
        alert("Connection failed: " + error.message);
      }
    },
    [localId, updateConnectionStatus, setupConnectionHandlers]
  );

  const disconnect = useCallback(() => {
    console.log("🔌 Disconnecting...");
    if (connectionRef.current) {
      connectionRef.current.close();
      connectionRef.current = null;
    }
    setConnection(null);
    updateConnectionStatus("disconnected");
  }, [updateConnectionStatus]);

  const sendFile = useCallback((file) => {
    if (!connectionRef.current || !connectionRef.current.open) {
      console.error("❌ No active connection for file transfer");
      return Promise.resolve(false);
    }

    // Limit file size for production (10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      alert(
        `File is too large. Maximum size is 10MB. Your file: ${(
          file.size /
          (1024 * 1024)
        ).toFixed(2)}MB`
      );
      return Promise.resolve(false);
    }

    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          console.log("📤 Sending file:", file.name);

          const fileData = {
            type: "file",
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            content: e.target.result,
          };

          connectionRef.current.send(fileData);
          console.log("✅ File sent successfully:", file.name);
          resolve(true);
        } catch (error) {
          console.error("❌ Error sending file:", error);
          resolve(false);
        }
      };

      reader.onerror = (error) => {
        console.error("❌ Error reading file:", error);
        resolve(false);
      };

      reader.readAsArrayBuffer(file);
    });
  }, []);

  return {
    peer,
    connection,
    isConnected,
    localId,
    remoteId,
    connectionStatus,
    connectToPeer,
    disconnect,
    sendFile,
  };
};
