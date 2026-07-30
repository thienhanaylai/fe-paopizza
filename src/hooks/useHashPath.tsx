"use client";

import { useState, useEffect } from "react";

//  Hook theo dõi pathname hiện tại.
//  trả về pathname hiện tại (vd: "/profile", "/orders")

export const useHash = () => {
  const [hash, setHash] = useState("");

  useEffect(() => {
    // Cập nhật pathname mỗi khi URL thay đổi (hash hoặc popstate)
    const handleHashChange = () => {
      setHash(window.location.pathname);
    };

    // Gọi ngay lần đầu để có giá trị khởi tạo
    handleHashChange();

    // Lắng nghe sự kiện thay đổi hash (điều hướng SPA)
    window.addEventListener("hashchange", handleHashChange);
    // Lắng nghe popstate (trình duyệt back/forward)
    window.addEventListener("popstate", handleHashChange);

    // Cleanup khi component unmount
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
      window.removeEventListener("popstate", handleHashChange);
    };
  }, []);

  return hash;
};
