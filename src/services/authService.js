const CURRENT_USER_KEY = "sdms_current_user";
const SESSION_KEY = "sdms_cognito_session";

const region = import.meta.env.VITE_AWS_REGION || "ap-southeast-1";
const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID;
const clientId = import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID;
const cognitoEndpoint = `https://cognito-idp.${region}.amazonaws.com/`;

const errorKeys = {
  NotAuthorizedException: "errors.authInvalidCredentials",
  UserNotFoundException: "errors.authInvalidCredentials",
  UserNotConfirmedException: "errors.authNeedsConfirmation",
  UsernameExistsException: "errors.authEmailTaken",
  InvalidPasswordException: "errors.authPasswordPolicy",
  CodeMismatchException: "errors.authInvalidCode",
  ExpiredCodeException: "errors.authExpiredCode",
  TooManyRequestsException: "errors.authTryLater",
  LimitExceededException: "errors.authTryLater",
  TooManyFailedAttemptsException: "errors.authTryLater",
};

const decodeJwtPayload = (token) => {
  try {
    const segment = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = segment.padEnd(Math.ceil(segment.length / 4) * 4, "=");
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
};

const readSession = () => {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
};

const saveSession = (authenticationResult) => {
  const session = {
    idToken: authenticationResult.IdToken,
    accessToken: authenticationResult.AccessToken,
    refreshToken: authenticationResult.RefreshToken || readSession()?.refreshToken,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));

  const claims = decodeJwtPayload(session.idToken);
  const email = claims?.email || claims?.['cognito:username'] || "";
  const currentUser = {
    name: claims?.name || email.split("@")[0] || "User",
    email,
    role: "student",
    authProvider: "cognito",
  };
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
  return currentUser;
};

const cognitoRequest = async (operation, payload) => {
  if (!userPoolId || !clientId) {
    throw new Error("errors.awsAuthNotConfigured");
  }

  let response;
  try {
    response = await fetch(cognitoEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-amz-json-1.1",
        "X-Amz-Target": `AWSCognitoIdentityProviderService.${operation}`,
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error("errors.authNetworkError");
  }

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorName = result.__type?.split("#").pop() || result.code;
    throw new Error(errorKeys[errorName] || "errors.authRequestFailed");
  }
  return result;
};

const refreshSession = async (session) => {
  if (!session?.refreshToken) throw new Error("errors.authSessionExpired");
  try {
    const result = await cognitoRequest("InitiateAuth", {
      AuthFlow: "REFRESH_TOKEN_AUTH",
      ClientId: clientId,
      AuthParameters: { REFRESH_TOKEN: session.refreshToken },
    });
    return saveSession(result.AuthenticationResult);
  } catch (error) {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(CURRENT_USER_KEY);
    throw error;
  }
};

export const authService = {
  login: async (email, password) => {
    const result = await cognitoRequest("InitiateAuth", {
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: clientId,
      AuthParameters: {
        USERNAME: email.trim().toLowerCase(),
        PASSWORD: password,
      },
    });

    if (!result.AuthenticationResult?.IdToken) {
      throw new Error("errors.authAdditionalStepRequired");
    }
    return saveSession(result.AuthenticationResult);
  },

  forgotPassword: async (email) => {
    return cognitoRequest("ForgotPassword", {
      ClientId: clientId,
      Username: email.trim().toLowerCase(),
    });
  },

  confirmForgotPassword: async (email, confirmationCode, password) => {
    return cognitoRequest("ConfirmForgotPassword", {
      ClientId: clientId,
      Username: email.trim().toLowerCase(),
      ConfirmationCode: confirmationCode.trim(),
      Password: password,
    });
  },

  register: async (name, email, password) => {
    const result = await cognitoRequest("SignUp", {
      ClientId: clientId,
      Username: email.trim().toLowerCase(),
      Password: password,
      UserAttributes: [
        { Name: "email", Value: email.trim().toLowerCase() },
        { Name: "name", Value: name.trim() },
      ],
    });
    return {
      isConfirmed: result.UserConfirmed === true,
      codeDeliveryDetails: result.CodeDeliveryDetails,
    };
  },

  confirmRegistration: async (email, confirmationCode) => {
    await cognitoRequest("ConfirmSignUp", {
      ClientId: clientId,
      Username: email.trim().toLowerCase(),
      ConfirmationCode: confirmationCode.trim(),
    });
  },

  resendConfirmationCode: async (email) => {
    await cognitoRequest("ResendConfirmationCode", {
      ClientId: clientId,
      Username: email.trim().toLowerCase(),
    });
  },

  logout: async () => {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  getCurrentUser: () => {
    try {
      const user = JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || "null");
      // Remove old local mock sessions so they cannot bypass Cognito sign-in.
      if (user && user.authProvider !== "cognito") {
        localStorage.removeItem(CURRENT_USER_KEY);
        localStorage.removeItem(SESSION_KEY);
        return null;
      }
      return user;
    } catch {
      localStorage.removeItem(CURRENT_USER_KEY);
      return null;
    }
  },

  isAuthenticated: () => Boolean(authService.getCurrentUser() && readSession()?.refreshToken),

  getIdToken: async () => {
    const session = readSession();
    if (!session?.idToken) return null;
    const claims = decodeJwtPayload(session.idToken);
    if (claims?.exp && claims.exp > Math.floor(Date.now() / 1000) + 60) return session.idToken;
    await refreshSession(session);
    return readSession()?.idToken || null;
  },
};
