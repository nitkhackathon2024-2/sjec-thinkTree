"use client";

import { useEffect } from "react";
import { loadGraph } from "../../loadGraph/loadGraph";
import Documents from "./Documents";

export default function Home() {
  useEffect(() => {
    loadGraph();
  }, []);

  return (
    <>
      <div className="w-1/2 flex flex-col border-r border-gray-700 py-4 space-y-4">
        <Documents />
      </div>
      <svg id="container"></svg>
    </>
  );
}
