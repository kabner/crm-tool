import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface Asset {
  id: string;
  tenantId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  s3Key: string;
  cdnUrl: string | null;
  width: number | null;
  height: number | null;
  altText: string | null;
  title: string | null;
  folderId: string | null;
  tags: string[];
  metadata: Record<string, any>;
  thumbnails: Record<string, any>;
  uploadedBy: string;
  createdAt: string;
}

export interface AssetFolder {
  id: string;
  tenantId: string;
  name: string;
  parentId: string | null;
  position: number;
}

export interface AssetsResponse {
  data: Asset[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AssetFilters {
  folderId?: string;
  search?: string;
  mimeType?: string;
  limit?: number;
  page?: number;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

function buildQueryString(filters: Record<string, any>): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  });
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function useAssets(filters: AssetFilters = {}) {
  return useQuery<AssetsResponse>({
    queryKey: ["assets", filters],
    queryFn: () =>
      apiClient.get<AssetsResponse>(
        `/api/v1/assets${buildQueryString(filters)}`,
      ),
  });
}

export function useAsset(id: string) {
  return useQuery<Asset>({
    queryKey: ["assets", id],
    queryFn: () => apiClient.get<Asset>(`/api/v1/assets/${id}`),
    enabled: !!id,
  });
}

export function useUploadAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      file,
      folderId,
    }: {
      file: File;
      folderId?: string;
    }) => {
      const formData = new FormData();
      formData.append("file", file);
      if (folderId) formData.append("folderId", folderId);

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("auth_token")
          : null;

      const res = await fetch(`${API_URL}/api/v1/assets/upload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Upload failed" }));
        throw new Error(err.message);
      }

      return res.json() as Promise<Asset>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
  });
}

export function useUpdateAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { altText?: string; title?: string; folderId?: string; tags?: string[] };
    }) => apiClient.patch<Asset>(`/api/v1/assets/${id}`, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["assets", variables.id] });
    },
  });
}

export function useDeleteAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/v1/assets/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
  });
}

export function useAssetFolders(parentId?: string) {
  return useQuery<AssetFolder[]>({
    queryKey: ["asset-folders", parentId],
    queryFn: () =>
      apiClient.get<AssetFolder[]>(
        `/api/v1/assets/folders${parentId ? `?parentId=${parentId}` : ""}`,
      ),
  });
}

export function useCreateFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; parentId?: string }) =>
      apiClient.post<AssetFolder>("/api/v1/assets/folders", data),
    onSuccess: (_data, variables) => {
      // Invalidate the specific parent folder query and any broader folder queries
      queryClient.invalidateQueries({ queryKey: ["asset-folders", variables.parentId] });
      queryClient.invalidateQueries({ queryKey: ["asset-folders"] });
    },
  });
}
