import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import i18n from "../i18n/config";
import { documentService } from "../services/documentService";
import { authService } from "../services/authService";

const Documents = () => {
  const { t } = useTranslation();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [deleteId, setDeleteId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const currentUser = authService.getCurrentUser();

  const loadDocuments = async () => {
    try {
      const data = await documentService.getDocuments();
      setDocuments(data);
    } catch (err) {
      setError(t("errors.loadDocsFailed"));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleDownload = async (doc) => {
    try {
      await documentService.downloadDocument(doc);
      showFeedback("success", t("documents.downloadSuccess", { name: doc.fileName }));
    } catch (err) {
      console.error(err);
      showFeedback("error", t("errors.downloadFailed"));
    }
  };

  const handleToggleFavorite = async (doc) => {
    try {
      const updatedDoc = await documentService.toggleFavorite(doc.documentId);
      setDocuments((prevDocs) => 
        prevDocs.map((d) => (d.documentId === doc.documentId ? updatedDoc : d))
      );
    } catch (err) {
      console.error(err);
      showFeedback("error", t(err.message) || t("errors.updateFavoriteFailed"));
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setActionLoading(true);
    setFeedback({ type: "", message: "" });

    try {
      await documentService.moveToTrash(deleteId);
      setDocuments(documents.filter((d) => d.documentId !== deleteId));
      showFeedback("success", t("documents.trashSuccess"));
      setDeleteId(null);
    } catch (err) {
      showFeedback("error", t(err.message) || t("errors.trashFailed"));
    } finally {
      setActionLoading(false);
    }
  };

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback({ type: "", message: "" });
    }, 4000);
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
    return new Date(dateString).toLocaleDateString(i18n.language === "vi" ? "vi-VN" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get unique file types from documents for filter buttons
  const availableTypes = ["all", ...new Set(documents.map((d) => d.fileType))];

  // Filtering & Searching logic
      const filteredDocuments = documents.filter((doc) => {
      const q = searchQuery.toLowerCase();
      const tagsStr = doc.tags ? doc.tags.join(" ") : "";
      const matchesSearch = doc.fileName.toLowerCase().includes(q) || 
                            doc.owner.toLowerCase().includes(q) ||
                            (doc.category && doc.category.toLowerCase().includes(q)) ||
                            tagsStr.toLowerCase().includes(q);
      const matchesType = selectedType === "all" || doc.fileType === selectedType;
      const matchesCategory = categoryFilter === "all" || doc.category === categoryFilter;
      
      return matchesSearch && matchesType && matchesCategory;
    });

  if (loading) {
    return (
      <div className="loading-wrapper">
        <div className="spinner"></div>
        <p>{t("documents.loading")}</p>
      </div>
    );
  }

  return (
    <div className="documents-page">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>{t("documents.title")}</h1>
          <p className="subtitle">{t("documents.desc")}</p>
        </div>
        <div>
          <Link to="/upload" className="btn btn-primary">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="btn-icon">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
            </svg>
            {t("navigation.upload")}
          </Link>
        </div>
      </div>

      {/* Alerts & Feedback */}
      {error && <div className="error-alert">{error}</div>}
      {feedback.message && (
        <div className={`alert alert-${feedback.type}`}>
          {feedback.message}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="filter-search-container" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', width: '100%', flexWrap: 'wrap' }}>
            <div className="search-box-wrapper" style={{ flex: 1, minWidth: '300px' }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="search-icon">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.637 10.637Z" />
              </svg>
              <input
                type="text"
                className="search-input"
                placeholder={t("documents.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <select 
              className="form-control" 
              style={{ width: '200px', height: '42px', flexShrink: 0 }}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">{t("documents.allCategories")}</option>
              <option value="Other">{t("categories.other")}</option>
              <option value="Work">{t("categories.work")}</option>
              <option value="Finance">{t("categories.finance")}</option>
              <option value="HR">{t("categories.hr")}</option>
              <option value="Technical">{t("categories.technical")}</option>
              <option value="Meeting">{t("categories.meeting")}</option>
            </select>
          </div>

        <div className="filter-type-list">
          {availableTypes.map((type) => (
            <button
              key={type}
              className={`filter-btn ${selectedType === type ? "active" : ""}`}
              onClick={() => setSelectedType(type)}
            >
              {type === "all" ? t("documents.allTypes") : type.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      {filteredDocuments.length === 0 ? (
        <div className="empty-documents-state">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="empty-icon">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
          <h3>{t("documents.noResults")}</h3>
          <p>{t("documents.noResults")}</p>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setSearchQuery("");
              setSelectedType("all");
            }}
          >
            {t("actions.clearFilter")}
          </button>
        </div>
      ) : (
        <div className="table-card">
          <div className="responsive-table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>{t("documents.fileName")}</th>
                  <th>{t("detail.fileType")}</th>
                  <th>{t("documents.size")}</th>
                  <th>{t("detail.owner")}</th>
                  <th>{t("detail.createdAt")}</th>
                  <th>{t("documents.status")}</th>
                  <th className="text-right">{t("documents.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.map((doc) => {
                  const isFavorited = doc.favoritedBy && currentUser && doc.favoritedBy.includes(currentUser.email);
                  return (
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
                    <td>
                      <span className="owner-txt" title={doc.owner}>{doc.owner.split("@")[0]}</span>
                    </td>
                    <td>{formatDate(doc.createdAt)}</td>
                    <td>
                      <span className={`badge badge-status-${doc.status}`}>
                        {doc.status === "active" ? t("documents.statusActive") : t("documents.statusProcessing")}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons justify-end">
                        <button 
                          className="btn-icon-action" 
                          onClick={() => handleToggleFavorite(doc)}
                          title={isFavorited ? t("documents.unfavorite") : t("documents.favorite")}
                        >
                          {isFavorited ? (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="icon-sm text-warning" style={{ color: '#f59e0b' }}>
                              <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="icon-sm">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                            </svg>
                          )}
                        </button>
                        <Link to={`/documents/${doc.documentId}`} className="btn-icon-action" title={t("detail.title")}>
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="icon-sm">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                          </svg>
                        </Link>
                        <button 
                          className="btn-icon-action" 
                          onClick={() => handleDownload(doc)}
                          title={t("documents.download")}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="icon-sm">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                          </svg>
                        </button>
                        <button 
                          className="btn-icon-action text-danger" 
                          onClick={() => setDeleteId(doc.documentId)}
                          title={t("detail.moveToTrash")}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="icon-sm">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
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
              <h3>{t("detail.trashConfirmTitle")}</h3>
              <button className="modal-close-btn" onClick={() => setDeleteId(null)}>×</button>
            </div>
            <div className="modal-body">
              <p>{t("documents.trashModalMsg")}</p>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary" 
                onClick={() => setDeleteId(null)}
                disabled={actionLoading}
              >
                {t("actions.cancel")}
              </button>
              <button 
                className="btn btn-danger" 
                onClick={handleDeleteConfirm}
                disabled={actionLoading}
              >
                {actionLoading ? t("actions.processing") : t("detail.moveToTrash")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;
