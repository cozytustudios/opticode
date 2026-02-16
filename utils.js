// Opticode - Utility Functions
// Made by Cozytustudios

const Utils = {
    // Generate unique ID
    generateId() {
        return 'id_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    },

    // Format date
    formatDate(date) {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(date));
    },

    // Debounce function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Throttle function
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // Escape HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    // Parse markdown-like code blocks
    parseCodeBlocks(text) {
        return text.replace(/```([^\n`]*)\n([\s\S]*?)```/g, (match, header, code) => {
            const token = (header || '').trim().split(/\s+/).filter(Boolean)[0] || '';
            const language = token.includes('.') ? Utils.getLanguage(token) : token.toLowerCase();
            return `<pre class="code-block" data-lang="${language || 'code'}"><code>${Utils.escapeHtml(code.trim())}</code></pre>`;
        }).replace(/`([^`]+)`/g, '<code>$1</code>');
    },

    // Format file size
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    // Get file extension
    getFileExtension(filename) {
        return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
    },

    // Get file icon
    getFileIcon(filename) {
        const ext = Utils.getFileExtension(filename).toLowerCase();
        const icons = {
            'html': 'fab fa-html5',
            'htm': 'fab fa-html5',
            'css': 'fab fa-css3-alt',
            'js': 'fab fa-js',
            'json': 'fas fa-file-code',
            'md': 'fab fa-markdown',
            'txt': 'fas fa-file-alt',
            'png': 'fas fa-image',
            'jpg': 'fas fa-image',
            'jpeg': 'fas fa-image',
            'gif': 'fas fa-image',
            'svg': 'fas fa-image',
            'pdf': 'fas fa-file-pdf',
            'zip': 'fas fa-file-archive',
            'py': 'fab fa-python',
            'ts': 'fab fa-js',
            'tsx': 'fab fa-react',
            'jsx': 'fab fa-react',
            'vue': 'fab fa-vuejs',
        };
        return icons[ext] || 'fas fa-file-code';
    },

    // Get language from extension
    getLanguage(filename) {
        const ext = Utils.getFileExtension(filename).toLowerCase();
        const languages = {
            'html': 'html',
            'htm': 'html',
            'css': 'css',
            'js': 'javascript',
            'json': 'json',
            'md': 'markdown',
            'py': 'python',
            'ts': 'typescript',
            'tsx': 'typescript',
            'jsx': 'javascript',
        };
        return languages[ext] || 'text';
    },

    // Copy to clipboard
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.left = '-999999px';
            document.body.appendChild(textarea);
            textarea.select();
            try {
                document.execCommand('copy');
                return true;
            } catch (e) {
                return false;
            } finally {
                document.body.removeChild(textarea);
            }
        }
    },

    // Download file
    downloadFile(content, filename, mimeType = 'text/plain') {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    // Download project as ZIP
    async downloadProjectAsZip(project) {
        // Simple implementation - just download files individually
        // In production, you'd use a library like JSZip
        const files = project.files || [];
        if (files.length === 1) {
            Utils.downloadFile(files[0].content, files[0].name);
        } else {
            files.forEach(file => {
                Utils.downloadFile(file.content, file.name);
            });
        }
    },

    // Play sound
    playSound(soundId, volume = 0.5) {
        const settings = Storage.getSettings();
        if (!settings.soundEnabled) return;

        const audio = document.getElementById(soundId);
        if (audio) {
            audio.volume = volume;
            audio.currentTime = 0;
            audio.play().catch(() => {});
        }
    },

    // Trigger haptic feedback
    triggerHaptic(type = 'light') {
        const settings = Storage.getSettings();
        if (!settings.hapticEnabled) return;

        if ('vibrate' in navigator) {
            switch (type) {
                case 'light':
                    navigator.vibrate(10);
                    break;
                case 'medium':
                    navigator.vibrate(25);
                    break;
                case 'heavy':
                    navigator.vibrate(50);
                    break;
                case 'success':
                    navigator.vibrate([10, 50, 10]);
                    break;
                case 'error':
                    navigator.vibrate([50, 30, 50]);
                    break;
            }
        }
    },

    // Show toast notification
    showToast(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type} animate-slide-left`;
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };

        toast.innerHTML = `
            <i class="${icons[type]}"></i>
            <span>${message}</span>
        `;

        container.appendChild(toast);

        Utils.playSound('sound-click');
        Utils.triggerHaptic(type === 'error' ? 'error' : 'light');

        setTimeout(() => {
            toast.classList.add('animate-slide-right');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    // Auto-resize textarea
    autoResizeTextarea(textarea, maxHeight = 200) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, maxHeight) + 'px';
    },

    // Get today's date key for usage tracking
    getTodayKey() {
        return new Date().toISOString().split('T')[0];
    },

    // Check if string is valid JSON
    isValidJson(str) {
        try {
            JSON.parse(str);
            return true;
        } catch (e) {
            return false;
        }
    },

    // Deep clone object
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    // Simple template engine
    template(str, data) {
        return str.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return data[key] !== undefined ? data[key] : match;
        });
    },

    // Create element from HTML string
    createElement(html) {
        const template = document.createElement('template');
        template.innerHTML = html.trim();
        return template.content.firstChild;
    },

    // Rough time estimate (minutes) based on description length
    estimateTaskMinutes(text) {
        if (!text) return 1;
        const length = text.trim().length;
        // base 2 minutes + 1 minute per 120 characters, capped to a reasonable range
        const minutes = Math.min(60, Math.max(1, Math.ceil(2 + length / 120)));
        return minutes;
    },

    // Create a minimal scaffold if AI returns no code
    quickScaffold(prompt = 'Your app') {
        const title = Utils.escapeHtml(prompt.slice(0, 60) || 'Prototype');
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <main class="wrap">
    <header class="hero">
      <p class="eyebrow">Generated starter</p>
      <h1>${title}</h1>
      <p class="lead">Edit this scaffold to match your task.</p>
      <div class="actions">
        <button id="primary-btn">Run Action</button>
        <button class="ghost" id="secondary-btn">Secondary</button>
      </div>
    </header>
    <section id="output" class="card">Output will appear here.</section>
  </main>
  <script src="script.js"></script>
</body>
</html>`;

        const css = `:root { color-scheme: dark; font-family: 'Inter', system-ui, sans-serif; }
* { box-sizing: border-box; }
body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #0f0f14; color: #f8fafc; padding: 24px; }
.wrap { width: min(960px, 100%); background: #161622; border: 1px solid #262638; border-radius: 18px; padding: 28px; box-shadow: 0 20px 60px rgba(0,0,0,0.35); }
.hero { display: grid; gap: 10px; }
.eyebrow { text-transform: uppercase; letter-spacing: 0.08em; font-size: 11px; color: #a5b4fc; }
.lead { color: #cbd5e1; }
.actions { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 8px; }
button { border: none; border-radius: 12px; padding: 12px 16px; font-weight: 600; cursor: pointer; transition: transform .15s ease, box-shadow .2s ease; }
button#primary-btn { background: linear-gradient(135deg, #ff4fa3, #8b5cf6); color: #fff; }
button.ghost { background: transparent; color: #e5e7eb; border: 1px solid #3b3b55; }
button:hover { transform: translateY(-1px); box-shadow: 0 10px 25px rgba(255,79,163,0.25); }
.card { margin-top: 18px; padding: 16px; border: 1px dashed #30304a; border-radius: 14px; min-height: 100px; background: #0f0f1a; }`;

        const js = `document.addEventListener('DOMContentLoaded', () => {
  const out = document.getElementById('output');
  document.getElementById('primary-btn')?.addEventListener('click', () => {
    out.innerHTML = '<strong>Primary action:</strong> replace with your logic.';
  });
  document.getElementById('secondary-btn')?.addEventListener('click', () => {
    out.innerHTML = '<em>Secondary action clicked.</em>';
  });
});`;

        return { html, css, js };
    },

    // Wait for element
    waitForElement(selector, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
                return;
            }

            const observer = new MutationObserver((mutations, obs) => {
                const element = document.querySelector(selector);
                if (element) {
                    obs.disconnect();
                    resolve(element);
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Element ${selector} not found`));
            }, timeout);
        });
    },

    // Animate element
    animate(element, animationClass, duration = 300) {
        return new Promise(resolve => {
            element.classList.add(animationClass);
            setTimeout(() => {
                element.classList.remove(animationClass);
                resolve();
            }, duration);
        });
    },

    // Extract code from AI response
    extractCode(response) {
        const codeBlocks = [];
        const regex = /```([^\n`]*)\n([\s\S]*?)```/g;
        const aliases = {
            js: 'javascript',
            jsx: 'javascript',
            ts: 'typescript',
            tsx: 'typescript',
            py: 'python',
            md: 'markdown',
            yml: 'yaml',
            sh: 'bash'
        };
        let match;

        while ((match = regex.exec(response)) !== null) {
            const header = (match[1] || '').trim();
            const firstToken = header.split(/\s+/).filter(Boolean)[0] || '';
            const tokenLooksLikeFile = /\.[a-z0-9]+$/i.test(firstToken);
            const rawLanguage = tokenLooksLikeFile
                ? Utils.getLanguage(firstToken)
                : firstToken.toLowerCase();
            const language = aliases[rawLanguage] || rawLanguage || 'text';

            codeBlocks.push({
                language,
                header,
                code: match[2].trim(),
                index: match.index,
                endIndex: regex.lastIndex
            });
        }

        return codeBlocks;
    },

    // Generate HTML preview with CSS and JS
    generatePreview(html, css = '', js = '') {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        ${css}
    </style>
</head>
<body>
    ${html}
    <script>
        ${js}
    </script>
</body>
</html>`;
    },

    // Parse response for files
    parseFilesFromResponse(response) {
        const files = [];
        const codeBlocks = Utils.extractCode(response);
        const usedNames = new Set();
        const langToFile = {
            html: 'index.html',
            css: 'style.css',
            javascript: 'script.js',
            json: 'data.json',
            python: 'main.py',
            typescript: 'main.ts',
            markdown: 'README.md',
            text: 'notes.txt'
        };
        const langToExtension = {
            html: 'html',
            css: 'css',
            javascript: 'js',
            json: 'json',
            python: 'py',
            typescript: 'ts',
            markdown: 'md',
            text: 'txt'
        };

        const cleanFilename = (value = '') => {
            if (!value) return '';
            let name = String(value).trim();
            name = name.replace(/^['"`]+|['"`]+$/g, '');
            name = name.replace(/^file(name)?\s*[:=]\s*/i, '');
            name = name.replace(/^path\s*[:=]\s*/i, '');
            name = name.replace(/^\.\/+/, '');
            name = name.replace(/[),.;:]+$/g, '');
            if (name.includes('://')) return '';
            if (!/^[a-zA-Z0-9][a-zA-Z0-9._/-]*\.[a-zA-Z0-9]+$/.test(name)) return '';
            return name;
        };

        const pickFilename = (text = '') => {
            const regex = /`?([a-zA-Z0-9][a-zA-Z0-9._/-]*\.[a-zA-Z0-9]+)`?/g;
            let match;
            let last = '';
            while ((match = regex.exec(text)) !== null) {
                const candidate = cleanFilename(match[1]);
                if (candidate) {
                    last = candidate;
                }
            }
            return last;
        };

        const uniqueName = (filename) => {
            if (!filename) return '';
            const normalized = filename.toLowerCase();
            if (!usedNames.has(normalized)) {
                usedNames.add(normalized);
                return filename;
            }
            const ext = Utils.getFileExtension(filename);
            const base = ext ? filename.slice(0, -(ext.length + 1)) : filename;
            let n = 2;
            let next = `${base}-${n}.${ext || 'txt'}`;
            while (usedNames.has(next.toLowerCase())) {
                n += 1;
                next = `${base}-${n}.${ext || 'txt'}`;
            }
            usedNames.add(next.toLowerCase());
            return next;
        };

        codeBlocks.forEach((block, index) => {
            const content = block.code;
            const header = block.header || '';
            const firstLine = content.split('\n')[0]?.trim() || '';
            const previousBoundary = index > 0 ? (codeBlocks[index - 1].endIndex || 0) : 0;
            const beforeStart = Math.max(previousBoundary, (block.index || 0) - 260);
            const beforeText = response.slice(beforeStart, block.index || 0);
            let filename =
                cleanFilename(header.split(/\s+/).find(part => part.includes('.')) || '') ||
                pickFilename(firstLine) ||
                pickFilename(beforeText);

            let language = block.language || 'text';
            if (filename) {
                const inferred = Utils.getLanguage(filename);
                if (inferred && inferred !== 'text') {
                    language = inferred;
                }
            }

            if (!filename) {
                filename = langToFile[language];
            }

            if (!filename) {
                const extension = langToExtension[language] || 'txt';
                filename = `file${index + 1}.${extension}`;
            }

            files.push({
                id: Utils.generateId(),
                name: uniqueName(filename),
                content,
                language
            });
        });

        return files;
    }
};

// Make Utils global
window.Utils = Utils;
