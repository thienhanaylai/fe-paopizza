import { http } from "@/src/utils/config.api";

export type PasswordResetUserType = "Customer" | "Employee";

const requestConfig = { skipUnauthorized: true };

export async function requestPasswordReset(email: string, userType: PasswordResetUserType) {
  return http(
    "/api/v1/auth/forgot-password",
    {
      method: "POST",
      body: JSON.stringify({ email, userType }),
    },
    userType === "Customer" ? "customer" : null,
    requestConfig,
  );
}

export async function verifyPasswordResetOtp(email: string, userType: PasswordResetUserType, otp: string) {
  return http(
    "/api/v1/auth/verify-reset-otp",
    {
      method: "POST",
      body: JSON.stringify({ email, userType, otp }),
    },
    userType === "Customer" ? "customer" : null,
    requestConfig,
  );
}

export async function resetPasswordWithOtp(
  email: string,
  userType: PasswordResetUserType,
  otp: string,
  newPassword: string,
) {
  return http(
    "/api/v1/auth/reset-password",
    {
      method: "POST",
      body: JSON.stringify({ email, userType, otp, newPassword }),
    },
    userType === "Customer" ? "customer" : null,
    requestConfig,
  );
}
