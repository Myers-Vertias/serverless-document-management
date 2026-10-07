import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { documentService } from "../services/documentService";
import { authService } from "../services/authService";

const Trash = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const currentUser = authService.getCurrentUser();

  const loadDocuments = async () => {
    try {
      const data = await documentService.getTrashedDocuments();
      setDocuments(data);
    } catch (err) {
      setError("Không thể tải danh sách thùng rác!");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleRestore = async (documentId) => {
    try {
      await documentService.restoreFromTrash(documentId);
      setDocuments((prevDocs) => prevDocs.filter((d) => d.documentId !== documentId));
      showFeedback("success", "Đã khôi phục tài liệu thành công!");
    } catch (err) {
      console.error(err);
      showFeedback("error", err.message || "Lỗi khi khôi phục tài liệu!");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setActionLoading(true);
    setFeedback({ type: "", message: "" });

    try {
      await documentService.permanentlyDelete(deleteId);
      setDeleteId(null);
      loadDocuments();
      showFeedback("success", "Đã xóa vĩnh viễn tài liệu!");
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.message || "Xóa thất bại! Vui lòng thử lại."
      });
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: "", message: "" }), 5000);
  };

  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="loading-wrapper">
        <div className="spinner"></div>
        <p>Đang tải danh sách thùng rác...</p>
      </div>
    );
  }

  return (
    <div className="documents-page">
      <div className="page-header">
        <h1>Thùng rác</h1>
        <p className="subtitle">Các tài liệu đã bị xóa. Bạn có thể khôi phục hoặc xóa vĩnh viễn chúng.</p>
      </div>

      {error ? (
        <div className="error-container">
          <p>{error}</p>
          <button className="btn btn-primary" onClick={loadDocuments}>Thử lại</button>
        </div>
      ) : (
        <>
          {feedback.message && (
            <div className={`alert alert-${feedback.type}`}>
              {feedback.message}
            </div>
          )}

          {documents.length === 0 ? (
            <div className="empty-documents-state">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="empty-icon">
                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
              <h3>Thùng rác trống</h3>
              <p>Không có tài liệu nào trong thùng rác.</p>
            </div>
          ) : (
            <div className="table-card">
              <div className="responsive-table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Tên tệp</th>
                      <th>Loại</th>
                      <th>Kích thước</th>
                      <th>Ngày xóa</th>
                      <th className="text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((doc) => (
                      <tr key={doc.documentId}>
                        <td>
                          <div className="file-name-cell-large">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="file-icon">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                            </svg>
                            <span className="file-name-txt" title={doc.fileName}>{doc.fileName}</span>
                          </div>
                        </td>
                        <td><span className={`badge badge-file-${doc.fileType}`}>{doc.fileType.toUpperCase()}</span></td>
                        <td>{formatBytes(doc.fileSize)}</td>
                        <td>{formatDate(doc.deletedAt)}</td>
                        <td>
                          <div className="action-buttons justify-end">
                            <button 
                              className="btn-icon-action text-primary" 
                              onClick={() => handleRestore(doc.documentId)}
                              title="Khôi phục"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="icon-sm">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                              </svg>
                            </button>
                            <button 
                              className="btn-icon-action text-danger" 
                              onClick={() => setDeleteId(doc.documentId)}
                              title="Xóa vĩnh viễn"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="icon-sm">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {deleteId && (
            <div className="modal-overlay">
              <div className="modal">
                <div className="modal-header">
                  <h3>Xác nhận xóa vĩnh viễn</h3>
                  <button className="modal-close-btn" onClick={() => setDeleteId(null)}>&times;</button>
                </div>
                <div className="modal-body">
                  <p>Bạn có chắc chắn muốn xóa vĩnh viễn tài liệu này khỏi hệ thống? Hành động này sẽ loại bỏ tệp vĩnh viễn khỏi AWS S3 bucket và thông tin lưu trữ trong DynamoDB.</p>
                  <p className="delete-warning"><strong>Cảnh báo:</strong> Thao tác này không thể hoàn tác.</p>
                </div>
                <div className="modal-footer">
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => setDeleteId(null)}
                    disabled={actionLoading}
                  >
                    Hủy bỏ
                  </button>
                  <button 
                    className="btn btn-danger" 
                    onClick={handleDeleteConfirm}
                    disabled={actionLoading}
                  >
                    {actionLoading ? "Đang xử lý..." : "Xác nhận xóa vĩnh viễn"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Trash;
