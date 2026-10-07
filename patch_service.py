import re

with open('src/services/documentService.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Fix getDocuments
get_docs_old = """  getDocuments: async () => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    const docs = getStoredDocuments();
    // In future, this will only fetch docs for current user + shared. 
    // For now, filter active only.
    return docs.filter(doc => doc.deletedAt === null);
  },"""

get_docs_new = """  getDocuments: async () => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    const currentUser = authService.getCurrentUser();
    if (!currentUser) throw new Error("Chưa đăng nhập!");
    const docs = getStoredDocuments();
    return docs.filter(doc => doc.owner === currentUser.email && doc.deletedAt === null);
  },"""

content = content.replace(get_docs_old, get_docs_new)

# 2. Fix toggleFavorite
toggle_fav_old = """  toggleFavorite: async (documentId) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const currentUser = authService.getCurrentUser();
    if (!currentUser) throw new Error("Chưa đăng nhập!");

    const docs = getStoredDocuments();
    const docIndex = docs.findIndex((d) => d.documentId === documentId);
    if (docIndex === -1) throw new Error("Không tìm thấy tài liệu!");

    const doc = docs[docIndex];
    if (!doc.favoritedBy) doc.favoritedBy = [];"""
# Fallback without diacritics
toggle_fav_old2 = """  toggleFavorite: async (documentId) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const currentUser = authService.getCurrentUser();
    if (!currentUser) throw new Error("Chưa đăng nhập!");

    const docs = getStoredDocuments();
    const docIndex = docs.findIndex((d) => d.documentId === documentId);
    if (docIndex === -1) throw new Error("Không tìm thấy tài liệu!");

    const doc = docs[docIndex];
    if (!doc.favoritedBy) doc.favoritedBy = [];"""

toggle_fav_new = """  toggleFavorite: async (documentId) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const currentUser = authService.getCurrentUser();
    if (!currentUser) throw new Error("Chưa đăng nhập!");

    const docs = getStoredDocuments();
    const docIndex = docs.findIndex((d) => d.documentId === documentId);
    if (docIndex === -1) throw new Error("Không tìm thấy tài liệu!");

    const doc = docs[docIndex];
    
    // Check access
    const isOwner = doc.owner === currentUser.email;
    const isShared = doc.sharedWith && doc.sharedWith.includes(currentUser.email);
    if (!isOwner && !isShared) {
      throw new Error("Không có quyền thao tác trên tài liệu này!");
    }

    if (!doc.favoritedBy) doc.favoritedBy = [];"""

# We use regex for replacement to avoid diacritics issues
content = re.sub(
    r'  toggleFavorite: async \(documentId\) => \{[\s\S]*?const doc = docs\[docIndex\];\n    if \(!doc\.favoritedBy\) doc\.favoritedBy = \[\];',
    toggle_fav_new,
    content,
    count=1
)


# 3. Fix downloadDocument
download_old = """  downloadDocument: async (doc) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    
    // Create a mock download action by building a dummy text content and triggering file download
    const element = document.createElement("a");"""

download_new = """  downloadDocument: async (doc) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    
    const currentUser = authService.getCurrentUser();
    if (!currentUser) throw new Error("Chưa đăng nhập!");
    
    const isOwner = doc.owner === currentUser.email;
    const isShared = doc.sharedWith && doc.sharedWith.includes(currentUser.email);
    if (!isOwner && !isShared) {
      throw new Error("Không có quyền tải xuống tài liệu này!");
    }
    
    // Create a mock download action by building a dummy text content and triggering file download
    const element = document.createElement("a");"""

content = content.replace(download_old, download_new)

with open('src/services/documentService.js', 'w', encoding='utf-8') as f:
    f.write(content)
