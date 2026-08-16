import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  fetchDisease,
  fetchSymptoms,
  predict,
  searchDiseases,
  type NormalizedPrediction,
} from "@/lib/api";
import { setPredictionResult } from "@/lib/prediction-store";

export function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function useSymptoms(search: string) {
  const debounced = useDebounced(search, 300);
  return useQuery({
    queryKey: ["symptoms", debounced],
    queryFn: () => fetchSymptoms(debounced || undefined),
    retry: 0,
    staleTime: 60_000,
  });
}

export function usePrediction(onSuccess?: (result: NormalizedPrediction) => void) {
  return useMutation({
    mutationFn: (symptoms: string[]) => predict(symptoms),
    onSuccess: (data) => {
      setPredictionResult(data);
      onSuccess?.(data);
    },
  });
}

export function useDiseaseSearch(search: string) {
  const debounced = useDebounced(search, 300);
  return useQuery({
    queryKey: ["diseases", debounced],
    queryFn: () => searchDiseases(debounced),
    enabled: debounced.trim().length > 0,
    retry: 0,
    staleTime: 60_000,
  });
}

export function useDisease(disease: string) {
  return useQuery({
    queryKey: ["disease", disease],
    queryFn: () => fetchDisease(disease),
    enabled: Boolean(disease),
    retry: 0,
    staleTime: 300_000,
  });
}
