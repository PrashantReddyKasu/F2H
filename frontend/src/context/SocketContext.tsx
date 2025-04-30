"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { io, type Socket } from "socket.io-client"
import { useAuth } from "./AuthContext"

interface SocketContextType {
  socket: Socket | null
  connected: boolean
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const { isAuthenticated, user } = useAuth()

  useEffect(() => {
    if (isAuthenticated && user) {
      // Connect to socket server when authenticated
      const socketInstance = io(import.meta.env.VITE_API_URL || "http://localhost:5000", {
        auth: {
          token: localStorage.getItem("token"),
        },
      })

      socketInstance.on("connect", () => {
        console.log("Socket connected")
        setConnected(true)
      })

      socketInstance.on("disconnect", () => {
        console.log("Socket disconnected")
        setConnected(false)
      })

      socketInstance.on("error", (error) => {
        console.error("Socket error:", error)
      })

      setSocket(socketInstance)

      // Cleanup on unmount
      return () => {
        socketInstance.disconnect()
      }
    } else if (socket) {
      // Disconnect if user logs out
      socket.disconnect()
      setSocket(null)
      setConnected(false)
    }
  }, [isAuthenticated, user])

  return <SocketContext.Provider value={{ socket, connected }}>{children}</SocketContext.Provider>
}

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider")
  }
  return context
}
