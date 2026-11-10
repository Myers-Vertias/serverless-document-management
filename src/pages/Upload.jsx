import React, { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { documentService } from "../services/documentService";

const Upload = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Other");
  const [tagsInput, setTagsInput] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

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
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleFileSelection = (file) => {
    // Basic validation
    const allowedExtensions = ["pdf", "png", "jpg", "jpeg", "docx", "xlsx", "pptx", "txt"];
    const fileExtension = file.name.split(".").pop().toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
      setFeedback({
        type: "error",
        message: t("upload.invalidExtension", { extension: fileExtension, allowed: allowedExtensions.map(e => e.toUpperCase()).join(", ") })
      });
      setSelectedFile(null);
      return;
    }

    // Limit to 20MB for mock validation
    if (file.size > 20 * 1024 * 1024) {
      setFeedback({
        type: "error",
        message: t("upload.fileTooLarge")
      });
      setSelectedFile(null);
      return;
    }

    setFeedback({ type: "", message: "" });
    setSelectedFile(file);
  };

  const simulateProgress = () => {
    setUploadProgress(10);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prev + Math.floor(Math.random() * 20) + 5;
      });
    }, 200);
    return interval;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    setFeedback({ type: "", message: "" });
    const progressInterval = simulateProgress();

    try {
      // Calls documentService upload flow
      
      const processedTags = tagsInput.split(',')
        .map(t => t.trim().toLowerCase())
        .filter(t => t)
        .filter((t, index, self) => self.indexOf(t) === index);

      await documentService.uploadDocument(selectedFile, description, category, processedTags);

      
      clearInterval(progressInterval);
      setUploadProgress(100);
      setFeedback({
        type: "success",
        message: t("upload.uploadSuccessMsg")
      });

      // Clear input fields
      setSelectedFile(null);
      setDescription("");
      setCategory("Other");
      setTagsInput("");
      if (fileInputRef.current) fileInputRef.current.value = "";

      // Redirect after 1.5s
      setTimeout(() => {
        navigate("/documents");
      }, 1500);

    } catch (err) {
      clearInterval(progressInterval);
      setUploadProgress(0);
      setFeedback({
        type: "error",
        message: `${t(err.message) || t("upload.uploadFailedMsg")}${err.s3Details ? ` (${err.s3Details})` : ""}`
      });
    } finally {
      setUploading(false);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="upload-page">
      <div className="page-header">
        <h1>{t("upload.title")}</h1>
        <p className="subtitle">{t("upload.desc")}</p>
      </div>

      {feedback.message && (
        <div className={`alert alert-${feedback.type}`}>
          {feedback.message}
        </div>
      )}

      <div className="upload-grid">
        {/* Upload Form */}
        <div className="card upload-card">
          <form onSubmit={handleSubmit}>
            <div 
              className={`drag-drop-zone ${dragActive ? "drag-active" : ""} ${selectedFile ? "has-file" : ""}`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden-file-input"
                onChange={handleFileChange}
                disabled={uploading}
              />
              
              {!selectedFile ? (
                <div className="dropzone-content">
                  <div className="dropzone-icon-wrapper">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="dropzone-icon">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
                    </svg>
                  </div>
                  <h3>{t("upload.dragDrop")}</h3>
                  <p className="dropzone-hint">{t("upload.chooseFile")}</p>
                </div>
              ) : (
                <div className="dropzone-content file-selected-content">
                  <div className="file-preview-icon">
                    <span className={`badge badge-file-${selectedFile.name.split(".").pop().toLowerCase()}`}>
                      {selectedFile.name.split(".").pop().toUpperCase()}
                    </span>
                  </div>
                  <h3>{selectedFile.name}</h3>
                  <p className="file-size-hint">{t("detail.fileSize")}: {formatBytes(selectedFile.size)}</p>
                  <button 
                    type="button" 
                    className="btn btn-outline-sm btn-remove-file"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    disabled={uploading}
                  >
                    {t("upload.chooseAnotherFile")}
                  </button>
                </div>
              )}
            </div>

            <div className="form-group margin-top-md">
              <label htmlFor="category">{t("upload.category")}</label>
              <select
                id="category"
                className="form-control"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={uploading}
              >
                <option value="Other">{t("categories.other")}</option>
                <option value="Work">{t("categories.work")}</option>
                <option value="Finance">{t("categories.finance")}</option>
                <option value="HR">{t("categories.hr")}</option>
                <option value="Technical">{t("categories.technical")}</option>
                <option value="Meeting">{t("categories.meeting")}</option>
              </select>
            </div>

            <div className="form-group margin-top-md">
              <label htmlFor="tags">{t("upload.tags")}</label>
              <input
                type="text"
                id="tags"
                className="form-control"
                placeholder={t("upload.tagsPlaceholder")}
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                disabled={uploading}
              />
            </div>

            <div className="form-group margin-top-md">
              <label htmlFor="description">{t("upload.description")}</label>
              <textarea
                id="description"
                className="form-control"
                rows="3"
                placeholder={t("upload.descriptionPlaceholder")}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={uploading}
              ></textarea>
            </div>

            {uploading && (
              <div className="progress-container">
                <div className="progress-labels">
                  <span>{t("upload.uploading")}</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{ width: `${uploadProgress}%` }}></div>
                </div>
              </div>
            )}

            <div className="form-actions">
              <button 
                type="submit" 
                className="btn btn-primary btn-block" 
                disabled={!selectedFile || uploading}
              >
                {uploading ? t("upload.uploading") : t("upload.uploadBtn")}
              </button>
            </div>
          </form>
        </div>

        {/* Informative S3 Flow Explainer */}
        <div className="card info-card">
          
          
          <div className="s3-steps">
            <div className="s3-step">
              <div className="s3-step-header">
                <span className="s3-step-badge">1</span>
                <h4>{t("upload.step1Title")}</h4>
              </div>
              <p>{t("upload.step1Desc")}</p>
            </div>
            
            <div className="s3-step">
              <div className="s3-step-header">
                <span className="s3-step-badge">2</span>
                <h4>{t("upload.step2Title")}</h4>
              </div>
              <p>{t("upload.step2Desc")}</p>
            </div>

            <div className="s3-step">
              <div className="s3-step-header">
                <span className="s3-step-badge">3</span>
                <h4>{t("upload.step3Title")}</h4>
              </div>
              <p>{t("upload.step3Desc")}</p>
            </div>

            <div className="s3-step">
              <div className="s3-step-header">
                <span className="s3-step-badge">4</span>
                <h4>{t("upload.step4Title")}</h4>
              </div>
              <p>{t("upload.step4Desc")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upload;
