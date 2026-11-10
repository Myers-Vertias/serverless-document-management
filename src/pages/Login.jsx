import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import { useTranslation } from "react-i18next";

const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [mode, setMode] = useState("login");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (authService.isAuthenticated()) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "login") {
        await authService.login(email, password);
        navigate("/dashboard");
      } else if (mode === "request-reset") {
        await authService.forgotPassword(email);
        setMode("confirm-reset");
        setNotice(t("auth.resetCodeSent", { email }));
      } else {
        await authService.confirmForgotPassword(email, resetCode, newPassword);
        setMode("login");
        setPassword("");
        setResetCode("");
        setNewPassword("");
        setNotice(t("auth.passwordResetSuccess"));
      }
    } catch (err) {
      setError(t(err.message) || t("auth.loginError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="logo-svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-.778.099-1.533.284-2.253" />
            </svg>
          </div>
          <h2>UniCloud DMS</h2>
          <p className="subtitle">{t("auth.systemSubtitle")}</p>
        </div>

        {error && <div className="auth-error-alert">{error}</div>}
        {notice && <div className="auth-info-alert">{notice}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">{t("auth.email")}</label>
            <input
              type="email"
              id="email"
              className="form-control"
              placeholder="ten@university.edu.vn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading || mode === "confirm-reset"}
            />
          </div>

          {mode === "login" && (
            <div className="form-group">
              <label htmlFor="password">{t("auth.password")}</label>
              <input
                type="password"
                id="password"
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          )}

          {mode === "confirm-reset" && (
            <>
              <div className="form-group">
                <label htmlFor="reset-code">{t("auth.passwordResetCode")}</label>
                <input id="reset-code" className="form-control" value={resetCode} onChange={(e) => setResetCode(e.target.value)} required disabled={loading} autoComplete="one-time-code" />
              </div>
              <div className="form-group">
                <label htmlFor="new-password">{t("auth.newPassword")}</label>
                <input id="new-password" type="password" className="form-control" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required disabled={loading} autoComplete="new-password" />
              </div>
            </>
          )}

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? (
              <span className="spinner-container">
                <span className="spinner"></span> {t("auth.authenticating")}
              </span>
            ) : (
              mode === "login" ? t("auth.loginAction") : mode === "request-reset" ? t("auth.sendResetCode") : t("auth.setNewPassword")
            )}
          </button>
        </form>

        <div className="auth-footer">
          {mode === "login" ? (
            <>
              <button type="button" className="auth-text-button" onClick={() => { setMode("request-reset"); setError(""); setNotice(""); }}>{t("auth.forgotPassword")}</button>
              <div>{t("auth.noAccount")} <Link to="/register">{t("auth.register")}</Link></div>
            </>
          ) : (
            <button type="button" className="auth-text-button" onClick={() => { setMode("login"); setError(""); setNotice(""); }}>{t("auth.backToLogin")}</button>
          )}
        </div>

      </div>
    </div>
  );
};

export default Login;
