import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { edgeFunctions } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type IndexingAction = "URL_UPDATED" | "URL_DELETED";

interface IndexingResult {
  url: string;
  success: boolean;
  status?: number;
  error?: string;
}

interface IndexingResponse {
  success: boolean;
  submitted: number;
  succeeded: number;
  failed: number;
  results: IndexingResult[];
}

interface SubmitUrlsParams {
  urls: string[];
  action?: IndexingAction;
}

export function useGoogleIndexing() {
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async ({ urls, action = "URL_UPDATED" }: SubmitUrlsParams) => {
      const { data, error } = await edgeFunctions.invoke<IndexingResponse>(
        "google-indexing",
        { body: { urls, action } }
      );

      if (error) throw error;
      if (!data) throw new Error("No response from indexing API");
      return data;
    },
    onSuccess: (data) => {
      if (data.failed > 0) {
        toast({
          title: "Indexing partially completed",
          description: `${data.succeeded} of ${data.submitted} URLs submitted. ${data.failed} failed.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "URLs submitted for indexing",
          description: `${data.succeeded} URL(s) submitted to Google for indexing.`,
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Indexing failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to submit URLs for indexing.",
        variant: "destructive",
      });
    },
  });

  const submitUrls = (urls: string[], action?: IndexingAction) => {
    return mutation.mutateAsync({ urls, action });
  };

  const notifyUrlUpdated = (url: string) => {
    return submitUrls([url], "URL_UPDATED");
  };

  const notifyUrlDeleted = (url: string) => {
    return submitUrls([url], "URL_DELETED");
  };

  return {
    submitUrls,
    notifyUrlUpdated,
    notifyUrlDeleted,
    isSubmitting: mutation.isPending,
    lastResult: mutation.data ?? null,
    error: mutation.error,
  };
}
