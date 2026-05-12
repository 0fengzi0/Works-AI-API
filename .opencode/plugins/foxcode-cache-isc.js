/**
 * Foxcode Cache Plugin for OpenCode
 *
 * 为 GPT / Gemini / Claude 系列模型自动注入缓存相关字段，
 * 以启用 Prompt 缓存，减少重复 token 计费。
 *
 * 工作原理：
 * - 通过 auth.loader hook 返回自定义 fetch，拦截所有发往 provider 的请求
 * - GPT 模型：注入 prompt_cache_key（同一会话复用同一 key）
 * - Gemini 模型：注入 cached_content 字段
 * - Claude 模型：在 system/tools 消息中注入 cache_control: { type: "ephemeral" }
 * - 同时移除 system prompt 中的时间戳，稳定缓存命中率
 *
 * 参考项目：https://github.com/1034378361/foxcode-cache-proxy
 * 参考项目：https://github.com/X7YUE/opencode-foxcode-aws-cache
 */

import { randomUUID } from 'crypto';

// ============ 配置 ============
const CONFIG = {
    // 匹配 GPT 模型的正则表达式
    gptModelPattern: /^(gpt|o[1-9]|chatgpt)/i,
    // 匹配 Gemini 模型的正则表达式
    geminiModelPattern: /^(gemini)/i,
    // 匹配 Claude 模型的正则表达式
    claudeModelPattern: /^(claude)/i,
    // 是否移除时间戳以稳定缓存
    removeTimestamp: true,
};

// ============ 会话缓存 Key 管理 ============
const sessionCacheKeys = new Map();

function getCacheKey(sessionId) {
    if (!sessionCacheKeys.has(sessionId)) {
        const key = `foxcode-${sessionId}-${randomUUID().slice(0, 8)}`;
        sessionCacheKeys.set(sessionId, key);
    }
    return sessionCacheKeys.get(sessionId);
}

// ============ 日志 ============
let logFn = console.log;

function log(level, msg, data) {
    const prefix = `[foxcode-cache][${new Date().toISOString()}]`;
    const emoji = level === 'info' ? '✅' : level === 'warn' ? '⚠️' : level === 'debug' ? '🔍' : '❌';
    if (data) {
        logFn(`${prefix} ${emoji} ${msg}`, data);
    } else {
        logFn(`${prefix} ${emoji} ${msg}`);
    }
}

// ============ 工具函数 ============

/**
 * 判断是否为 GPT 系列模型
 */
function isGPTModel(model) {
    if (!model || typeof model !== 'string') return false;
    return CONFIG.gptModelPattern.test(model);
}

/**
 * 判断是否为 Gemini 系列模型
 */
function isGeminiModel(model) {
    if (!model || typeof model !== 'string') return false;
    return CONFIG.geminiModelPattern.test(model);
}

/**
 * 判断是否为 Claude 系列模型
 */
function isClaudeModel(model) {
    if (!model || typeof model !== 'string') return false;
    return CONFIG.claudeModelPattern.test(model);
}

/**
 * 检查 Content-Type 是否为 JSON
 */
function isJsonContentType(headers) {
    const ct = headers.get('content-type') || '';
    return ct.includes('application/json');
}

/**
 * 解析请求 body
 */
function parseBody(body) {
    if (!body) return null;
    if (typeof body === 'string') return body;
    if (body instanceof Uint8Array) return new TextDecoder().decode(body);
    return null;
}

/**
 * 移除系统提示中的时间戳行，稳定缓存命中率
 * 匹配格式: "Current date and time: Monday, February 2, 2026 at 12:13:18 PM GMT+8"
 */
function removeTimestamp(text) {
    if (!text || typeof text !== 'string') return text;
    return text.replace(/\n?Current date and time:[^\n]*/g, '');
}

/**
 * 递归移除消息中的时间戳
 */
function removeTimestampFromMessages(messages) {
    if (!Array.isArray(messages)) return false;
    let removed = false;
    for (const msg of messages) {
        if (msg.role === 'system' && typeof msg.content === 'string') {
            const before = msg.content.length;
            msg.content = removeTimestamp(msg.content);
            if (msg.content.length !== before) removed = true;
        }
        // 处理 content 为数组的情况 (OpenAI 格式)
        if (Array.isArray(msg.content)) {
            for (const part of msg.content) {
                if (part.type === 'text' && typeof part.text === 'string') {
                    const before = part.text.length;
                    part.text = removeTimestamp(part.text);
                    if (part.text.length !== before) removed = true;
                }
            }
        }
    }
    return removed;
}

// ============ 会话状态 ============
let currentSessionId = '';
let projectId = '';

// ============ 插件主体 ============
export const FoxcodeCachePlugin = async ({ client, project }) => {
    // 初始化日志
    if (client?.app?.log) {
        logFn = (msg, data) => {
            try {
                client.app.log({
                    body: {
                        service: 'foxcode-cache',
                        level: 'info',
                        message: msg,
                        extra: data || {},
                    },
                });
            } catch {
                console.log(msg, data);
            }
        };
    }

    projectId = project?.id || '';
    log('info', 'Plugin initialized', { projectId });

    return {
        // 监听会话事件，获取 session ID
        event: async ({ event }) => {
            if (event.type === 'session.created' || event.type === 'session.updated') {
                const props = event.properties;
                const newSessionId = props?.info?.id || props?.id || '';
                if (newSessionId && newSessionId !== currentSessionId) {
                    currentSessionId = newSessionId;
                    log('debug', 'Session updated', { sessionId: currentSessionId });
                }
            }
            if (event.type === 'session.deleted') {
                // 清理缓存 key
                const deletedId = event.properties?.info?.id || event.properties?.id || '';
                if (deletedId) {
                    sessionCacheKeys.delete(deletedId);
                }
            }
        },

        // 通过 auth.loader 返回自定义 fetch，拦截请求
        auth: {
            provider: 'isc',
            methods: [{ type: 'api', label: 'key' }],
            loader: async () => ({
                fetch: async (url, init) => {
                    const headers = new Headers(init?.headers);
                    const method = (init?.method || 'GET').toUpperCase();

                    // 只拦截 POST JSON 请求
                    if (method !== 'POST' || !isJsonContentType(headers)) {
                        return fetch(url, init);
                    }

                    const rawBody = parseBody(init?.body);
                    if (!rawBody) return fetch(url, init);

                    let payload;
                    try {
                        payload = JSON.parse(rawBody);
                    } catch {
                        log('warn', 'Failed to parse request body as JSON');
                        return fetch(url, init);
                    }

                    if (!payload || typeof payload !== 'object') {
                        return fetch(url, init);
                    }

                    const model = payload.model || '';

                    // ===== 移除时间戳以稳定缓存 =====
                    if (CONFIG.removeTimestamp) {
                        let timestampRemoved = false;

                        // 处理 messages 数组中的 system 消息
                        if (removeTimestampFromMessages(payload.messages)) {
                            timestampRemoved = true;
                        }

                        // 处理 instructions 字段 (Codex/OpenAI Responses API)
                        if (payload.instructions && typeof payload.instructions === 'string') {
                            const before = payload.instructions.length;
                            payload.instructions = removeTimestamp(payload.instructions);
                            if (payload.instructions.length !== before) {
                                timestampRemoved = true;
                            }
                        }

                        if (timestampRemoved) {
                            log('debug', 'Timestamp removed for stable caching');
                        }
                    }

                    // ===== GPT 模型注入 prompt_cache_key =====
                    if (isGPTModel(model)) {
                        const sessionId = currentSessionId || 'default';
                        const originalCacheKey = payload.prompt_cache_key;

                        if (!payload.prompt_cache_key) {
                            payload.prompt_cache_key = getCacheKey(sessionId);
                            log('info', `Injected prompt_cache_key for GPT model`, {
                                model,
                                cache_key: payload.prompt_cache_key,
                                session_id: sessionId,
                                injected: !originalCacheKey,
                            });
                        } else {
                            log('debug', 'prompt_cache_key already exists', {
                                model,
                                existing_key: payload.prompt_cache_key,
                            });
                        }
                    }

                    // ===== Gemini 模型注入 cached_content =====
                    if (isGeminiModel(model)) {
                        const sessionId = currentSessionId || 'default';
                        const cacheKey = getCacheKey(sessionId);

                        if (!payload.cached_content) {
                            payload.cached_content = cacheKey;
                            log('info', 'Injected cached_content for Gemini model', {
                                model,
                                cached_content: cacheKey,
                                session_id: sessionId,
                            });
                        } else {
                            log('debug', 'cached_content already exists', {
                                model,
                                existing: payload.cached_content,
                            });
                        }
                    }

                    // ===== Claude 模型注入 cache_control =====
                    if (isClaudeModel(model)) {
                        // 在系统提示中添加 cache_control breakpoint
                        if (Array.isArray(payload.messages) && payload.messages.length > 0) {
                            // 找到最后一条 system 消息，添加 cache_control
                            let systemMsgIndex = -1;
                            for (let i = payload.messages.length - 1; i >= 0; i--) {
                                if (payload.messages[i].role === 'system') {
                                    systemMsgIndex = i;
                                    break;
                                }
                            }

                            if (systemMsgIndex >= 0) {
                                const sysMsg = payload.messages[systemMsgIndex];
                                // 如果 content 是字符串，转为数组格式以支持 cache_control
                                if (typeof sysMsg.content === 'string') {
                                    sysMsg.content = [
                                        { type: 'text', text: sysMsg.content },
                                    ];
                                }
                                // 在最后一个 content block 添加 cache_control
                                if (Array.isArray(sysMsg.content) && sysMsg.content.length > 0) {
                                    const lastBlock = sysMsg.content[sysMsg.content.length - 1];
                                    if (!lastBlock.cache_control) {
                                        lastBlock.cache_control = { type: 'ephemeral' };
                                        log('info', 'Injected cache_control for Claude model (system)', {
                                            model,
                                        });
                                    }
                                }
                            }
                        }

                        // 如果有 system 字段 (Anthropic API 格式)，也添加缓存标记
                        if (typeof payload.system === 'string' && payload.system.length > 0) {
                            payload.system = [
                                { type: 'text', text: payload.system, cache_control: { type: 'ephemeral' } },
                            ];
                            log('info', 'Injected cache_control for Claude model (system field)', {
                                model,
                            });
                        } else if (
                            Array.isArray(payload.system) &&
                            payload.system.length > 0
                        ) {
                            const lastSysBlock = payload.system[payload.system.length - 1];
                            if (!lastSysBlock.cache_control) {
                                lastSysBlock.cache_control = { type: 'ephemeral' };
                                log('info', 'Injected cache_control for Claude model (system array)', {
                                    model,
                                });
                            }
                        }

                        // 在工具定义中添加缓存标记（如果存在）
                        if (Array.isArray(payload.tools) && payload.tools.length > 0) {
                            const lastTool = payload.tools[payload.tools.length - 1];
                            if (!lastTool.cache_control) {
                                lastTool.cache_control = { type: 'ephemeral' };
                                log('debug', 'Injected cache_control for Claude model (tools)', {
                                    model,
                                });
                            }
                        }
                    }

                    // 重新序列化 body
                    headers.delete('content-length');
                    return fetch(url, {
                        ...init,
                        headers,
                        body: JSON.stringify(payload),
                    });
                },
            }),
        },
    };
};

export default FoxcodeCachePlugin;
