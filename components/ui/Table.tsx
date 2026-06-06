"use client";
import React from "react";

interface Column<T> {
  key: string;
  header: React.ReactNode;
  render: (row: T, index: number) => React.ReactNode;
  align?: "left" | "center" | "right";
  width?: number | string;
  mono?: boolean;
  hint?: boolean;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  emptyMessage?: string;
  loading?: boolean;
}

export function Table<T>({ columns, data, keyExtractor, emptyMessage, loading }: TableProps<T>) {
  if (loading) {
    return (
      <div className="vl-table-wrap">
        <table className="vl-table" style={{ width: "100%" }}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} style={{ width: col.width, textAlign: col.align || "left" }}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                {columns.map((col) => (
                  <td key={col.key}>
                    <div className="vl-skeleton" style={{ height: 16, width: col.width ? "60%" : "80%" }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="vl-empty">
        <p className="vl-empty-title">{emptyMessage || "暂无数据"}</p>
      </div>
    );
  }

  return (
    <div className="vl-table-wrap">
      <table className="vl-table" style={{ width: "100%" }}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={{ width: col.width, textAlign: col.align || "left" }}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={keyExtractor(row)}>
              {columns.map((col) => {
                const classes = [
                  col.mono ? "vl-td-mono" : "",
                  col.hint ? "vl-td-hint" : "",
                ].filter(Boolean).join(" ");
                return (
                  <td key={col.key} className={classes || undefined} style={{ textAlign: col.align || "left" }}>
                    {col.render(row, i)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
