/**
 * CDN File Operations Hook
 * React Query mutations for CDN file operations
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cdnAdminService } from "@/services/api/CDNAdminService";
import type { CDNDirectoryType } from "@/types/cdn";

export const useCDNFileOperations = () => {
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: ({
      files,
      directory,
    }: {
      files: File[];
      directory: CDNDirectoryType;
    }) => cdnAdminService.uploadFiles(files, directory),
    onSuccess: () => {
      // Invalidate and refetch files and directories
      queryClient.invalidateQueries({ queryKey: ["cdn", "files"] });
      queryClient.invalidateQueries({ queryKey: ["cdn", "directories"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (filePath: string) => cdnAdminService.deleteFile(filePath),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cdn", "files"] });
      queryClient.invalidateQueries({ queryKey: ["cdn", "directories"] });
    },
  });

  const renameMutation = useMutation({
    mutationFn: ({ oldPath, newName }: { oldPath: string; newName: string }) =>
      cdnAdminService.renameFile(oldPath, newName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cdn", "files"] });
    },
  });

  const bulkDownloadMutation = useMutation({
    mutationFn: (filePaths: string[]) =>
      cdnAdminService.bulkDownload(filePaths),
    onSuccess: (blob) => {
      const filename = `cdn-files-${new Date().toISOString().split("T")[0]}.zip`;
      cdnAdminService.triggerDownload(blob, filename);
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (filePaths: string[]) => cdnAdminService.bulkDelete(filePaths),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cdn", "files"] });
      queryClient.invalidateQueries({ queryKey: ["cdn", "directories"] });
    },
  });

  return {
    upload: uploadMutation,
    delete: deleteMutation,
    rename: renameMutation,
    bulkDownload: bulkDownloadMutation,
    bulkDelete: bulkDeleteMutation,
  };
};
