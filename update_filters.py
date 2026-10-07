import re

def process_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Add state
    state_search = 'const [searchQuery, setSearchQuery] = useState("");'
    new_states = 'const [searchQuery, setSearchQuery] = useState("");\n  const [categoryFilter, setCategoryFilter] = useState("all");'
    content = content.replace(state_search, new_states)

    # 2. Update filter logic
    filter_logic_orig = """    const filteredDocuments = documents.filter((doc) => {
      const matchesSearch = doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            doc.owner.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedType === "all" || doc.fileType === selectedType;
      return matchesSearch && matchesType;
    });"""
    
    filter_logic_new = """    const filteredDocuments = documents.filter((doc) => {
      const q = searchQuery.toLowerCase();
      const tagsStr = doc.tags ? doc.tags.join(" ") : "";
      const matchesSearch = doc.fileName.toLowerCase().includes(q) || 
                            doc.owner.toLowerCase().includes(q) ||
                            (doc.category && doc.category.toLowerCase().includes(q)) ||
                            tagsStr.toLowerCase().includes(q);
      const matchesType = selectedType === "all" || doc.fileType === selectedType;
      const matchesCategory = categoryFilter === "all" || doc.category === categoryFilter;
      
      return matchesSearch && matchesType && matchesCategory;
    });"""
    
    content = content.replace(filter_logic_orig, filter_logic_new)
    # regex fallback
    if filter_logic_orig not in content:
        pattern = r'const filteredDocuments = documents\.filter\(\(doc\) => \{[\s\S]*?return matchesSearch && matchesType;\s*\}\);'
        content = re.sub(pattern, filter_logic_new, content)

    # 3. Update UI
    ui_orig = """        <div className="filter-search-container">
          <div className="search-box-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="search-icon">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.637 10.637Z" />
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder="TAm kim theo tAn tp hoc ng?i sY h_u..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>"""
    
    # In regex, we just replace the wrapper part
    pattern_ui = r'<div className="filter-search-container">\s*<div className="search-box-wrapper">\s*<svg[^>]+>\s*<path[^>]+/>\s*</svg>\s*<input[^>]+value=\{searchQuery\}[^>]+/>\s*</div>'
    
    ui_new = """<div className="filter-search-container" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', width: '100%', flexWrap: 'wrap' }}>
            <div className="search-box-wrapper" style={{ flex: 1, minWidth: '300px' }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="search-icon">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.637 10.637Z" />
              </svg>
              <input
                type="text"
                className="search-input"
                placeholder="Tìm kiếm tên, người sở hữu, danh mục, thẻ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <select 
              className="form-control" 
              style={{ width: '200px', height: '42px', flexShrink: 0 }}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">Tất cả danh mục</option>
              <option value="Other">Khác (Other)</option>
              <option value="Work">Công việc (Work)</option>
              <option value="Finance">Tài chính (Finance)</option>
              <option value="HR">Nhân sự (HR)</option>
              <option value="Technical">Kỹ thuật (Technical)</option>
              <option value="Meeting">Cuộc họp (Meeting)</option>
            </select>
          </div>"""
          
    content = re.sub(pattern_ui, ui_new, content)
    
    # 4. Reset logic
    reset_orig = """setSearchQuery("");
                setSelectedType("all");"""
    reset_new = """setSearchQuery("");
                setSelectedType("all");
                setCategoryFilter("all");"""
    content = content.replace(reset_orig, reset_new)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Updated {file_path}")

process_file('src/pages/Documents.jsx')
process_file('src/pages/Favorites.jsx')
