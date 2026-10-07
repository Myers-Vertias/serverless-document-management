import re

with open('src/services/documentService.js', 'r', encoding='utf-8') as f:
    content = f.read()

get_fav_old = """  getFavoriteDocuments: async () => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const currentUser = authService.getCurrentUser();
    if (!currentUser) throw new Error("Chưa đăng nhập!");

    const docs = getStoredDocuments();
    // Filter docs where currentUser's email is in favoritedBy and doc is not in trash
    // (Trash logic is not implemented yet, so we assume all are active for now)
    return docs.filter(doc => doc.favoritedBy && doc.favoritedBy.includes(currentUser.email) && doc.deletedAt === null);
  },"""

# Regex replacing `return docs.filter...` to check owner or sharedWith
get_fav_new = """  getFavoriteDocuments: async () => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const currentUser = authService.getCurrentUser();
    if (!currentUser) throw new Error("Chưa đăng nhập!");

    const docs = getStoredDocuments();
    return docs.filter(doc => {
      const isOwner = doc.owner === currentUser.email;
      const isShared = doc.sharedWith && doc.sharedWith.includes(currentUser.email);
      const isFavorited = doc.favoritedBy && doc.favoritedBy.includes(currentUser.email);
      return isFavorited && doc.deletedAt === null && (isOwner || isShared);
    });
  },"""

# Using string replace with regex for safety
content = re.sub(
    r'  getFavoriteDocuments: async \(\) => \{[\s\S]*?return docs\.filter\(doc => doc\.favoritedBy && doc\.favoritedBy\.includes\(currentUser\.email\) && doc\.deletedAt === null\);\n  \},',
    get_fav_new,
    content
)

with open('src/services/documentService.js', 'w', encoding='utf-8') as f:
    f.write(content)
