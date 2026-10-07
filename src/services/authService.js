// Mock authentication service
// In the future, this will be replaced with Amazon Cognito / AWS Amplify Auth

const MOCK_USERS_KEY = "sdms_mock_users";
const CURRENT_USER_KEY = "sdms_current_user";

// Helper to get registered mock users
const getMockUsers = () => {
  const users = localStorage.getItem(MOCK_USERS_KEY);
  return users ? JSON.parse(users) : [
    {
      name: "Nguyễn Văn A",
      email: "nguyen.van.a@university.edu.vn",
      password: "password123",
      role: "admin"
    },
    {
      name: "Trần Thị B",
      email: "tran.thi.b@university.edu.vn",
      password: "password123",
      role: "student"
    }
  ];
};

const saveMockUsers = (users) => {
  localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
};

export const authService = {
  login: async (email, password) => {
    // Simulate API network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const users = getMockUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      throw new Error("Email không tồn tại trong hệ thống!");
    }

    if (user.password !== password) {
      throw new Error("Mật khẩu không chính xác!");
    }

    const sessionUser = {
      name: user.name,
      email: user.email,
      role: user.role || "student",
      token: "mock-jwt-token-from-cognito-" + Math.random().toString(36).substring(2, 15)
    };

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(sessionUser));
    return sessionUser;
  },

  register: async (name, email, password) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (!name || !email || !password) {
      throw new Error("Vui lòng điền đầy đủ thông tin đăng ký!");
    }

    const users = getMockUsers();
    const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (existingUser) {
      throw new Error("Email này đã được sử dụng!");
    }

    const newUser = {
      name,
      email: email.toLowerCase(),
      password,
      role: "student" // Default role
    };

    users.push(newUser);
    saveMockUsers(users);

    // Auto log-in after registration
    const sessionUser = {
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      token: "mock-jwt-token-from-cognito-" + Math.random().toString(36).substring(2, 15)
    };

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(sessionUser));
    return sessionUser;
  },

  logout: async () => {
    // Simulate network delay for full mock experience
    await new Promise((resolve) => setTimeout(resolve, 300));
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  getCurrentUser: () => {
    const userJson = localStorage.getItem(CURRENT_USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  },

  isAuthenticated: () => {
    return localStorage.getItem(CURRENT_USER_KEY) !== null;
  },

  checkUserExists: async (email) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const users = getMockUsers();
    return users.some(u => u.email.toLowerCase() === email.toLowerCase());
  }
};
