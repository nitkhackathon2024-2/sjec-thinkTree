"use client";
import React, { useState } from 'react';
import RevisionMode from './RevisionMode';
import StudyMode from './StudyMode';
import FileUploadSection from './uploader';

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

const MainLayout = ({ data }) => {
  return (
    <div style={styles.mainContainer}>
      {/* File Upload Section */}
      <div style={styles.leftSection}>
        <FileUploadSection />
      </div>

      {/* ForceGraph Section */}
      <div style={styles.rightSection}>
        <ForceGraph data={data} />
      </div>
    </div>
  );
};

export default MainLayout;

// CSS-in-JS styles
const styles = {
  mainContainer: {
    display: 'flex', // Use flexbox to align child components
    width: '100vw', // Full viewport width
    height: '100vh', // Full viewport height
  },
  leftSection: {
    width: '50%', // Left section takes up half the screen
    backgroundColor: '#111', // Dark background for the file upload section
    color: 'white',
    overflowY: 'auto', // Ensure scrolling if content overflows
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightSection: {
    width: '50%', // Right section takes up half the screen
    backgroundColor: '#fff', // Light background for the ForceGraph
    color: 'black',
    overflowY: 'auto',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
};
