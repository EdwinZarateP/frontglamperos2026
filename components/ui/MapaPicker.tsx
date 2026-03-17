'use client'

import { useCallback, useRef, useState } from 'react'
import { GoogleMap, Marker, Autocomplete, useJsApiLoader } from '@react-google-maps/api'
import { GiCampingTent } from 'react-icons/gi'
import { Search } from 'lucide-react'

const LIBRARIES: ('places')[] = ['places']

interface Props {
  lat: string
  lng: string
  onChange: (lat: string, lng: string) => void
}

const MAP_STYLES = { width: '100%', height: '100%' }

export function MapaPicker({ lat, lng, onChange }: Props) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY!,
    libraries: LIBRARIES,
    language: 'es',
    region: 'CO',
  })

  const mapRef = useRef<google.maps.Map | null>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)

  const latNum = parseFloat(lat) || 4.711
  const lngNum = parseFloat(lng) || -74.0721

  const [center, setCenter] = useState({ lat: latNum, lng: lngNum })

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map
  }, [])

  // Clic en el mapa
  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return
    const newLat = e.latLng.lat().toFixed(6)
    const newLng = e.latLng.lng().toFixed(6)
    onChange(newLat, newLng)
  }, [onChange])

  // Fin de arrastre del marcador
  const handleDragEnd = useCallback((e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return
    onChange(e.latLng.lat().toFixed(6), e.latLng.lng().toFixed(6))
  }, [onChange])

  // Selección en el autocomplete
  const handlePlaceChanged = useCallback(() => {
    const place = autocompleteRef.current?.getPlace()
    if (!place?.geometry?.location) return
    const newLat = place.geometry.location.lat().toFixed(6)
    const newLng = place.geometry.location.lng().toFixed(6)
    onChange(newLat, newLng)
    const newCenter = { lat: parseFloat(newLat), lng: parseFloat(newLng) }
    setCenter(newCenter)
    mapRef.current?.panTo(newCenter)
    mapRef.current?.setZoom(16)
  }, [onChange])

  if (!isLoaded) return (
    <div className="w-full h-64 sm:h-80 rounded-xl bg-stone-100 animate-pulse flex items-center justify-center">
      <span className="text-xs text-stone-400">Cargando mapa...</span>
    </div>
  )

  return (
    <div className="space-y-2">
      {/* Buscador con Places Autocomplete */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none z-10" />
        <Autocomplete
          onLoad={(ac) => { autocompleteRef.current = ac }}
          onPlaceChanged={handlePlaceChanged}
          options={{ componentRestrictions: { country: 'co' }, fields: ['geometry', 'name', 'formatted_address'] }}
        >
          <input
            type="text"
            placeholder="Busca tu glamping, vereda, municipio..."
            className="w-full rounded-xl border border-stone-300 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </Autocomplete>
      </div>

      {/* Mapa */}
      <div className="relative w-full h-64 sm:h-80 rounded-xl overflow-hidden border border-stone-200">
        <GoogleMap
          mapContainerStyle={MAP_STYLES}
          center={center}
          zoom={lat ? 15 : 6}
          onLoad={onMapLoad}
          onClick={handleMapClick}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
            zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_TOP },
          }}
        >
          {lat && lng && (
            <Marker
              position={{ lat: parseFloat(lat), lng: parseFloat(lng) }}
              draggable
              onDragEnd={handleDragEnd}
              title="Arrastra para ajustar la ubicación"
            />
          )}
        </GoogleMap>

        {!lat && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2 text-xs text-stone-500 shadow whitespace-nowrap">
              Busca arriba o haz clic en el mapa para marcar
            </div>
          </div>
        )}
      </div>

      {lat && lng && (
        <p className="text-xs text-stone-400 flex items-center justify-between">
          <span>📍 {parseFloat(lat).toFixed(5)}, {parseFloat(lng).toFixed(5)} — arrastra el marcador para ajustar</span>
          <button type="button" onClick={() => onChange('', '')} className="text-red-400 hover:text-red-600 underline ml-2">
            quitar
          </button>
        </p>
      )}
    </div>
  )
}
