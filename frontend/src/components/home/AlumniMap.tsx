import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import useSupercluster from "use-supercluster";
import "leaflet/dist/leaflet.css";
import api from "@/lib/api";

interface AlumniLocation {
  city: string;
  country: string;
  count: number;
  lat: number;
  lng: number;
}

// Tracks map bounds and zoom, stores them in ref-backed state
function MapController({
  setBounds,
  setZoom,
  onMapReady,
}: {
  setBounds: (b: [number, number, number, number]) => void;
  setZoom: (z: number) => void;
  onMapReady: (m: L.Map) => void;
}) {
  const map = useMap();

  const update = () => {
    const b = map.getBounds();
    setBounds([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
    setZoom(map.getZoom());
  };

  useMapEvents({ moveend: update, zoomend: update });

  useEffect(() => {
    onMapReady(map);
    update();
  }, []);

  return null;
}

const COUNTRY_CENTROIDS: Record<string, { lat: number; lng: number; zoom: number }> = {
  india: { lat: 20.5937, lng: 78.9629, zoom: 4 },
  bharat: { lat: 20.5937, lng: 78.9629, zoom: 4 },
  "united states": { lat: 37.0902, lng: -95.7129, zoom: 4 },
  "united states of america": { lat: 37.0902, lng: -95.7129, zoom: 4 },
  usa: { lat: 37.0902, lng: -95.7129, zoom: 4 },
  us: { lat: 37.0902, lng: -95.7129, zoom: 4 },
  "united kingdom": { lat: 55.3781, lng: -3.4360, zoom: 5 },
  uk: { lat: 55.3781, lng: -3.4360, zoom: 5 },
  england: { lat: 55.3781, lng: -3.4360, zoom: 5 },
  canada: { lat: 56.1304, lng: -106.3468, zoom: 3 },
  australia: { lat: -25.2744, lng: 133.7751, zoom: 4 },
  germany: { lat: 51.1657, lng: 10.4515, zoom: 5 },
  france: { lat: 46.2276, lng: 2.2137, zoom: 5 },
  singapore: { lat: 1.3521, lng: 103.8198, zoom: 11 },
  "united arab emirates": { lat: 23.4241, lng: 53.8478, zoom: 6 },
  uae: { lat: 23.4241, lng: 53.8478, zoom: 6 },
  japan: { lat: 36.2048, lng: 138.2529, zoom: 5 },
  china: { lat: 35.8617, lng: 104.1954, zoom: 4 },
  brazil: { lat: -14.2350, lng: -51.9253, zoom: 4 },
  russia: { lat: 61.5240, lng: 105.3188, zoom: 3 },
  "south africa": { lat: -30.5595, lng: 22.9375, zoom: 5 },
};

function MapSearchControl({
  locations,
  mapInstance,
}: {
  locations: AlumniLocation[];
  mapInstance: L.Map | null;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<string | null>(null);

  const handleSearch = () => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || !mapInstance) return;

    // 1. Check if query matches a country name or alias
    const matchingCountryLocations = locations.filter(
      (loc) =>
        loc.country.toLowerCase().includes(q) ||
        q.includes(loc.country.toLowerCase())
    );

    const exactCountryKey = Object.keys(COUNTRY_CENTROIDS).find(
      (cKey) =>
        q === cKey ||
        (matchingCountryLocations.length > 0 &&
          matchingCountryLocations[0].country.toLowerCase() === cKey)
    );

    if (exactCountryKey || matchingCountryLocations.length > 0) {
      let targetLat: number;
      let targetLng: number;
      let targetZoom: number;
      const rawCountryName = exactCountryKey
        ? exactCountryKey
        : matchingCountryLocations[0].country;
      const countryName =
        rawCountryName.charAt(0).toUpperCase() + rawCountryName.slice(1);

      if (exactCountryKey && COUNTRY_CENTROIDS[exactCountryKey]) {
        const entry = COUNTRY_CENTROIDS[exactCountryKey];
        targetLat = entry.lat;
        targetLng = entry.lng;
        targetZoom = entry.zoom;
      } else {
        targetLat =
          matchingCountryLocations.reduce((sum, l) => sum + l.lat, 0) /
          matchingCountryLocations.length;
        targetLng =
          matchingCountryLocations.reduce((sum, l) => sum + l.lng, 0) /
          matchingCountryLocations.length;
        targetZoom = 4;
      }

      mapInstance.flyTo([targetLat, targetLng], targetZoom, {
        animate: true,
        duration: 0.65,
        easeLinearity: 0.25,
      });

      setSearchResult(`Found ${countryName}`);
      setTimeout(() => setSearchResult(null), 3000);
      return;
    }

    // 2. Fallback to City Search
    const cityMatch = locations.find((loc) =>
      loc.city.toLowerCase().includes(q)
    );

    if (cityMatch) {
      mapInstance.flyTo([cityMatch.lat, cityMatch.lng], 7, {
        animate: true,
        duration: 0.65,
        easeLinearity: 0.25,
      });
      const capitalizedCity =
        cityMatch.city.charAt(0).toUpperCase() + cityMatch.city.slice(1);
      const capitalizedCountry =
        cityMatch.country.charAt(0).toUpperCase() + cityMatch.country.slice(1);
      setSearchResult(`Found ${capitalizedCity}, ${capitalizedCountry}`);
      setTimeout(() => setSearchResult(null), 3000);
    } else {
      setSearchResult(`No results found for "${q}"`);
      setTimeout(() => setSearchResult(null), 3000);
    }
  };

  if (!mapInstance) return null;

  return (
    <>
      {searchResult && (
        <div
          style={{
            position: "absolute",
            top: "60px",
            left: "50px",
            zIndex: 1000,
            background: "rgba(255, 255, 255, 0.95)",
            color: "#333",
            padding: "8px 16px",
            borderRadius: "6px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            fontSize: "13px",
            fontWeight: 500,
          }}
        >
          {searchResult}
        </div>
      )}
      <div
        style={{
          position: "absolute",
          top: "12px",
          left: "50px",
          zIndex: 1000,
          display: "flex",
          gap: "6px",
        }}
      >
        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
          <input
            type="text"
            placeholder="Search city or country..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
            style={{
              padding: "7px 30px 7px 12px",
              borderRadius: "6px",
              border: "1px solid #ccc",
              fontSize: "13px",
              width: "220px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
              outline: "none",
              background: "#fff",
              color: "#333",
            }}
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSearchResult(null);
              }}
              aria-label="Clear search"
              style={{
                position: "absolute",
                right: "8px",
                background: "transparent",
                border: "none",
                color: "#666",
                cursor: "pointer",
                fontSize: "16px",
                padding: "0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ×
            </button>
          )}
        </div>
        <button
          onClick={handleSearch}
          style={{
            padding: "7px 14px",
            borderRadius: "6px",
            background: "#E53935",
            color: "#fff",
            fontWeight: 600,
            fontSize: "13px",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
          }}
        >
          Go
        </button>
      </div>
    </>
  );
}

const AlumniMap = () => {
  const [locations, setLocations] = useState<AlumniLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(2);
  const [bounds, setBounds] = useState<[number, number, number, number]>([
    -180, -85, 180, 85,
  ]);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const { data } = await api.get("/alumni-map");
        setLocations(data.locations || []);
      } catch (err) {
        console.error("Error fetching alumni locations:", err);
        setError("Failed to load alumni map");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocations();
  }, []);

  // Format raw locations as GeoJSON features for supercluster
  const points = useMemo(
    () =>
      locations.map((loc) => ({
        type: "Feature" as const,
        properties: {
          cluster: false,
          city: loc.city,
          country: loc.country,
          count: loc.count || 1,
        },
        geometry: { type: "Point" as const, coordinates: [loc.lng, loc.lat] },
      })),
    [locations]
  );

  const clusterOptions = useMemo(
    () => ({
      radius: 75,
      maxZoom: 17,
      map: (props: any) => ({ sum: props.count || 1 }),
      reduce: (accumulated: any, props: any) => {
        accumulated.sum += props.sum || props.count || 1;
      },
    }),
    []
  );

  const { clusters, supercluster } = useSupercluster({
    points,
    bounds,
    zoom,
    options: clusterOptions,
  });

  const getClusterPopupContent = (clusterId: number) => {
    if (!supercluster) return null;
    const leaves = supercluster.getLeaves(clusterId, Infinity);
    const countries = Array.from(
      new Set(leaves.map((l) => l.properties.country || "Unknown"))
    );
    const countryLabel = countries
      .map((c) => c.charAt(0).toUpperCase() + c.slice(1))
      .join(", ");

    return (
      <div className="text-sm p-1" style={{ color: "#333" }}>
        <div className="font-semibold text-gray-800">
          {countryLabel}
        </div>
      </div>
    );
  };

  const bgPattern = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23FFD700' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`;

  const wrapperClass =
    "relative bg-gradient-to-br from-nsut-maroon via-red-900 to-nsut-maroon text-white py-12 md:py-20 overflow-hidden";

  if (isLoading) {
    return (
      <div className={wrapperClass}>
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{ backgroundImage: bgPattern }}
          />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-5xl font-serif font-bold text-gray-900 mb-4 tracking-tight">
              Alumni Network Map
            </h2>
          </div>
          <div className="w-full h-[500px] bg-gray-100 rounded-lg flex items-center justify-center">
            <p className="text-gray-600">Loading map...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={wrapperClass}>
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{ backgroundImage: bgPattern }}
          />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-5xl font-serif font-bold text-gray-900 mb-4 tracking-tight">
              Alumni Network Map
            </h2>
          </div>
          <div className="w-full h-[500px] bg-gray-100 rounded-lg flex items-center justify-center">
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className={wrapperClass}>
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{ backgroundImage: bgPattern }}
          />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-5xl font-serif font-bold text-gray-900 mb-4 tracking-tight">
              Alumni Network Map
            </h2>
          </div>
          <div className="w-full h-[500px] bg-gray-100 rounded-lg flex items-center justify-center">
            <p className="text-gray-600">No alumni locations available yet</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={wrapperClass}>
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{ backgroundImage: bgPattern }}
        />
      </div>
      {/* Decorative gradient accents */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-nsut-yellow/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-nsut-yellow/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-2xl md:text-5xl font-serif font-bold text-white mb-4 tracking-tight">
            Alumni Network Map
          </h2>
          <p className="text-lg md:text-xl text-white/80 font-medium max-w-2xl mx-auto">
            Discover where our alumni are located around the world
          </p>
        </div>

      <div className="w-full h-[400px] md:h-[500px] relative">
        <div className="rounded-lg overflow-hidden shadow-lg h-full relative">
          <MapContainer
            center={[20, 0]}
            zoom={2}
            minZoom={2}
            maxZoom={18}
            maxBounds={[
              [-85, -180], // Southwest coordinate
              [85, 180]    // Northeast coordinate
            ]}
            maxBoundsViscosity={1.0}
            style={{ height: "100%", width: "100%" }}
            className="z-0"
          >
            <MapController
              setBounds={setBounds}
              setZoom={setZoom}
              onMapReady={setMapInstance}
            />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              />
              {clusters.map((cluster) => {
                const [lng, lat] = cluster.geometry.coordinates;
                const {
                  cluster: isCluster,
                  point_count,
                  city,
                  country,
                } = cluster.properties;

                if (isCluster) {
                  const displayCount = cluster.properties.sum || point_count;
                  const digits =
                    Math.floor(Math.log10(Math.max(displayCount, 1))) + 1;
                  const size = 32 + (digits - 1) * 12;
                  const fontSize = Math.max(11, Math.floor(size * 0.32));

                  // pointer-events:none on the inner div ensures mouse events
                  // fall through to Leaflet's marker layer — not the HTML div —
                  // so the eventHandlers.click always fires on desktop.
                  const icon = L.divIcon({
                    html: `<div class="alumni-map-pin" style="width:${size}px;height:${size}px;border-radius:50%;background:#E53935;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:${fontSize}px;border:2px solid #b71c1c;box-shadow:0 2px 8px rgba(0,0,0,0.3);pointer-events:none;">${displayCount}</div>`,
                    className: "",
                    iconSize: [size, size],
                    iconAnchor: [size / 2, size / 2],
                  });

                  return (
                    <Marker
                      key={`cluster-${cluster.id}`}
                      position={[lat, lng]}
                      icon={icon}
                      eventHandlers={{
                        click: (e) => {
                          if (!mapInstance || !supercluster) return;
                          e.target.openPopup();
                          const expansionZoom = Math.min(
                            supercluster.getClusterExpansionZoom(cluster.id as number),
                            18
                          );
                          mapInstance.flyTo([lat, lng], expansionZoom, {
                            animate: true,
                            duration: 0.65,
                            easeLinearity: 0.25,
                          });
                        },
                      }}
                    >
                      {/* Popup is always present in the DOM; we control open/
                          close imperatively so the popup pane never sits under
                          the cursor at the moment the user clicks — eliminating
                          the "click eaten by popup" desktop bug. */}
                      <Popup>
                        {getClusterPopupContent(cluster.id as number)}
                      </Popup>
                    </Marker>
                  );
                }

                // ── Single city marker ──────────────────────────────────────
                const count = cluster.properties.count || 1;
                const size = Math.max(20, 20 + Math.log(count) * 8);
                const fontSize = Math.max(9, Math.floor(size * 0.32));
                const icon = L.divIcon({
                  html: `<div class="alumni-map-pin" style="width:${size}px;height:${size}px;border-radius:50%;background:#E53935;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:${fontSize}px;border:2px solid #b71c1c;box-shadow:0 2px 8px rgba(0,0,0,0.3);pointer-events:none;">${count}</div>`,
                  className: "",
                  iconSize: [size, size],
                  iconAnchor: [size / 2, size / 2],
                });
                return (
                  <Marker
                    key={`point-${city}-${country}-${lat}-${lng}`}
                    position={[lat, lng]}
                    icon={icon}
                    eventHandlers={{
                      click: (e) => {
                        if (!mapInstance) return;
                        e.target.openPopup();
                        const currentZoom = mapInstance.getZoom();

                        if (currentZoom < 13) {
                          const targetZoom = Math.min(currentZoom + 2, 17);
                          mapInstance.flyTo([lat, lng], targetZoom, {
                            animate: true,
                            duration: 0.65,
                            easeLinearity: 0.25,
                          });
                        }
                      },
                    }}
                  >
                    <Popup>
                      <div className="text-sm" style={{ color: "#333" }}>
                        <strong className="capitalize">{city}</strong>
                        <br />
                        <span className="capitalize">{country}</span>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
          <MapSearchControl locations={locations} mapInstance={mapInstance} />
        </div>
      </div>
    </div>
  );
};

export default AlumniMap;
