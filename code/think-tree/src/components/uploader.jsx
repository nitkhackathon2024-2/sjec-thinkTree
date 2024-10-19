"use client"
import React, { useEffect, useState } from 'react';

const FileUploadSection = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadStatus, setUploadStatus] = useState('');

  // Function to fetch the list of uploaded files
  const fetchUploadedFiles = async () => {
    try {
      const response = await fetch('http://localhost:8000/files'); // Example GET endpoint
      const result = await response.json();
      setUploadedFiles(result.files); // Assuming the response is { files: [] }
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  // Fetch the files when the component mounts
  useEffect(() => {
    fetchUploadedFiles();
  }, []);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleUpload = async () => {
    if (selectedFile) {
      const formData = new FormData();
      formData.append('file', selectedFile); // Append file to FormData

      try {
        const response = await fetch('http://localhost:8000/upload', { // Example POST endpoint
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          setUploadStatus('Upload successful!');
          setSelectedFile(null); // Reset the selected file
          fetchUploadedFiles(); // Refresh the list of files after upload
        } else {
          setUploadStatus('Upload failed. Try again.');
        }
      } catch (error) {
        console.error('Error uploading file:', error);
        setUploadStatus('Upload failed. Try again.');
      }
    } else {
      alert('Please select a file to upload.');
    }
  };

  return (
    <div style={styles.container}>
      {/* Search Bar */}
      <input
        type="text"
        placeholder="Search..."
        value={searchTerm}
        onChange={handleSearchChange}
        style={styles.searchBar}
      />

      {/* Uploaded Files List */}
      <div style={styles.fileList}>
        <h4 style={styles.fileListHeading}>Uploaded Files:</h4>
        {uploadedFiles.length > 0 ? (
          <ul>
            {uploadedFiles
              .filter((file) => file.name.toLowerCase().includes(searchTerm.toLowerCase()))
              .map((file) => (
                <li key={file.id} style={styles.fileListItem}>
                  {file.name}
                </li>
              ))}
          </ul>
        ) : (
          <p style={styles.noFilesText}>No files uploaded yet.</p>
        )}
      </div>

      {/* File Input */}
      <input
        type="file"
        onChange={handleFileChange}
        style={styles.fileInput}
      />

      {/* Upload Button */}
      <button onClick={handleUpload} style={styles.uploadButton}>
        Upload File
      </button>

      {/* Display Upload Status */}
      {uploadStatus && <p style={styles.uploadStatus}>{uploadStatus}</p>}
    </div>
  );
};

// CSS-in-JS styles
const styles = {
  container: {
    width: '50vw', // Half the screen width
    height: '100vh', // Full height of the screen
    backgroundColor: 'black', // Black background
    color: 'white', // White text color for contrast
    padding: '20px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start', // Top-align the content
    alignItems: 'flex-start', // Left-align the content
  },
  searchBar: {
    width: '100%',
    padding: '10px',
    marginBottom: '20px',
    backgroundColor: '#333', // Darker background for input
    border: '1px solid #555', // Lighter border for contrast
    color: 'white', // White text
    fontSize: '16px',
    borderRadius: '5px',
    outline: 'none', // No border highlight on focus
  },
  fileList: {
    width: '100%',
    marginBottom: '20px',
    maxHeight: '200px',
    overflowY: 'auto',
  },
  fileListHeading: {
    marginBottom: '10px',
    color: '#ccc',
  },
  fileListItem: {
    listStyleType: 'none',
    padding: '5px 0',
    borderBottom: '1px solid #555',
  },
  noFilesText: {
    color: '#ccc',
  },
  fileInput: {
    color: 'white', // File input text
    backgroundColor: '#333', // File input background
    padding: '10px 0', // Some padding for a better look
    marginBottom: '20px', // Space between file input and button
  },
  uploadButton: {
    padding: '10px 20px',
    backgroundColor: '#444', // Slightly lighter than the background
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    fontSize: '16px',
    borderRadius: '5px',
  },
  uploadStatus: {
    marginTop: '10px',
    color: '#ccc', // Subtle gray for status message
  },
};

export default FileUploadSection;
