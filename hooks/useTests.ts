"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTests,
  createTest,
  runTest,
  stopTest,
  restartTest,
  deleteTest,
} from "@/lib/api";
import type { CreateTestRequest } from "@/lib/types";
import { toast } from "sonner";

export function useTests(projectId: string) {
  return useQuery({
    queryKey: ["tests", projectId],
    queryFn: () => getTests(projectId),
    enabled: !!projectId,
  });
}

export function useCreateTest(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTestRequest) => createTest(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tests", projectId] });
      toast.success("Test created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create test");
    },
  });
}

export function useRunTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: runTest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tests"] });
      toast.success("Test started");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to start test");
    },
  });
}

export function useStopTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: stopTest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tests"] });
      toast.success("Test stopped");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to stop test");
    },
  });
}

export function useRestartTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: restartTest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tests"] });
      toast.success("Test restarted");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to restart test");
    },
  });
}

export function useDeleteTest(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tests", projectId] });
      toast.success("Test deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete test");
    },
  });
}
