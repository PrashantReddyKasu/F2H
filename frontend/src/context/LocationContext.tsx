"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { useAuth } from "./AuthContext"
import { useSocket } from "./SocketContext"
import api from "../services/api"

interface Location {
  type: string
  coordinates: [number, number] // [longitude, latitude]
  address?: string
  lastUpdated?: Date
}

interface DeliveryPartnerLocation {
  orderId: string
  partnerId: string
  partnerName: string
  location: Location
}

interface LocationContextType {
  userLocation: Location | null
  setUserLocation: (location: Location) => void
  updateUserLocation: (longitude: number, latitude: number, address?: string) => Promise<void>
  setManualLocation: (longitude: number, latitude: number, address: string) => Promise<void>
  deliveryPartnerLocations: Record<string, DeliveryPartnerLocation>
  getDeliveryPartnerLocation: (orderId: string) => Promise<DeliveryPartnerLocation | null>
  getNearbyFarmers: (longitude: number, latitude: number, maxDistance?: number) => Promise<any[]>
  isLocationEnabled: boolean
  locationError: string | null
  requestLocationPermission: () => Promise<boolean>
  getCurrentPosition: () => Promise<{ longitude: number; latitude: number } | null>
}

const LocationContext = createContext<LocationContextType | undefined>(undefined)

export const LocationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth()
  const { socket } = useSocket()
  const [userLocation, setUserLocation] = useState<Location | null>(null)
  const [deliveryPartnerLocations, setDeliveryPartnerLocations] = useState<Record<string, DeliveryPartnerLocation>>({})
  const [isLocationEnabled, setIsLocationEnabled] = useState<boolean>(false)
  const [locationError, setLocationError] = useState<string | null>(null)

  // Get current position from device
  const getCurrentPosition = async (): Promise<{ longitude: number; latitude: number } | null> => {
    try {
      setLocationError(null)

      if (!navigator.geolocation) {
        setLocationError("Geolocation is not supported by your browser")
        return null
      }

      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { longitude, latitude } = position.coords
            setIsLocationEnabled(true)
            resolve({ longitude, latitude })
          },
          (error) => {
            let errorMessage = "Unknown error occurred"
            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMessage = "User denied the request for Geolocation"
                break
              case error.POSITION_UNAVAILABLE:
                errorMessage = "Location information is unavailable"
                break
              case error.TIMEOUT:
                errorMessage = "The request to get user location timed out"
                break
            }
            setLocationError(errorMessage)
            setIsLocationEnabled(false)
            resolve(null)
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
          },
        )
      })
    } catch (error) {
      setLocationError("Error requesting location permission")
      setIsLocationEnabled(false)
      return null
    }
  }

  // Request location permission
  const requestLocationPermission = async (): Promise<boolean> => {
    try {
      setLocationError(null)

      const position = await getCurrentPosition()
      if (position) {
        const { longitude, latitude } = position
        setUserLocation({
          type: "Point",
          coordinates: [longitude, latitude],
        })
        return true
      }
      return false
    } catch (error) {
      setLocationError("Error requesting location permission")
      setIsLocationEnabled(false)
      return false
    }
  }

  // Update user location in the backend
  const updateUserLocation = async (longitude: number, latitude: number, address?: string) => {
    try {
      console.log("Updating location with:", { longitude, latitude, address })

      const response = await api.post("/location/update", {
        longitude,
        latitude,
        address,
      })

      setUserLocation(response.data.location)

      // If user is a delivery partner, also emit location via socket
      if (user?.role === "partner" && socket) {
        // Get assigned orders to determine which customers to notify
        const ordersResponse = await api.get("/orders/partner/assigned")
        const customerIds = ordersResponse.data
          .filter((order: any) => ["processing", "shipped"].includes(order.status))
          .map((order: any) => order.customer._id)

        socket.emit("update_location", {
          partnerId: user._id,
          partnerName: user.name,
          location: response.data.location,
          customerIds,
        })
      }
    } catch (error) {
      console.error("Error updating location:", error)
      throw error
    }
  }

  // Set location manually without using browser geolocation
  const setManualLocation = async (longitude: number, latitude: number, address: string) => {
    try {
      console.log("Setting manual location with:", { longitude, latitude, address })

      // Update the location in the backend
      const response = await api.post("/location/update", {
        longitude,
        latitude,
        address,
      })

      // Update local state
      setUserLocation(response.data.location)
      setIsLocationEnabled(true)

      // If user is a delivery partner, also emit location via socket
      if (user?.role === "partner" && socket) {
        // Get assigned orders to determine which customers to notify
        const ordersResponse = await api.get("/orders/partner/assigned")
        const customerIds = ordersResponse.data
          .filter((order: any) => ["processing", "shipped"].includes(order.status))
          .map((order: any) => order.customer._id)

        socket.emit("update_location", {
          partnerId: user._id,
          partnerName: user.name,
          location: response.data.location,
          customerIds,
        })
      }
    } catch (error) {
      console.error("Error setting manual location:", error)
      throw error
    }
  }

  // Get delivery partner location for a specific order - memoized with useCallback
  const getDeliveryPartnerLocation = useCallback(
    async (orderId: string): Promise<DeliveryPartnerLocation | null> => {
      try {
        // Check if we already have this location cached
        if (deliveryPartnerLocations[orderId]) {
          return deliveryPartnerLocations[orderId]
        }

        const response = await api.get(`/location/delivery/${orderId}`)
        const locationData = {
          orderId,
          ...response.data,
        }

        // Update the state
        setDeliveryPartnerLocations((prev) => ({
          ...prev,
          [orderId]: locationData,
        }))

        return locationData
      } catch (error) {
        console.error("Error getting delivery partner location:", error)
        return null
      }
    },
    [deliveryPartnerLocations],
  )

  // Get nearby farmers - memoized with useCallback
  const getNearbyFarmers = useCallback(
    async (longitude: number, latitude: number, maxDistance = 50000): Promise<any[]> => {
      try {
        const response = await api.get(`/location/nearby-farmers`, {
          params: { longitude, latitude, maxDistance },
        })
        return response.data
      } catch (error) {
        console.error("Error getting nearby farmers:", error)
        return []
      }
    },
    [],
  )

  // Listen for delivery location updates
  useEffect(() => {
    if (socket && user?.role === "customer") {
      socket.on("delivery_location_update", (data: DeliveryPartnerLocation) => {
        setDeliveryPartnerLocations((prev) => ({
          ...prev,
          [data.orderId]: data,
        }))
      })

      return () => {
        socket.off("delivery_location_update")
      }
    }
  }, [socket, user])

  // Start tracking location for delivery partners
  useEffect(() => {
    let watchId: number | null = null

    if (user?.role === "partner" && isLocationEnabled) {
      // Set up continuous location tracking
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { longitude, latitude } = position.coords
          updateUserLocation(longitude, latitude)
        },
        (error) => {
          console.error("Error watching position:", error)
        },
        {
          enableHighAccuracy: true,
          maximumAge: 30000, // 30 seconds
          timeout: 27000, // 27 seconds
        },
      )
    }

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [user, isLocationEnabled])

  // Load user's location when they log in
  useEffect(() => {
    const loadUserLocation = async () => {
      if (user && user._id) {
        try {
          // Fetch the user's saved location from the backend
          const response = await api.get("/location/user")
          if (response.data && response.data.location) {
            setUserLocation(response.data.location)
            setIsLocationEnabled(true)
          }
        } catch (error) {
          console.error("Error loading user location:", error)
        }
      }
    }

    loadUserLocation()
  }, [user])

  return (
    <LocationContext.Provider
      value={{
        userLocation,
        setUserLocation,
        updateUserLocation,
        setManualLocation,
        deliveryPartnerLocations,
        getDeliveryPartnerLocation,
        getNearbyFarmers,
        isLocationEnabled,
        locationError,
        requestLocationPermission,
        getCurrentPosition,
      }}
    >
      {children}
    </LocationContext.Provider>
  )
}

export const useLocation = () => {
  const context = useContext(LocationContext)
  if (context === undefined) {
    throw new Error("useLocation must be used within a LocationProvider")
  }
  return context
}
