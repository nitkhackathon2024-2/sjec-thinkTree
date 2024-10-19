"use client"
import React, { useState } from 'react';
import RevisionMode from './RevisionMode';
import StudyMode from './StudyMode';

const ForceGraph = ({ data }) => {
  const [mode, setMode] = useState('Revision'); // Set initial mode to Revision

  return (
    <div>
      {/* Dropdown */}
      <div style={{ position: 'absolute', top: 10, right: 10 }}>
        <select value={mode} onChange={(e) => setMode(e.target.value)}>
          <option value="Revision">Mode: Revision</option>
          <option value="Study">Mode: Study</option>
        </select>
      </div>

      {/* Conditionally render the appropriate mode component */}
      {mode === 'Revision' ? (
        <RevisionMode data={data} />
      ) : (
        <StudyMode data={data} />
      )}
    </div>
  );
};

export default ForceGraph;
