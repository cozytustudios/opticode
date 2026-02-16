// Opticode - AI Integration Module v2.0
// Made by Cozytustudios
// Using DeepSeek API with Optichain models

const AI = {
    isStreaming: false,
    abortController: null,

    getSystemPrompt() {
        var p = 'You are Optichain, an expert AI coding assistant created by Cozytustudios for the Opticode vibe coding platform.\n\n';
        p += 'Your primary role is to help users build web applications through natural language descriptions.\n\n';
        p += 'When generating code:\n';
        p += '- Always provide complete, runnable code files\n';
        p += '- Use modern HTML5, CSS3, and ES6+ JavaScript\n';
        p += '- Include responsive design by default\n';
        p += '- Add helpful comments\n';
        p += '- Use semantic HTML elements\n';
        p += '- Create visually appealing designs\n\n';
        p += 'SMART EDITING: When asked to EDIT, MODIFY, FIX, or CHANGE existing code, use EDIT markers:\n';
        p += '<<<EDIT>>>\nFIND:\n[exact code to find]\nREPLACE:\n[new replacement code]\n<<<END_EDIT>>>\n\n';
        p += 'You can have multiple <<<EDIT>>> blocks. Only change what is needed.\n';
        p += 'If creating brand new code, use full markdown code blocks instead.\n\n';
        p += 'Format code with markdown fences: ```html, ```css, ```javascript\n';
        p += 'If user asks to create [filename], return full code for that file.\n';
        p += 'Always produce working code, not just explanations or todo lists.';
        return p;
    },

    getChatPrompt(model) {
        model = model || 'OPTICHAIN_PRO';
        var base = 'You are Optichain Chat, a helpful conversational assistant inside the Opticode coding IDE by Cozytustudios.\n';
        base += 'Respond naturally and clearly. Give direct answers. You understand English and Bangla.\n';
        base += 'Provide code only if the user asks for code.';

        if (model === 'EXAKIO_SONE') {
            return base + '\n\nUse research mode:\n- Use provided web context.\n- Add source markers like [1], [2].\n- If no context is available, say so clearly.';
        }
        if (model === 'OPTICHAIN_600B') {
            return base + '\n\nOptichain 600B mode:\n- Most powerful AI coding model with 600B parameters.\n- Provide production-quality responses.\n- Consider edge cases, performance, accessibility, scalability.';
        }
        return base;
    },

    getModelPromptBoost(model) {
        model = model || 'OPTICHAIN_PRO';
        if (model === 'OPTICHAIN_600B') {
            return 'You are using Optichain 600B - the most powerful model. Prioritize robust architecture, clean abstractions, and production-ready results.';
        }
        if (model === 'OPTICHAIN_THINKING_15') {
            return 'You are using Optichain Thinking 1.5. Use deep reasoning and produce well-structured solutions.';
        }
        if (model === 'EXAKIO_SONE') {
            return 'You are using Exakio Sone. Behave as a research-first model. Cite sources when relevant.';
        }
        return '';
    },

    getSelectionEditPrompt(language) {
        return 'You are an expert code refactoring assistant.\nEdit ONLY the user-provided selected code snippet.\nFollow the instruction exactly.\nReturn ONLY the updated ' + (language || 'text') + ' code. No markdown fences. No explanations.';
    },

    getResearchPrompt() {
        return 'You are Exakio Sone, a web research model.\nUse provided "Web research context" when available.\nPrefer concise, source-backed answers.\nAdd source labels like [1], [2].';
    },

    getChatResearchPrompt(mode) {
        var base = 'You are Optichain Research Assistant inside Opticode by Cozytustudios.\nYou understand English and Bangla.\n';
        if (mode === 'deep-research') {
            return base + 'DEEP RESEARCH MODE: Provide comprehensive, in-depth analysis. Break down complex topics. Include examples and comparisons. Structure with headings and bullet points.';
        }
        if (mode === 'web-search') {
            return base + 'WEB SEARCH MODE: Use the provided web research context. Synthesize from multiple sources. Add source markers [1], [2]. Keep answers factual.';
        }
        return base + 'CHAT MODE: Be conversational and helpful. Give clear, direct answers. Use code examples when helpful.';
    },

    getSmartEditPrompt() {
        return 'You are Optichain Smart Editor.\nONLY modify the specific parts that need changing.\nUse <<<EDIT>>> format:\n<<<EDIT>>>\nFIND:\n[exact existing code]\nREPLACE:\n[new code]\n<<<END_EDIT>>>\nYou can have multiple EDIT blocks. Keep unchanged code untouched.';
    },

    getTodoPrompt() {
        return 'You are Optichain Task Planner.\nBreak the request into a JSON task list:\n[{"task":"Description","priority":"high"},...]\nKeep tasks specific and actionable. Order logically. Return ONLY JSON.';
    },

    getPlanningPrompt() {
        return 'You are Optichain Planner.\nCreate a concise implementation plan:\n1) Goal summary\n2) Architecture/file plan\n3) Step-by-step tasks\n4) Validation checklist\nKeep plans actionable.';
    },

    getExecutionPrompt() {
        return 'You are Optichain Executor.\nFollow the given plan and produce complete working code.\nReturn code in markdown code blocks split by file type.\nDo NOT return pseudo-code or explanation-only answers.';
    },

    async gatherWebResearchContext(query) {
        var cleanQuery = String(query || '').trim().slice(0, 320);
        if (!cleanQuery) return '';

        try {
            var endpoint = 'https://api.duckduckgo.com/?q=' + encodeURIComponent(cleanQuery) + '&format=json&no_html=1&skip_disambig=1';
            var response = await fetch(endpoint);
            if (!response.ok) return '';
            var data = await response.json();

            var lines = [];
            if (data.AbstractText && data.AbstractURL) {
                lines.push('[1] ' + data.AbstractText + ' (' + data.AbstractURL + ')');
            }

            var related = Array.isArray(data.RelatedTopics) ? data.RelatedTopics : [];
            var sourceIndex = lines.length + 1;

            related.forEach(function(topic) {
                if (sourceIndex > 6) return;
                if (topic && topic.Text && topic.FirstURL) {
                    lines.push('[' + sourceIndex + '] ' + topic.Text + ' (' + topic.FirstURL + ')');
                    sourceIndex++;
                    return;
                }
                if (Array.isArray(topic && topic.Topics)) {
                    topic.Topics.forEach(function(child) {
                        if (sourceIndex > 6) return;
                        if (child && child.Text && child.FirstURL) {
                            lines.push('[' + sourceIndex + '] ' + child.Text + ' (' + child.FirstURL + ')');
                            sourceIndex++;
                        }
                    });
                }
            });

            if (lines.length === 0) return '';
            return 'Web research context for "' + cleanQuery + '":\n' + lines.join('\n');
        } catch (error) {
            return '';
        }
    },

    normalizeApiUrl(rawUrl) {
        var value = String(rawUrl || '').trim();
        if (!value) return '';

        var withProtocol = /^https?:\/\//i.test(value) ? value : 'https://' + value.replace(/^\/+/, '');

        var parsed;
        try {
            parsed = new URL(withProtocol);
        } catch (error) {
            return '';
        }

        var pathname = parsed.pathname.replace(/\/+$/, '');
        var lowerPath = pathname.toLowerCase();

        if (!lowerPath || lowerPath === '') {
            parsed.pathname = '/v1/chat/completions';
        } else if (lowerPath === '/v1') {
            parsed.pathname = '/v1/chat/completions';
        } else if (lowerPath.endsWith('/v1')) {
            parsed.pathname = pathname + '/chat/completions';
        } else if (lowerPath === '/v1/chat') {
            parsed.pathname = '/v1/chat/completions';
        } else if (lowerPath.endsWith('/v1/chat') || lowerPath.endsWith('/chat')) {
            parsed.pathname = pathname + '/completions';
        } else {
            parsed.pathname = pathname || '/v1/chat/completions';
        }

        return parsed.toString();
    },

    getFriendlyRequestError(error, timeoutSeconds) {
        if (!error) return 'Unknown API error';
        if (error.name === 'TimeoutError') return error.message || 'Request timed out after ' + timeoutSeconds + 's.';
        if (error.name === 'AbortError') return 'Request cancelled';
        if (error.name === 'TypeError') return '🌐 Network/CORS error. This usually means:\n1. Check your internet connection\n2. The API URL may be incorrect\n3. Go to Settings → AI Settings to verify your API key\n4. Try using: https://api.deepseek.com/v1/chat/completions';
        return error.message || 'Unknown API error';
    },

    async callAPI(messages, model, onStream, options) {
        model = model || 'OPTICHAIN_THINKING_15';
        options = options || {};

        var countUsage = options.countUsage !== false;
        var usageCost = Math.max(1, Number(options.usageCost) || 1);
        var baseSystemPrompt = options.systemPrompt || this.getSystemPrompt();
        var modelBoost = this.getModelPromptBoost(model);
        var systemPrompt = modelBoost ? baseSystemPrompt + '\n\n' + modelBoost : baseSystemPrompt;
        var fallbackPref = options.fallback || 'auto';

        if (countUsage && !Storage.canMakeRequest(usageCost)) {
            var info = Storage.getUsageInfo(usageCost);
            throw new Error('Not enough daily credits (' + info.used + '/' + info.limit + ' used). Need ' + usageCost + ' credits.');
        }

        var modelConfig = ENV.MODELS[model];
        if (!modelConfig) throw new Error('Invalid model selected');

        var settings = Storage.getSettings ? Storage.getSettings() : {};
        var configuredUrl = String(settings.deepseekApiUrl || '').trim();
        var configuredKey = String(settings.deepseekApiKey || '').trim();
        var envUrl = String(ENV.DEEPSEEK_API_URL || '').trim();
        var envKey = String(ENV.DEEPSEEK_API_KEY || '').trim();
        var apiUrl = this.normalizeApiUrl(configuredUrl) || this.normalizeApiUrl(envUrl);
        var apiKey = configuredKey || envKey;
        var requestTimeoutMs = Math.max(15000, Number(options.timeoutMs) || 90000);
        var timeoutSeconds = Math.round(requestTimeoutMs / 1000);

        if (!apiUrl) throw new Error('⚠️ DeepSeek API URL is missing. Go to Settings → AI Settings and enter your API URL.');
        if (!apiKey) throw new Error('⚠️ DeepSeek API key is missing. Go to Settings → AI Settings and enter your API key.');

        var preparedMessages = messages.slice();
        if (model === 'EXAKIO_SONE') {
            var latestUserPrompt = preparedMessages.slice().reverse().find(function(msg) { return msg.role === 'user'; });
            var researchContext = await this.gatherWebResearchContext(latestUserPrompt ? latestUserPrompt.content : '');
            var researchPrompt = this.getResearchPrompt();
            preparedMessages.unshift({
                role: 'system',
                content: researchContext ? researchPrompt + '\n\n' + researchContext : researchPrompt
            });
        }

        var requestBody = {
            model: modelConfig.id,
            messages: [{ role: 'system', content: systemPrompt }].concat(preparedMessages),
            temperature: 0.7,
            max_tokens: 4096
        };

        var self = this;

        try {
            var parseAPIError = async function(response) {
                var payload = {};
                try { payload = await response.clone().json(); } catch(e) {}
                var message = (payload.error && payload.error.message) || payload.message || 'API error: ' + response.status;
                if (response.status === 401) return 'Invalid API key. Update it in Settings.';
                if (response.status === 429) return 'Rate limit reached. Please wait.';
                return message;
            };

            var runRequest = async function(streamEnabled) {
                var controller = new AbortController();
                self.abortController = controller;
                var timedOut = false;
                var timeoutHandle = setTimeout(function() {
                    timedOut = true;
                    controller.abort();
                }, requestTimeoutMs);

                try {
                    var headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey };
                    if (streamEnabled) headers['Accept'] = 'text/event-stream';

                    return await fetch(apiUrl, {
                        method: 'POST',
                        headers: headers,
                        body: JSON.stringify(Object.assign({}, requestBody, { stream: streamEnabled })),
                        signal: controller.signal
                    });
                } catch (error) {
                    if (timedOut) {
                        var te = new Error('Request timed out after ' + timeoutSeconds + 's.');
                        te.name = 'TimeoutError';
                        throw te;
                    }
                    throw error;
                } finally {
                    clearTimeout(timeoutHandle);
                }
            };

            var output = '';
            if (onStream) {
                var streamResponse = await runRequest(true);
                if (!streamResponse.ok) throw new Error(await parseAPIError(streamResponse));
                output = await this.handleStreamResponse(streamResponse, onStream);
                if (!output || !output.trim()) {
                    var retryResponse = await runRequest(false);
                    if (!retryResponse.ok) throw new Error(await parseAPIError(retryResponse));
                    var retryData = await retryResponse.json();
                    output = (retryData.choices && retryData.choices[0] && retryData.choices[0].message && retryData.choices[0].message.content) || '';
                    if (output) onStream(output, output);
                }
            } else {
                var response = await runRequest(false);
                if (!response.ok) throw new Error(await parseAPIError(response));
                var data = await response.json();
                output = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
            }

            if (!output) throw new Error('Empty response from AI. Please try again.');
            if (countUsage) Storage.incrementUsage(usageCost);
            return output;

        } catch (error) {
            var reason = this.getFriendlyRequestError(error, timeoutSeconds);
            if (reason === 'Request cancelled') throw new Error(reason);

            var inferredFallback = fallbackPref === 'auto'
                ? ((options.systemPrompt || '').includes('Optichain Chat') ? 'chat' : 'code')
                : fallbackPref;

            if (inferredFallback === 'none') throw new Error(reason);

            var fallback = inferredFallback === 'chat'
                ? this.generateChatFallback(messages, reason)
                : this.generateFallback(messages, reason);

            if (onStream) onStream(fallback, fallback);
            return fallback;
        }
    },

    async handleStreamResponse(response, onStream) {
        this.isStreaming = true;
        var reader = response.body.getReader();
        var decoder = new TextDecoder();
        var fullContent = '';
        var buffer = '';

        try {
            while (true) {
                var result = await reader.read();
                if (result.done) break;

                buffer += decoder.decode(result.value, { stream: true });
                var lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (var i = 0; i < lines.length; i++) {
                    var line = lines[i].trim();
                    if (!line) continue;
                    var isSSE = line.startsWith('data:');
                    var dataStr = isSSE ? line.slice(5).trimStart() : line;
                    if (dataStr === '[DONE]') continue;

                    try {
                        var parsed = JSON.parse(dataStr);
                        var content = null;
                        if (parsed.choices && parsed.choices[0]) {
                            if (parsed.choices[0].delta && parsed.choices[0].delta.content) {
                                content = parsed.choices[0].delta.content;
                            } else if (parsed.choices[0].message && parsed.choices[0].message.content) {
                                content = parsed.choices[0].message.content;
                            }
                        }
                        if (content) {
                            fullContent += content;
                            onStream(content, fullContent);
                        }
                    } catch (e) {
                        if (isSSE) buffer = line + '\n' + buffer;
                    }
                }
            }

            var finalLine = buffer.trim();
            if (finalLine) {
                var isSSEF = finalLine.startsWith('data:');
                var dataF = isSSEF ? finalLine.slice(5).trimStart() : finalLine;
                if (dataF && dataF !== '[DONE]') {
                    try {
                        var pf = JSON.parse(dataF);
                        var cf = null;
                        if (pf.choices && pf.choices[0]) {
                            cf = (pf.choices[0].delta && pf.choices[0].delta.content) || (pf.choices[0].message && pf.choices[0].message.content);
                        }
                        if (cf) {
                            fullContent += cf;
                            onStream(cf, fullContent);
                        }
                    } catch (e) {}
                }
            }
        } finally {
            this.isStreaming = false;
        }
        return fullContent;
    },

    generateChatFallback(messages, reason) {
        var lastMsg = messages.slice().reverse().find(function(m) { return m.role === 'user'; });
        var lastText = lastMsg ? lastMsg.content : '';
        var hint = reason ? ' (' + reason + ')' : '';
        return '[API unavailable' + hint + '] Could not reach AI service.\n\nTry:\n- Check Settings > AI Settings for API key\n- Check network connection\n\n' +
            (lastText ? 'Your message: "' + lastText + '"' : '');
    },

    generateFallback(messages, reason) {
        var lastMsg = messages.slice().reverse().find(function(m) { return m.role === 'user'; });
        var lastText = lastMsg ? lastMsg.content : 'your request';
        var safeText = Utils.escapeHtml(lastText);
        var hint = reason ? ' (' + reason + ')' : '';
        var bt = '`' + '`' + '`';
        return '[API fallback' + hint + '] Quick starter:\n\n' +
            bt + 'html\n<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <title>Prototype</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <main class="wrap">\n    <h1>' + safeText + '</h1>\n    <button id="action-btn">Run Demo</button>\n    <section id="output" class="card"></section>\n  </main>\n  <script src="script.js"><' + '/script>\n</body>\n</html>\n' + bt + '\n' +
            bt + 'css\n:root{font-family:Inter,sans-serif;background:#0f0f14;color:#fff}\nbody{margin:0;min-height:100vh;display:grid;place-items:center;padding:32px}\n.wrap{width:min(960px,100%);background:#1b1b24;border:1px solid #2a2a3a;border-radius:16px;padding:28px}\nbutton{background:linear-gradient(135deg,#ff4fa3,#8b5cf6);color:#fff;border:none;padding:12px 18px;border-radius:10px;cursor:pointer}\n' + bt + '\n' +
            bt + 'javascript\ndocument.addEventListener("DOMContentLoaded",()=>{document.getElementById("action-btn").addEventListener("click",()=>{document.getElementById("output").innerHTML="<strong>Demo:</strong> Button clicked!"})});\n' + bt + '\n';
    },

    cancelRequest() {
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
        this.isStreaming = false;
    },

    async generateCode(description, context, model, options, onStream) {
        context = context || [];
        model = model || 'OPTICHAIN_THINKING_15';
        var msgs = context.concat([{ role: 'user', content: description }]);
        return this.callAPI(msgs, model, onStream, options);
    },

    async smartEdit(instruction, currentCode, context, model, onStream) {
        context = context || [];
        model = model || 'OPTICHAIN_THINKING_15';
        var bt = '`' + '`' + '`';
        var msgs = context.concat([{
            role: 'user',
            content: 'Here is my current code:\n\n' + bt + '\n' + currentCode + '\n' + bt + '\n\nPlease make ONLY these changes (do NOT rewrite the whole file): ' + instruction + '\n\nUse <<<EDIT>>> blocks to show what to find and replace.'
        }]);
        return this.callAPI(msgs, model, onStream, { systemPrompt: this.getSmartEditPrompt() });
    },

    parseEditBlocks(response) {
        var edits = [];
        var regex = /<<<EDIT>>>\s*FIND:\s*([\s\S]*?)\s*REPLACE:\s*([\s\S]*?)\s*<<<END_EDIT>>>/g;
        var match;
        while ((match = regex.exec(response)) !== null) {
            edits.push({ find: match[1].trim(), replace: match[2].trim() });
        }
        return edits;
    },

    applyEdits(code, edits) {
        var result = code;
        for (var i = 0; i < edits.length; i++) {
            if (result.includes(edits[i].find)) {
                result = result.replace(edits[i].find, edits[i].replace);
            }
        }
        return result;
    },

    async generateTodoList(prompt, model) {
        model = model || 'OPTICHAIN_THINKING_15';
        var msgs = [{ role: 'user', content: 'Break this request into a task list:\n\n' + prompt }];
        var response = await this.callAPI(msgs, model, null, {
            countUsage: false,
            systemPrompt: this.getTodoPrompt(),
            fallback: 'none'
        });

        try {
            var jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) return JSON.parse(jsonMatch[0]);
        } catch (e) {}

        var lines = response.split('\n').filter(function(l) { return l.trim(); });
        return lines.map(function(line, i) {
            return { task: line.replace(/^\d+[\.\)]\s*/, '').trim(), priority: i < 2 ? 'high' : 'medium' };
        });
    },

    async generatePlan(description, context, model) {
        context = context || [];
        model = model || 'OPTICHAIN_THINKING_15';
        var msgs = context.concat([{
            role: 'user',
            content: 'Create an implementation plan for:\n\n' + description + '\n\nReturn only the plan in markdown.'
        }]);
        var plan = await this.callAPI(msgs, model, null, {
            countUsage: false,
            systemPrompt: this.getPlanningPrompt(),
            fallback: 'none'
        });
        var bt = '`' + '`' + '`';
        if (plan.includes(bt)) {
            return '1. Define project structure\n2. Build core UI\n3. Implement features\n4. Test and polish\n5. Final verification';
        }
        return plan;
    },

    async generateCodeFromPlan(description, plan, context, model, options, onStream) {
        context = context || [];
        model = model || 'OPTICHAIN_THINKING_15';
        var msgs = context.concat([{
            role: 'user',
            content: 'User request:\n' + description + '\n\nApproved plan:\n' + plan + '\n\nExecute the plan and return complete runnable code.'
        }]);
        return this.callAPI(msgs, model, onStream, Object.assign({}, options, { systemPrompt: this.getExecutionPrompt() }));
    },

    async modifyCode(instruction, currentCode, context, model, onStream) {
        context = context || [];
        model = model || 'OPTICHAIN_THINKING_15';
        var bt = '`' + '`' + '`';
        var msgs = context.concat([{
            role: 'user',
            content: 'Here is my current code:\n\n' + bt + '\n' + currentCode + '\n' + bt + '\n\nPlease make: ' + instruction + '\n\nProvide the complete updated code.'
        }]);
        return this.callAPI(msgs, model, onStream);
    },

    async customizeSelection(selectedCode, instruction, language, model) {
        language = language || 'text';
        model = model || 'OPTICHAIN_THINKING_15';
        var bt = '`' + '`' + '`';
        var msgs = [{
            role: 'user',
            content: 'Language: ' + language + '\nInstruction: ' + instruction + '\n\nSelected code:\n' + bt + language + '\n' + selectedCode + '\n' + bt + '\n\nReturn only the updated selected code. No markdown.'
        }];
        return this.callAPI(msgs, model, null, {
            usageCost: 1,
            systemPrompt: this.getSelectionEditPrompt(language)
        });
    },

    async chatResearch(message, mode, context, model) {
        mode = mode || 'chat';
        context = context || [];
        model = model || 'EXAKIO_SONE';
        var msgs = context.slice();

        if (mode === 'web-search') {
            var webContext = await this.gatherWebResearchContext(message);
            if (webContext) msgs.push({ role: 'system', content: webContext });
        }

        msgs.push({ role: 'user', content: message });
        return this.callAPI(msgs, model, null, {
            usageCost: ENV.CHAT_RESEARCH_COST || 50,
            systemPrompt: this.getChatResearchPrompt(mode),
            fallback: 'chat'
        });
    },

    async explainCode(code, model) {
        model = model || 'OPTICHAIN_THINKING_15';
        var bt = '`' + '`' + '`';
        var msgs = [{ role: 'user', content: 'Explain this code:\n\n' + bt + '\n' + code + '\n' + bt }];
        return this.callAPI(msgs, model);
    },

    async fixCode(code, error, model, onStream) {
        model = model || 'OPTICHAIN_THINKING_15';
        var bt = '`' + '`' + '`';
        var msgs = [{ role: 'user', content: 'Fix this code:\n\n' + bt + '\n' + code + '\n' + bt + '\n\nError: ' + error }];
        return this.callAPI(msgs, model, onStream);
    },

    async improveCode(code, aspects, model, onStream) {
        model = model || 'OPTICHAIN_THINKING_15';
        aspects = aspects || [];
        var aspectsText = aspects.length > 0 ? 'Focus on: ' + aspects.join(', ') : 'Improve overall quality';
        var bt = '`' + '`' + '`';
        var msgs = [{ role: 'user', content: 'Improve this code:\n\n' + bt + '\n' + code + '\n' + bt + '\n\n' + aspectsText }];
        return this.callAPI(msgs, model, onStream);
    }
};
