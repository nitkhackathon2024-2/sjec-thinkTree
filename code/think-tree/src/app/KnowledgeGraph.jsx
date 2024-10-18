"use client"

import { useEffect } from "react";
import { loadGraph } from "../../loadGraph/loadGraph";

const KnowledgeGraph = () => {
  useEffect(() => {
    loadGraph();
  }, []);

  return (
    <svg id="container"></svg>
  )
}

export default KnowledgeGraph
