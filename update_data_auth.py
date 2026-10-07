import re

# 1. Update mockDocuments.js
file_path_mock = 'src/data/mockDocuments.js'
with open(file_path_mock, 'r', encoding='utf-8') as f:
    content_mock = f.read()

content_mock = re.sub(r'favoritedBy: \[\],', r'favoritedBy: [],\n    sharedWith: [],', content_mock)

with open(file_path_mock, 'w', encoding='utf-8') as f:
    f.write(content_mock)

# 2. Update authService.js
file_path_auth = 'src/services/authService.js'
with open(file_path_auth, 'r', encoding='utf-8') as f:
    content_auth = f.read()

check_user_exists = """  isAuthenticated: () => {
    return localStorage.getItem(CURRENT_USER_KEY) !== null;
  },

  checkUserExists: async (email) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const users = getMockUsers();
    return users.some(u => u.email.toLowerCase() === email.toLowerCase());
  }
};"""
content_auth = re.sub(r'  isAuthenticated: \(\) => \{\s*return localStorage\.getItem\(CURRENT_USER_KEY\) !== null;\s*\}\s*\};', check_user_exists, content_auth)

with open(file_path_auth, 'w', encoding='utf-8') as f:
    f.write(content_auth)
