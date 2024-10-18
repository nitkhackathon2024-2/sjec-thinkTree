import {
  select,
  forceSimulation,
  forceManyBody,
  forceLink,
  forceCenter,
  drag,
  zoom,
} from "d3";

const colors = [
  ["#9D4452", "#E6A6B0", "#BE6B78", "#812836", "#5B0D1A"],
  ["#A76C48", "#F4CAAF", "#C99372", "#884E2A", "#602E0E"],
  ["#2E6B5E", "#719D93", "#498175", "#1B584A", "#093E32"],
  ["#538E3D", "#A6D096", "#75AC61", "#3A7424", "#1F520C"],
];

const MAIN_NODE_SIZE = 40;
const CHILD_NODE_SIZE = 15;
const DEFAULT_DISTANCE = 90;
const MAIN_NODE_DISTANCE = 90;
const MANY_BODY_STRENGTH = -180;

export let nodes = [];
export let links = [];

// Load the new graph data
const data = {
  nodes: [
    { id: "Chemistry", group: "subject" },
    { id: "Physics", group: "subject" },
    { id: "Atoms", group: "topic", parent: "Chemistry" },
    { id: "Molecules", group: "topic", parent: "Chemistry" },
    { id: "Quantum Mechanics", group: "topic", parent: "Physics" },
    { id: "Thermodynamics", group: "topic", parent: "Physics" },
    { id: "Protons", group: "subtopic", parent: "Atoms" },
    { id: "Electrons", group: "subtopic", parent: "Atoms" },
    { id: "Entropy", group: "subtopic", parent: "Thermodynamics" },
    { id: "Energy Levels", group: "subtopic", parent: "Quantum Mechanics" },
  ],
  links: [
    { source: "Chemistry", target: "Atoms" },
    { source: "Chemistry", target: "Molecules" },
    { source: "Physics", target: "Quantum Mechanics" },
    { source: "Physics", target: "Thermodynamics" },
    { source: "Atoms", target: "Protons" },
    { source: "Atoms", target: "Electrons" },
    { source: "Quantum Mechanics", target: "Energy Levels" },
    { source: "Thermodynamics", target: "Entropy" },
  ],
};

export const loadGraph = () => {
  const svg = select("#container");
  const width = +svg.attr("width");
  const height = +svg.attr("height");
  const centerX = width / 2;
  const centerY = height / 2;

  // Map each node to a color based on its group
  nodes = data.nodes.map((node) => {
    let color;
    if (node.group === "subject") color = colors[0][0];
    else if (node.group === "topic") color = colors[1][0];
    else if (node.group === "subtopic") color = colors[2][0];
    return { ...node, size: MAIN_NODE_SIZE, color: color || "gray", showChildren: true };
  });

  // Modify sizes for children nodes
  nodes.forEach((node) => {
    if (node.group === "topic") node.size = CHILD_NODE_SIZE;
    if (node.group === "subtopic") node.size = CHILD_NODE_SIZE;
  });

  // Create links from data
  links = data.links.map(link => ({
    source: link.source,
    target: link.target,
    distance: DEFAULT_DISTANCE,
    color: "black",
  }));

  const g = svg.append("g");

  let simulation = forceSimulation(nodes)
    .force("charge", forceManyBody().strength(MANY_BODY_STRENGTH))
    .force(
      "link",
      forceLink(links)
        .id(function (d) {
          return d.id;
        })
        .distance((link) => link.distance)
    )
    .force("center", forceCenter(centerX, centerY));

  let dragInteraction = drag().on("drag", (event, node) => {
    node.fx = event.x;
    node.fy = event.y;
    simulation.alpha(1);
    simulation.restart();
  });

  svg.call(
    zoom().on("zoom", (event) => {
      g.attr("transform", event.transform);
    })
  );

  let lines = g
    .selectAll("line")
    .data(links, (link) => link.source + "-" + link.target)
    .enter()
    .append("line")
    .attr("stroke", (link) => link.color || "black");

  let circles = g
    .selectAll("circle")
    .data(nodes, (node) => node.id)
    .enter()
    .append("circle")
    .attr("fill", (node) => node.color || "gray")
    .attr("r", (node) => node.size)
    .style("cursor", "pointer")
    .call(dragInteraction);

  circles.on("mouseover", (event, node) => {
    const tooltip = select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("z-index", "10")
      .style("background-color", "white")
      .style("padding", "10px")
      .style("border", "1px solid #ccc")
      .style("border-radius", "5px")
      .style("font-size", "14px")
      .style("visibility", "visible")
      .html(`Node: ${node.id}`);

    tooltip
      .style("top", `${event.pageY}px`)
      .style("left", `${event.pageX + 10}px`);
  })
  .on("mouseout", () => {
    select(".tooltip").remove();
  });

  circles.on("click", (event, node) => {
    showHideChildren(node);
  });

  let text = g
    .selectAll("text")
    .data(nodes, (node) => node.id)
    .enter()
    .append("text")
    .attr("text-anchor", "middle")
    .attr("alignment-baseline", "middle")
    .style("pointer-events", "none")
    .style("font-size", "14px")
    .style("font-weight", "bold")
    .text((node) => node.id);

  simulation.on("tick", () => {
    circles.attr("cx", (node) => node.x).attr("cy", (node) => node.y);
    text.attr("x", (node) => node.x).attr("y", (node) => node.y);

    lines
      .attr("x1", (link) => link.source.x)
      .attr("y1", (link) => link.source.y)
      .attr("x2", (link) => link.target.x)
      .attr("y2", (link) => link.target.y);
  });

  function showHideChildren(node) {
    // Since you have a flat structure in `data`, implement child toggling logic if needed
    console.log("Show/Hide children for node:", node);
    // Implement logic to show/hide child nodes if you have a hierarchy
  }
};
