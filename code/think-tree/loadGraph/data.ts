export interface Node {
    id: string;
    group: number;
  }
  
  export interface Link {
    source: string;
    target: string;
    value: number;
  }
  
  export interface GraphData {
    nodes: Node[];
    links: Link[];
  }
  
  export const data: GraphData = {
    nodes: [
      { id: "A", group: 1 },
      { id: "B", group: 1 },
      { id: "C", group: 2 },
      { id: "D", group: 2 },
      { id: "E", group: 3 },
      { id: "F", group: 3 }
    ],
    links: [
      { source: "A", target: "B", value: 1 },
      { source: "B", target: "C", value: 1 },
      { source: "C", target: "D", value: 1 },
      { source: "D", target: "E", value: 1 },
      { source: "E", target: "F", value: 1 },
      { source: "A", target: "F", value: 2 }
    ]
  };
  