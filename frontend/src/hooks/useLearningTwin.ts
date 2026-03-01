import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";
import type { Concept, LearningTwinResponse, StudentState } from "../types";

type LearningTwinData = {
  concepts: Concept[];
  studentState: StudentState[];
  learningTwin: LearningTwinResponse;
};

export const useLearningTwin = () => {
  const [data, setData] = useState<LearningTwinData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [concepts, studentState, learningTwin] = await Promise.all([
        api.getConcepts(),
        api.getStudentState(),
        api.getLearningTwin()
      ]);

      setData({ concepts, studentState, learningTwin });
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    data,
    loading,
    error,
    refresh
  };
};
