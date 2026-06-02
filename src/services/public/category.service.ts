import api from "@/lib/Axios";
import type { ApiResponse } from "@/types/api/common.types";
import type { CategoryResponse } from "@/types/api/category.types";

const publicCategoryService = {
  getAll: () =>
    api.get<ApiResponse<CategoryResponse[]>>("/api/categories"),

  getById: (id: string) =>
    api.get<ApiResponse<CategoryResponse>>(`/api/categories/${id}`),
};

export default publicCategoryService;
