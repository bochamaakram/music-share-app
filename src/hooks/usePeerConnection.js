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
    [updateConnectionStatus]
  );

  const setupConnectionHandlers = useCallback(
    (conn) => {
      conn.on("data", (data) => {
        console.log("📦 Received data type:", data.type);
        console.log("📦 Full data received:", data);

        if (data.type === "file" && onFileReceived) {
          try {
            console.log("📁 Processing file:", data.fileName);

            // Handle the file content properly
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
    },
    [onFileReceived, updateConnectionStatus]
  );

  useEffect(() => {
    if (!Peer) {
      console.error("PeerJS not available");
      return;
    }

    const peerId =
      staticId ||
      `user-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

    console.log("🔄 Initializing Peer with ID:", peerId);

    const newPeer = new Peer(peerId, {
      host: "0.peerjs.com",
      port: 443,
      path: "/",
      debug: 3,
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:global.stun.twilio.com:3478" },
        ],
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
      if (err.type === "unavailable-id") {
        updateConnectionStatus("error");
        alert(
          `Nickname "${staticId}" is already taken. Please choose a different one.`
        );
      } else {
        updateConnectionStatus("error");
      }
    });

    newPeer.on("disconnected", () => {
      console.log("🔌 Peer disconnected");
      updateConnectionStatus("disconnected");
    });

    peerRef.current = newPeer;

    return () => {
      if (connectionRef.current) {
        connectionRef.current.close();
      }
      if (newPeer && !newPeer.destroyed) {
        newPeer.destroy();
      }
    };
  }, [staticId, updateConnectionStatus, handleIncomingConnection]);

  const connectToPeer = (peerId) => {
    if (!peerRef.current) {
      console.error("❌ Peer not initialized");
      updateConnectionStatus("error");
      return;
    }

    if (!peerId.trim()) {
      console.error("❌ Invalid peer ID");
      return;
    }

    console.log("🔄 Attempting to connect to:", peerId);
    updateConnectionStatus("connecting");

    try {
      const conn = peerRef.current.connect(peerId, {
        reliable: true,
        serialization: "binary",
      });

      conn.on("open", () => {
        console.log("✅ Outgoing connection opened to:", peerId);
        connectionRef.current = conn;
        setConnection(conn);
        updateConnectionStatus("connected", peerId);
        setupConnectionHandlers(conn);
      });

      conn.on("error", (err) => {
        console.error("❌ Outgoing connection error:", err);
        updateConnectionStatus("error");
        alert(
          `Failed to connect to ${peerId}. Please make sure they are online.`
        );
      });
    } catch (error) {
      console.error("❌ Failed to create connection:", error);
      updateConnectionStatus("error");
    }
  };

  const disconnect = () => {
    console.log("🔌 Disconnecting...");
    if (connectionRef.current) {
      connectionRef.current.close();
      connectionRef.current = null;
    }
    setConnection(null);
    updateConnectionStatus("disconnected");
  };

  const sendFile = (file) => {
    if (!connectionRef.current || !connectionRef.current.open) {
      console.error("❌ No active connection for file transfer");
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
  };

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
