"use client";

import { ArrowRight, Check, Clock, Loader2, MapPin, Navigation, Search, StoreIcon, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { getAllStore, getNearestStore, NearestStoreData, StoreData } from "@/src/services/store.service";
import { autocomplete, placeDetail } from "@/src/services/map.service";

type StoreItem = (StoreData & { distanceMeters?: number }) | NearestStoreData;
type AddressSuggestion = { place_id: string; description: string; main_text?: string };

const AUTOCOMPLETE_DEBOUNCE_MS = 600;
const AUTOCOMPLETE_CACHE_LIMIT = 50;

interface SelectStoreModalProps {
  isOpen: boolean;
  onClose: (selectedStore: StoreData) => void;
  onDismiss?: () => void;
}

function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

export default function SelectStoreModal({ isOpen, onClose, onDismiss }: SelectStoreModalProps) {
  const [listStore, setListStore] = useState<StoreItem[]>([]);
  const [selectedStore, setSelectedStore] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [userCoords, setUserCoords] = useState<{ lng: number; lat: number } | null>(null);
  const [searchAddress, setSearchAddress] = useState("");
  // Autocomplete địa chỉ khách hàng
  const [addressInput, setAddressInput] = useState("");
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const sessionTokenRef = useRef(
    typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
  );
  const autocompleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Cache theo query để không gọi lại API khi khách gõ lại cùng địa chỉ.
  const autocompleteCacheRef = useRef(new Map<string, AddressSuggestion[]>());
  const autocompleteQueryRef = useRef("");
  const initializedRef = useRef(false);
  const isOpenRef = useRef(isOpen);
  // Chống race condition: mỗi lần detectLocation tăng generation, callback cũ bị bỏ qua
  const detectGenRef = useRef(0);

  const isCurrentRequest = useCallback((gen: number) => isOpenRef.current && gen === detectGenRef.current, []);

  const loadAllStores = useCallback(
    async (gen: number) => {
      try {
        const { data } = await getAllStore();
        // Bỏ qua kết quả nếu đã có request mới hơn
        if (!isCurrentRequest(gen)) return;
        setListStore(data);
        setUserCoords(null);
      } catch (e) {
        if (!isCurrentRequest(gen)) return;
        console.error("Lỗi tải danh sách cửa hàng:", e);
        setLocationError("Không thể tải danh sách cửa hàng. Vui lòng thử lại sau.");
        setUserCoords(null);
      } finally {
        if (!isCurrentRequest(gen)) return;
        setLoading(false);
      }
    },
    [isCurrentRequest],
  );

  const loadNearestStores = useCallback(
    async (lng: number, lat: number, gen: number) => {
      try {
        const { data } = await getNearestStore(lng, lat, 10);
        // Bỏ qua kết quả nếu đã có request mới hơn
        if (!isCurrentRequest(gen)) return;
        setListStore(data);
        setUserCoords({ lng, lat });
        setLocationError("");
      } catch {
        if (!isCurrentRequest(gen)) return;
        setLocationError("Không tìm thấy cửa hàng gần vị trí của bạn.");
        setUserCoords(null);
        // Fallback về all stores — truyền gen để tránh race tiếp
        await loadAllStores(gen);
      } finally {
        if (!isCurrentRequest(gen)) return;
        setLoading(false);
        setLocating(false);
      }
    },
    [isCurrentRequest, loadAllStores],
  );

  const detectLocation = useCallback(() => {
    // Tăng generation để huỷ các callback cũ đang chạy dở
    const gen = ++detectGenRef.current;

    if (!navigator.geolocation) {
      setLocationError("Trình duyệt không hỗ trợ định vị. Vui lòng chọn thủ công.");
      loadAllStores(gen);
      return;
    }

    setLocating(true);
    setLoading(true);
    setLocationError("");
    setUserCoords(null);

    navigator.geolocation.getCurrentPosition(
      position => {
        if (!isCurrentRequest(gen)) return;
        loadNearestStores(position.coords.longitude, position.coords.latitude, gen);
      },
      err => {
        if (!isCurrentRequest(gen)) return;
        setLocating(false);
        setUserCoords(null);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationError("Bạn đã từ chối truy cập vị trí. Hiển thị tất cả cửa hàng.");
        } else {
          setLocationError("Không thể lấy vị trí. Hiển thị tất cả cửa hàng.");
        }
        loadAllStores(gen);
      },
      { timeout: 10000, enableHighAccuracy: false },
    );
  }, [isCurrentRequest, loadNearestStores, loadAllStores]);

  const handleAddressInput = useCallback((value: string) => {
    setAddressInput(value);
    setSearchAddress(value);

    const query = value.trim().replace(/\s+/g, " ").toLocaleLowerCase("vi-VN");
    autocompleteQueryRef.current = query;

    if (autocompleteTimerRef.current) {
      clearTimeout(autocompleteTimerRef.current);
    }

    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      setSuggestionsLoading(false);
      return;
    }

    const cachedSuggestions = autocompleteCacheRef.current.get(query);
    if (cachedSuggestions !== undefined) {
      setSuggestions(cachedSuggestions);
      setShowSuggestions(cachedSuggestions.length > 0);
      setSuggestionsLoading(false);
      return;
    }

    autocompleteTimerRef.current = setTimeout(async () => {
      if (autocompleteQueryRef.current !== query) return;

      setSuggestionsLoading(true);
      try {
        const result = await autocomplete({
          input: value.trim(),
          sessiontoken: sessionTokenRef.current,
          limit: 5,
        });

        // Người dùng đã tiếp tục gõ trong lúc request chạy: không dùng response cũ.
        if (autocompleteQueryRef.current !== query) return;

        const predictions = result.predictions || [];
        const cache = autocompleteCacheRef.current;
        if (cache.size >= AUTOCOMPLETE_CACHE_LIMIT) {
          cache.delete(cache.keys().next().value as string);
        }
        cache.set(query, predictions);
        setSuggestions(predictions);
        setShowSuggestions(predictions.length > 0);
      } catch {
        if (autocompleteQueryRef.current === query) {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } finally {
        if (autocompleteQueryRef.current === query) {
          setSuggestionsLoading(false);
        }
      }
    }, AUTOCOMPLETE_DEBOUNCE_MS);
  }, []);

  const handleSelectSuggestion = useCallback(
    async (placeId: string, description: string) => {
      setAddressInput(description);
      // `searchAddress` chỉ dùng để lọc tên/địa chỉ của cửa hàng.
      // Địa chỉ khách chọn dùng để tìm cửa hàng gần nhất, không được dùng làm filter
      // nếu không danh sách nearest sẽ bị lọc thành rỗng.
      setSearchAddress("");
      setShowSuggestions(false);
      setSuggestions([]);

      // Tạo generation mới để huỷ geolocation đang chạy dở (nếu có)
      const gen = ++detectGenRef.current;

      setLocating(true);
      setLoading(true);
      setLocationError("");
      setUserCoords(null);

      try {
        const detail = await placeDetail({
          place_id: placeId,
          sessiontoken: sessionTokenRef.current,
        });
        const location = detail?.result?.geometry?.location;
        if (location && Number.isFinite(location.lng) && Number.isFinite(location.lat)) {
          await loadNearestStores(location.lng, location.lat, gen);
        } else {
          throw new Error("NO_LOCATION");
        }
      } catch {
        if (!isCurrentRequest(gen)) return;
        setLocationError("Không thể lấy tọa độ từ địa chỉ này. Vui lòng thử địa chỉ khác.");
        await loadAllStores(gen);
      }
    },
    [isCurrentRequest, loadNearestStores, loadAllStores],
  );

  // Khởi tạo khi modal mở
  useEffect(() => {
    isOpenRef.current = isOpen;

    if (!isOpen || initializedRef.current) return;
    initializedRef.current = true;

    setLoading(true);
    setLocationError("");
    setSearchAddress("");
    setAddressInput("");
    autocompleteQueryRef.current = "";
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedStore(null);

    // Thử detect vị trí trước
    detectLocation();
  }, [isOpen, detectLocation]);

  // Reset khi modal đóng
  useEffect(() => {
    if (!isOpen) {
      initializedRef.current = false;
      autocompleteQueryRef.current = "";
      if (autocompleteTimerRef.current) {
        clearTimeout(autocompleteTimerRef.current);
        autocompleteTimerRef.current = null;
      }
      // Vô hiệu hoá callback định vị/fetch còn treo khi modal đã đóng.
      // Nếu modal được mở lại, chỉ request mới được quyền cập nhật danh sách.
      detectGenRef.current += 1;
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (!selectedStore) return;
    onClose(selectedStore);
  };

  const canDismiss = typeof window !== "undefined" && Boolean(localStorage.getItem("selected_store"));

  // Lọc cửa hàng theo địa chỉ tìm kiếm
  const filteredStores = searchAddress.trim()
    ? listStore.filter(s => {
        const addr = `${s.address.streetNumber}, ${s.address.district}, ${s.address.city}`.toLowerCase();
        const name = s.name.toLowerCase();
        const q = searchAddress.toLowerCase();
        return addr.includes(q) || name.includes(q);
      })
    : listStore;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 pt-[max(1rem,env(safe-area-inset-top,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] pb-[max(1rem,env(safe-area-inset-bottom,0px))] pl-[max(1rem,env(safe-area-inset-left,0px))] backdrop-blur-sm animate-in fade-in duration-300">
      <div
        className="relative bg-card w-full max-w-lg rounded-[28px] border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 text-left"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border/80 flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 ">
              <MapPin size={20} className="fill-primary/20" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-foreground flex items-center gap-1.5">
                Chào mừng bạn đến với PaoPizza!
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Vui lòng chọn chi nhánh gần nhất để bắt đầu xem menu và đặt hàng nhé
              </p>
            </div>
          </div>
          {canDismiss && onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="ml-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
              aria-label="Đóng chọn cửa hàng"
              title="Đóng"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Trạng thái đang định vị / lỗi */}
          {locating && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-primary/5 border border-primary/20">
              <Loader2 size={18} className="text-primary animate-spin shrink-0" />
              <div>
                <p className="text-sm font-bold text-foreground">Đang phát hiện vị trí của bạn...</p>
                <p className="text-xs text-muted-foreground">Vui lòng cho phép truy cập vị trí để tìm cửa hàng gần nhất</p>
              </div>
            </div>
          )}

          {locationError && !locating && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-2xl bg-amber-50 border border-amber-200">
              <Navigation size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-800">{locationError}</p>
                <button onClick={detectLocation} className="text-xs text-primary font-bold hover:underline mt-1 cursor-pointer">
                  Thử lại định vị
                </button>
              </div>
            </div>
          )}

          {userCoords && !locating && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-green-50 border border-green-200">
              <p className="text-xs font-bold text-green-700">Đã phát hiện vị trí, hiển thị cửa hàng gần bạn nhất</p>
            </div>
          )}

          {/* Ô tìm kiếm địa chỉ khách hàng + Autocomplete */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-3.5 text-muted-foreground shrink-0" />
            <input
              type="text"
              placeholder={
                locationError
                  ? "Nhập địa chỉ của bạn để tìm cửa hàng gần nhất..."
                  : "Nhập địa chỉ hoặc tên đường, quận, thành phố..."
              }
              value={addressInput}
              onChange={e => handleAddressInput(e.target.value)}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
              onBlur={() => {
                // Delay để onClick trên suggestion kịp fire
                setTimeout(() => setShowSuggestions(false), 150);
              }}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-muted/30 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
            />

            {/* Dropdown autocomplete */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-card border border-border rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                {suggestionsLoading && (
                  <div className="flex items-center gap-2 px-4 py-2.5 text-xs text-muted-foreground">
                    <Loader2 size={12} className="animate-spin" /> Đang tìm...
                  </div>
                )}
                {suggestions.map(s => (
                  <button
                    key={s.place_id}
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => handleSelectSuggestion(s.place_id, s.description)}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-sm text-foreground hover:bg-muted transition-colors border-b border-border/50 last:border-b-0 cursor-pointer"
                  >
                    <MapPin size={14} className="text-muted-foreground shrink-0" />
                    <span className="line-clamp-1">{s.description}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Danh sách cửa hàng */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {userCoords ? "Cửa hàng gần bạn" : "Danh sách chi nhánh"}
              </label>
              {!userCoords && (
                <button
                  onClick={detectLocation}
                  disabled={locating}
                  className="text-xs text-primary font-bold hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  {locating ? <Loader2 size={12} className="animate-spin" /> : <Navigation size={12} />}
                  {locating ? "Đang tìm..." : "Tìm cửa hàng gần nhất"}
                </button>
              )}
            </div>

            {loading ? (
              <div className="space-y-2 pr-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-full flex items-start gap-3.5 px-4 py-3.5 border border-border rounded-2xl bg-muted/20 animate-pulse"
                  >
                    <div className="w-9 h-9 rounded-xl bg-muted shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 bg-muted rounded-md w-2/3" />
                      <div className="h-2.5 bg-muted rounded-md w-full" />
                      <div className="h-2 bg-muted rounded-md w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredStores.length === 0 ? (
              <div className="text-center py-12">
                <StoreIcon size={32} className="text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {searchAddress ? "Không tìm thấy cửa hàng phù hợp" : "Chưa có cửa hàng nào"}
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-85 overflow-y-auto pr-1">
                {filteredStores.map(s => {
                  const isSelected = s._id === selectedStore?._id;
                  const dist = (s as NearestStoreData).distanceMeters;

                  return (
                    <button
                      key={s._id}
                      onClick={() => setSelectedStore(s as StoreData)}
                      className={`w-full flex items-start gap-3.5 px-4 py-3.5 text-left border rounded-2xl transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? "bg-primary/5 border-primary shadow-sm"
                          : "bg-muted/30 border-border hover:border-primary/30 hover:bg-muted/50"
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-200 ${
                          isSelected ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isSelected ? <Check size={16} /> : <StoreIcon size={16} />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-xs font-black text-foreground">{s.name}</p>
                          {dist !== undefined && (
                            <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-md">
                              {formatDistance(dist)}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                          {s.address.streetNumber}, {s.address.district}, {s.address.city}
                        </p>

                        <div className="flex items-center gap-3 mt-1.5 flex-wrap text-[10px]">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Clock size={10} /> {s.timeOpen} - {s.timeClose}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-muted/20 flex items-center justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <span className="text-[9px] text-muted-foreground uppercase block font-bold tracking-wider">Đang chọn chi nhánh</span>
            <span className="text-xs font-bold text-foreground truncate block max-w-[180px] sm:max-w-[240px]">
              {selectedStore?.name || "Chưa chọn"}
            </span>
          </div>
          <button
            onClick={handleConfirm}
            disabled={!selectedStore}
            className="px-6 py-2.5 rounded-xl bg-primary text-white hover:bg-primary/95 text-xs font-extrabold shadow-md shadow-primary/25 hover:shadow-lg transition-all cursor-pointer flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Vào xem thực đơn <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
