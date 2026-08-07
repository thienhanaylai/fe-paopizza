"use client";

import { CheckCircle2, Loader2, MapPin, Search } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import "@goongmaps/goong-js/dist/goong-js.css";
import { autocomplete, placeDetail } from "@/src/services/map.service";
import type { StoreAddress } from "@/src/services/store.service";

const DEFAULT_CENTER: [number, number] = [106.7009, 10.7769];
const AUTOCOMPLETE_DELAY = 600;
const CACHE_LIMIT = 50;

type Coordinates = { lng: number; lat: number };

type Prediction = {
  place_id: string;
  description: string;
  structured_formatting?: { main_text?: string; secondary_text?: string };
  compound?: { district?: string; province?: string; commune?: string };
};

type PlaceDetailResult = {
  result?: {
    name?: string;
    formatted_address?: string;
    geometry?: { location?: Coordinates };
    compound?: Prediction["compound"];
  };
};

type MapInstance = {
  remove: () => void;
  flyTo: (options: { center: [number, number]; zoom: number; essential?: boolean }) => void;
  on(event: "load", callback: () => void): void;
  on(event: "click", callback: (event: { lngLat: Coordinates }) => void): void;
};

type MarkerInstance = {
  addTo: (map: MapInstance) => MarkerInstance;
  remove: () => void;
  setLngLat: (coords: [number, number]) => MarkerInstance;
  getLngLat: () => Coordinates;
  on: (event: "dragend", callback: () => void) => void;
};

interface StoreLocationPickerProps {
  address: StoreAddress;
  latitude: string;
  longitude: string;
  onAddressChange: (address: StoreAddress) => void;
  onLocationChange: (coords: Coordinates) => void;
}

function createSessionToken() {
  return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
}

function formatAddress(address: StoreAddress) {
  return [address.streetNumber, address.district, address.city].filter(Boolean).join(", ");
}

function addressFromPlace(prediction: Prediction, detail: PlaceDetailResult): StoreAddress {
  const compound = detail.result?.compound || prediction.compound;
  const parts = prediction.description
    .split(",")
    .map(part => part.trim())
    .filter(Boolean);

  return {
    streetNumber: detail.result?.name || prediction.structured_formatting?.main_text || parts[0] || "",
    district: compound?.district || (parts.length >= 3 ? parts[parts.length - 2] : ""),
    city: compound?.province || parts[parts.length - 1] || "",
  };
}

export default function StoreLocationPicker({
  address,
  latitude,
  longitude,
  onAddressChange,
  onLocationChange,
}: StoreLocationPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapInstance | null>(null);
  const markerRef = useRef<MarkerInstance | null>(null);
  const locationChangeRef = useRef(onLocationChange);
  const autocompleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autocompleteCacheRef = useRef(new Map<string, Prediction[]>());
  const latestQueryRef = useRef("");
  const sessionTokenRef = useRef(createSessionToken());

  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState("");
  const [query, setQuery] = useState(() => formatAddress(address));
  const [suggestions, setSuggestions] = useState<Prediction[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [resolvingPlace, setResolvingPlace] = useState(false);

  useEffect(() => {
    locationChangeRef.current = onLocationChange;
  }, [onLocationChange]);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    let cancelled = false;

    import("@goongmaps/goong-js")
      .then(goongjsModule => {
        if (cancelled || !mapContainerRef.current) return;

        const goongjs = goongjsModule.default || goongjsModule;
        goongjs.accessToken = process.env.NEXT_PUBLIC_GOONG_MAP_TILES_KEY || "";

        const parsedLng = Number(longitude);
        const parsedLat = Number(latitude);
        const hasLocation = Number.isFinite(parsedLng) && Number.isFinite(parsedLat) && longitude !== "" && latitude !== "";
        const center: [number, number] = hasLocation ? [parsedLng, parsedLat] : DEFAULT_CENTER;

        const map = new goongjs.Map({
          container: mapContainerRef.current,
          style: "https://tiles.goong.io/assets/goong_map_web.json",
          center,
          zoom: hasLocation ? 15 : 11,
        }) as MapInstance;

        mapRef.current = map;
        map.on("load", () => setMapReady(true));
        map.on("click", event => {
          setMapError("");
          locationChangeRef.current(event.lngLat);
        });
      })
      .catch(() => {
        if (!cancelled) setMapError("Không thể tải bản đồ. Vui lòng kiểm tra Goong Map Tiles Key.");
      });

    return () => {
      cancelled = true;
      if (autocompleteTimerRef.current) clearTimeout(autocompleteTimerRef.current);
      markerRef.current?.remove();
      markerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // Bản đồ chỉ khởi tạo một lần khi modal được mở.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    const lng = Number(longitude);
    const lat = Number(latitude);
    if (!Number.isFinite(lng) || !Number.isFinite(lat) || longitude === "" || latitude === "") return;

    const coords: [number, number] = [lng, lat];
    const map = mapRef.current;

    if (markerRef.current) {
      markerRef.current.setLngLat(coords);
    } else {
      import("@goongmaps/goong-js").then(goongjsModule => {
        if (!mapRef.current) return;
        const goongjs = goongjsModule.default || goongjsModule;
        const marker = new goongjs.Marker({ color: "#ef4444", draggable: true }).setLngLat(coords).addTo(map) as MarkerInstance;
        marker.on("dragend", () => locationChangeRef.current(marker.getLngLat()));
        markerRef.current = marker;
      });
    }

    map.flyTo({ center: coords, zoom: 16, essential: true });
  }, [latitude, longitude, mapReady]);

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    const normalizedQuery = value.trim().replace(/\s+/g, " ").toLocaleLowerCase("vi-VN");
    latestQueryRef.current = normalizedQuery;

    if (autocompleteTimerRef.current) clearTimeout(autocompleteTimerRef.current);

    if (normalizedQuery.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      setSuggestionsLoading(false);
      return;
    }

    const cached = autocompleteCacheRef.current.get(normalizedQuery);
    if (cached !== undefined) {
      setSuggestions(cached);
      setShowSuggestions(cached.length > 0);
      setSuggestionsLoading(false);
      return;
    }

    autocompleteTimerRef.current = setTimeout(async () => {
      if (latestQueryRef.current !== normalizedQuery) return;
      setSuggestionsLoading(true);

      try {
        const response = await autocomplete({
          input: value.trim(),
          sessiontoken: sessionTokenRef.current,
          limit: 6,
        });
        if (latestQueryRef.current !== normalizedQuery) return;

        const predictions = (response.predictions || []) as Prediction[];
        const cache = autocompleteCacheRef.current;
        if (cache.size >= CACHE_LIMIT) {
          const oldestKey = cache.keys().next().value;
          if (oldestKey) cache.delete(oldestKey);
        }
        cache.set(normalizedQuery, predictions);
        setSuggestions(predictions);
        setShowSuggestions(predictions.length > 0);
      } catch {
        if (latestQueryRef.current === normalizedQuery) {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } finally {
        if (latestQueryRef.current === normalizedQuery) setSuggestionsLoading(false);
      }
    }, AUTOCOMPLETE_DELAY);
  }, []);

  const handleSelectPlace = useCallback(
    async (prediction: Prediction) => {
      setQuery(prediction.description);
      setShowSuggestions(false);
      setSuggestions([]);
      setResolvingPlace(true);

      try {
        const detail = (await placeDetail({
          place_id: prediction.place_id,
          sessiontoken: sessionTokenRef.current,
        })) as PlaceDetailResult;
        const location = detail.result?.geometry?.location;

        if (!location || !Number.isFinite(location.lng) || !Number.isFinite(location.lat)) {
          throw new Error("INVALID_LOCATION");
        }

        onAddressChange(addressFromPlace(prediction, detail));
        onLocationChange(location);
        setMapError("");
        sessionTokenRef.current = createSessionToken();
      } catch {
        setMapError("Không thể lấy tọa độ của địa chỉ này. Vui lòng chọn địa chỉ khác.");
      } finally {
        setResolvingPlace(false);
      }
    },
    [onAddressChange, onLocationChange],
  );

  const hasValidLocation =
    latitude !== "" && longitude !== "" && Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude));

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search size={15} className="absolute top-3.5 left-3 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={event => handleQueryChange(event.target.value)}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder="Tìm số nhà, tên đường hoặc địa điểm..."
          className="w-full rounded-xl border border-border bg-background py-2.5 pr-10 pl-9 text-sm outline-none transition-colors focus:border-primary"
        />
        {(suggestionsLoading || resolvingPlace) && (
          <Loader2 size={15} className="absolute top-3.5 right-3 animate-spin text-primary" />
        )}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full right-0 left-0 z-30 mt-1 overflow-hidden rounded-xl border border-border bg-card shadow-xl">
            {suggestions.map(prediction => (
              <button
                key={prediction.place_id}
                type="button"
                onMouseDown={event => event.preventDefault()}
                onClick={() => handleSelectPlace(prediction)}
                className="flex w-full items-start gap-2.5 border-b border-border/50 px-3 py-2.5 text-left last:border-b-0 hover:bg-muted"
              >
                <MapPin size={14} className="mt-0.5 shrink-0 text-primary" />
                <span className="text-xs text-foreground">{prediction.description}</span>
              </button>
            ))}
          </div>
        )}
        <p className="text-[12px] pt-1 text-gray-500">Di chuyển, hoặc nhấp vào bản đồ để chọn vị trí chính xác</p>
      </div>

      <div className="relative h-72 overflow-hidden rounded-xl border border-border bg-muted/20">
        <div ref={mapContainerRef} className="h-full w-full" />
        {!hasValidLocation && !mapError && (
          <div className="pointer-events-none absolute inset-x-3 bottom-3 rounded-lg bg-card/90 px-3 py-2 text-center text-xs text-muted-foreground shadow backdrop-blur">
            Chọn một địa chỉ hoặc click bản đồ để đặt vị trí cửa hàng
          </div>
        )}
      </div>

      {mapError && <p className="text-xs text-red-500">{mapError}</p>}
      {hasValidLocation && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-green-200 bg-green-50 px-3 py-2">
          <span className="flex items-center gap-1.5 text-xs font-medium text-green-700">
            <CheckCircle2 size={14} /> Đã xác định vị trí chính xác
          </span>
          <span className="text-[10px] text-green-700">
            {Number(latitude).toFixed(6)}, {Number(longitude).toFixed(6)}
          </span>
        </div>
      )}
    </div>
  );
}
