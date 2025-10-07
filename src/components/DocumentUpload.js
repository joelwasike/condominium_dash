import React, { useState, useRef } from 'react';
import { FileText, Upload, X, CheckCircle } from 'lucide-react';
import './DocumentUpload.css';

const DocumentUpload = ({ userRole, onUpload, onClose }) => {
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFiles = (newFiles) => {
    const fileArray = Array.from(newFiles);
    const validFiles = fileArray.filter(file => {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      return validTypes.includes(file.type);
    });
    
    setFiles(prev => [...prev, ...validFiles]);
  };

  const handleFileInput = (e) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    
    setUploading(true);
    
    // Simulate upload process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Call the upload handler
    if (onUpload) {
      onUpload(files, userRole);
    }
    
    setUploading(false);
    setFiles([]);
    if (onClose) onClose();
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="document-upload">
      <div className="upload-header">
        <h4>Upload KYC Documents</h4>
        <p>Upload your identity verification documents</p>
      </div>

      <div
        className={`upload-area ${dragActive ? 'drag-active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileInput}
          style={{ display: 'none' }}
        />
        <Upload className="upload-icon" size={48} />
        <h5>Drag & drop files here</h5>
        <p>or click to browse</p>
        <p className="upload-hint">Supported formats: PDF, JPG, PNG (Max 10MB each)</p>
      </div>

      {files.length > 0 && (
        <div className="file-list">
          <h5>Selected Files ({files.length})</h5>
          {files.map((file, index) => (
            <div key={index} className="file-item">
              <div className="file-info">
                <FileText className="file-icon" size={20} />
                <div className="file-details">
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">{formatFileSize(file.size)}</span>
                </div>
              </div>
              <button
                className="remove-file"
                onClick={() => removeFile(index)}
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="upload-actions">
        <button
          className="btn-secondary"
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          className="btn-primary"
          onClick={handleUpload}
          disabled={files.length === 0 || uploading}
        >
          {uploading ? (
            <>
              <div className="spinner"></div>
              Uploading...
            </>
          ) : (
            <>
              <Upload size={16} />
              Upload {files.length} file{files.length !== 1 ? 's' : ''}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default DocumentUpload;
