import re

file_path = 'src/App.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add import
content = content.replace('import Favorites from "./pages/Favorites";', 'import Favorites from "./pages/Favorites";\nimport Trash from "./pages/Trash";')

# Add route
content = content.replace('<Route path="/upload" element={<Upload />} />', '<Route path="/upload" element={<Upload />} />\n          <Route path="/trash" element={<Trash />} />')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
