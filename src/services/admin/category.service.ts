import api from "@/lib/Axios";
import type { ApiResponse } from "@/types/api/common.types";
import type { CategoryCreateRequest, CategoryResponse } from "@/types/api/category.types";

const adminCategoryService = {
  create: (data: CategoryCreateRequest) =>
    api.post<ApiResponse<CategoryResponse>>("/api/categories", data),
};

export default adminCategoryService;
