'use client'

import { GoogleMap, useJsApiLoader, Circle } from '@react-google-maps/api'
import { Spinner } from '@/components/ui/Spinner'

interface Props {
  lat: number
  lng: number
}

const MAP_OPTIONS: google.maps.MapOptions = {
  zoom: 13,
  minZoom: 10,
  maxZoom: 14,
  disableDefaultUI: true,
  zoomControl: true,
  scrollwheel: false,
  gestureHandling: 'cooperative',
}

const CIRCLE_OPTIONS: google.maps.CircleOptions = {
  strokeColor: '#059669',
  strokeOpacity: 0.6,
  strokeWeight: 2,
  fillColor: '#059669',
  fillOpacity: 0.12,
  radius: 400, // metros — zona aproximada
}

export function MapaVista({ lat, lng }: Props) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? '',
  })

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-stone-100 rounded-xl">
        <Spinner />
      </div>
    )
  }

  return (
    <GoogleMap
      mapContainerStyle={{ width: '100%', height: '100%', borderRadius: '0.75rem' }}
      center={{ lat, lng }}
      options={MAP_OPTIONS}
    >
      {/* Círculo verde en la zona aproximada — sin marcador exacto */}
      <Circle center={{ lat, lng }} options={CIRCLE_OPTIONS} />
    </GoogleMap>
  )
}
