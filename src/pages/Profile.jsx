import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import { useTranslation } from "react-i18next";
import { documentService } from "../services/documentService";

const Profile = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  const [docCount, setDocCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const docs = await documentService.getDocuments();
        // Count documents owned by this user
        const userDocs = docs.filter(d => d.owner === currentUser?.email);
        setDocCount(userDocs.length);
      } catch (err) {
        console.error("Stats error:", err);
      } finally {
        setLoading(false);
      }
    };
    if (currentUser) {
      fetchUserStats();
    }
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate("/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="profile-page">
      <div className="page-header">
        <h1>{t("profile.title")}</h1>
        <p className="subtitle">{t("profile.subtitle")}</p>
      </div>

      <div className="profile-grid">
        {/* Main Info Card */}
        <div className="card profile-card">
          <div className="profile-avatar-large">
            {currentUser.name.charAt(0).toUpperCase()}
          </div>
          <h2>{currentUser.name}</h2>
          <span className={`badge badge-role-${currentUser.role}`}>
            {currentUser.role === "admin" ? t("profile.roleAdmin") : t("profile.roleUser")}
          </span>

          <div className="profile-details-list">
            <div className="detail-row">
              <span className="detail-label">{t("profile.email")}</span>
              <span className="detail-val">{currentUser.email}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">{t("profile.ownedDocs")}</span>
              <span className="detail-val">{loading ? "..." : t("profile.docCount", { count: docCount })}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">{t("profile.cloudPlatform")}</span>
              <span className="detail-val">Amazon Web Services (AWS)</span>
            </div>
          </div>

          <div className="profile-actions">
            <button className="btn btn-danger btn-block" onClick={handleLogout}>
              {t("profile.logoutBtn")}
            </button>
          </div>
        </div>

        {/* AWS Security Session Card */}
        <div className="card info-card">
          <h3>{t("profile.sessionTitle")}</h3>
          <p className="intro">{t("profile.sessionIntro")}</p>
          
          <div className="token-info-box">
            <div className="token-item">
              <strong>Cognito User Pool ID</strong>
              <code>{import.meta.env.VITE_COGNITO_USER_POOL_ID}</code>
            </div>
            
            <div className="token-item">
              <strong>App Client ID</strong>
              <code>{import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID}</code>
            </div>

            <div className="token-item">
              <strong>{t("profile.authProvider")}</strong>
              <span>{t("profile.cognitoSessionActive")}</span>
            </div>
          </div>
          
          <p className="security-notice">
            * {t("profile.tokenNote")}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Profile;
