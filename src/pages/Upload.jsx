import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { documentService } from "../services/documentService";

const Upload = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [description, setDescription] = useState("");
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
        message: `Định dạng tệp .${fileExtension} không được hỗ trợ! Hệ thống chỉ hỗ trợ các tệp: ${allowedExtensions.map(e => e.toUpperCase()).join(", ")}.`
      });
      setSelectedFile(null);
      return;
    }

    // Limit to 20MB for mock validation
    if (file.size > 20 * 1024 * 1024) {
      setFeedback({
        type: "error",
        message: "Kích thước tệp vượt quá giới hạn cho phép (Tối đa 20MB)!"
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
      await documentService.uploadDocument(selectedFile, description);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      setFeedback({
        type: "success",
        message: "Chúc mừng! Tài liệu đã được tải lên trực tiếp S3 và lưu thông tin vào DynamoDB thành công."
      });

      // Clear input fields
      setSelectedFile(null);
      setDescription("");
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
        message: err.message || "Tải lên tệp thất bại! Vui lòng thử lại."
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
        <h1>Tải tài liệu mới lên đám mây</h1>
        <p className="subtitle">Lưu trữ tệp tin an toàn trên S3. Thông tin tệp sẽ được ghi vào cơ sở dữ liệu DynamoDB.</p>
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
                  <h3>Kéo thả tệp tin vào đây hoặc nhấp để chọn</h3>
                  <p className="dropzone-hint">Hỗ trợ các tệp PDF, Word, Excel, PowerPoint, Ảnh (Tối đa 20MB)</p>
                </div>
              ) : (
                <div className="dropzone-content file-selected-content">
                  <div className="file-preview-icon">
                    <span className={`badge badge-file-${selectedFile.name.split(".").pop().toLowerCase()}`}>
                      {selectedFile.name.split(".").pop().toUpperCase()}
                    </span>
                  </div>
                  <h3>{selectedFile.name}</h3>
                  <p className="file-size-hint">Kích thước: {formatBytes(selectedFile.size)}</p>
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
                    Chọn tệp khác
                  </button>
                </div>
              )}
            </div>

            <div className="form-group margin-top-lg">
              <label htmlFor="description">Mô tả tài liệu (Không bắt buộc)</label>
              <textarea
                id="description"
                className="form-control"
                rows="3"
                placeholder="Nhập mô tả ngắn gọn về tài liệu này (sẽ lưu trữ dưới dạng metadata)..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={uploading}
              ></textarea>
            </div>

            {uploading && (
              <div className="progress-container">
                <div className="progress-labels">
                  <span>Đang tải lên AWS S3...</span>
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
                {uploading ? "Đang xử lý tải lên..." : "Bắt đầu tải lên S3"}
              </button>
            </div>
          </form>
        </div>

        {/* Informative S3 Flow Explainer */}
        <div className="card info-card">
          <h3>Quy trình tải lên Serverless S3</h3>
          <p className="intro">Kiến trúc Cloud trong các giai đoạn tiếp theo sẽ hoạt động như thế nào?</p>
          <div className="s3-steps">
            <div className="s3-step">
              <div className="s3-step-header">
                <span className="s3-step-badge">1</span>
                <h4>Lấy Presigned URL</h4>
              </div>
              <p>Trình duyệt gửi yêu cầu REST API POST đến API Gateway để xin quyền tải lên S3.</p>
            </div>
            
            <div className="s3-step">
              <div className="s3-step-header">
                <span className="s3-step-badge">2</span>
                <h4>Sinh URL bảo mật (Lambda)</h4>
              </div>
              <p>Lambda function xử lý yêu cầu, tạo ra một S3 Presigned URL bảo mật (có thời hạn ngắn).</p>
            </div>

            <div className="s3-step">
              <div className="s3-step-header">
                <span className="s3-step-badge">3</span>
                <h4>Tải lên S3 Trực tiếp</h4>
              </div>
              <p>Trình duyệt nhận được URL và thực hiện upload file trực tiếp (HTTP PUT) lên AWS S3. Cách tiếp cận này giúp Lambda không cần gánh dung lượng tệp lớn, tăng tối đa hiệu suất.</p>
            </div>

            <div className="s3-step">
              <div className="s3-step-header">
                <span className="s3-step-badge">4</span>
                <h4>Trigger cập nhật Metadata</h4>
              </div>
              <p>Khi tải lên S3 thành công, Lambda thứ 2 sẽ tự động kích hoạt thông qua S3 Event để phân tích tài liệu và ghi nhận siêu dữ liệu tệp vào bảng DynamoDB.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upload;
