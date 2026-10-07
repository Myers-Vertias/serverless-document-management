import re

file_path = 'src/pages/DocumentDetail.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# I will find all instances of handleEditOpen and handleEditSubmit and just leave the first one.
pattern = r'(  const handleEditOpen = \(\) => \{[\s\S]*?const handleEditSubmit = async \(e\) => \{[\s\S]*?\}\n  \};\n)'

matches = list(re.finditer(pattern, content))
if len(matches) > 1:
    # Replace all matches except the first one with empty string
    first_match_end = matches[0].end()
    rest_of_file = content[first_match_end:]
    
    # In the rest of the file, remove the pattern
    rest_of_file_clean = re.sub(pattern, '', rest_of_file)
    
    new_content = content[:first_match_end] + rest_of_file_clean
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Fixed duplicates in DocumentDetail.jsx")
