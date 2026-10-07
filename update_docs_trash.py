import re

file_path = 'src/pages/Documents.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace deleteDocument with moveToTrash
content = content.replace('documentService.deleteDocument(deleteId);', 'documentService.moveToTrash(deleteId);')

# Update title of modal and button text
content = content.replace('<h3>Xác nhận xóa tài liệu</h3>', '<h3>Đưa vào thùng rác</h3>')
content = content.replace('<p>Bạn có chắc chắn muốn xóa tài liệu này khỏi hệ thống? Hành động này sẽ loại bỏ tệp vĩnh viễn khỏi AWS S3 bucket và thông tin lưu trữ trong DynamoDB.</p>', '<p>Bạn có chắc muốn đưa tài liệu này vào Thùng rác không? Bạn có thể khôi phục nó sau này.</p>')
content = content.replace('<p className="delete-warning"><strong>Cảnh báo:</strong> Thao tác này không thể hoàn tác.</p>', '')
content = content.replace('{actionLoading ? "Đang xóa..." : "Xác nhận Xóa"}', '{actionLoading ? "Đang xử lý..." : "Đưa vào Thùng rác"}')

# Replace the delete icon title
content = content.replace('title="Xóa tài liệu"', 'title="Đưa vào Thùng rác"')

# Also remove from list locally on delete
# Wait, handle_delete_confirm is:
# const handleDeleteConfirm = async () => { ... loadDocuments() ... }
# If it calls loadDocuments(), it's fine.

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
