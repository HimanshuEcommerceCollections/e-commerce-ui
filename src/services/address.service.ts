import api from "@/lib/Axios";
import type { ApiResponse } from "@/types/api/common.types";
import type { AddressRequest, AddressResponse } from "@/types/api/address.types";

const addressService = {
  getAll: () =>
    api.get<ApiResponse<AddressResponse[]>>("/api/users/me/addresses"),

  getById: (id: string) =>
    api.get<ApiResponse<AddressResponse>>(`/api/users/me/addresses/${id}`),

  create: (data: AddressRequest) =>
    api.post<ApiResponse<AddressResponse>>("/api/users/me/addresses", data),

  update: (id: string, data: AddressRequest) =>
    api.put<ApiResponse<AddressResponse>>(`/api/users/me/addresses/${id}`, data),

  delete: (id: string) =>
    api.delete<ApiResponse<null>>(`/api/users/me/addresses/${id}`),

  setDefault: (id: string) =>
    api.patch<ApiResponse<AddressResponse>>(`/api/users/me/addresses/${id}/default`),
};

export default addressService;
