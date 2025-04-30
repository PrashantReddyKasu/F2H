"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useLocation } from "../context/LocationContext"
import { useAuth } from "../context/AuthContext"
import MapComponent from "../components/Map"

const LocationSettings = () => {
  const { user } = useAuth()
  const {
    userLocation,
    updateUserLocation,
    setManualLocation,
    isLocationEnabled,
    locationError,
    requestLocationPermission,
    getCurrentPosition,
  } = useLocation()

  const [address, setAddress] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [locationType, setLocationType] = useState<"auto" | "manual">("auto")
  const [manualLatitude, setManualLatitude] = useState("")
  const [manualLongitude, setManualLongitude] = useState("")
  const [manualAddress, setManualAddress] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (userLocation) {
      if (userLocation.address) {
        setAddress(userLocation.address)
        setManualAddress(userLocation.address)
      }

      if (userLocation.coordinates && userLocation.coordinates.length === 2) {
        setManualLatitude(userLocation.coordinates[1].toString())
        setManualLongitude(userLocation.coordinates[0].toString())
      }
    }
  }, [userLocation])

  const handleRequestPermission = async () => {
    setError(null)
    setSuccess(null)

    try {
      const granted = await requestLocationPermission()
      if (granted) {
        setSuccess("Location permission granted successfully!")
      } else {
        setError("Could not get your location. Please try again or enter it manually.")
      }
    } catch (err: any) {
      setError(err.message || "Failed to get location permission")
    }
  }

  const handleUseDeviceLocation = async () => {
    setError(null)
    setSuccess(null)
    setIsUpdating(true)

    try {
      const position = await getCurrentPosition()
      if (!position) {
        throw new Error("Could not get your location. Please try again or enter it manually.")
      }

      const { longitude, latitude } = position

      // Update the form fields with the device location
      setManualLongitude(longitude.toString())
      setManualLatitude(latitude.toString())

      setSuccess("Device location retrieved successfully! Click 'Save Location' to update your profile.")
    } catch (err: any) {
      setError(err.message || "Failed to get device location")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleUpdateLocation = async () => {
    setError(null)
    setSuccess(null)
    setIsUpdating(true)

    try {
      if (!userLocation) {
        throw new Error("Location not available. Please enable location services.")
      }

      await updateUserLocation(userLocation.coordinates[0], userLocation.coordinates[1], address)

      setSuccess("Location updated successfully!")
    } catch (err: any) {
      setError(err.message || "Failed to update location")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleManualLocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setIsUpdating(true)

    try {
      const lat = Number.parseFloat(manualLatitude)
      const lng = Number.parseFloat(manualLongitude)

      if (isNaN(lat) || isNaN(lng)) {
        throw new Error("Please enter valid latitude and longitude values")
      }

      if (lat < -90 || lat > 90) {
        throw new Error("Latitude must be between -90 and 90 degrees")
      }

      if (lng < -180 || lng > 180) {
        throw new Error("Longitude must be between -180 and 180 degrees")
      }

      await setManualLocation(lng, lat, manualAddress)
      setSuccess("Location updated successfully!")
    } catch (err: any) {
      setError(err.message || "Failed to update location")
    } finally {
      setIsUpdating(false)
    }
  }

  const getMapCenter = () => {
    if (userLocation) {
      return {
        lat: userLocation.coordinates[1],
        lng: userLocation.coordinates[0],
      }
    }

    // Default to a central location if user location is not available
    return { lat: 40.7128, lng: -74.006 } // New York City
  }

  const getMapMarkers = () => {
    if (!userLocation) return []

    return [
      {
        id: "user-location",
        position: {
          lat: userLocation.coordinates[1],
          lng: userLocation.coordinates[0],
        },
        title: "Your Location",
        description: address || "Current location",
        type: "user",
      },
    ]
  }

  useEffect(() => {
    // Set loading to false once we have determined if the user has a location or not
    if (userLocation || locationError) {
      setIsLoading(false)
    }
  }, [userLocation, locationError])

  return (
    <div className="container mx-auto px-4 py-8">
      {isLoading && (
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
          <span className="ml-2">Loading your location...</span>
        </div>
      )}
      <h1 className="text-3xl font-bold text-green-700 mb-6">Location Settings</h1>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Location</h2>

        {locationError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{locationError}</div>
        )}

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{success}</div>
        )}

        <div className="mb-6">
          <div className="flex space-x-4 mb-4">
            <button
              onClick={() => setLocationType("auto")}
              className={`py-2 px-4 rounded ${
                locationType === "auto" ? "bg-green-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Use Device Location
            </button>
            <button
              onClick={() => setLocationType("manual")}
              className={`py-2 px-4 rounded ${
                locationType === "manual" ? "bg-green-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Enter Location Manually
            </button>
          </div>

          {locationType === "auto" ? (
            <div>
              <p className="mb-2">
                Location Status:
                <span className={`ml-2 font-semibold ${isLocationEnabled ? "text-green-600" : "text-red-600"}`}>
                  {isLocationEnabled ? "Enabled" : "Disabled"}
                </span>
              </p>

              <button
                onClick={handleUseDeviceLocation}
                disabled={isUpdating}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2"
              >
                {isUpdating ? "Getting Location..." : "Get Device Location"}
              </button>

              {!isLocationEnabled && (
                <button
                  onClick={handleRequestPermission}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-2"
                >
                  Enable Location Services
                </button>
              )}

              <form onSubmit={handleManualLocationSubmit} className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="latitude">
                      Latitude
                    </label>
                    <input
                      type="text"
                      id="latitude"
                      value={manualLatitude}
                      onChange={(e) => setManualLatitude(e.target.value)}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      placeholder="e.g., 40.7128"
                      required
                      readOnly={isUpdating}
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="longitude">
                      Longitude
                    </label>
                    <input
                      type="text"
                      id="longitude"
                      value={manualLongitude}
                      onChange={(e) => setManualLongitude(e.target.value)}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      placeholder="e.g., -74.0060"
                      required
                      readOnly={isUpdating}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="address">
                    Address
                  </label>
                  <input
                    type="text"
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="Enter your address"
                    required
                    readOnly={isUpdating}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                >
                  {isUpdating ? "Updating..." : "Save Location"}
                </button>
              </form>
            </div>
          ) : (
            <form onSubmit={handleManualLocationSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="latitude">
                    Latitude
                  </label>
                  <input
                    type="text"
                    id="latitude"
                    value={manualLatitude}
                    onChange={(e) => setManualLatitude(e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="e.g., 40.7128"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="longitude">
                    Longitude
                  </label>
                  <input
                    type="text"
                    id="longitude"
                    value={manualLongitude}
                    onChange={(e) => setManualLongitude(e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="e.g., -74.0060"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="manualAddress">
                  Address
                </label>
                <input
                  type="text"
                  id="manualAddress"
                  value={manualAddress}
                  onChange={(e) => setManualAddress(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="Enter your address"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isUpdating}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              >
                {isUpdating ? "Updating..." : "Save Location"}
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Location Map</h2>

        {userLocation ? (
          <MapComponent center={getMapCenter()} markers={getMapMarkers()} height="400px" />
        ) : (
          <div className="bg-gray-100 p-6 rounded text-center">
            <p className="text-gray-600">
              Enable location services or enter your location manually to view on the map.
            </p>
          </div>
        )}

        <div className="mt-4">
          <p className="text-sm text-gray-600">
            {user?.role === "partner" ? (
              <>
                As a delivery partner, your location will be shared with customers when you're assigned to their orders.
                Your location will update automatically while you're delivering orders.
              </>
            ) : user?.role === "farmer" ? (
              <>
                As a farmer, your location helps customers find farms in their area. Your exact location is only shown
                to customers when they view your farm details.
              </>
            ) : (
              <>
                As a customer, your location helps us show you nearby farms and calculate delivery distances. Your
                location is only shared with delivery partners when they're assigned to your order.
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}

export default LocationSettings
