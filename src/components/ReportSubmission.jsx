import React, { useState } from 'react';
import Modal from './Modal';
import { AlertTriangle, FileText, Upload, Send, CheckCircle } from 'lucide-react';
import './ReportSubmission.css';

const ReportSubmission = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reportData, setReportData] = useState({
    type: '',
    priority: 'medium',
    subject: '',
    description: '',
    category: '',
    attachments: []
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const reportTypes = [
    { value: 'complaint', label: 'Complaint' },
    { value: 'maintenance', label: 'Maintenance Request' },
    { value: 'payment', label: 'Payment Issue' },
    { value: 'noise', label: 'Noise Complaint' },
    { value: 'safety', label: 'Safety Concern' },
    { value: 'other', label: 'Other' }
  ];

  const categories = [
    { value: 'property', label: 'Property Related' },
    { value: 'neighbor', label: 'Neighbor Issue' },
    { value: 'management', label: 'Management Issue' },
    { value: 'facility', label: 'Facility/Common Area' },
    { value: 'emergency', label: 'Emergency' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setReportData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setReportData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...files]
    }));
  };

  const removeAttachment = (index) => {
    setReportData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (reportData.type && reportData.subject && reportData.description) {
      console.log('Report submitted:', reportData);
      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        setIsModalOpen(false);
        setReportData({
          type: '',
          priority: 'medium',
          subject: '',
          description: '',
          category: '',
          attachments: []
        });
      }, 3000);
    }
  };

  return (
    <>
      <button 
        className="report-button"
        onClick={() => setIsModalOpen(true)}
      >
        <AlertTriangle size={20} />
        Submit Report
      </button>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="report-submission">
          {isSubmitted ? (
            <div className="submission-success">
              <CheckCircle size={48} color="#10b981" />
              <h3>Report Submitted Successfully!</h3>
              <p>Your report has been received and will be reviewed by our team. You will receive an update within 24 hours.</p>
            </div>
          ) : (
            <>
              <div className="report-header">
                <h2>
                  <FileText size={24} />
                  Submit Report or Complaint
                </h2>
                <p>Help us improve by reporting issues or concerns</p>
              </div>

              <form onSubmit={handleSubmit} className="report-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Report Type</label>
                    <select
                      name="type"
                      value={reportData.type}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select type</option>
                      {reportTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Priority Level</label>
                    <select
                      name="priority"
                      value={reportData.priority}
                      onChange={handleInputChange}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Category</label>
                  <select
                    name="category"
                    value={reportData.category}
                    onChange={handleInputChange}
                  >
                    <option value="">Select category</option>
                    {categories.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Subject</label>
                  <input
                    type="text"
                    name="subject"
                    value={reportData.subject}
                    onChange={handleInputChange}
                    placeholder="Brief description of the issue"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Detailed Description</label>
                  <textarea
                    name="description"
                    value={reportData.description}
                    onChange={handleInputChange}
                    placeholder="Please provide as much detail as possible..."
                    rows="4"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Attachments (Optional)</label>
                  <div className="file-upload">
                    <input
                      type="file"
                      id="file-upload"
                      multiple
                      onChange={handleFileUpload}
                      accept="image/*,.pdf,.doc,.docx"
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="file-upload" className="upload-label">
                      <Upload size={20} />
                      Choose Files
                    </label>
                    <span className="upload-hint">Images, PDFs, or documents (max 10MB each)</span>
                  </div>

                  {reportData.attachments.length > 0 && (
                    <div className="attachments-list">
                      {reportData.attachments.map((file, index) => (
                        <div key={index} className="attachment-item">
                          <span>{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeAttachment(index)}
                            className="remove-attachment"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="cancel-button"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="submit-button">
                    <Send size={16} />
                    Submit Report
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </Modal>
    </>
  );
};

export default ReportSubmission;
