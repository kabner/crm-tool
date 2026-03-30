"use client";

import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useAssets,
  useUploadAsset,
  useDeleteAsset,
  useUpdateAsset,
  useAssetFolders,
  useCreateFolder,
  Asset,
  AssetFolder,
} from "@/hooks/use-assets";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith("image/")) {
    return (
      <svg className="h-8 w-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
      </svg>
    );
  }
  if (mimeType === "application/pdf") {
    return (
      <svg className="h-8 w-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    );
  }
  return (
    <svg className="h-8 w-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}

export default function AssetsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [mimeFilter, setMimeFilter] = useState("");
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>(
    undefined,
  );
  const [folderPath, setFolderPath] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: assetsData, isLoading } = useAssets({
    page,
    limit: 40,
    folderId: currentFolderId,
    search: debouncedSearch || undefined,
    mimeType: mimeFilter || undefined,
  });
  const { data: folders } = useAssetFolders(currentFolderId);
  const uploadAsset = useUploadAsset();
  const deleteAsset = useDeleteAsset();
  const updateAsset = useUpdateAsset();
  const createFolder = useCreateFolder();

  const debounceTimer = useState<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
      if (debounceTimer[0]) clearTimeout(debounceTimer[0]);
      debounceTimer[0] = setTimeout(() => {
        setDebouncedSearch(value);
        setPage(1);
      }, 300);
    },
    [debounceTimer],
  );

  const handleUpload = async (files: FileList | File[]) => {
    for (const file of Array.from(files)) {
      await uploadAsset.mutateAsync({ file, folderId: currentFolderId });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUpload(e.target.files);
      e.target.value = "";
    }
  };

  const navigateToFolder = (folder: AssetFolder) => {
    setFolderPath([...folderPath, { id: folder.id, name: folder.name }]);
    setCurrentFolderId(folder.id);
    setPage(1);
    setSelectedAsset(null);
  };

  const navigateToBreadcrumb = (index: number) => {
    if (index === -1) {
      setFolderPath([]);
      setCurrentFolderId(undefined);
    } else {
      const newPath = folderPath.slice(0, index + 1);
      setFolderPath(newPath);
      setCurrentFolderId(newPath[newPath.length - 1]!.id);
    }
    setPage(1);
    setSelectedAsset(null);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    await createFolder.mutateAsync({
      name: newFolderName.trim(),
      parentId: currentFolderId,
    });
    setNewFolderName("");
    setShowNewFolder(false);
  };

  const handleDeleteAsset = async (id: string) => {
    if (confirm("Delete this asset permanently?")) {
      await deleteAsset.mutateAsync(id);
      if (selectedAsset?.id === id) setSelectedAsset(null);
    }
  };

  const handleCopyUrl = (asset: Asset) => {
    const url = asset.cdnUrl
      ? `${API_URL}${asset.cdnUrl}`
      : "";
    navigator.clipboard.writeText(url);
  };

  const assets = assetsData?.data ?? [];
  const meta = assetsData?.meta ?? {
    total: 0,
    page: 1,
    limit: 40,
    totalPages: 1,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assets</h1>
          <p className="text-muted-foreground">
            Manage files, images, and documents.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowNewFolder(!showNewFolder)}
          >
            New Folder
          </Button>
          <Button onClick={() => fileInputRef.current?.click()}>
            Upload File
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-sm">
        <button
          onClick={() => navigateToBreadcrumb(-1)}
          className="text-primary hover:underline"
        >
          All Files
        </button>
        {folderPath.map((folder, index) => (
          <span key={folder.id} className="flex items-center gap-1">
            <span className="text-muted-foreground">/</span>
            <button
              onClick={() => navigateToBreadcrumb(index)}
              className="text-primary hover:underline"
            >
              {folder.name}
            </button>
          </span>
        ))}
      </div>

      {/* New Folder Form */}
      {showNewFolder && (
        <div className="flex items-center gap-2">
          <Input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Folder name"
            className="max-w-xs"
            onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
          />
          <Button size="sm" onClick={handleCreateFolder}>
            Create
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowNewFolder(false)}
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search assets..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="max-w-sm"
        />
        <select
          value={mimeFilter}
          onChange={(e) => {
            setMimeFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="">All types</option>
          <option value="image/">Images</option>
          <option value="application/pdf">PDF</option>
          <option value="video/">Video</option>
          <option value="audio/">Audio</option>
        </select>
      </div>

      {/* Drop zone + Grid */}
      <div className="flex gap-6">
        <div
          className={`flex-1 ${dragActive ? "rounded-lg border-2 border-dashed border-primary bg-primary/5" : ""}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {uploadAsset.isPending && (
            <div className="mb-4 rounded-md bg-blue-50 px-4 py-2 text-sm text-blue-700">
              Uploading...
            </div>
          )}

          {/* Folders */}
          {folders && folders.length > 0 && (
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {folders.map((folder: AssetFolder) => (
                <button
                  key={folder.id}
                  onClick={() => navigateToFolder(folder)}
                  className="flex flex-col items-center gap-2 rounded-lg border border-border p-4 transition-colors hover:bg-muted"
                >
                  <svg
                    className="h-10 w-10 text-yellow-500"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                  </svg>
                  <span className="text-xs font-medium truncate w-full text-center">
                    {folder.name}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Assets Grid */}
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground">
              Loading assets...
            </div>
          ) : assets.length === 0 && (!folders || folders.length === 0) ? (
            <div
              className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border py-16"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <svg
                className="mb-4 h-12 w-12 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              </svg>
              <p className="text-muted-foreground">
                Drag and drop files here, or click Upload
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {assets.map((asset: Asset) => (
                <button
                  key={asset.id}
                  onClick={() => setSelectedAsset(asset)}
                  className={`flex flex-col items-center gap-2 rounded-lg border p-3 transition-colors hover:bg-muted ${
                    selectedAsset?.id === asset.id
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  }`}
                >
                  {asset.mimeType.startsWith("image/") && asset.cdnUrl ? (
                    <div className="flex h-24 w-full items-center justify-center overflow-hidden rounded bg-muted">
                      <img
                        src={`${API_URL}${asset.cdnUrl}`}
                        alt={asset.altText || asset.originalName}
                        className="max-h-24 max-w-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="flex h-24 w-full items-center justify-center rounded bg-muted">
                      <FileIcon mimeType={asset.mimeType} />
                    </div>
                  )}
                  <p className="w-full truncate text-center text-xs font-medium">
                    {asset.originalName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(asset.sizeBytes)}
                  </p>
                </button>
              ))}
            </div>
          )}

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {meta.total} assets total
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {meta.page} of {meta.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPage((p) => Math.min(meta.totalPages, p + 1))
                  }
                  disabled={page >= meta.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selectedAsset && (
          <Card className="w-80 shrink-0">
            <CardHeader>
              <CardTitle className="text-base">Asset Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedAsset.mimeType.startsWith("image/") &&
              selectedAsset.cdnUrl ? (
                <div className="overflow-hidden rounded-md bg-muted">
                  <img
                    src={`${API_URL}${selectedAsset.cdnUrl}`}
                    alt={selectedAsset.altText || selectedAsset.originalName}
                    className="w-full object-contain"
                  />
                </div>
              ) : (
                <div className="flex h-32 items-center justify-center rounded-md bg-muted">
                  <FileIcon mimeType={selectedAsset.mimeType} />
                </div>
              )}

              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Name:</span>{" "}
                  {selectedAsset.originalName}
                </div>
                <div>
                  <span className="text-muted-foreground">Type:</span>{" "}
                  {selectedAsset.mimeType}
                </div>
                <div>
                  <span className="text-muted-foreground">Size:</span>{" "}
                  {formatFileSize(selectedAsset.sizeBytes)}
                </div>
                {selectedAsset.width && selectedAsset.height && (
                  <div>
                    <span className="text-muted-foreground">Dimensions:</span>{" "}
                    {selectedAsset.width} x {selectedAsset.height}
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Uploaded:</span>{" "}
                  {new Date(selectedAsset.createdAt).toLocaleDateString()}
                </div>
              </div>

              {/* Alt Text */}
              <div>
                <label className="text-sm font-medium">Alt Text</label>
                <Input
                  defaultValue={selectedAsset.altText ?? ""}
                  placeholder="Describe this image..."
                  className="mt-1"
                  onBlur={(e) => {
                    if (e.target.value !== (selectedAsset.altText ?? "")) {
                      updateAsset.mutate({
                        id: selectedAsset.id,
                        data: { altText: e.target.value },
                      });
                    }
                  }}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleCopyUrl(selectedAsset)}
                >
                  Copy URL
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDeleteAsset(selectedAsset.id)}
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
