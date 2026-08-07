"use client";

import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import {
  PasswordResetUserType,
  requestPasswordReset,
  resetPasswordWithOtp,
  verifyPasswordResetOtp,
} from "@/src/services/password-reset.service";

type PasswordResetFormProps = {
  userType: PasswordResetUserType;
  onBack: () => void;
};

type Step = "request" | "verify" | "reset" | "done";

const OTP_TTL_SECONDS = 5 * 60;

const getErrorMessage = (error: unknown) => {
  const message = error instanceof Error ? error.message : "Không thể xử lý yêu cầu. Vui lòng thử lại.";
  if (message === "TOO_MANY_PASSWORD_RESET_REQUESTS") {
    return "Bạn đã yêu cầu mã quá nhiều lần. Vui lòng thử lại sau 15 phút.";
  }
  if (message === "OTP_INVALID_OR_EXPIRED") {
    return "Mã OTP không đúng hoặc đã hết hạn.";
  }
  if (message === "OTP_ATTEMPTS_EXCEEDED") {
    return "Bạn đã nhập sai mã quá nhiều lần. Vui lòng yêu cầu mã mới.";
  }
  if (message === "EMAIL_SERVICE_NOT_CONFIGURED") {
    return "Dịch vụ gửi email chưa được cấu hình. Vui lòng liên hệ quản trị viên.";
  }
  if (message === "EMAIL_DELIVERY_FAILED") {
    return "Không thể gửi email chứa mã OTP. Vui lòng thử lại sau.";
  }
  return message;
};

export function PasswordResetForm({ userType, onBack }: PasswordResetFormProps) {
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otpExpiresAt, setOtpExpiresAt] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(OTP_TTL_SECONDS);

  const clearError = () => setError("");
  const isOtpExpired = otpExpiresAt !== null && remainingSeconds === 0;
  const remainingTime = `${String(Math.floor(remainingSeconds / 60)).padStart(2, "0")}:${String(remainingSeconds % 60).padStart(2, "0")}`;

  useEffect(() => {
    if (!otpExpiresAt) return;

    const updateRemainingTime = () => {
      setRemainingSeconds(Math.max(0, Math.ceil((otpExpiresAt - Date.now()) / 1000)));
    };

    updateRemainingTime();
    const intervalId = window.setInterval(updateRemainingTime, 1000);
    return () => window.clearInterval(intervalId);
  }, [otpExpiresAt]);

  const handleRequestOtp = async (event: FormEvent) => {
    event.preventDefault();
    clearError();

    if (!email.trim()) {
      setError("Vui lòng nhập email đã liên kết với tài khoản.");
      return;
    }

    try {
      setIsSubmitting(true);
      await requestPasswordReset(email.trim(), userType);
      setOtpExpiresAt(Date.now() + OTP_TTL_SECONDS * 1000);
      setRemainingSeconds(OTP_TTL_SECONDS);
      setStep("verify");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (event: FormEvent) => {
    event.preventDefault();
    clearError();

    if (!/^\d{6}$/.test(otp)) {
      setError("Mã OTP phải gồm đúng 6 chữ số.");
      return;
    }
    if (isOtpExpired) {
      setError("Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.");
      return;
    }

    try {
      setIsSubmitting(true);
      await verifyPasswordResetOtp(email.trim(), userType, otp);
      setStep("reset");
    } catch (verifyError) {
      setError(getErrorMessage(verifyError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (event: FormEvent) => {
    event.preventDefault();
    clearError();

    if (isOtpExpired) {
      setError("Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Xác nhận mật khẩu chưa khớp.");
      return;
    }

    try {
      setIsSubmitting(true);
      await resetPasswordWithOtp(email.trim(), userType, otp, newPassword);
      setStep("done");
    } catch (resetError) {
      setError(getErrorMessage(resetError));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === "done") {
    return (
      <div className="space-y-5">
        <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
          Đặt lại mật khẩu thành công. Vui lòng đăng nhập bằng mật khẩu mới.
        </div>
        <button
          type="button"
          onClick={onBack}
          className="w-full rounded-xl bg-primary py-3 font-semibold text-white shadow-lg shadow-primary/25 transition-colors hover:bg-primary/90"
        >
          Quay lại đăng nhập
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={step === "request" ? handleRequestOtp : step === "verify" ? handleVerifyOtp : handleResetPassword}
      className="space-y-4"
    >
      {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

      {step === "request" ? (
        <>
          <p className="text-sm text-muted-foreground">
            Nhập email đã liên kết với tài khoản {userType === "Employee" ? "nhân viên" : "khách hàng"}. Chúng tôi sẽ gửi mã OTP 6
            số có hiệu lực trong 5 phút.
          </p>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Email</label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={event => {
                setEmail(event.target.value);
                clearError();
              }}
              placeholder="email@example.com"
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {step === "reset" ? (
              <>
                Mã OTP đã được xác thực. Hãy tạo mật khẩu mới. Thời gian còn lại: {" "}
                <span className={`font-semibold tabular-nums ${isOtpExpired ? "text-red-600" : "text-primary"}`}>{remainingTime}</span>
              </>
            ) : (
              <>
                Mã OTP đã được gửi đến <span className="font-medium text-foreground">{email}</span>. Thời gian còn lại: {" "}
                <span className={`font-semibold tabular-nums ${isOtpExpired ? "text-red-600" : "text-primary"}`}>{remainingTime}</span>
              </>
            )}
          </p>
          <div className={`${step === "reset" ? "hidden" : ""}`}>
            <label className="mb-1.5 block text-sm font-medium">Mã OTP</label>
            <input
              value={otp}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              readOnly={step === "reset"}
              onChange={event => {
                setOtp(event.target.value.replace(/\D/g, ""));
                clearError();
              }}
              placeholder="123456"
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-center text-lg tracking-[0.35em] outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          {step === "reset" && (
            <>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Mật khẩu mới</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={event => {
                      setNewPassword(event.target.value);
                      clearError();
                    }}
                    placeholder="Ít nhất 6 ký tự"
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 pr-12 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(value => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Xác nhận mật khẩu mới</label>
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={event => {
                    setConfirmPassword(event.target.value);
                    clearError();
                  }}
                  placeholder="Nhập lại mật khẩu mới"
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </>
          )}
          <button
            type="button"
            onClick={() => {
              setStep("request");
              setOtp("");
              setOtpExpiresAt(null);
              setRemainingSeconds(OTP_TTL_SECONDS);
              clearError();
            }}
            className="text-sm font-medium text-primary hover:underline"
          >
            Gửi lại mã OTP
          </button>
          {isOtpExpired && <p className="text-sm text-red-600">Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.</p>}
        </>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-semibold text-white shadow-lg shadow-primary/25 transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting && <LoaderCircle size={18} className="animate-spin" />}
        {isSubmitting
          ? "Đang xử lý..."
          : step === "request"
            ? "Gửi mã OTP"
            : step === "verify"
              ? "Xác thực mã OTP"
              : "Đặt lại mật khẩu"}
      </button>

      {step === "request" && (
        <button type="button" onClick={onBack} className="w-full text-sm font-medium text-primary hover:underline">
          Quay lại đăng nhập
        </button>
      )}
    </form>
  );
}
