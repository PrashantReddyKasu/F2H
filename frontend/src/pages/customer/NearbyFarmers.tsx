"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { useLocation } from "../../context/LocationContext"
import MapComponent from "../../components/Map"
import LoadingSpinner from "../../components/LoadingSpinner"

interface Farmer {
  _id: string
  name: string
  location: {
    coordinates: [number, number] // [longitude, latitude]
    address?: string
  }
}

const NearbyFarmers = () => {
  const { userLocation, getNearbyFarmers, isLocationEnabled, requestLocationPermission, locationError } = useLocation()

  const [farmers, setFarmers] = useState<Farmer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchRadius, setSearchRadius] = useState(50) // Default 50km radius

  useEffect(() => {
    const fetchFarmers = async () => {
      if (!userLocation) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const [longitude, latitude] = userLocation.coordinates
        const maxDistance = searchRadius * 1000 // Convert km to meters

        const nearbyFarmers = await getNearbyFarmers(longitude, latitude, maxDistance)
        setFarmers(nearbyFarmers)
      } catch (err) {
        console.error("Error fetching nearby farmers:", err)
        setError("Failed to load nearby farmers. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchFarmers()
  }, [userLocation, searchRadius, getNearbyFarmers])

  const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchRadius(Number(e.target.value))
  }

  const getMapMarkers = () => {
    const markers = []

    // Add user location marker
    if (userLocation) {
      markers.push({
        id: "user-location",
        position: {
          lat: userLocation.coordinates[1],
          lng: userLocation.coordinates[0],
        },
        title: "Your Location",
        description: "Your current position",
        type: "user",
      })
    }

    // Add farmer markers
    farmers.forEach((farmer) => {
      if (farmer.location && farmer.location.coordinates) {
        markers.push({
          id: `farmer-${farmer._id}`,
          position: {
            lat: farmer.location.coordinates[1],
            lng: farmer.location.coordinates[0],
          },
          title: farmer.name,
          description: farmer.location.address || "Farm location",
          type: "farmer",
        })
      }
    })

    return markers
  }

  if (loading && !farmers.length) return <LoadingSpinner />

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-green-700">Nearby Farmers</h1>
        <Link
          to="/customer/dashboard"
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        >
          Back to Products
        </Link>
      </div>

      {!isLocationEnabled ? (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6">
          <p className="mb-2">Location services are required to find nearby farmers. Please enable location access.</p>
          <button
            onClick={requestLocationPermission}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Enable Location Services
          </button>
        </div>
      ) : locationError ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{locationError}</div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex flex-col md:flex-row justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  Found {farmers.length} farmers within {searchRadius} km
                </h2>
              </div>
              <div className="mt-4 md:mt-0 w-full md:w-1/3">
                <label htmlFor="radius" className="block text-sm font-medium text-gray-700 mb-1">
                  Search Radius: {searchRadius} km
                </label>
                <input
                  type="range"
                  id="radius"
                  min="5"
                  max="100"
                  step="5"
                  value={searchRadius}
                  onChange={handleRadiusChange}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            <div className="h-[500px] w-full">
              {userLocation ? (
                <MapComponent
                  center={{
                    lat: userLocation.coordinates[1],
                    lng: userLocation.coordinates[0],
                  }}
                  markers={getMapMarkers()}
                  height="100%"
                  zoom={10}
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
                  <p className="text-gray-500">Location data not available</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Farmer List</h2>

            {farmers.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No farmers found in your area. Try increasing the search radius.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {farmers.map((farmer) => (
                  <div key={farmer._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h3 className="text-lg font-semibold">{farmer.name}</h3>
                    <p className="text-gray-600 text-sm">{farmer.location.address || "Address not available"}</p>
                    <Link
                      to={`/farmer/${farmer._id}/products`}
                      className="mt-2 inline-block text-green-600 hover:text-green-800"
                    >
                      View Products
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default NearbyFarmers
