/**
 * CDN Files Hook
 * React Query hook for fetching CDN files
 */

import { useQuery } from "@tanstack/react-query";
import { cdnAdminService } from "@/services/api/CDNAdminService";

export const useCDNFiles = () => {
  return useQuery({
    queryKey: ["cdn", "files"],
    queryFn: () => cdnAdminService.getFiles(),
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
  });
};

export const useCDNDirectories = () => {
  return useQuery({
    queryKey: ["cdn", "directories"],
    queryFn: () => cdnAdminService.getDirectories(),
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
  });
};
