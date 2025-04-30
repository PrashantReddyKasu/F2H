"use client"

import { useEffect, useState } from "react"
import { MapContainer, TileLayer, Marker as LeafletMarker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Fix for default marker icons in React Leaflet
import icon from "leaflet/dist/images/marker-icon.png"
import iconShadow from "leaflet/dist/images/marker-shadow.png"

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

L.Marker.prototype.options.icon = DefaultIcon

// Custom icons
const createCustomIcon = (color: string) => {
  return L.divIcon({
    className: "custom-icon",
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white;"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })
}

interface MapPosition {
  lat: number
  lng: number
}

interface MarkerProps {
  id: string
  position: MapPosition
  title: string
  description?: string
  type: "user" | "partner" | "farmer" | "destination"
}

interface MapViewProps {
  center: MapPosition
  zoom: number
}

// Component to handle map view changes
const MapView = ({ center, zoom }: MapViewProps) => {
  const map = useMap()

  useEffect(() => {
    map.setView(center, zoom)
  }, [center, zoom, map])

  return null
}

interface MapComponentProps {
  center: MapPosition
  zoom?: number
  markers?: MarkerProps[]
  height?: string
  width?: string
  showControls?: boolean
  onMarkerClick?: (marker: MarkerProps) => void
}

const MapComponent = ({
  center,
  zoom = 13,
  markers = [],
  height = "400px",
  width = "100%",
  showControls = true,
  onMarkerClick,
}: MapComponentProps) => {
  const [mapCenter, setMapCenter] = useState<MapPosition>(center)
  const [mapZoom, setMapZoom] = useState<number>(zoom)

  useEffect(() => {
    setMapCenter(center)
  }, [center])

  const getMarkerIcon = (type: string) => {
    switch (type) {
      case "user":
        return createCustomIcon("#3b82f6") // blue
      case "partner":
        return createCustomIcon("#3b82f6") // blue
      case "farmer":
        return createCustomIcon("#f59e0b") // yellow
      case "destination":
        return createCustomIcon("#ef4444") // red
      default:
        return DefaultIcon
    }
  }

  return (
    <div style={{ height, width }}>
      <MapContainer
        center={[mapCenter.lat, mapCenter.lng]}
        zoom={mapZoom}
        style={{ height: "100%", width: "100%" }}
        zoomControl={showControls}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapView center={mapCenter} zoom={mapZoom} />

        {markers.map((marker) => (
          <LeafletMarker
            key={marker.id}
            position={[marker.position.lat, marker.position.lng]}
            icon={getMarkerIcon(marker.type)}
            eventHandlers={{
              click: () => onMarkerClick && onMarkerClick(marker),
            }}
          >
            <Popup>
              <div>
                <h3 className="font-semibold">{marker.title}</h3>
                {marker.description && <p>{marker.description}</p>}
              </div>
            </Popup>
          </LeafletMarker>
        ))}
      </MapContainer>
    </div>
  )
}

export default MapComponent
