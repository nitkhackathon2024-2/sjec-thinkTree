import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const RevisionMode = ({ data }) => {
  const svgRef = useRef();
  const tooltipRef = useRef();
  const [clickedNode, setClickedNode] = useState(null);

  useEffect(() => {
    // Clear any previous graph when component is mounted
    d3.select(svgRef.current).selectAll('*').remove();

    const width = (window.innerWidth) / 2; // Fixed width
    const height = window.innerHeight; // Match height to screen

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('style', 'max-width: 100%; height: auto;');

    // Create a force simulation
    const simulation = d3.forceSimulation(data.nodes)
      .force('link', d3.forceLink().distance(120).id(d => d.id))
      .force('charge', d3.forceManyBody().strength(-100))
      .force('center', d3.forceCenter(width / 2, height / 2));

    // Create links
    const link = svg.append('g')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(data.links)
      .enter()
      .append('line')
      .attr('stroke-width', d => Math.sqrt(d.value)); // Adjust stroke width based on value

    // Create nodes
    const node = svg.append('g')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .selectAll('circle')
      .data(data.nodes)
      .enter()
      .append('circle')
      .attr('r', 8)
      .attr('fill', 'steelblue')
      .on('mouseover', (event, d) => {
        d3.select(tooltipRef.current)
          .style('opacity', 1)
          .html(`${d.text}<br><a href="${d.link}" target="_blank">Know More</a>`)
          .style('left', `${event.pageX + 5}px`)
          .style('top', `${event.pageY - 28}px`);
      })
      .on('mouseout', () => {
        d3.select(tooltipRef.current).style('opacity', 0); // Hide tooltip
      })
      .on('click', (event, d) => {
        setClickedNode(d); // Set clicked node
      });

    // Add labels for nodes
    const labels = svg.append('g')
      .selectAll('text')
      .data(data.nodes)
      .enter()
      .append('text')
      .text(d => d.name)
      .attr('font-size', '10px')
      .attr('fill', '#000')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em');

    // Add drag behavior
    node.call(d3.drag()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended));

    // Update positions of nodes and links on each tick
    simulation
      .on('tick', () => {
        link
          .attr('x1', d => d.source.x)
          .attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x)
          .attr('y2', d => d.target.y);

        node
          .attr('cx', d => d.x)
          .attr('cy', d => d.y);

        labels
          .attr('x', d => d.x)
          .attr('y', d => d.y);
      });

    // Update the simulation with links
    simulation.force('link').links(data.links);

    return () => {
      simulation.stop();
    };
  }, [data]);

  // Drag event handlers
  function dragstarted(event) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
  }

  function dragged(event) {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
  }

  function dragended(event) {
    if (!event.active) simulation.alphaTarget(0);
    event.subject.fx = null;
    event.subject.fy = null;
  }

  return (
    <div style={{ position: 'relative', height: '100vh' }}>
      <svg ref={svgRef} style={{ position: 'absolute', top: 0, right: 0 }}></svg>
      <div
        ref={tooltipRef}
        style={{
          position: 'absolute',
          opacity: 0,
          background: 'white',
          border: '1px solid black',
          padding: '5px',
          pointerEvents: 'auto',
          borderRadius: '3px',
        }}
      ></div>
    </div>
  );
};

export default RevisionMode;
