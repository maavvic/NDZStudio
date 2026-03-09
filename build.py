import os
import re
import shutil
import zipfile

# Configuration
PLUGIN_SLUG = 'WPPluginAIGenerator'
SOURCE_FILE = 'WPPluginAIGenerator.php'
DIST_DIR = 'dist'
PROD_API_URL = 'https://app.nodevzone.com/'
# Assets to include in the package
ASSETS = ['logo60px.png', 'readme.txt', 'uninstall.php', 'assets', 'languages']

def build():
    if not os.path.exists(SOURCE_FILE):
        print(f"Error: {SOURCE_FILE} not found.")
        return

    # Create dist directory if it doesn't exist
    if os.path.exists(DIST_DIR):
        shutil.rmtree(DIST_DIR)
    os.makedirs(DIST_DIR)

    # Create plugin folder inside dist for zipping
    plugin_dir = os.path.join(DIST_DIR, PLUGIN_SLUG)
    os.makedirs(plugin_dir)

    with open(SOURCE_FILE, 'r', encoding='utf-8') as f:
        content = f.read()

    # Get Version from PHP file
    version_match = re.search(r'Version:\s*([\d\.]+)', content)
    version = version_match.group(1) if version_match else "1.0.0"

    # 1. Remove DEV blocks
    cleaned_content = re.sub(r'// DEV-START.*?// DEV-END', '', content, flags=re.DOTALL)

    # 2. Uncomment PROD-API-URL lines
    cleaned_content = re.sub(r'// PROD-API-URL:\s*(.*?);', r'\1;', cleaned_content)

    # Save cleaned PHP to plugin folder
    dist_path = os.path.join(plugin_dir, SOURCE_FILE)
    with open(dist_path, 'w', encoding='utf-8') as f:
        f.write(cleaned_content)
    
    # 3. Copy Assets and Directories
    for asset in ASSETS:
        src = asset
        dst = os.path.join(plugin_dir, asset)
        if os.path.exists(src):
            if os.path.isdir(src):
                shutil.copytree(src, dst)
                print(f"Copied directory {asset}")
            else:
                shutil.copy2(src, dst)
                print(f"Copied file {asset}")
        else:
            if asset != 'languages': # Don't warn for languages if just starting
                print(f"Warning: Asset {asset} not found, skipping.")

    # 4. Create ZIP
    zip_filename = f"{PLUGIN_SLUG}-{version}.zip"
    zip_path = os.path.join(DIST_DIR, zip_filename)
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(plugin_dir):
            for file in files:
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, DIST_DIR)
                zipf.write(file_path, arcname)

    print(f"Successfully created production build {version} at: {plugin_dir}")
    print(f"Successfully created ZIP package at: {zip_path}")

if __name__ == "__main__":
    build()
