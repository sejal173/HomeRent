import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix for default Leaflet icon URLs in bundled Vite environments
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Known coordinates for Indian cities as fallback
const CITY_COORDS = {
  pune: { lat: 18.5204, lng: 73.8567 },
  mumbai: { lat: 19.076, lng: 72.8777 },
  bengaluru: { lat: 12.9716, lng: 77.5946 },
  hyderabad: { lat: 17.385, lng: 78.4867 },
  'delhi ncr': { lat: 28.6139, lng: 77.209 },
  delhi: { lat: 28.6139, lng: 77.209 },
  chennai: { lat: 13.0827, lng: 80.2707 },
};

const DEFAULT_CENTER = [20.5937, 78.9629]; // India center
const DEFAULT_ZOOM = 5;

// Component to dynamically fit all markers in map view once loaded
function FitBoundsToMarkers({ markers }) {
  const map = useMap();

  useEffect(() => {
    if (!map || markers.length === 0) return;
    try {
      const coords = markers.filter((m) => m.lat && m.lng).map((m) => [m.lat, m.lng]);
      if (coords.length === 1) {
        map.setView(coords[0], 13);
      } else if (coords.length > 1) {
        const bounds = L.latLngBounds(coords);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      }
    } catch {
      // Map may not be ready or unmounted
    }
  }, [markers, map]);

  return null;
}

export default function PropertyMap({ properties = [] }) {
  const geocodeCache = useRef({});
  const [markers, setMarkers] = useState([]);
  const [geocoding, setGeocoding] = useState(false);

  useEffect(() => {
    if (!properties || properties.length === 0) {
      setMarkers([]);
      return;
    }

    let isMounted = true;
    setGeocoding(true);

    const resolvePropertyCoords = async () => {
      const resolvedList = [];

      for (let i = 0; i < properties.length; i++) {
        const prop = properties[i];
        const locality = prop.locality || '';
        const city = prop.city || '';
        const cacheKey = `${locality}_${city}`.trim().toLowerCase();

        // 1. Check cache in useRef
        if (geocodeCache.current[cacheKey]) {
          const cached = geocodeCache.current[cacheKey];
          resolvedList.push({
            ...prop,
            lat: cached.lat,
            lng: cached.lng,
          });
          continue;
        }

        // 2. Geocode using free Nominatim API
        let coords = null;
        if (locality || city) {
          try {
            const query = encodeURIComponent(`${locality} ${city} India`.trim());
            const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;
            const res = await fetch(url, {
              headers: {
                Accept: 'application/json',
              },
            });
            if (res.ok) {
              const data = await res.json();
              if (Array.isArray(data) && data.length > 0) {
                coords = {
                  lat: parseFloat(data[0].lat),
                  lng: parseFloat(data[0].lon),
                };
              }
            }
          } catch {
            // Network or CORS failure
          }
        }

        // 3. Fallback to known city coordinates with small jitter to prevent identical marker overlap
        if (!coords) {
          const fallback = CITY_COORDS[city.toLowerCase()] || CITY_COORDS.pune;
          const jitterLat = (Math.random() - 0.5) * 0.04;
          const jitterLng = (Math.random() - 0.5) * 0.04;
          coords = {
            lat: fallback.lat + jitterLat,
            lng: fallback.lng + jitterLng,
          };
        }

        // Cache the coordinates in useRef
        geocodeCache.current[cacheKey] = coords;

        resolvedList.push({
          ...prop,
          lat: coords.lat,
          lng: coords.lng,
        });

        // Nominatim policy courtesy pause (50ms between uncached calls)
        if (i < properties.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
      }

      if (isMounted) {
        setMarkers(resolvedList);
        setGeocoding(false);
      }
    };

    resolvePropertyCoords();

    return () => {
      isMounted = false;
    };
  }, [properties]);

  if (!properties || properties.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center text-slate-500 font-medium shadow-card">
        No properties to show on map
      </div>
    );
  }

  return (
    <div className="relative w-full h-[600px] rounded-2xl overflow-hidden border border-slate-200/90 shadow-card bg-slate-100 z-0">
      {geocoding && (
        <div className="absolute top-3 right-3 z-[1000] bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm text-xs font-semibold text-slate-700 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
          Locating properties...
        </div>
      )}

      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom={true}
        className="w-full h-full"
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitBoundsToMarkers markers={markers} />

        {markers.map((prop) => (
          <Marker key={prop._id} position={[prop.lat, prop.lng]}>
            <Popup>
              <div className="p-1 min-w-[200px] max-w-[240px]">
                <h3 className="font-bold text-sm text-slate-900 leading-tight mb-1 line-clamp-2">
                  {prop.title}
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-1.5">
                  <span className="inline-block px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold text-[10px] uppercase">
                    {prop.type}
                  </span>
                  <span className="font-semibold text-slate-800">
                    ₹{prop.price ? Number(prop.price).toLocaleString('en-IN') : 'N/A'} / month
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mb-2 truncate">
                  {prop.locality ? `${prop.locality}, ` : ''}{prop.city}
                </div>
                <Link
                  to={`/properties/${prop._id}`}
                  className="inline-block w-full text-center py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors"
                >
                  View Details
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

