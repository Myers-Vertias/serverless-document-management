import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { documentService } from "../services/documentService";
import { authService } from "../services/authService";
import { useTranslation } from "react-i18next";
import i18n from "../i18n/config";

const Dashboard = () => {
  const { t } = useTranslation();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const data = await documentService.getDocuments();
        setDocuments(data);
      } catch (err) {
        setError(t("errors.default"));
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

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
      month: "long",
      day: "numeric",
    });
  };

  // Calculations
  const totalDocs = documents.length;
  const totalStorageBytes = documents.reduce((acc, doc) => acc + doc.fileSize, 0);
  const activeDocs = documents.filter(d => d.status === "active").length;
  const processingDocs = documents.filter(d => d.status === "processing").length;
  
  // Recent documents (limit to 3)
  const recentDocuments = [...documents]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 3);

  if (loading) {
    return (
      <div className="loading-wrapper">
        <div className="spinner"></div>
        <p>{t("dashboard.loading", "Loading...")}</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* Welcome Banner */}
      <section className="welcome-banner">
        <div className="welcome-text">
          <h1>{t("dashboard.welcome", { name: currentUser?.name })}</h1>
          <p>{t("dashboard.welcomeDesc")}</p>
        </div>
        <div className="welcome-action">
          <Link to="/upload" className="btn btn-primary">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="btn-icon">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            {t("dashboard.uploadNew")}
          </Link>
        </div>
      </section>

      {error && <div className="error-alert">{error}</div>}

      {/* Stats Cards Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper blue">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="stat-icon">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
          </div>
          <div className="stat-content">
            <span className="stat-label">{t("dashboard.totalDocs")}</span>
            <span className="stat-value">{totalDocs}</span>
            
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper green">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="stat-icon">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 1.028-.394 2.022-1.11 2.801l-10.2 10.2a4.5 4.5 0 0 1-3.18 1.324H4.5v-1.27a4.5 4.5 0 0 1 1.323-3.18l10.2-10.2a4.5 4.5 0 0 1 3.18-1.324H20.25v1.27Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 9.75 14.25 7.5" />
            </svg>
          </div>
          <div className="stat-content">
            <span className="stat-label">{t("dashboard.totalStorage")}</span>
            <span className="stat-value">{formatBytes(totalStorageBytes)}</span>
            
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper purple">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="stat-icon">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376A8.965 8.965 0 0 0 12 12.75c-.131 0-.262.003-.392.009m3.142 4.491a9.06 9.06 0 0 1-1.5.124M12 12.75c-1.17 0-2.28-.228-3.3-.642m3.3.642c-.131 0-.262.003-.392.009m-3.142-4.491a9.06 9.06 0 0 1 1.5-.124M9.75 3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V6.75h-4.5V3.375Z" />
            </svg>
          </div>
          <div className="stat-content">
            <span className="stat-label">{t("documents.status")}</span>
            <span className="stat-value">{activeDocs} <span className="stat-subtext">{t("documents.statusActive")}</span></span>
            <span className="stat-desc">{processingDocs} {t("dashboard.processingDocs")}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Documents & Quick Upload */}
      <div className="dashboard-grid">
        {/* Recent Documents Card */}
        <div className="dashboard-card recent-docs-card">
          <div className="card-header">
            <h3>{t("dashboard.recentDocs")}</h3>
            <Link to="/documents" className="view-all-link">{t("dashboard.viewAllDocs")}</Link>
          </div>
          
          <div className="card-body">
            {recentDocuments.length === 0 ? (
              <div className="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="empty-icon">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
                <p>{t("dashboard.emptyRecent")}</p>
                <Link to="/upload" className="btn btn-secondary btn-sm">{t("dashboard.uploadNew")}</Link>
              </div>
            ) : (
              <div className="responsive-table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>{t("documents.fileName")}</th>
                      <th>{t("documents.category")}</th>
                      <th>{t("documents.size")}</th>
                      <th>{t("documents.updatedAt")}</th>
                      <th>{t("documents.status")}</th>
                      <th>{t("documents.actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentDocuments.map((doc) => (
                      <tr key={doc.documentId}>
                        <td>
                          <div className="file-name-cell">
                            <span className="file-name-txt" title={doc.fileName}>{doc.fileName}</span>
                          </div>
                        </td>
                        <td><span className={`badge badge-file-${doc.fileType}`}>{doc.fileType.toUpperCase()}</span></td>
                        <td>{formatBytes(doc.fileSize)}</td>
                        <td>{formatDate(doc.createdAt)}</td>
                        <td>
                          <span className={`badge badge-status-${doc.status}`}>
                            {doc.status === "active" ? t("documents.statusActive") : t("documents.statusProcessing")}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <Link to={`/documents/${doc.documentId}`} className="btn-icon-action" title={t("dashboard.viewAllDocs")}>
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="icon-sm">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                              </svg>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* System Architecture Preview Card */}
              </div>
    </div>
  );
};

export default Dashboard;
