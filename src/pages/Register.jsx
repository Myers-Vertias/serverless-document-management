import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import { useTranslation } from "react-i18next";

const Register = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmationCode, setConfirmationCode] = useState("");
  const [confirmationPending, setConfirmationPending] = useState(false);
  const [error, setError] = useState("");
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

    if (confirmationPending) {
      setLoading(true);
      try {
        await authService.confirmRegistration(email, confirmationCode);
        await authService.login(email, password);
        navigate("/dashboard");
      } catch (err) {
        setError(t(err.message) || t("auth.registerError"));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (password !== confirmPassword) {
      setError(t("auth.passwordMatchError"));
      return;
    }

    if (password.length < 12) {
      setError(t("auth.passwordMinLength"));
      return;
    }

    setLoading(true);

    try {
      const result = await authService.register(name, email, password);
      if (result.isConfirmed) {
        await authService.login(email, password);
        navigate("/dashboard");
      } else {
        setConfirmationPending(true);
      }
    } catch (err) {
      setError(t(err.message) || t("auth.registerError"));
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError("");
    setLoading(true);
    try {
      await authService.resendConfirmationCode(email);
    } catch (err) {
      setError(t(err.message) || t("auth.registerError"));
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
          <p className="subtitle">{t("auth.registerSubtitle")}</p>
        </div>

        {error && <div className="auth-error-alert">{error}</div>}

        {confirmationPending ? (
          <>
            <p className="subtitle">{t("auth.confirmationSent", { email })}</p>
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="confirmationCode">{t("auth.confirmationCode")}</label>
                <input
                  type="text"
                  id="confirmationCode"
                  className="form-control"
                  value={confirmationCode}
                  onChange={(e) => setConfirmationCode(e.target.value)}
                  autoComplete="one-time-code"
                  required
                  disabled={loading}
                />
              </div>
              <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                {loading ? t("actions.processing") : t("auth.confirmCodeAction")}
              </button>
            </form>
            <button type="button" className="btn btn-secondary btn-block" onClick={handleResendCode} disabled={loading}>
              {t("auth.resendCode")}
            </button>
          </>
        ) : (
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">{t("auth.name")}</label>
            <input
              type="text"
              id="name"
              className="form-control"
              placeholder={t("auth.namePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
            />
          </div>

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
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">{t("auth.password")}</label>
            <input
              type="password"
              id="password"
              className="form-control"
              placeholder={t("auth.passwordMinPlaceholder")}
              minLength={12}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">{t("auth.confirmPassword")}</label>
            <input
              type="password"
              id="confirmPassword"
              className="form-control"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? (
              <span className="spinner-container">
                <span className="spinner"></span> {t("actions.processing")}
              </span>
            ) : (
              t("auth.registerAction")
            )}
          </button>
        </form>
        )}

        <div className="auth-footer">
          {t("auth.haveAccount")} <Link to="/login">{t("auth.login")}</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
