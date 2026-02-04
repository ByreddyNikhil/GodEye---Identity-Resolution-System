import React, { useState, useEffect } from 'react';
import * as d3 from 'd3';

function App() {
  const [identities, setIdentities] = useState([]);

  useEffect(() => {
    // Fetch identity graph data from API
    fetch('/api/identities')
      .then(res => res.json())
      .then(setIdentities);
  }, []);

  useEffect(() => {
    if (identities.length > 0) {
      drawGraph();
    }
  }, [identities]);

  const drawGraph = () => {
    const svg = d3.select('#graph')
      .attr('width', 800)
      .attr('height', 600);

    // Simple force-directed graph concept
    const simulation = d3.forceSimulation(identities)
      .force('link', d3.forceLink().id(d => d.id))
      .force('charge', d3.forceManyBody())
      .force('center', d3.forceCenter(400, 300));

    const link = svg.append('g')
      .selectAll('line')
      .data(identities)
      .enter().append('line')
      .attr('stroke', '#999');

    const node = svg.append('g')
      .selectAll('circle')
      .data(identities)
      .enter().append('circle')
      .attr('r', 5)
      .attr('fill', '#69b3a2');

    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);
    });
  };

  return (
    <div className="App">
      <h1>Identity Resolution Dashboard</h1>
      <div>
        <label>Confidence Threshold: </label>
        <input type="range" min="0" max="1" step="0.1" />
      </div>
      <svg id="graph"></svg>
    </div>
  );
}

export default App;
