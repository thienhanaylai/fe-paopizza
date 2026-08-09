"use client";

import { Clock, Loader2, MapPin, Phone } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import GoongMap from "@/src/components/layouts/GoongMap";
import { getAllStore, type StoreData } from "@/src/services/store.service";

function formatAddress(store?: StoreData) {
  if (!store) return "Chưa chọn cửa hàng";
  return [store.address.streetNumber, store.address.district, store.address.city].filter(Boolean).join(", ");
}

export default function ContactPage() {
  const [stores, setStores] = useState<StoreData[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const syncSelectedStore = () => setSelectedStoreId(localStorage.getItem("selected_store") || "");
    const handleStoreChanged = () => syncSelectedStore();
    const handleStorage = (event: StorageEvent) => {
      if (event.key === "selected_store") syncSelectedStore();
    };

    syncSelectedStore();
    window.addEventListener("selected-store-changed", handleStoreChanged);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("selected-store-changed", handleStoreChanged);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadStores = async () => {
      try {
        const { data } = await getAllStore();
        if (!cancelled) setStores(data.filter(store => store.status === "active"));
      } catch {
        if (!cancelled) setError("Không thể tải danh sách cửa hàng. Vui lòng thử lại sau.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadStores();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedStore = useMemo(
    () => stores.find(store => store._id === selectedStoreId) || stores[0],
    [selectedStoreId, stores],
  );

  return (
    <div className="flex-1 bg-background">
      <section className="border-b border-border bg-card py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="mb-3 text-3xl font-bold text-foreground sm:text-4xl">Liên hệ với chúng tôi</h1>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Chọn một chi nhánh trên bản đồ để xem vị trí, số điện thoại và thời gian hoạt động.
          </p>
        </div>
      </section>

      <section className="py-10 sm:py-14">
        <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex h-80 items-center justify-center rounded-2xl border border-border bg-card">
              <Loader2 className="animate-spin text-primary" size={28} />
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-600">{error}</div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[
                  {
                    icon: <Phone size={21} />,
                    label: "Hotline",
                    value: selectedStore?.phone || "1900 0860",
                  },
                  {
                    icon: <MapPin size={21} />,
                    label: "Địa chỉ",
                    value: formatAddress(selectedStore),
                  },
                  {
                    icon: <Clock size={21} />,
                    label: "Giờ mở cửa",
                    value: selectedStore ? `${selectedStore.timeOpen} - ${selectedStore.timeClose}` : "Đang cập nhật",
                  },
                ].map(item => (
                  <div key={item.label} className="rounded-2xl border border-border bg-card p-5 text-center">
                    <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      {item.icon}
                    </div>
                    <p className="mb-1 font-medium text-foreground">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.value}</p>
                  </div>
                ))}
              </div>

              <GoongMap stores={stores} onStoreSelect={setSelectedStoreId} />
            </>
          )}
        </div>
      </section>
    </div>
  );
}
