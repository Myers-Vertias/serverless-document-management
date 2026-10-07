import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { documentService } from "../services/documentService";
import { authService } from "../services/authService";

const DocumentDetail = () => {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [trashModalOpen, setTrashModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editCategory, setEditCategory] = useState("Other");
  const [editTagsInput, setEditTagsInput] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const data = await documentService.getDocumentById(documentId);
        setDocument(data);
      } catch (err) {
        setError(err.message || "Không thể tìm thấy tài liệu này!");
      } finally {
        setLoading(false);
      }
    };
    fetchDocument();
  }, [documentId]);

  const handleDownload = async () => {
    if (!document) return;
    try {
      await documentService.downloadDocument(document);
    } catch (err) {
      console.error(err);
      alert("Lỗi khi tải tài liệu!");
    }
  };

  const handleMoveToTrash = async () => {
    setActionLoading(true);
    try {
      await documentService.moveToTrash(documentId);
      navigate("/documents");
    } catch (err) {
      alert(err.message || "Không thể đưa vào thùng rác!");
      setActionLoading(false);
    }
  };

  const handleRestore = async () => {
    setActionLoading(true);
    try {
      const updatedDoc = await documentService.restoreFromTrash(documentId);
      setDocument(updatedDoc);
    } catch (err) {
      alert(err.message || "Không thể khôi phục tài liệu!");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePermanently = async () => {
    setActionLoading(true);
    try {
      await documentService.permanentlyDelete(documentId);
      navigate("/trash");
    } catch (err) {
      alert(err.message || "Không thể xóa vĩnh viễn tài liệu!");
      setActionLoading(false);
    }
  };

  const handleEditOpen = () => {
    setEditCategory(document.category || "Other");
    setEditTagsInput(document.tags ? document.tags.join(", ") : "");
    setEditDescription(document.description || "");
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const processedTags = editTagsInput.split(',')
        .map(t => t.trim().toLowerCase())
        .filter(t => t)
        .filter((t, index, self) => self.indexOf(t) === index);
        
      const updatedDoc = await documentService.updateMetadata(documentId, {
        category: editCategory,
        tags: processedTags,
        description: editDescription
      });
      setDocument(updatedDoc);
      setEditModalOpen(false);
    } catch (err) {
      console.error(err);
      alert(err.message || "Lỗi khi cập nhật metadata!");
    } finally {
      setActionLoading(false);
    }
  };


  const handleToggleFavorite = async () => {
    try {
      if (document.deletedAt !== null) {
        alert("Không thể thao tác với tài liệu trong thùng rác!");
        return;
      }
      const updatedDoc = await documentService.toggleFavorite(documentId);
      setDocument(updatedDoc);
    } catch (err) {
      console.error(err);
      alert("Lỗi khi cập nhật mục yêu thích!");
    }
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
    return new Date(dateString).toLocaleString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="loading-wrapper">
        <div className="spinner"></div>
        <p>Đang tải thông tin chi tiết tài liệu...</p>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="error-container-page">
        <div className="error-card">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="error-icon">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
          <h2>Không tìm thấy tệp tin!</h2>
          <p>{error || "Yêu cầu tệp không hợp lệ hoặc đã bị xóa."}</p>
          <Link to="/documents" className="btn btn-primary">Quay lại danh sách</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="document-detail-page">
      {/* Navigation Breadcrumb */}
      <div className="breadcrumb">
        <Link to="/documents">Kho tài liệu</Link>
        <span className="separator">/</span>
        <span className="current">{document.fileName}</span>
      </div>

      <div className="detail-layout">
        {/* Main Details Card */}
        <div className="card main-detail-card">
          <div className="detail-header-section" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div className={`large-file-icon file-${document.fileType}`}>
                <span>{document.fileType.toUpperCase()}</span>
              </div>
              <div className="header-info">
                <h2>{document.fileName}</h2>
                <p className="doc-id">Mã tài liệu: {document.documentId}</p>
              </div>
            </div>
            <button className="btn-icon-action" onClick={handleToggleFavorite} title="Yêu thích" style={{ padding: "0.5rem", background: "transparent", border: "none", cursor: "pointer", color: "#eab308" }}>
              {document.favoritedBy?.includes(authService.getCurrentUser()?.email) ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
                  <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="28" height="28">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385c.148.621-.531 1.115-1.069.792c-.183-.11-.377-.221-.572-.341L12 18.354 7.373 21.18c-.538.323-1.217-.171-1.069-.792l1.285-5.385a.563.563 0 00-.182-.557l-4.204-3.602c-.38-.325-.178-.948.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
              )}
            </button>
          </div>

          <div className="detail-body-section">
            <h3 className="section-title">Siêu dữ liệu chi tiết (DynamoDB Fields)</h3>
            <div className="meta-fields-grid">
              <div className="meta-field-item">
                <span className="meta-label">Tên tệp tin gốc</span>
                <span className="meta-val">{document.fileName}</span>
              </div>
              <div className="meta-field-item">
                <span className="meta-label">Định dạng tệp</span>
                <span className="meta-val-badge">
                  <span className={`badge badge-file-${document.fileType}`}>{document.fileType.toUpperCase()}</span>
                </span>
              </div>
              <div className="meta-field-item">
                <span className="meta-label">Kích thước tệp</span>
                <span className="meta-val">{formatBytes(document.fileSize)} ({document.fileSize.toLocaleString()} bytes)</span>
              </div>
              <div className="meta-field-item">
                <span className="meta-label">Danh mục (Category)</span>
                <span className="meta-val">
                  <span className="badge badge-outline">{document.category || "Other"}</span>
                </span>
              </div>
              <div className="meta-field-item">
                <span className="meta-label">Thẻ (Tags)</span>
                <span className="meta-val">
                  {document.tags && document.tags.length > 0 
                    ? document.tags.map(t => <span key={t} className="badge badge-tag" style={{marginRight: '4px', background: '#e2e8f0', color: '#475569', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem'}}>{t}</span>) 
                    : <span className="text-muted">Không có thẻ</span>}
                </span>
              </div>
              <div className="meta-field-item">
                <span className="meta-label">Danh mục</span>
                <span className="meta-val">{document.category || "N/A"}</span>
              </div>
              <div className="meta-field-item">
                <span className="meta-label">Thẻ (Tags)</span>
                <span className="meta-val">
                  {document.tags && document.tags.length > 0 
                    ? document.tags.map(t => <span key={t} className="badge badge-tag" style={{marginRight: '4px', background: '#e2e8f0', color: '#475569', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem'}}>{t}</span>) 
                    : "N/A"}
                </span>
              </div>
              <div className="meta-field-item">
                <span className="meta-label">Người sở hữu (Owner)</span>
                <span className="meta-val">{document.owner}</span>
              </div>
              <div className="meta-field-item">
                <span className="meta-label">Ngày khởi tạo</span>
                <span className="meta-val">{formatDate(document.createdAt)}</span>
              </div>
              <div className="meta-field-item">
                <span className="meta-label">Ngày cập nhật</span>
                <span className="meta-val">{formatDate(document.updatedAt)}</span>
              </div>
              <div className="meta-field-item full-width">
                <span className="meta-label">Đường dẫn AWS S3 Key</span>
                <span className="meta-val s3-key-val">
                  <code>s3://{import.meta.env.VITE_S3_BUCKET_NAME || "uni-document-bucket-prod"}/{document.s3Key}</code>
                </span>
              </div>
              {document.description && (
                <div className="meta-field-item full-width">
                  <span className="meta-label">Mô tả tài liệu</span>
                  <span className="meta-val desc-val">{document.description}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Actions Card */}
        <div className="card actions-sidebar-card">
          <h3>Thao tác tài liệu</h3>
          <p className="actions-hint">Nhấp vào bên dưới để thao tác trực tiếp với tài nguyên cloud.</p>
          
                    {document.deletedAt ? (
            <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>
              <strong>Tài liệu này đang trong Thùng rác.</strong> Không thể xem chi tiết hoặc tải xuống cho đến khi được khôi phục.
            </div>
          ) : null}
          <div className="action-buttons-stack">
            {document.deletedAt === null ? (
              <>
                {document.owner === currentUser?.email && (
                  <button className="btn btn-secondary" onClick={handleEditOpen}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="btn-icon">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                    </svg>
                    Sửa Metadata
                  </button>
                )}
                <button className="btn btn-primary" onClick={handleDownload}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="btn-icon">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  Tải xuống (S3 Presigned)
                </button>
                {document.owner === currentUser?.email && (
                  <button className="btn btn-danger-outline" onClick={() => setTrashModalOpen(true)}>
                    Đưa vào thùng rác
                  </button>
                )}
              </>
            ) : (
              <>
                {document.owner === currentUser?.email && (
                  <>
                    <button className="btn btn-primary" onClick={handleRestore} disabled={actionLoading}>
                      Khôi phục tài liệu
                    </button>
                    <button className="btn btn-danger-outline" onClick={() => setDeleteModalOpen(true)}>
                      Xóa vĩnh viễn
                    </button>
                  </>
                )}
              </>
            )}
            <Link to="/documents" className="btn btn-secondary-outline text-center">
              Quay lại danh sách
            </Link>
          </div>

          <div className="s3-info-badge">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="badge-icon">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
            <div>
              <strong>Liên kết an toàn</strong>
              <p>Mọi yêu cầu tải tệp đều sử dụng chữ ký điện tử AWS Signature Version 4 để ngăn chặn truy cập trái phép.</p>
            </div>
          </div>
        </div>
      </div>

      
      {/* Edit Metadata Modal */}
      {editModalOpen && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>Chỉnh sửa siêu dữ liệu</h3>
              <button className="modal-close-btn" onClick={() => setEditModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="editCategory">Danh mục</label>
                  <select
                    id="editCategory"
                    className="form-control"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    disabled={actionLoading}
                  >
                    <option value="Other">Khác (Other)</option>
                    <option value="Work">Công việc (Work)</option>
                    <option value="Finance">Tài chính (Finance)</option>
                    <option value="HR">Nhân sự (HR)</option>
                    <option value="Technical">Kỹ thuật (Technical)</option>
                    <option value="Meeting">Cuộc họp (Meeting)</option>
                  </select>
                </div>
                <div className="form-group margin-top-md">
                  <label htmlFor="editTags">Thẻ (Tags)</label>
                  <input
                    type="text"
                    id="editTags"
                    className="form-control"
                    placeholder="Nhập thẻ cách nhau bởi dấu phẩy"
                    value={editTagsInput}
                    onChange={(e) => setEditTagsInput(e.target.value)}
                    disabled={actionLoading}
                  />
                </div>
                <div className="form-group margin-top-md">
                  <label htmlFor="editDescription">Mô tả tài liệu</label>
                  <textarea
                    id="editDescription"
                    className="form-control"
                    rows="3"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    disabled={actionLoading}
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button"
                  className="btn btn-secondary" 
                  onClick={() => setEditModalOpen(false)}
                  disabled={actionLoading}
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit"
                  className="btn btn-primary" 
                  disabled={actionLoading}
                >
                  {actionLoading ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Move to Trash Confirmation Modal */}
      {trashModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Đưa vào thùng rác</h3>
              <button className="modal-close-btn" onClick={() => setTrashModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <p>Bạn có chắc muốn đưa tài liệu <strong>{document.fileName}</strong> vào Thùng rác không?</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setTrashModalOpen(false)} disabled={actionLoading}>Hủy bỏ</button>
              <button className="btn btn-danger" onClick={handleMoveToTrash} disabled={actionLoading}>Đưa vào Thùng rác</button>
            </div>
          </div>
        </div>
      )}

      {/* Permanently Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Xác nhận xóa vĩnh viễn</h3>
              <button className="modal-close-btn" onClick={() => setDeleteModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <p>Bạn có chắc chắn muốn xóa vĩnh viễn tệp <strong>{document.fileName}</strong>?</p>
              <p className="delete-warning">Thao tác này không thể hoàn tác. Tài liệu sẽ bị xóa hoàn toàn khỏi hệ thống.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteModalOpen(false)} disabled={actionLoading}>Hủy bỏ</button>
              <button className="btn btn-danger" onClick={handleDeletePermanently} disabled={actionLoading}>Xác nhận xóa vĩnh viễn</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentDetail;
