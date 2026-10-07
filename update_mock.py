import re

file_path = 'src/data/mockDocuments.js'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'("uploads/doc-001/Bao_Cao_Nghien_Cuu_AWS\.pdf",\s*favoritedBy:\s*\[\])', r'\1,\n    category: "Technical",\n    tags: ["aws", "research", "cloud"]', content)
content = re.sub(r'("uploads/doc-002/Slide_Thuyet_Trinh_Giua_Ky\.pptx",\s*favoritedBy:\s*\[\])', r'\1,\n    category: "Meeting",\n    tags: ["presentation", "midterm"]', content)
content = re.sub(r'("uploads/doc-003/Danh_Sach_Sinh_Vien_Nhom_5\.xlsx",\s*favoritedBy:\s*\[\])', r'\1,\n    category: "HR",\n    tags: ["students", "list"]', content)
content = re.sub(r'("uploads/doc-004/Kien_Truc_He_Thong_Serverless\.png",\s*favoritedBy:\s*\[\])', r'\1,\n    category: "Technical",\n    tags: ["architecture", "serverless", "diagram"]', content)
content = re.sub(r'("uploads/doc-005/De_Cuong_Mon_Hoc_Cloud_Computing\.docx",\s*favoritedBy:\s*\[\])', r'\1,\n    category: "Work",\n    tags: ["syllabus", "cloud", "course"]', content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
