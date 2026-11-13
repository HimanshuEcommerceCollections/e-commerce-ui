import api from "@/lib/Axios";
import type { ApiResponse, PageResponse } from "@/types/api/common.types";
import type { SubmissionDetail } from "@/types/api/admin.types";
import type {
  BulkApproveResult,
  QueueCounts,
  QueueDecisionInput,
  QueueItem,
  QueueItemDetail,
  QueueListParams,
} from "@/types/api/reviewQueue.types";

/** Review queue tabs, automatic checks, structured decisions and bulk approval. */
const reviewQueueService = {
  list: (params: QueueListParams) => api.get<ApiResponse<PageResponse<QueueItem>>>("/api/admin/review-queue", { params }),

  counts: () => api.get<ApiResponse<QueueCounts>>("/api/admin/review-queue/counts"),

  /** Checks, price history and the neighbouring items (oldest first). */
  item: (ref: string) => api.get<ApiResponse<QueueItemDetail>>(`/api/admin/review-queue/${ref}`),

  decide: (ref: string, input: QueueDecisionInput) =>
    api.post<ApiResponse<SubmissionDetail>>(`/api/admin/review-queue/${ref}/decision`, input, { timeout: 60_000 }),

  bulkApprove: (references: string[], note?: string) =>
    api.post<ApiResponse<BulkApproveResult>>("/api/admin/review-queue/bulk-approve", { references, note }, { timeout: 180_000 }),
};

export default reviewQueueService;
