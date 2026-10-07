import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import { documentService } from "../services/documentService";

const Profile = () => {
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
        console.error("Lỗi lấy thông tin thống kê:", err);
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
      console.error("Lỗi đăng xuất:", err);
    }
  };

  const tokenExp = React.useMemo(() => Math.floor(Date.now() / 1000) + 3600, []);

  if (!currentUser) return null;

  return (
    <div className="profile-page">
      <div className="page-header">
        <h1>Hồ sơ cá nhân</h1>
        <p className="subtitle">Thông tin tài khoản sinh viên/giảng viên được xác thực bởi Amazon Cognito.</p>
      </div>

      <div className="profile-grid">
        {/* Main Info Card */}
        <div className="card profile-card">
          <div className="profile-avatar-large">
            {currentUser.name.charAt(0).toUpperCase()}
          </div>
          <h2>{currentUser.name}</h2>
          <span className={`badge badge-role-${currentUser.role}`}>
            {currentUser.role === "admin" ? "Quản trị viên hệ thống" : "Sinh viên / Người dùng"}
          </span>

          <div className="profile-details-list">
            <div className="detail-row">
              <span className="detail-label">Địa chỉ email</span>
              <span className="detail-val">{currentUser.email}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Số tài liệu sở hữu</span>
              <span className="detail-val">{loading ? "..." : `${docCount} tài liệu`}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Nền tảng Cloud</span>
              <span className="detail-val">Amazon Web Services (AWS)</span>
            </div>
          </div>

          <div className="profile-actions">
            <button className="btn btn-danger btn-block" onClick={handleLogout}>
              Đăng xuất tài khoản
            </button>
          </div>
        </div>

        {/* AWS Security Session Card */}
        <div className="card info-card">
          <h3>Thông tin phiên bảo mật (Cognito Session)</h3>
          <p className="intro">Dưới đây là chi tiết kỹ thuật từ JWT token được mã hóa sau khi đăng nhập thành công qua Cognito User Pool.</p>
          
          <div className="token-info-box">
            <div className="token-item">
              <strong>Cognito User Pool ID</strong>
              <code>ap-southeast-1_uX87aD1Bq</code>
            </div>
            
            <div className="token-item">
              <strong>App Client ID</strong>
              <code>3n7b82md819asd72bmasd812bd</code>
            </div>

            <div className="token-item">
              <strong>Mock JWT ID Token (Payload)</strong>
              <pre className="jwt-payload-preview">
{JSON.stringify({
  "sub": "us-east-1:71b29a-28ab-412f-8da7-183017bc",
  "email_verified": true,
  "iss": "https://cognito-idp.ap-southeast-1.amazonaws.com/ap-southeast-1_uX87aD1Bq",
  "cognito:username": currentUser.email,
  "custom:role": currentUser.role,
  "name": currentUser.name,
  "exp": tokenExp
}, null, 2)}
              </pre>
            </div>
          </div>
          
          <p className="security-notice">
            * <strong>Lưu ý:</strong> Token này được sinh ngẫu nhiên để phục vụ quá trình giả lập phát triển local. Khi triển khai lên AWS, thư viện AWS Amplify SDK sẽ tự động xử lý và lưu trữ token này trong bộ nhớ trình duyệt một cách an toàn.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Profile;
