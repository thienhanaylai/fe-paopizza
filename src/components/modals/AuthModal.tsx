"use client";

import React, { useState } from "react";
import { X, Eye, EyeOff } from "lucide-react";
import { useCustomerAuth } from "@/src/context/authCustomerContext";
import { PasswordResetForm } from "@/src/components/auth/PasswordResetForm";

const LOGIN_ERROR_MESSAGES: Record<string, string> = {
  RATE_LIMIT: "Vui lòng đăng nhập lại sau 1 giờ!",
  ACCOUNT_NOT_FOUND: "Không tìm thấy tài khoản!",
  ACCOUNT_LOCKED: "Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.",
};

export const AuthModal = () => {
  const { authMode, setAuthMode, customerLogin, customerRegister } = useCustomerAuth();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isPasswordReset, setIsPasswordReset] = useState(false);

  const clearNotice = () => {
    setError("");
    setSuccess("");
  };

  const handleClose = () => {
    setAuthMode(null);
    clearNotice();
    setPhone("");
    setPassword("");
    setFullname("");
    setEmail("");
    setIsPasswordReset(false);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    clearNotice();

    if (!phone || !password) {
      setError("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    if (authMode === "register") {
      if (!fullname) {
        setError("Vui lòng nhập họ tên");
        return;
      }
      if (!email.trim()) {
        setError("Vui lòng nhập email để có thể khôi phục mật khẩu.");
        return;
      }

      setIsSubmitting(true);
      const res = await customerRegister(fullname, phone, password, email);
      setIsSubmitting(false);

      if (!res.success) {
        setError(res.message || "Đăng ký thất bại");
        return;
      }

      setSuccess("Đăng ký thành công! Vui lòng đăng nhập.");
      setTimeout(() => {
        setAuthMode("login");
        clearNotice();
      }, 1000);
      return;
    }

    if (authMode === "login") {
      setIsSubmitting(true);
      const result = await customerLogin(phone, password);
      setIsSubmitting(false);
      if (result.success) {
        handleClose();
      } else {
        setError(
          (result.message && LOGIN_ERROR_MESSAGES[result.message]) ||
            result.message ||
            "Lỗi đăng nhập!",
        );
      }
    }
  };

  if (!authMode) return null;

  return (
    <div
      className="fixed inset-0 z-50 m-0 flex items-center justify-center bg-black/50 pt-[max(1rem,env(safe-area-inset-top,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] pb-[max(1rem,env(safe-area-inset-bottom,0px))] pl-[max(1rem,env(safe-area-inset-left,0px))]"
      onClick={handleClose}
    >
      <div className="bg-card rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-foreground text-xl font-semibold">
              {isPasswordReset ? "Quên mật khẩu" : authMode === "login" ? "Đăng nhập" : "Đăng ký tài khoản"}
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isPasswordReset
                ? "Xác thực email để tạo mật khẩu mới"
                : authMode === "login"
                  ? "Đăng nhập để đặt hàng ngay"
                  : "Tạo tài khoản mới"}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {isPasswordReset ? (
          <PasswordResetForm userType="Customer" onBack={() => setIsPasswordReset(false)} />
        ) : (
          <>
            <form onSubmit={handleAuth} className="space-y-4 ">
              {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">{error}</div>}
              {success && <div className="bg-green-50 text-green-600 px-4 py-3 rounded-lg text-sm">{success}</div>}

              {authMode === "register" && (
                <>
                  <div>
                    <label className="block text-sm mb-1.5 font-medium">Họ tên</label>
                    <input
                      value={fullname}
                      onChange={e => {
                        setFullname(e.target.value);
                        setError("");
                      }}
                      placeholder="Nguyễn Văn A"
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1.5 font-medium">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => {
                        setEmail(e.target.value);
                        setError("");
                      }}
                      placeholder="email@example.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm mb-1.5 font-medium">Số điện thoại</label>
                <input
                  type="text"
                  value={phone}
                  inputMode="numeric"
                  onChange={e => {
                    setPhone(e.target.value);
                    setError("");
                  }}
                  placeholder="Nhập số điện thoại"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm mb-1.5 font-medium">Mật khẩu</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    placeholder="Nhập mật khẩu"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none pr-12 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute  right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full cursor-pointer bg-primary text-white py-3 rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25 font-semibold mt-2 disabled:opacity-70"
              >
                {isSubmitting ? "Đang xử lý..." : authMode === "login" ? "Đăng nhập" : "Đăng ký"}
              </button>
            </form>

            {authMode === "login" && (
              <button
                type="button"
                onClick={() => {
                  clearNotice();
                  setIsPasswordReset(true);
                }}
                className="mt-4 w-full text-right text-sm font-medium text-primary hover:underline"
              >
                Quên mật khẩu?
              </button>
            )}

            <p className="text-center text-muted-foreground text-sm mt-6 ">
              {authMode === "login" ? (
                <>
                  Chưa có tài khoản?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("register");
                      clearNotice();
                    }}
                    className="text-primary hover:underline font-medium cursor-pointer"
                  >
                    Đăng ký ngay
                  </button>
                </>
              ) : (
                <>
                  Đã có tài khoản?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("login");
                      clearNotice();
                    }}
                    className="text-primary hover:underline font-medium cursor-pointer"
                  >
                    Đăng nhập
                  </button>
                </>
              )}
            </p>
          </>
        )}
      </div>
    </div>
  );
};
