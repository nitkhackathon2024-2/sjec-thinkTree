import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface Node extends d3.SimulationNodeDatum {
  id: string;
  group: number;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: string | Node;
  target: string | Node;
  value: number;
}

interface Data {
  nodes: Node[];
  links: Link[];
}

interface ForceDirectedGraphProps {
  data: Data;
}

const ForceDirectedGraph: React.FC<ForceDirectedGraphProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    // Specify the dimensions of the chart.
    const width = 928;
    const height = 680;

    // Specify the color scale.
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    // Create copies of links and nodes.
    const links = data.links.map((d) => ({ ...d }));
    const nodes = data.nodes.map((d) => ({ ...d }));

    // Create a simulation with several forces.
    const simulation = d3.forceSimulation<Node>()
      .force("link", d3.forceLink<Node, Link>().id((d) => d.id))
      .force("charge", d3.forceManyBody())
      .force("x", d3.forceX())
      .force("y", d3.forceY());

    // Create the SVG container.
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [-width / 2, -height / 2, width, height])
      .attr("style", "max-width: 100%; height: auto;");

    // Add a line for each link.
    const link = svg.append("g")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", (d) => Math.sqrt(d.value));

    // Add a group for nodes.
    const nodeGroup = svg.append("g")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .selectAll("g")
      .data(nodes)
      .join("g");

    // Add circles for nodes.
    const node = nodeGroup.append("circle")
      .attr("r", 5)
      .attr("fill", (d) => color(d.group.toString()));

    // Add titles for node hover.
    node.append("title").text((d) => d.id);

    // Add labels for nodes.
    nodeGroup.append("text")
      .text((d) => d.id)
      .attr('x', 6)
      .attr('y', 3)
      .attr('fill', (d) => color(d.group.toString()));

    // Add a drag behavior.
    node.call(d3.drag<SVGGElement, Node>()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended));

    // Set the position attributes of links and nodes each time the simulation ticks.
    simulation.nodes(nodes);
    simulation.force("link").links(links);

    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as Node).x)
        .attr("y1", (d) => (d.source as Node).y)
        .attr("x2", (d) => (d.target as Node).x)
        .attr("y2", (d) => (d.target as Node).y);

      nodeGroup.attr("transform", (d) => `translate(${d.x}, ${d.y})`);
    });

    // Reheat the simulation when drag starts, and fix the subject position.
    function dragstarted(event: d3.D3DragEvent<SVGGElement, Node, unknown>) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    // Update the subject (dragged node) position during drag.
    function dragged(event: d3.D3DragEvent<SVGGElement, Node, unknown>) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    // Restore the target alpha so the simulation cools after dragging ends.
    function dragended(event: d3.D3DragEvent<SVGGElement, Node, unknown>) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    // Clean up the simulation when the component unmounts.
    return () => {
      simulation.stop();
    };
  }, [data]);

  return <svg ref={svgRef} />;
};

export default ForceDirectedGraph;
