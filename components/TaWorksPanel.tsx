"use client";
import { useMemo } from "react";
import WorksTable from "./WorksTable";
import { Skeleton } from "./Ui";
import { useWorks } from "@/lib/data";
import { WORK_COLUMNS } from "@/lib/config";
import type { RuleBook } from "@/lib/rules";

/** A single TA's own works, loaded on demand when their card is expanded —
 *  keeps the TA list itself light while still giving each TA a real,
 *  sortable, exportable view of exactly what they need to estimate. */
export default function TaWorksPanel({ taluka, ta, book, stages }: {
  taluka: string; ta: string | null; book: RuleBook; stages: Record<string, string>;
}) {
  const { works, loading } = useWorks([taluka]);
  const mine = useMemo(() => (works ?? []).filter((w) => w.ta === ta), [works, ta]);

  if (loading) return <Skeleton rows={4} />;
  if (mine.length === 0) return <p className="py-4 text-center text-[12.5px]" style={{ color: "var(--ink-3)" }}>No works found.</p>;

  return <WorksTable works={mine} columns={WORK_COLUMNS} stages={stages} book={book} />;
}
