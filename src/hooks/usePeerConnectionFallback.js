// src/hooks/usePeerConnectionFallback.js
import { useState, useEffect, useRef, useCallback } from "react";

let Peer;
if (typeof window !== "undefined") {
  Peer = require("peerjs").default;
}

const SIGNALING_SERVERS = [
  // Primary server
  { host: "0.peerjs.com", port: 443, path: "/", secure: true },
  // Backup server 1
  { host: "1.peerjs.com", port: 443, path: "/", secure: true },
  // Backup server 2 (non-SSL for fallback)
  { host: "0.peerjs.com", port: 80, path: "/", secure: false },
];

export const usePeerConnectionFallback = ({
  onFileReceived,
  onConnectionStatusChange,
  staticId = null,
}) => {
  const [peer, setPeer] = useState(null);
  const [connection, setConnection] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [localId, setLocalId] = useState("");
  const [remoteId, setRemoteId] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [currentServerIndex, setCurrentServerIndex] = useState(0);
  const peerRef = useRef();
  const connectionRef = useRef();
  const retryCountRef = useRef(0);

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

  const initializePeer = useCallback(() => {
    if (!Peer) return null;

    const serverConfig = SIGNALING_SERVERS[currentServerIndex];
    const peerId =
      staticId || `user-${Math.random().toString(36).substr(2, 6)}`;

    console.log(
      `🔄 Initializing Peer with server ${currentServerIndex}:`,
      serverConfig.host
    );

    return new Peer(peerId, {
      ...serverConfig,
      debug: 3,
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun2.l.google.com:19302" },
          { urls: "stun:stun3.l.google.com:19302" },
          { urls: "stun:stun4.l.google.com:19302" },
        ],
      },
    });
  }, [currentServerIndex, staticId]);

  useEffect(() => {
    const newPeer = initializePeer();
    if (!newPeer) return;

    newPeer.on("open", (id) => {
      console.log("✅ Peer connected with ID:", id);
      setLocalId(id);
      setPeer(newPeer);
      updateConnectionStatus("ready");
      retryCountRef.current = 0;
    });

    newPeer.on("connection", (conn) => {
      console.log("📨 Incoming connection from:", conn.peer);
      handleIncomingConnection(conn);
    });

    newPeer.on("error", (err) => {
      console.error("❌ PeerJS error:", err);

      if (retryCountRef.current < SIGNALING_SERVERS.length - 1) {
        retryCountRef.current += 1;
        setCurrentServerIndex(retryCountRef.current);
        console.log(`🔄 Retrying with server ${retryCountRef.current}`);
      } else {
        updateConnectionStatus("error");
      }
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
  }, [initializePeer, updateConnectionStatus]);

  // ... rest of the functions remain similar to the previous hook

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
