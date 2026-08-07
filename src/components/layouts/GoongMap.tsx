"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import "@goongmaps/goong-js/dist/goong-js.css";
import { MapPin, Phone, Store } from "lucide-react";
import { renderToString } from "react-dom/server";
import type { StoreData } from "@/src/services/store.service";

type GoongMapInstance = {
  remove: () => void;
  hasImage: (id: string) => boolean;
  addImage: (id: string, image: { width: number; height: number; data: Uint8Array }) => void;
  on(event: "load", callback: () => void): void;
  on(event: "styleimagemissing", callback: (event: { id: string }) => void): void;
  flyTo: (options: { center: [number, number]; zoom: number; essential: boolean }) => void;
};

type GoongPopup = {
  addTo: (map: GoongMapInstance) => void;
  remove: () => void;
};

type GoongMarker = {
  getPopup: () => GoongPopup | undefined;
};

type MarkerEntry = {
  marker: GoongMarker;
  coords: [number, number];
};

function normalizeCoords(rawCoords?: readonly number[]): [number, number] | null {
  if (!rawCoords || rawCoords.length !== 2) return null;
  const [first, second] = rawCoords;

  // Dữ liệu cũ có thể lưu nhầm [lat, lng]; Goong luôn cần [lng, lat].
  if (first < 30 && second > 90) return [second, first];
  return [first, second];
}

function getAddress(store: StoreData) {
  return [store.address?.streetNumber, store.address?.district, store.address?.city].filter(Boolean).join(", ");
}

interface GoongMapProps {
  stores?: StoreData[];
  onStoreSelect?: (storeId: string) => void;
}

export default function GoongMap({ stores = [], onStoreSelect }: GoongMapProps) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<GoongMapInstance | null>(null);
  const storesKeyRef = useRef("");
  const markerRefs = useRef(new Map<string, MarkerEntry>());
  const pendingStoreIdRef = useRef<string | null>(null);
  const onStoreSelectRef = useRef(onStoreSelect);
  const [activeStoreId, setActiveStoreId] = useState<string | null>(null);

  useEffect(() => {
    onStoreSelectRef.current = onStoreSelect;
  }, [onStoreSelect]);

  const focusStore = useCallback((storeId: string) => {
    const selectedMarker = markerRefs.current.get(storeId);
    const map = mapRef.current;
    setActiveStoreId(storeId);
    onStoreSelectRef.current?.(storeId);
    if (!selectedMarker || !map) {
      // Người dùng có thể click danh sách trong lúc bản đồ còn đang khởi tạo.
      // Giữ lựa chọn này để flyTo ngay khi marker đã sẵn sàng.
      pendingStoreIdRef.current = storeId;
      return;
    }

    markerRefs.current.forEach(({ marker }) => marker.getPopup()?.remove());
    map.flyTo({ center: selectedMarker.coords, zoom: 15, essential: true });
    selectedMarker.marker.getPopup()?.addTo(map);
    pendingStoreIdRef.current = null;
  }, []);

  useEffect(() => {
    if (!mapContainer.current) return;
    const markers = markerRefs.current;

    const storesKey = JSON.stringify(stores.map(store => [store._id, store.location?.coordinates]));
    if (storesKeyRef.current === storesKey && mapRef.current) return;
    storesKeyRef.current = storesKey;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }
    markers.clear();

    let cancelled = false;

    import("@goongmaps/goong-js").then(goongjsModule => {
      if (cancelled || !mapContainer.current) return;

      const goongjs = goongjsModule.default || goongjsModule;
      goongjs.accessToken = process.env.NEXT_PUBLIC_GOONG_MAP_TILES_KEY || "";

      const firstValidCoords = stores.find(store => normalizeCoords(store.location?.coordinates))?.location?.coordinates;
      const initialCenter = normalizeCoords(firstValidCoords) || [105.801982, 21.026745];
      const map = new goongjs.Map({
        container: mapContainer.current,
        style: "https://tiles.goong.io/assets/goong_map_web.json",
        center: initialCenter,
        zoom: 10,
      }) as GoongMapInstance;

      mapRef.current = map;

      map.on("styleimagemissing", event => {
        if (!map.hasImage(event.id)) {
          map.addImage(event.id, { width: 0, height: 0, data: new Uint8Array(0) });
        }
      });

      map.on("load", () => {
        stores.forEach(store => {
          const coords = normalizeCoords(store.location?.coordinates);
          if (!coords) return;

          const element = document.createElement("div");
          element.className = "custom-marker";
          element.innerHTML = renderToString(<Store className="h-6 w-6 fill-white text-primary drop-shadow-md" />);

          const popupContent = (
            <div className="max-w-[220px] p-1">
              <h4 className="mb-1 text-sm font-bold text-gray-900">{store.name || "Cửa hàng"}</h4>
              <div className="mb-1 flex items-start gap-1.5 text-xs text-gray-600">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
                <span>{getAddress(store) || "Chưa có thông tin địa chỉ"}</span>
              </div>
              {store.phone && (
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <Phone className="h-3.5 w-3.5 shrink-0 text-green-600" />
                  <span>{store.phone}</span>
                </div>
              )}
            </div>
          );

          const marker = new goongjs.Marker({ element, anchor: "bottom" })
            .setLngLat(coords)
            .setPopup(
              new goongjs.Popup({
                offset: 25,
                closeOnClick: false,
                // Goong mặc định focus nút đóng khi mở popup, khiến trình duyệt
                // tự cuộn cả trang để đưa phần tử được focus vào viewport.
                focusAfterOpen: false,
              }).setHTML(renderToString(popupContent)),
            )
            .addTo(map) as GoongMarker;

          markers.set(store._id, { marker, coords });
          element.addEventListener("click", event => {
            // Không để click đi tiếp vào handler toggle mặc định của Marker;
            // nếu không popup sẽ được mở rồi đóng ngay trong cùng một lần click.
            event.preventDefault();
            event.stopPropagation();
            focusStore(store._id);
          });
        });

        if (pendingStoreIdRef.current) {
          focusStore(pendingStoreIdRef.current);
        }
      });
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markers.clear();
    };
  }, [focusStore, stores]);

  const storesWithLocation = stores.filter(store => normalizeCoords(store.location?.coordinates));

  return (
    <div className="relative h-[480px] w-full overscroll-contain overflow-hidden rounded-lg shadow-md">
      <div ref={mapContainer} className="h-full w-full" />

      <aside className="absolute top-3 left-3 z-10 w-[calc(100%-1.5rem)] max-w-72 overflow-hidden rounded-xl border border-border bg-card/95 shadow-lg backdrop-blur sm:w-72">
        <div className="border-b border-border px-3 py-2.5">
          <p className="text-sm font-bold text-foreground">Cửa hàng PaoPizza</p>
          <p className="text-[11px] text-muted-foreground">Chọn cửa hàng để xem vị trí trên bản đồ</p>
        </div>

        <div className="max-h-60 overscroll-contain overflow-y-auto p-1.5">
          {storesWithLocation.length === 0 ? (
            <p className="px-2 py-3 text-xs text-muted-foreground">Chưa có cửa hàng có vị trí trên bản đồ.</p>
          ) : (
            storesWithLocation.map(store => {
              const isActive = store._id === activeStoreId;
              const address = getAddress(store);

              return (
                <button
                  key={store._id}
                  type="button"
                  onMouseDown={event => event.preventDefault()}
                  onClick={event => {
                    event.stopPropagation();
                    focusStore(store._id);
                  }}
                  className={`w-full rounded-lg px-2.5 py-2 text-left transition-colors ${
                    isActive ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Store size={15} className="shrink-0" />
                    <span className="truncate text-xs font-bold">{store.name}</span>
                  </span>
                  <span
                    className={`mt-0.5 block truncate pl-5 text-[10px] ${
                      isActive ? "text-primary-foreground/80" : "text-muted-foreground"
                    }`}
                  >
                    {address || "Chưa có địa chỉ"}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </aside>
    </div>
  );
}
