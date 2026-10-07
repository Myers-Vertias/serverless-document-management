import re

file_path = 'src/data/mockDocuments.js'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'status: "(active|processing)",', r'status: "\1",\n    deletedAt: null,', content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
