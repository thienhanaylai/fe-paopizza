import { http } from "../utils/config.api";

export type CustomerAddress = {
  _id?: string;
  name: string;
  phone: string;
  address: string;
  isDefault: boolean;
};

export interface UpdateCustomerInfo {
  user_id: string;
  name?: string;
  phone?: string;
  address?: string;
  listAddress?: CustomerAddress[];
  email?: string;
  birthday?: string;
}

export interface AddCustomerAddressPayload {
  user_id: string;
  name: string;
  phone: string;
  address: string;
  isDefault: boolean;
}

export interface UpdateCustomerAddressPayload {
  user_id: string;
  address_id: string;
  name?: string;
  phone?: string;
  address?: string;
  isDefault?: boolean;
}

export interface DeleteCustomerAddressPayload {
  user_id: string;
  address_id: string;
}

export const getAllEmployee = async (payload: UpdateCustomerInfo) => {
  try {
    const response = await http("/api/v1/customers/update", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi fetch products:", error);
    throw error;
  }
};

export const getCustomerAddresses = async (user_id: string, typeUser: string | null = "customer") => {
  try {
    const response = await http(
      "/api/v1/customers/list-address",
      {
        method: "POST",
        body: JSON.stringify({ user_id: user_id }),
      },
      typeUser,
    );
    return response.data;
  } catch (error) {
    console.error("Lỗi fetch địa chỉ khách hàng:", error);
    throw error;
  }
};

export const addCustomerAddress = async (payload: AddCustomerAddressPayload, typeUser: string | null = "customer") => {
  try {
    const response = await http(
      "/api/v1/customers/add-address",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      typeUser,
    );
    return response;
  } catch (error) {
    console.error("Lỗi thêm địa chỉ khách hàng:", error);
    throw error;
  }
};

export const updateCustomerAddress = async (payload: UpdateCustomerAddressPayload, typeUser: string | null = "customer") => {
  try {
    const response = await http(
      "/api/v1/customers/update-address",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      typeUser,
    );

    return response;
  } catch (error) {
    console.error("Lỗi cập nhật địa chỉ khách hàng:", error);
    throw error;
  }
};

export const deleteCustomerAddress = async (payload: DeleteCustomerAddressPayload, typeUser: string | null = "customer") => {
  try {
    const response = await http(
      "/api/v1/customers/delete-address",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      typeUser,
    );
    return response;
  } catch (error) {
    console.error("Lỗi xóa địa chỉ khách hàng:", error);
    throw error;
  }
};

export const setDefaultAddress = async (payload: UpdateCustomerAddressPayload, typeUser: string | null = "customer") => {
  try {
    const response = await http(
      "/api/v1/customers/set-default-address",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      typeUser,
    );
    return response;
  } catch (error) {
    console.error("Lõi khi đặt địa chỉ làm mặc định:", error);
    throw error;
  }
};

export const updateCustomer = async (payload: UpdateCustomerInfo) => {
  try {
    const response = await http(
      "/api/v1/customers/update",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      "customer",
    );
    return response.data;
  } catch (error) {
    console.error("Lỗi update customer:", error);
    throw error;
  }
};

export const changePassword = async (oldPass: string, newPass: string, typeUser: string | null = "customer") => {
  try {
    const response = await http(
      "/api/v1/auth/changePassword",
      {
        method: "POST",
        body: JSON.stringify({ oldPass, newPass }),
      },
      typeUser,
    );
    return response;
  } catch (error) {
    console.error("Lỗi đổi mật khẩu:", error);
    throw error;
  }
};
