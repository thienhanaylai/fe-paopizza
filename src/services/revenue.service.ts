import { http } from "../utils/config.api";

export type RECOGNIZED_STATUSES = ["completed", "delivering"];
export type ALLOWED_GROUP_BY = ["day", "week", "month"];
export type DASHBOARD_PERIODS = ["day", "month", "quarter", "year"];

export const getRevenueDashboard = async (
  revenueStartDate: string,
  revenueEndDate: string,
  storeId: string,
  revenuePaymentMethod: string,
  revenueOrderType: string,
  typeUser: string,
) => {
  try {
    const response = await http(
      `/api/v1/revenue/overview?start_date=${revenueStartDate}&end_date=${revenueEndDate}&store_id=${storeId}&paymentMethod=${revenuePaymentMethod}&order_type=${revenueOrderType}`,
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
