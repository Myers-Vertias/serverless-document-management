import re

file_path = 'src/services/documentService.js'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update getDocuments
get_docs_old = """  getDocuments: async () => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 600));
    return getStoredDocuments();
  },"""
get_docs_new = """  getDocuments: async () => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    const docs = getStoredDocuments();
    // In future, this will only fetch docs for current user + shared. 
    // For now, filter active only.
    return docs.filter(doc => doc.deletedAt === null);
  },"""
content = content.replace(get_docs_old, get_docs_new)

# 2. Update getFavoriteDocuments
get_favs_old = """return docs.filter(doc => doc.favoritedBy && doc.favoritedBy.includes(currentUser.email));"""
get_favs_new = """return docs.filter(doc => doc.favoritedBy && doc.favoritedBy.includes(currentUser.email) && doc.deletedAt === null);"""
content = content.replace(get_favs_old, get_favs_new)

# 3. Add getTrashedDocuments, moveToTrash, restoreFromTrash, permanentlyDelete
trash_methods = """  // Get trashed documents
  getTrashedDocuments: async () => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const currentUser = authService.getCurrentUser();
    if (!currentUser) throw new Error("Chưa đăng nhập!");

    const docs = getStoredDocuments();
    return docs.filter(doc => doc.owner === currentUser.email && doc.deletedAt !== null);
  },

  // Move document to Trash (Soft Delete)
  moveToTrash: async (documentId) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const currentUser = authService.getCurrentUser();
    if (!currentUser) throw new Error("Chưa đăng nhập!");

    const docs = getStoredDocuments();
    const docIndex = docs.findIndex((d) => d.documentId === documentId);
    if (docIndex === -1) throw new Error("Không tìm thấy tài liệu!");

    const doc = docs[docIndex];
    if (doc.owner !== currentUser.email) throw new Error("Chỉ chủ sở hữu mới có quyền đưa vào thùng rác!");

    doc.deletedAt = new Date().toISOString();
    docs[docIndex] = doc;
    saveDocuments(docs);
    return doc;
  },

  // Restore document from Trash
  restoreFromTrash: async (documentId) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const currentUser = authService.getCurrentUser();
    if (!currentUser) throw new Error("Chưa đăng nhập!");

    const docs = getStoredDocuments();
    const docIndex = docs.findIndex((d) => d.documentId === documentId);
    if (docIndex === -1) throw new Error("Không tìm thấy tài liệu!");

    const doc = docs[docIndex];
    if (doc.owner !== currentUser.email) throw new Error("Chỉ chủ sở hữu mới có quyền khôi phục!");

    doc.deletedAt = null;
    doc.updatedAt = new Date().toISOString();
    docs[docIndex] = doc;
    saveDocuments(docs);
    return doc;
  },

  // Permanently delete document
  permanentlyDelete: async (documentId) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const currentUser = authService.getCurrentUser();
    if (!currentUser) throw new Error("Chưa đăng nhập!");

    const docs = getStoredDocuments();
    const doc = docs.find((d) => d.documentId === documentId);
    if (!doc) throw new Error("Không tìm thấy tài liệu!");
    if (doc.owner !== currentUser.email) throw new Error("Chỉ chủ sở hữu mới có quyền xóa vĩnh viễn!");

    const filteredDocs = docs.filter((d) => d.documentId !== documentId);
    saveDocuments(filteredDocs);
    return { success: true };
  },"""

# Replace the existing deleteDocument with the new trash methods
delete_old = r'  // Delete document\s+deleteDocument: async \(documentId\) => \{[\s\S]*?return \{ success: true \};\s+\},'
content = re.sub(delete_old, trash_methods, content)

# 4. Add deletedAt: null in uploadDocument
upload_old = """      category: category,
      tags: tags
    };"""
upload_new = """      category: category,
      tags: tags,
      deletedAt: null
    };"""
content = content.replace(upload_old, upload_new)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
