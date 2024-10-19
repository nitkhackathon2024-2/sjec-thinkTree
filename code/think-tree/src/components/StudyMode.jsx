import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const StudyMode = ({ data }) => {
  const svgRef = useRef();
  const tooltipRef = useRef();
  const [visibleNodes, setVisibleNodes] = useState([]); // Start with no nodes
  const [clickedNode, setClickedNode] = useState(null);

  useEffect(() => {
    // Fetch initial nodes from FastAPI
    const fetchNodes = async () => {
      const response = await fetch('http://localhost:8000/nodes');
      const result = await response.json();

      if (result.nodes && result.nodes.length > 0) {
        // If nodes exist in JSON, set them as visible
        setVisibleNodes(result.nodes.map(node => node.id));
      } else {
        // If no nodes are present, set the first node and post it to the backend
        const firstNode = data.nodes[0]; // Assuming data is passed as prop
        await fetch('http://localhost:8000/nodes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(firstNode), // Post the first node
        });
        setVisibleNodes([firstNode]);
      }
    };

    fetchNodes();
  }, [data]);

  useEffect(() => {
    const svg = d3.select(svgRef.current)
      .attr('width', window.innerWidth / 2) // Set to half width
      .attr('height', window.innerHeight); // Match height to screen

    // Clear any previous elements
    svg.selectAll('*').remove();

    // Check if data is in the expected format
    if (!data.nodes || !data.links) {
      console.error('Data format error: Expected { nodes, links } structure');
      return;
    }

    // Get filtered nodes and links based on visibleNodes
    const filteredNodes = data.nodes.filter(node => visibleNodes.includes(node.id));
    const filteredLinks = data.links.filter(link =>
      visibleNodes.includes(link.source.id) && visibleNodes.includes(link.target.id));

    const simulation = d3.forceSimulation(filteredNodes)
      .force('link', d3.forceLink().distance(100).strength(1).links(filteredLinks))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(window.innerWidth / 4, window.innerHeight / 2));

    // Draw links
    const link = svg.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(filteredLinks)
      .enter().append('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6);

    // Draw nodes
    const node = svg.append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(filteredNodes)
      .enter().append('circle')
      .attr('r', 10)
      .attr('fill', '#69b3a2')
      .on('mouseover', (event, d) => {
        d3.select(tooltipRef.current)
          .style('opacity', 1)
          .html(`${d.text}<br><a href="${d.link}" target="_blank" style="display:none;">Know More</a>`)
          .style('left', `${event.pageX + 5}px`)
          .style('top', `${event.pageY - 28}px`);
      })
      .on('mouseout', () => {
        d3.select(tooltipRef.current).style('opacity', 0); // Hide tooltip
      })
      .on('click', async (event, d) => {
        // Show neighbors only if they were previously hidden
        const neighbors = data.links.filter(link => link.source.id === d.id || link.target.id === d.id)
          .map(link => (link.source.id === d.id ? link.target.id : link.source.id));

        // Update the visible nodes and set the clicked node
        setVisibleNodes(prev => {
          const newVisibleNodes = [...new Set([...prev, d.id, ...neighbors])];

          // Make POST request for each new visible node
          neighbors.forEach(async neighborId => {
            const neighborNode = data.nodes.find(node => node.id === neighborId);
            await fetch('http://localhost:8000/nodes', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(neighborNode),
            });
          });

          return newVisibleNodes;
        });
        setClickedNode(d);

        // Show tooltip with link after clicking the node
        d3.select(tooltipRef.current)
          .style('opacity', 1)
          .html(`${d.text}<br><a href="${d.link}" target="_blank">Know More</a>`)
          .style('left', `${event.pageX + 5}px`)
          .style('top', `${event.pageY - 28}px`);
      });

    // Add drag behavior to nodes
    node.call(d3.drag()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended));

    // Handle simulation tick
    simulation.on('tick', () => {
      node.attr('cx', d => d.x)
          .attr('cy', d => d.y);

      link.attr('x1', d => d.source.x)
          .attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x)
          .attr('y2', d => d.target.y);
    });

    // Hide tooltip when clicking outside
    const handleClickOutside = (event) => {
      if (!tooltipRef.current.contains(event.target) && !event.target.closest('circle')) {
        setClickedNode(null);
        d3.select(tooltipRef.current).style('opacity', 0); // Hide tooltip
      }
    };

    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('click', handleClickOutside); // Cleanup listener
      simulation.stop(); // Cleanup simulation
    };
  }, [data, visibleNodes]);

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

export default StudyMode;
