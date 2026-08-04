import { http } from "../utils/config.api";

export type RECOGNIZED_STATUSES = ["completed", "delivering"];
export type ALLOWED_GROUP_BY = ["day", "week", "month"];
export type DASHBOARD_PERIODS = ["day", "month", "quarter", "year"];

export const getRevenue = async (
  revenueStartDate: string,
  revenueEndDate: string,
  storeId: string,
  revenuePaymentMethod: string,
  revenueOrderType: string,
  typeUser: string,
) => {
  try {
    const response = await http(
      `/api/v1/revenue/overview?startDate=${revenueStartDate}&endDate=${revenueEndDate}&store_id=${storeId}&paymentMethod=${revenuePaymentMethod}&orderType=${revenueOrderType}`,
      {
        method: "GET",
      },
      typeUser,
    );
    return response.data;
  } catch (error) {
    console.error("Lỗi fetch :", error);
    throw error;
  }
};

export const getStoresRevenue = async (startDate: string, endDate: string, typeUser: string) => {
  try {
    const response = await http(
      `/api/v1/revenue/breakdown?startDate=${startDate}&endDate=${endDate}&dimension=store`,
      { method: "GET" },
      typeUser,
    );
    return response.data.data;
  } catch (error) {
    console.error("Lỗi fetch stores revenue:", error);
    throw error;
  }
};
