// src/hooks/usePeerConnection.js
import { useState, useEffect, useRef } from "react";

// Import PeerJS correctly
let Peer;
if (typeof window !== "undefined") {
  Peer = require("peerjs").default;
}

export const usePeerConnection = ({ onFileReceived }) => {
  const [peer, setPeer] = useState(null);
  const [connection, setConnection] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [localId, setLocalId] = useState("");
  const [remoteId, setRemoteId] = useState("");
  const peerRef = useRef();

  useEffect(() => {
    if (!Peer) return;

    // Initialize Peer with better error handling
    const newPeer = new Peer({
      debug: 3,
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:global.stun.twilio.com:3478" },
        ],
      },
    });

    newPeer.on("open", (id) => {
      console.log("My peer ID is: " + id);
      setLocalId(id);
      setPeer(newPeer);
    });

    newPeer.on("connection", (conn) => {
      console.log("Received connection from: " + conn.peer);
      handleConnection(conn);
    });

    newPeer.on("error", (err) => {
      console.error("PeerJS error:", err);
      // For development, you can use a fallback ID
      if (err.type === "unavailable-id") {
        const fallbackId = "user-" + Math.random().toString(36).substr(2, 9);
        setLocalId(fallbackId);
      }
    });

    peerRef.current = newPeer;

    return () => {
      if (newPeer && !newPeer.destroyed) {
        newPeer.destroy();
      }
    };
  }, []);

  const handleConnection = (conn) => {
    setConnection(conn);
    setIsConnected(true);
    setRemoteId(conn.peer);

    conn.on("data", (data) => {
      console.log("Received data:", data);
      if (data.type === "file" && onFileReceived) {
        // Create a new file object from the received data
        const file = new File([data.file], data.metadata.name, {
          type: data.metadata.type,
        });

        const url = URL.createObjectURL(file);

        onFileReceived({
          id: Math.random().toString(36).substr(2, 9),
          name: data.metadata.name,
          size: data.metadata.size,
          type: data.metadata.type,
          file: file,
          url: url,
          isLocal: false,
        });
      }
    });

    conn.on("close", () => {
      console.log("Connection closed");
      setIsConnected(false);
      setConnection(null);
      setRemoteId("");
    });

    conn.on("error", (err) => {
      console.error("Connection error:", err);
    });
  };

  const connectToPeer = (peerId) => {
    if (!peerRef.current || !peerId.trim()) {
      console.error("No peer instance or invalid peer ID");
      return;
    }

    try {
      const conn = peerRef.current.connect(peerId, {
        reliable: true,
      });

      conn.on("open", () => {
        console.log("Connected to: " + peerId);
        handleConnection(conn);
      });

      conn.on("error", (err) => {
        console.error("Connection error:", err);
      });
    } catch (error) {
      console.error("Failed to connect:", error);
    }
  };

  const disconnect = () => {
    if (connection) {
      connection.close();
    }
    setIsConnected(false);
    setConnection(null);
    setRemoteId("");
  };

  const sendFile = (file) => {
    if (!connection || !connection.open) {
      console.error("No active connection");
      return false;
    }

    try {
      const reader = new FileReader();
      reader.onload = function (event) {
        connection.send({
          type: "file",
          file: event.target.result,
          metadata: {
            name: file.name,
            size: file.size,
            type: file.type,
          },
        });
      };
      reader.readAsArrayBuffer(file);
      return true;
    } catch (error) {
      console.error("Error sending file:", error);
      return false;
    }
  };

  return {
    peer,
    connection,
    isConnected,
    localId,
    remoteId,
    connectToPeer,
    disconnect,
    sendFile,
  };
};
