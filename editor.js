// Opticode - Editor Module
// Made by Cozytustudios

const Editor = {
    currentFile: null,
    openFiles: [],
    previewWindow: null,
    selectionRange: null,

    // Initialize editor
    init() {
        this.setupEventListeners();
        this.setupCodeEditor();
    },

    // Setup event listeners
    setupEventListeners() {
        // Code editor input
        const codeEditor = document.getElementById('code-editor');
        if (codeEditor) {
            codeEditor.addEventListener('input', Utils.debounce(() => {
                this.handleCodeChange();
            }, 500));

            // Tab key support
            codeEditor.addEventListener('keydown', (e) => {
                if (e.key === 'Tab') {
                    e.preventDefault();
                    const start = codeEditor.selectionStart;
                    const end = codeEditor.selectionEnd;
                    codeEditor.value = codeEditor.value.substring(0, start) + '  ' + codeEditor.value.substring(end);
                    codeEditor.selectionStart = codeEditor.selectionEnd = start + 2;
                    this.handleCodeChange();
                }
            });
        }

        // Editor action buttons
        document.getElementById('customize-selection-btn')?.addEventListener('click', () => this.openSelectionEditor());
        document.getElementById('download-code-btn')?.addEventListener('click', () => this.downloadCode());
        document.getElementById('apply-selection-edit-btn')?.addEventListener('click', () => this.applySelectionEdit());
        document.getElementById('apply-selection-ai-btn')?.addEventListener('click', () => this.applySelectionEditWithAI());

        // Preview buttons
        document.getElementById('refresh-preview-btn')?.addEventListener('click', () => this.refreshPreview());
        document.getElementById('new-window-btn')?.addEventListener('click', () => this.openInNewWindow());
    },

    // Setup code editor
    setupCodeEditor() {
        const codeEditor = document.getElementById('code-editor');
        if (codeEditor) {
            // Set monospace font
            codeEditor.style.fontFamily = "'JetBrains Mono', monospace";
            codeEditor.style.tabSize = 2;
            codeEditor.addEventListener('input', () => this.updateGutter());
            codeEditor.addEventListener('scroll', () => this.syncGutterScroll());
            codeEditor.addEventListener('keyup', () => this.updateStatusBar());
            codeEditor.addEventListener('click', () => this.updateStatusBar());
            this.updateGutter();
            this.updateStatusBar();
        }
    },

    // Handle code changes
    handleCodeChange() {
        if (this.currentFile) {
            this.currentFile.content = document.getElementById('code-editor').value;
            this.currentFile.modified = true;
            this.updateTabIndicator();

            // Auto-save to project
            if (App.currentProject) {
                this.saveFileToProject(this.currentFile);
            }
        }
        this.updateGutter();
        this.updateStatusBar();
    },

    // Update tab indicator for unsaved changes
    updateTabIndicator() {
        const tab = document.querySelector(`.editor-tab[data-file-id="${this.currentFile?.id}"]`);
        if (tab) {
            const nameSpan = tab.querySelector('.file-name');
            if (nameSpan && this.currentFile?.modified) {
                if (!nameSpan.textContent.endsWith('•')) {
                    nameSpan.textContent += ' •';
                }
            }
        }
    },

    // Open file in editor
    openFile(file) {
        Utils.playSound('sound-click');

        // Check if file is already open
        const existingFile = this.openFiles.find(f => f.id === file.id);
        if (existingFile) {
            this.switchToFile(existingFile);
            return;
        }

        // Add to open files
        this.openFiles.push(file);
        this.currentFile = file;

        // Create tab
        this.createTab(file);

        // Load content
        this.loadFileContent(file);

        // Update preview
        this.updatePreview();
    },

    // Create editor tab
    createTab(file) {
        const tabsContainer = document.getElementById('editor-tabs');
        const icon = Utils.getFileIcon(file.name);

        const tab = document.createElement('button');
        tab.className = 'editor-tab active';
        tab.dataset.fileId = file.id;
        tab.innerHTML = `
            <i class="${icon}"></i>
            <span class="file-name">${file.name}</span>
            <span class="close-tab"><i class="fas fa-times"></i></span>
        `;

        // Deactivate other tabs
        tabsContainer.querySelectorAll('.editor-tab').forEach(t => t.classList.remove('active'));

        // Add tab
        tabsContainer.appendChild(tab);

        // Tab click handler
        tab.addEventListener('click', (e) => {
            if (!e.target.closest('.close-tab')) {
                this.switchToFile(file);
            }
        });

        // Close tab handler
        tab.querySelector('.close-tab').addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeFile(file);
        });
    },

    // Switch to file
    switchToFile(file) {
        Utils.playSound('sound-click');

        this.currentFile = file;
        this.loadFileContent(file);

        // Update tabs
        document.querySelectorAll('.editor-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.fileId === file.id);
        });

        // Update preview
        this.updatePreview();
    },

    // Load file content
    loadFileContent(file) {
        const codeEditor = document.getElementById('code-editor');
        if (codeEditor) {
            codeEditor.value = file.content || '';
            this.updateGutter();
            this.updateStatusBar();
        }
    },

    // Close file
    closeFile(file) {
        Utils.playSound('sound-click');

        // Remove from open files
        this.openFiles = this.openFiles.filter(f => f.id !== file.id);

        // Remove tab
        const tab = document.querySelector(`.editor-tab[data-file-id="${file.id}"]`);
        if (tab) {
            tab.remove();
        }

        // Switch to another file or clear editor
        if (this.openFiles.length > 0) {
            this.switchToFile(this.openFiles[this.openFiles.length - 1]);
        } else {
            this.currentFile = null;
            document.getElementById('code-editor').value = '';
        }
    },

    // Get default content for file type
    getDefaultContent(filename) {
        const ext = Utils.getFileExtension(filename).toLowerCase();

        switch (ext) {
            case 'html':
                return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Page</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <h1>Hello World!</h1>
    
    <script src="script.js"></script>
</body>
</html>`;
            case 'css':
                return `/* Styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
}`;
            case 'js':
                return `// JavaScript
document.addEventListener('DOMContentLoaded', () => {
    console.log('Page loaded!');
});`;
            default:
                return '';
        }
    },

    // Save file to project
    saveFileToProject(file) {
        if (!App.currentProject) return;

        const files = App.currentProject.files || [];
        const index = files.findIndex(f => f.id === file.id);

        if (index !== -1) {
            files[index] = { ...file, modified: false };
        } else {
            files.push({ ...file, modified: false });
        }

        App.currentProject.files = files;
        Storage.updateProject(App.currentProject.id, { files });
    },

    // Download code
    downloadCode() {
        if (!this.currentFile) {
            Utils.showToast('No file to download', 'warning');
            return;
        }

        Utils.downloadFile(
            this.currentFile.content,
            this.currentFile.name,
            'text/plain'
        );

        Utils.showToast('File downloaded', 'success');
    },

    buildPreviewHTML() {
        const files = App.currentProject?.files || [];
        const htmlFile = files.find(f => f.name.endsWith('.html')) || this.currentFile;
        if (!htmlFile || !htmlFile.content) return null;

        let htmlContent = htmlFile.content;
        const cssFile = files.find(f => f.name.endsWith('.css'));
        const jsFile = files.find(f => f.name.endsWith('.js'));

        // Ensure document shell exists so injection is stable.
        if (!/<html[\s>]/i.test(htmlContent)) {
            htmlContent = `<!DOCTYPE html><html><head></head><body>${htmlContent}</body></html>`;
        }
        if (!/<head[\s>]/i.test(htmlContent)) {
            htmlContent = htmlContent.replace(/<html[^>]*>/i, '$&<head></head>');
        }
        if (!/<body[\s>]/i.test(htmlContent)) {
            htmlContent = htmlContent.replace(/<\/head>/i, '</head><body></body>');
        }

        if (cssFile && !htmlContent.includes(cssFile.name)) {
            htmlContent = htmlContent.replace(/<\/head>/i, `<style>${cssFile.content}</style></head>`);
        } else if (cssFile) {
            htmlContent = htmlContent.replace(
                new RegExp(`<link[^>]*href=["']${cssFile.name}["'][^>]*>`, 'i'),
                `<style>${cssFile.content}</style>`
            );
        }

        const guardScript = `
<script>
(() => {
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href') || '';
    if (href.startsWith('#') || href.startsWith('javascript:')) return;
    e.preventDefault();
  }, true);
  document.addEventListener('submit', (e) => e.preventDefault(), true);
  const noop = () => {};
  try { window.open = noop; } catch (err) {}
})();
</script>`;
        htmlContent = htmlContent.replace(/<\/head>/i, `${guardScript}</head>`);

        if (jsFile && !htmlContent.includes(jsFile.name)) {
            htmlContent = htmlContent.replace(/<\/body>/i, `<script>${jsFile.content}</script></body>`);
        } else if (jsFile) {
            htmlContent = htmlContent.replace(
                new RegExp(`<script[^>]*src=["']${jsFile.name}["'][^>]*><\\/script>`, 'i'),
                `<script>${jsFile.content}</script>`
            );
        }

        return htmlContent;
    },

    // Update preview
    updatePreview() {
        const iframe = document.getElementById('preview-frame');
        if (!iframe) return;
        const htmlContent = this.buildPreviewHTML();
        if (!htmlContent) {
            iframe.srcdoc = '<html><body><p style="padding:20px;color:#666;">No preview available</p></body></html>';
            return;
        }
        iframe.removeAttribute('src');
        iframe.srcdoc = htmlContent;
    },

    // Refresh preview
    refreshPreview() {
        Utils.playSound('sound-click');
        this.updatePreview();
    },

    // Open preview in new window
    openInNewWindow() {
        const htmlContent = this.buildPreviewHTML();
        if (!htmlContent) {
            Utils.showToast('No HTML file to preview', 'warning');
            return;
        }

        // Open in new window
        if (this.previewWindow && !this.previewWindow.closed) {
            this.previewWindow.document.open();
            this.previewWindow.document.write(htmlContent);
            this.previewWindow.document.close();
            this.previewWindow.focus();
        } else {
            this.previewWindow = window.open('', 'preview', 'width=800,height=600');
            this.previewWindow.document.write(htmlContent);
            this.previewWindow.document.close();
        }
    },

    // Edit only the selected portion of the code editor
    openSelectionEditor() {
        const editor = document.getElementById('code-editor');
        const modal = document.getElementById('selection-edit-modal');
        const input = document.getElementById('selection-edit-input');
        const instructionInput = document.getElementById('selection-edit-instruction');

        if (!editor || !modal || !input || !instructionInput) return;

        const start = editor.selectionStart;
        const end = editor.selectionEnd;

        if (start === end) {
            Utils.showToast('Select some code to edit first.', 'warning');
            return;
        }

        this.selectionRange = { start, end };
        input.value = editor.value.slice(start, end);
        instructionInput.value = '';
        modal.classList.remove('hidden');
        instructionInput.focus();
    },

    applySelectionEdit() {
        const editor = document.getElementById('code-editor');
        const modal = document.getElementById('selection-edit-modal');
        const input = document.getElementById('selection-edit-input');

        if (!editor || !modal || !input || !this.selectionRange) return;

        const { start, end } = this.selectionRange;
        const before = editor.value.slice(0, start);
        const after = editor.value.slice(end);
        const replacement = input.value;
        editor.value = before + replacement + after;

        const newPos = start + replacement.length;
        editor.selectionStart = editor.selectionEnd = newPos;

        this.selectionRange = null;
        modal.classList.add('hidden');
        this.handleCodeChange();
        Utils.showToast('Selection updated', 'success');
    },

    async applySelectionEditWithAI() {
        const editor = document.getElementById('code-editor');
        const modal = document.getElementById('selection-edit-modal');
        const input = document.getElementById('selection-edit-input');
        const instructionInput = document.getElementById('selection-edit-instruction');
        const applyAiBtn = document.getElementById('apply-selection-ai-btn');

        if (!editor || !modal || !input || !instructionInput || !this.selectionRange || !applyAiBtn) return;

        const instruction = instructionInput.value.trim();
        if (!instruction) {
            Utils.showToast('Write what you want to change first.', 'warning');
            instructionInput.focus();
            return;
        }

        const selectedCode = input.value;
        if (!selectedCode.trim()) {
            Utils.showToast('Selected code is empty.', 'warning');
            return;
        }

        const model = document.getElementById('model-select')?.value || 'ASHER_LIO';
        const language = this.currentFile?.language || 'text';
        const originalBtnHtml = applyAiBtn.innerHTML;
        applyAiBtn.disabled = true;
        applyAiBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Applying...';

        try {
            const response = await AI.customizeSelection(selectedCode, instruction, language, model);
            const blocks = Utils.extractCode(response);
            const replacement = (blocks[0]?.code || response || '').trim();

            if (!replacement) {
                throw new Error('AI returned an empty edit.');
            }

            input.value = replacement;
            this.applySelectionEdit();
            instructionInput.value = '';
            Utils.showToast('Selection customized with AI', 'success');
        } catch (error) {
            Utils.showToast(error.message || 'Failed to customize selection', 'error');
        } finally {
            applyAiBtn.disabled = false;
            applyAiBtn.innerHTML = originalBtnHtml;
        }
    },

    updateGutter() {
        const editor = document.getElementById('code-editor');
        const gutter = document.getElementById('editor-gutter');
        if (!editor || !gutter) return;

        const lines = editor.value.split('\n').length || 1;
        let html = '';
        for (let i = 1; i <= lines; i++) {
            html += `<div>${i}</div>`;
        }
        gutter.innerHTML = html;
        this.syncGutterScroll();
        this.updateStatusBar();
    },

    updateStatusBar() {
        const editor = document.getElementById('code-editor');
        if (!editor) return;

        const text = editor.value;
        const lines = text.split('\n').length || 1;
        const selectionStart = editor.selectionStart;
        const selectionEnd = editor.selectionEnd;
        const selected = Math.abs(selectionEnd - selectionStart);

        const beforeCursor = text.slice(0, selectionEnd);
        const line = beforeCursor.split('\n').length;
        const col = beforeCursor.length - beforeCursor.lastIndexOf('\n');

        const lineInfo = document.getElementById('editor-line-info');
        const selInfo = document.getElementById('editor-selection-info');
        if (lineInfo) lineInfo.textContent = `Line ${line}:${col} • Total ${lines}`;
        if (selInfo) selInfo.textContent = `Selection: ${selected} char${selected === 1 ? '' : 's'}`;
    },

    selectLines() {
        const editor = document.getElementById('code-editor');
        if (!editor || !editor.value) {
            Utils.showToast('Open a file first', 'warning');
            return;
        }
        const input = prompt('Enter line range (e.g., 3-8 or 12):');
        if (!input) return;
        const match = input.trim().match(/^\\s*(\\d+)(?:\\s*-\\s*(\\d+))?\\s*$/);
        if (!match) {
            Utils.showToast('Invalid range. Use "start-end"', 'error');
            return;
        }
        const startLine = parseInt(match[1], 10);
        const endLine = parseInt(match[2] || match[1], 10);
        const lines = editor.value.split('\\n');
        const safeStart = Math.max(1, Math.min(startLine, lines.length));
        const safeEnd = Math.max(safeStart, Math.min(endLine, lines.length));

        let startPos = 0;
        for (let i = 0; i < safeStart - 1; i++) startPos += lines[i].length + 1;
        let endPos = startPos;
        for (let i = safeStart - 1; i < safeEnd; i++) endPos += lines[i].length + 1;

        editor.focus();
        editor.selectionStart = startPos;
        editor.selectionEnd = Math.max(startPos, endPos - 1);
        this.selectionRange = { start: editor.selectionStart, end: editor.selectionEnd };
        this.updateStatusBar();
        this.openSelectionEditor();
    },

    syncGutterScroll() {
        const editor = document.getElementById('code-editor');
        const gutter = document.getElementById('editor-gutter');
        if (!editor || !gutter) return;
        gutter.scrollTop = editor.scrollTop;
    },

    // Set code content from AI response
    setCodeFromResponse(response) {
        const files = Utils.parseFilesFromResponse(response);

        if (files.length === 0) {
            const scaffold = Utils.quickScaffold(response.slice(0, 80));
            files.push(
                { id: Utils.generateId(), name: 'index.html', content: scaffold.html, language: 'html' },
                { id: Utils.generateId(), name: 'style.css', content: scaffold.css, language: 'css' },
                { id: Utils.generateId(), name: 'script.js', content: scaffold.js, language: 'javascript' }
            );
            Utils.showToast('AI returned text only. Added starter code scaffold.', 'warning');
        }

        // Add files to project
        if (App.currentProject) {
            files.forEach(file => {
                const existingIndex = App.currentProject.files?.findIndex(f => f.name === file.name);
                if (existingIndex !== undefined && existingIndex !== -1) {
                    App.currentProject.files[existingIndex] = file;
                } else {
                    App.currentProject.files = App.currentProject.files || [];
                    App.currentProject.files.push(file);
                }
            });

            Storage.updateProject(App.currentProject.id, { files: App.currentProject.files });
            App.renderFileTree();
        }

        // Open first file in editor
        this.openFiles = [];
        document.getElementById('editor-tabs').innerHTML = '';

        files.forEach((file, index) => {
            if (index === 0) {
                this.openFile(file);
            }
        });

        // Update preview
        setTimeout(() => this.updatePreview(), 100);

        Utils.showToast(`${files.length} file(s) generated`, 'success');
    },

    // Clear editor
    clear() {
        this.currentFile = null;
        this.openFiles = [];
        document.getElementById('editor-tabs').innerHTML = '';
        document.getElementById('code-editor').value = '';
        const preview = document.getElementById('preview-frame');
        if (preview) preview.srcdoc = '';
    }
};

// Make Editor global
window.Editor = Editor;
