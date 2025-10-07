import React, { useState, useRef } from 'react';
import { FileText, Upload, X, CheckCircle, Calendar, User } from 'lucide-react';
import './ContractUpload.css';

const ContractUpload = ({ userRole, onUpload, onClose }) => {
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [contractDetails, setContractDetails] = useState({
    contractType: '',
    startDate: '',
    endDate: '',
    propertyAddress: '',
    monthlyRent: '',
    deposit: '',
    landlordName: '',
    tenantName: ''
  });
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
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setContractDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    
    setUploading(true);
    
    // Simulate upload process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Call the upload handler
    if (onUpload) {
      onUpload(files, contractDetails, userRole);
    }
    
    setUploading(false);
    setFiles([]);
    setContractDetails({
      contractType: '',
      startDate: '',
      endDate: '',
      propertyAddress: '',
      monthlyRent: '',
      deposit: '',
      landlordName: '',
      tenantName: ''
    });
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
    <div className="contract-upload">
      <div className="upload-header">
        <h4>Upload Essential Contract</h4>
        <p>Upload your lease agreement and provide contract details</p>
      </div>

      <div className="contract-form">
        <div className="form-section">
          <h5>Contract Information</h5>
          <div className="form-row">
            <div className="form-group">
              <label>Contract Type</label>
              <select
                name="contractType"
                value={contractDetails.contractType}
                onChange={handleInputChange}
                required
              >
                <option value="">Select contract type</option>
                <option value="lease">Lease Agreement</option>
                <option value="rental">Rental Agreement</option>
                <option value="sublease">Sublease Agreement</option>
              </select>
            </div>
            <div className="form-group">
              <label>Property Address</label>
              <input
                type="text"
                name="propertyAddress"
                value={contractDetails.propertyAddress}
                onChange={handleInputChange}
                placeholder="Enter property address"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Start Date</label>
              <input
                type="date"
                name="startDate"
                value={contractDetails.startDate}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>End Date</label>
              <input
                type="date"
                name="endDate"
                value={contractDetails.endDate}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Monthly Rent</label>
              <input
                type="number"
                name="monthlyRent"
                value={contractDetails.monthlyRent}
                onChange={handleInputChange}
                placeholder="Enter monthly rent amount"
                required
              />
            </div>
            <div className="form-group">
              <label>Security Deposit</label>
              <input
                type="number"
                name="deposit"
                value={contractDetails.deposit}
                onChange={handleInputChange}
                placeholder="Enter deposit amount"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Landlord Name</label>
              <input
                type="text"
                name="landlordName"
                value={contractDetails.landlordName}
                onChange={handleInputChange}
                placeholder="Enter landlord name"
                required
              />
            </div>
            <div className="form-group">
              <label>Tenant Name</label>
              <input
                type="text"
                name="tenantName"
                value={contractDetails.tenantName}
                onChange={handleInputChange}
                placeholder="Enter tenant name"
                required
              />
            </div>
          </div>
        </div>

        <div className="upload-section">
          <h5>Upload Contract Document</h5>
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
              accept=".pdf,.doc,.docx"
              onChange={handleFileInput}
              style={{ display: 'none' }}
            />
            <Upload className="upload-icon" size={48} />
            <h5>Drag & drop contract files here</h5>
            <p>or click to browse</p>
            <p className="upload-hint">Supported formats: PDF, DOC, DOCX (Max 10MB each)</p>
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
        </div>
      </div>

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
          disabled={files.length === 0 || uploading || !contractDetails.contractType}
        >
          {uploading ? (
            <>
              <div className="spinner"></div>
              Uploading...
            </>
          ) : (
            <>
              <Upload size={16} />
              Upload Contract
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ContractUpload;
