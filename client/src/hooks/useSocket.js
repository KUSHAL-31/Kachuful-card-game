import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

let socketInstance = null;

export function useSocket(eventHandlers) {
  const handlersRef = useRef(eventHandlers);
  handlersRef.current = eventHandlers;

  useEffect(() => {
    if (!socketInstance) {
      socketInstance = io(SOCKET_URL, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
      });
    }

    const socket = socketInstance;
    const registeredEvents = [];

    Object.entries(handlersRef.current).forEach(([event, handler]) => {
      const wrappedHandler = (...args) => handlersRef.current[event]?.(...args);
      socket.on(event, wrappedHandler);
      registeredEvents.push([event, wrappedHandler]);
    });

    return () => {
      registeredEvents.forEach(([event, handler]) => {
        socket.off(event, handler);
      });
    };
  }, []); // Only register once

  const emit = useCallback((event, data) => {
    if (socketInstance) {
      socketInstance.emit(event, data);
    }
  }, []);

  const getSocketId = useCallback(() => {
    return socketInstance?.id;
  }, []);

  return { emit, getSocketId, socket: socketInstance };
}

export function getSocket() {
  return socketInstance;
}
