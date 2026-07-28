import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DEFAULT_DEPARTMENT } from "../lib/constants";
import { useFilterStore } from "./filterStore";

export function useUrlSync() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { search, deptFilter, aPlusFullFilter, recentOnly, noGradeFilter, liberalArtsOnly, sortBy, sortDir } = useFilterStore();

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (deptFilter !== DEFAULT_DEPARTMENT) params.set("dept", deptFilter);
    if (aPlusFullFilter !== "exclude") params.set("aplus", aPlusFullFilter);
    if (recentOnly !== "on") params.set("recent", recentOnly);
    if (noGradeFilter !== "exclude") params.set("nograde", noGradeFilter);
    if (liberalArtsOnly === "on") params.set("liberal", "on");
    if (sortBy !== "A+") params.set("sort", sortBy);
    if (sortDir !== "desc") params.set("dir", sortDir);
    const qs = params.toString();
    if (qs !== searchParams.toString()) {
      router.replace(qs ? `?${qs}` : "/", { scroll: false });
    }
  }, [search, deptFilter, aPlusFullFilter, recentOnly, noGradeFilter, liberalArtsOnly, sortBy, sortDir, router, searchParams]);
}
