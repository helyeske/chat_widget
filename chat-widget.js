/**
 * Semmelweis University Translational Medicine Chatbot Widget
 * Version: 1.0.0
 * 
 * SSE-enabled chat widget with real-time streaming responses
 */
(function() {
    'use strict';
    
    // ========================================
    // CONFIGURATION
    // ========================================

    /**
     * Deep merge utility function for nested configuration objects
     * @param {Object} target - The target object
     * @param {Object} source - The source object to merge into target
     * @returns {Object} - The merged object
     */
    function deepMerge(target, source) {
        const output = { ...target };

        if (isObject(target) && isObject(source)) {
            Object.keys(source).forEach(key => {
                if (isObject(source[key])) {
                    if (!(key in target)) {
                        Object.assign(output, { [key]: source[key] });
                    } else {
                        output[key] = deepMerge(target[key], source[key]);
                    }
                } else {
                    Object.assign(output, { [key]: source[key] });
                }
            });
        }

        return output;
    }

    function isObject(item) {
        return item && typeof item === 'object' && !Array.isArray(item);
    }

    // ========================================
    // CONVERSATION PERSISTENCE TTL PRESETS
    // ========================================
    const TTL_PRESETS = {
        SHORT: 24 * 60 * 60 * 1000,       // 24 hours - for transactional sites
        MEDIUM: 3 * 24 * 60 * 60 * 1000,   // 3 days - recommended default
        LONG: 7 * 24 * 60 * 60 * 1000      // 7 days - for B2B/complex products
    };

    const DEFAULT_CONFIG = {
        // API Configuration
        apiEndpoint: 'https://ctm-chat.fylio.workers.dev',
        retries: 2,
        timeoutMs: 20000,
        streamBatchIntervalMs: 1000,
        streamChunkDelayMs: 80,  // Delay between displaying chunks from queue (legacy, kept for compatibility)
        streamCharDelayMs: 5,   // Milliseconds per character for typewriter effect (30ms = ~33 chars/sec, smooth and readable)
        fallbackResponse: "I'm sorry, I'm having trouble connecting right now. Please try again or contact us at tmk@semmelweis.hu",

        // Branding & Customization
        branding: {
            botName: 'Zsanett AI',
            botAvatar: 'chatbot_icon.jpg',  // Used in panel header and bot messages - can be emoji or image URL
            widgetIcon: '<svg viewBox="0 0 30 30" fill="none"><g clip-path="url(#clip0_114_14)"><path d="M8 14H13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 18H16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 10H13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M17 5H7.5C6.50544 5 5.55161 5.39509 4.84835 6.09835C4.14509 6.80161 3.75 7.75544 3.75 8.75V18.75C3.75 19.7446 4.14509 20.6984 4.84835 21.4017C5.55161 22.1049 6.50544 22.5 7.5 22.5H10V26.25L16.25 22.5H22.5C23.4946 22.5 24.4484 22.1049 25.1517 21.4017C25.8549 20.6984 26.25 19.7446 26.25 18.75V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M25.8462 11.5391L21.9846 13.0615L20.4609 16.923L18.9385 13.0615L15.077 11.5391L18.9385 10.0154L20.4609 6.15381L21.9846 10.0154L25.8462 11.5391Z" fill="currentColor"/><path d="M26.8337 11.5846C26.8337 11.8226 26.6867 12.0396 26.464 12.1265C26.464 12.1265 23.5345 12.5931 22.3994 13.801C21.2643 15.0089 20.9587 17.6318 20.9587 17.6318C20.9155 17.7405 20.8407 17.8336 20.7439 17.8993C20.6472 17.9649 20.533 18 20.4161 18C20.2992 18 20.185 17.9649 20.0883 17.8993C19.9915 17.8336 19.9167 17.7405 19.8735 17.6318C19.8735 17.6318 19.4886 14.8555 18.3166 13.6834C17.1445 12.5114 14.3682 12.1265 14.3682 12.1265C14.2595 12.0833 14.1664 12.0085 14.1007 11.9117C14.0351 11.815 14 11.7008 14 11.5839C14 11.467 14.0351 11.3528 14.1007 11.2561C14.1664 11.1593 14.2595 11.0845 14.3682 11.0413C14.3682 11.0413 17.1445 10.6564 18.3166 9.48438C19.4886 8.31235 19.8735 5.53596 19.8735 5.53596C19.9167 5.42733 19.9915 5.33417 20.0883 5.26853C20.185 5.20289 20.2992 5.1678 20.4161 5.1678C20.533 5.1678 20.6472 5.20289 20.7439 5.26853C20.8407 5.33417 20.9155 5.42733 20.9587 5.53596C20.9587 5.53596 21.3436 8.31235 22.5156 9.48438C23.6877 10.6564 26.464 11.0413 26.464 11.0413C26.5727 11.0848 26.666 11.1597 26.7318 11.2565C26.7977 11.3533 26.8331 11.4675 26.8337 11.5846ZM24.6592 11.5846L21.8534 10.4771C21.779 10.4475 21.7115 10.4031 21.6549 10.3465C21.5983 10.2899 21.5539 10.2224 21.5243 10.148L20.4182 7.34075L19.3093 10.148C19.2799 10.2223 19.2356 10.2897 19.1793 10.3463C19.123 10.4028 19.0557 10.4473 18.9816 10.4771L16.173 11.5832L18.9816 12.6921C19.0556 12.7217 19.1228 12.766 19.1791 12.8223C19.2354 12.8786 19.2797 12.9458 19.3093 13.0198L20.4168 15.8284L21.5243 13.0198C21.5541 12.9457 21.5986 12.8784 21.6551 12.8221C21.7117 12.7658 21.7791 12.7215 21.8534 12.6921L24.6592 11.5846ZM28 6.33405C28 6.33405 26.8941 6.59145 26.4094 7.07612C25.9248 7.5608 25.6674 8.66669 25.6674 8.66669C25.6674 8.66669 25.4089 7.56076 24.9239 7.07612C24.439 6.59166 23.3333 6.33405 23.3333 6.33405C23.3333 6.33405 24.4392 6.07666 24.9239 5.59197C25.4089 5.10693 25.666 4 25.666 4C25.666 4 25.9235 5.10571 26.408 5.59057C26.893 6.07594 28 6.33405 28 6.33405Z" fill="currentColor"/></g><defs><clipPath id="clip0_114_14"><rect width="30" height="30" fill="white"/></clipPath></defs></svg>',  // Widget bubble icon only
            colors: {
                primary: '#8B5CF6'  // Your brand color - applied to header, buttons, accents, user messages
            }
        },

        // Content Customization
        content: {
            barPlaceholder: 'Got any questions?',
            panelPlaceholder: 'Type a message...',
            quickQuestions: [
                { text: "What programs do you offer?", emoji: "🎓" },
                { text: "How can I apply?", emoji: "📝" },
                { text: "Tell me about tuition fees", emoji: "💰" }
            ],
            quickQuestionsHeader: 'Frequently Asked Questions',
            quickQuestionsHeaderEmoji: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 18a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2zm0 -12a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2zm-7 12a6 6 0 0 1 6 -6a6 6 0 0 1 -6 -6a6 6 0 0 1 -6 6a6 6 0 0 1 6 6z"/></svg>'
        },

        // UI Visibility Controls
        ui: {
            showFloatingBar: true,  // Show/hide the floating chat input bar at the bottom
            showPoweredBy: true     // Show/hide "Powered by" attribution
        },

        // Powered By Attribution (internal - not user configurable)
        poweredBy: {
            enabled: true,  // DEPRECATED: Use ui.showPoweredBy instead
            text: 'Powered by',
            brandName: 'Fylio',
            brandUrl: 'https://fylio.hu',
            logoUrl: './favicon.svg'
        },

        // Conversation Persistence Settings
        persistence: {
            enabled: true,                          // Enable/disable conversation persistence
            conversationTTL: TTL_PRESETS.MEDIUM,    // Time-to-live: 3 days (default)
            storageKey: 'chat_conversation'         // localStorage key
        },

        // Rich Content Feature Flags (OFF by default for safety)
        enableRichContent: true,      // Master switch for all rich content features
        enableMarkdown: true,         // Enable markdown rendering (requires marked.js)
        enableCards: true,            // Enable structured cards and carousels
        fallbackToPlainText: true,     // Fallback to plain text if libraries fail to load

        // DEPRECATED: Legacy support for old config format
        quickQuestions: undefined      // Will be mapped from content.quickQuestions
    };

    // Merge with user config if provided (with backward compatibility)
    let CONFIG;
    if (typeof window.ChatbotConfig !== 'undefined') {
        const userConfig = window.ChatbotConfig;

        // BACKWARD COMPATIBILITY: Map old flat config to new nested structure
        const normalizedConfig = { ...userConfig };

        // If user provided old-style quickQuestions at root level, map to content.quickQuestions
        if (userConfig.quickQuestions && !userConfig.content?.quickQuestions) {
            normalizedConfig.content = normalizedConfig.content || {};
            normalizedConfig.content.quickQuestions = userConfig.quickQuestions;
        }

        CONFIG = deepMerge(DEFAULT_CONFIG, normalizedConfig);
    } else {
        CONFIG = DEFAULT_CONFIG;
    }

    // Convert TTL preset strings to numeric values
    if (CONFIG.persistence?.conversationTTL && typeof CONFIG.persistence.conversationTTL === 'string') {
        const presetKey = CONFIG.persistence.conversationTTL.toUpperCase();
        if (TTL_PRESETS[presetKey]) {
            CONFIG.persistence.conversationTTL = TTL_PRESETS[presetKey];
        } else {
            console.warn(`[ChatWidget] Invalid TTL preset: ${CONFIG.persistence.conversationTTL}. Using default (MEDIUM).`);
            CONFIG.persistence.conversationTTL = TTL_PRESETS.MEDIUM;
        }
    }

    // Set quickQuestions at root level for backward compatibility with existing code
    CONFIG.quickQuestions = CONFIG.content?.quickQuestions || DEFAULT_CONFIG.content.quickQuestions;

    // ========================================
    // LIBRARY LOADING (for Rich Content)
    // ========================================
    let LIBRARIES_LOADED = {
        marked: false,
        DOMPurify: false
    };

    function loadLibraries() {
        return new Promise((resolve) => {
            // Load libraries if either markdown or rich content features are enabled
            if (!CONFIG.enableMarkdown && !CONFIG.enableRichContent) {
                console.log('[Chatbot] Markdown and rich content disabled, skipping library load');
                resolve(false);
                return;
            }

            let loadedCount = 0;
            const totalLibraries = 2;

            function checkComplete() {
                loadedCount++;
                if (loadedCount === totalLibraries) {
                    const allLoaded = LIBRARIES_LOADED.marked && LIBRARIES_LOADED.DOMPurify;
                    console.log('[Chatbot] Libraries loaded:', allLoaded ? 'success' : 'failed');
                    resolve(allLoaded);
                }
            }

            // Load marked.js (markdown parser)
            const markedScript = document.createElement('script');
            markedScript.src = 'https://cdn.jsdelivr.net/npm/marked@11.1.1/marked.min.js';
            markedScript.onload = () => {
                LIBRARIES_LOADED.marked = typeof window.marked !== 'undefined';
                if (LIBRARIES_LOADED.marked) {
                    console.log('[Chatbot] marked.js loaded successfully');
                }
                checkComplete();
            };
            markedScript.onerror = () => {
                console.warn('[Chatbot] Failed to load marked.js - markdown rendering will be disabled');
                checkComplete();
            };
            document.head.appendChild(markedScript);

            // Load DOMPurify (HTML sanitization)
            const purifyScript = document.createElement('script');
            purifyScript.src = 'https://cdn.jsdelivr.net/npm/dompurify@3.0.8/dist/purify.min.js';
            purifyScript.onload = () => {
                LIBRARIES_LOADED.DOMPurify = typeof window.DOMPurify !== 'undefined';
                if (LIBRARIES_LOADED.DOMPurify) {
                    console.log('[Chatbot] DOMPurify loaded successfully');
                }
                checkComplete();
            };
            purifyScript.onerror = () => {
                console.warn('[Chatbot] Failed to load DOMPurify - HTML sanitization will be disabled');
                checkComplete();
            };
            document.head.appendChild(purifyScript);
        });
    }

    // ========================================
    // CSS INJECTION
    // ========================================

    /**
     * Generate CSS variables from configuration
     * @returns {string} CSS variable declarations
     */
    function generateCSSVariables() {
        const primary = CONFIG.branding.colors.primary;

        return `
        :root {
            /* Brand Colors (Customizable - only primary color) */
            --sw-primary: ${primary};
            --sw-primary-light: ${primary};  /* Uses primary for active states */

            /* Background Colors (Fixed for consistency) */
            --sw-panel-bg: #f1f3f5;
            --sw-card-bg: #ffffff;
            --sw-header-bg: ${primary};  /* Header uses primary color */
            --sw-input-area-bg: #e5e7eb;
            --sw-input-field-bg: #ffffff;

            /* Message Colors */
            --sw-message-bot-bg: #f3f4f6;  /* gray-100 - matches avatar background */
            --sw-message-user-bg: ${primary};  /* User messages use primary color */

            /* Input Colors (Fixed) */
            --sw-input-border: #f3f4f6;
            --sw-input-border-active: ${primary};  /* Active border uses primary */

            /* Text Colors (Fixed for readability) */
            --sw-text-primary: #1f2937;
            --sw-text-secondary: #6b7280;
            --sw-text-light: #9ca3af;

            /* Button Colors (Fixed) */
            --sw-button-disabled: #d1d5db;
            --sw-button-disabled-text: #a1a1aa;

            /* Animation Timing (Premium consistency) */
            --sw-timing-instant: 0.15s;
            --sw-timing-fast: 0.2s;
            --sw-timing-normal: 0.35s;
            --sw-timing-slow: 0.5s;

            /* Easing Functions (Premium feel) */
            --sw-ease-premium: cubic-bezier(0.4, 0, 0.2, 1);
            --sw-ease-bounce: cubic-bezier(0.34, 1.4, 0.64, 1);
            --sw-ease-smooth: cubic-bezier(0.25, 0.1, 0.25, 1);

            /* Shadow System (4-tier hierarchy) */
            --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.04);
            --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.08);
            --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.12);
            --shadow-xl: 0 12px 48px rgba(0, 0, 0, 0.16);
        }
        `;
    }

    const CSS = `
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        #semmelweis-chat-widget {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', sans-serif;
            position: fixed;
            z-index: 999999;
        }

        /* Compact Chat Input Bar */
        .sw-chat-input-bar {
            position: fixed;
            bottom: 24px;
            left: 50%;
            transform: translateX(-50%) scale(1);
            background: white;
            border-radius: 40px;
            box-shadow: var(--shadow-lg);
            padding: 6px 12px;
            display: flex;
            align-items: center;
            gap: 8px;
            width: 320px;
            transition:
                transform var(--sw-timing-normal) var(--sw-ease-bounce),
                width var(--sw-timing-normal) var(--sw-ease-premium),
                box-shadow var(--sw-timing-fast) ease;
            pointer-events: all;
            will-change: transform, width;
        }

        .sw-chat-input-bar:hover:not(.expanding) {
            transform: translateX(-50%) scale(1.02);
            box-shadow: var(--shadow-xl);
        }

        .sw-chat-input-bar:not(:hover) {
            transform: translateX(-50%) scale(1);
        }

        .sw-chat-input-bar.expanded {
            width: 380px;
            transform: translateX(-50%) scale(1);
        }

        .sw-chat-input-bar.expanded:hover:not(.expanding) {
            transform: translateX(-50%) scale(1.02);
        }

        .sw-chat-input-bar.expanded:not(:hover) {
            transform: translateX(-50%) scale(1);
        }

        .sw-chat-input-bar.expanding {
            transition:
                transform var(--sw-timing-slow) var(--sw-ease-bounce),
                width var(--sw-timing-slow) var(--sw-ease-premium),
                box-shadow var(--sw-timing-normal) ease;
        }

        .sw-chat-input-bar.expanding:hover {
            transform: translateX(-50%) scale(1.01);
        }

        .sw-chat-input-bar.hidden {
            opacity: 0;
            transform: translateX(-50%) translateY(120%) scale(0.95);
            pointer-events: none;
            transition:
                opacity var(--sw-timing-normal) ease,
                transform var(--sw-timing-normal) var(--sw-ease-premium);
        }

        .sw-chat-input-bar.hidden:hover {
            transform: translateX(-50%) translateY(120%) scale(0.95);
        }

        .sw-chat-input-bar.dismissed {
            display: none;
        }
        @media (max-width: 768px) {
            .sw-chat-input-bar {
                display: none !important;
            }
         }

        .sw-chat-avatar-mini {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: transparent;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            color: var(--sw-primary);
            font-size: 18px;
            cursor: default;
            transition: all var(--sw-timing-fast) var(--sw-ease-smooth);
        }

        .sw-chat-avatar-mini:hover {
            transform: scale(1.08);
        }

        .sw-chat-avatar-mini svg {
            width: 20px;
            height: 20px;
        }

        .sw-bar-chat-input {
            flex: 1;
            border: none;
            outline: none;
            background: transparent;
            font-size: 14px;
            line-height: 1.2;
            color: var(--sw-text-primary);
            padding: 4px 4px;
        }

        .sw-bar-chat-input:focus-visible {
            outline: none;
        }

        .sw-bar-icon-btn {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: #9DA3AF; /* gray-400 - default/disabled state */
            border: none;
            color: white;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all var(--sw-timing-fast) var(--sw-ease-premium);
            flex-shrink: 0;
            overflow: hidden;
        }

        .sw-bar-icon-btn.send-btn {
            background: #9DA3AF; /* gray-400 - inactive/disabled */
        }

        .sw-bar-icon-btn.send-btn:not(.active) {
            cursor: default; /* Regular cursor when disabled */
        }

        .sw-bar-icon-btn.send-btn.active {
            background: var(--sw-primary); /* Primary color when active */
            color: white;
            box-shadow: var(--shadow-sm);
        }

        .sw-bar-icon-btn.send-btn.active:hover {
            transform: scale(1.03);
            box-shadow: var(--shadow-md);
        }

        .sw-bar-icon-btn.close-btn {
            background: #9DA3AF; /* gray-400 - same as inactive send button */
            color: white;
        }

        .sw-bar-icon-btn.close-btn:hover {
            background: #ED5E69; /* red-300 - more subtle light red on hover */
            color: white;
        }

        .sw-bar-icon-btn svg {
            width: 16px;
            height: 16px;
        }

        /* Persistent Chat Widget Bubble */
        .sw-chat-widget-bubble {
            position: fixed;
            bottom: 24px;
            right: 24px;
            width: 56px;  /* Standard size: 64px → 56px */
            height: 56px;
            border-radius: 50%;
            background: var(--sw-primary);
            box-shadow: var(--shadow-lg);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            color: white;
            font-size: 28px;
            transition: all var(--sw-timing-normal) var(--sw-ease-premium);
            pointer-events: all;
        }

        .sw-chat-widget-bubble:hover {
            transform: scale(1.04);
            box-shadow: var(--shadow-xl);
        }

        .sw-chat-widget-bubble:active {
            transform: scale(0.95);
        }

        .sw-chat-widget-bubble.chat-open {
            opacity: 0;
            transform: scale(0.8);
            pointer-events: none;
        }

        .sw-chat-widget-bubble svg {
            width: 36px;  /* Icon size: 40px → 36px (64.3% of bubble) */
            height: 36px;
        }

        /* LAYER 1: Grey Outer Container Card */
        .sw-chat-panel {
            position: fixed;
            bottom: 24px;
            right: 24px;
            width: 50vh; /* Responsive: 50% of viewport height */
            max-width: 400px; /* Cap at 400px for standard screens */
            min-width: 300px; /* Minimum width constraint */
            height: 92vh; /* Responsive height - 92% of viewport */
            max-height: 800px; /* Maximum height cap for large displays */
            background: var(--sw-panel-bg);
            border-radius: 32px;
            box-shadow:
                0 0 0 1px rgba(0, 0, 0, 0.05),
                var(--shadow-md);
            display: flex;
            flex-direction: column;
            opacity: 0;
            transform: scale(0.92) translateY(30px);
            pointer-events: none;
            transition:
                transform var(--sw-timing-normal) var(--sw-ease-bounce),
                opacity var(--sw-timing-normal) ease,
                box-shadow var(--sw-timing-normal) ease;
            will-change: transform, opacity;
            z-index: 10000;
            padding: 8px;
            gap: 8px;
        }

        .sw-chat-panel.visible {
            opacity: 1;
            transform: scale(1) translateY(0);
            pointer-events: all;
            box-shadow:
                0 0 0 1px rgba(0, 0, 0, 0.05),
                var(--shadow-xl);
        }

        /* LAYER 2: White Main Chat Card */
        .sw-chat-main-card {
            flex: 1;
            background: var(--sw-card-bg);
            border-radius: 24px;
            box-shadow: var(--shadow-sm);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            position: relative;
            gap: 0;
        }

        /* LAYER 3a: Floating Pill Bar */
        .sw-chat-header {
            /* Positioning: Absolute at top center */
            position: absolute;
            top: 16px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 3;

            /* Sizing: Compact pill */
            width: auto;
            max-width: calc(100% - 80px);  /* Increased from 80% - 60px for more text space */

            /* Pill shape: Fully rounded */
            border-radius: 999px;

            /* Spacing: Enhanced padding for larger avatar */
            padding: 10px 16px 10px 10px;

            /* Background */
            background: var(--sw-header-bg);
            color: white;

            /* Shadow: Elevated floating effect */
            box-shadow: var(--shadow-lg);

            /* Layout */
            display: flex;
            align-items: center;
            flex-shrink: 0;
        }

        .sw-chat-header-left {
            display: flex;
            align-items: center;
            gap: 10px;
            width: 100%;
            min-width: 0;
        }

        .sw-chat-logo {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(10px);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            box-shadow: var(--shadow-sm);
            flex-shrink: 0;
            transition: all var(--sw-timing-fast) var(--sw-ease-smooth);
        }

        .sw-chat-header-title {
            font-size: 16px;
            font-weight: 600;
            margin: 0;
            letter-spacing: -0.02em;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        /* External Minimize Button - Hover Reveal Design */
        .sw-header-minimize-btn {
            position: absolute;
            top: 24px; /* Aligned with pill vertical center */
            right: 16px;
            z-index: 4;

            width: 40px;
            height: 40px;
            border-radius: 50%;

            /* Default: No background, just subtle dash */
            background: transparent;
            backdrop-filter: none;
            border: none;

            color: var(--sw-text-secondary); /* Harmonizes with UI color system */
            cursor: pointer;

            display: flex;
            align-items: center;
            justify-content: center;

            transition: all var(--sw-timing-fast) var(--sw-ease-premium);
            flex-shrink: 0;
        }

        .sw-header-minimize-btn:hover {
            /* Hover: Circle fades in smoothly */
            background: rgba(0, 0, 0, 0.06);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(0, 0, 0, 0.08);
            color: var(--sw-text-primary); /* Dash becomes more prominent */
            transform: scale(1.02);
        }

        .sw-header-minimize-btn svg {
            width: 18px;
            height: 18px;
            transition: all var(--sw-timing-fast) var(--sw-ease-premium);
        }

        /* New Chat Button - Secondary Action */
        .sw-header-new-chat-btn {
            position: absolute;
            top: 24px; /* Aligned with pill vertical center */
            left: 16px; /* Positioned on left for symmetric layout */
            z-index: 4;

            width: 40px;
            height: 40px;
            border-radius: 50%;

            /* Default: No background, subtle icon */
            background: transparent;
            backdrop-filter: none;
            border: none;

            color: var(--sw-text-secondary); /* Harmonizes with UI color system */
            opacity: 0.7; /* More subtle as secondary action */
            cursor: pointer;

            display: flex;
            align-items: center;
            justify-content: center;

            transition: all var(--sw-timing-fast) var(--sw-ease-premium);
            flex-shrink: 0;
        }

        .sw-header-new-chat-btn:hover {
            /* Hover: Circle fades in smoothly */
            background: rgba(0, 0, 0, 0.06);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(0, 0, 0, 0.08);
            color: var(--sw-text-primary);
            opacity: 1;
            transform: scale(1.02);
        }

        .sw-header-new-chat-btn svg {
            width: 18px;
            height: 18px;
            transition: all var(--sw-timing-fast) var(--sw-ease-premium);
        }

        /* Header Background - Frosted Glass (iMessage style) */
        .sw-header-background {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 90px;
            z-index: 2;
            pointer-events: none;

            /* Frosted glass effect: strong blur + white tint */
            backdrop-filter: blur(15px) saturate(180%);
            -webkit-backdrop-filter: blur(15px) saturate(180%);
            background: rgba(255, 255, 255, 0.85);
        }

        /* Chat Messages Area - Inside White Card */
        .sw-chat-messages {
            flex: 1;
            overflow-y: auto;
            overflow-x: hidden;
            padding: 100px 20px 20px 12px;  /* Reduced left padding to bring avatar closer to edge, more content space */
            display: flex;
            flex-direction: column;
            gap: 14px;
        }

        .sw-chat-messages::-webkit-scrollbar {
            width: 6px;
        }

        .sw-chat-messages::-webkit-scrollbar-track {
            background: transparent;
            margin: 16px 0;
        }

        .sw-chat-messages::-webkit-scrollbar-thumb {
            background: #d1d5db; /* gray-300 - matches UI neutral palette */
            border-radius: 10px;
            transition: background 0.2s ease;
        }

        .sw-chat-messages::-webkit-scrollbar-thumb:hover {
            background: #9ca3af; /* gray-400 - matches text-light variable */
        }

        .sw-chat-messages {
            scrollbar-width: thin;
            scrollbar-color: #d1d5db transparent; /* gray-300 - matches webkit scrollbar */
        }

        /* Date Separator */
        .sw-date-separator {
            text-align: center;
            color: #6b7280;
            font-size: 13px;
            font-weight: 500;
            margin: 8px 0;
            letter-spacing: -0.01em;
        }

        /* Timestamp Separator for Message Pairs */
        .sw-timestamp-separator {
            text-align: center;
            color: #6b7280;
            font-size: 12px;
            font-weight: 500;
            margin: 16px 0 12px 0;
            letter-spacing: -0.01em;
        }

        /* Quick Questions Section */
        .sw-quick-questions-section {
            display: flex;
            flex-direction: column;
            gap: 16px;
            padding: 8px 0;
            animation: sw-fadeSlideIn 0.5s cubic-bezier(0.4, 0, 0.2, 1);
            transition: opacity 0.12s ease-in;
        }

        .sw-quick-questions-section.hidden {
            opacity: 0;
            pointer-events: none;
        }

        @keyframes sw-fadeSlideIn {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .sw-quick-questions-header {
            font-size: 22px;  /* Increased from 18px for better prominence */
            font-weight: 800;
            color: #111827;
            text-align: left;
            letter-spacing: -0.03em;
            margin-bottom: 10px;  /* Slightly more space below */
            line-height: 1.2;
            display: flex;
            align-items: center;
            gap: 10px;  /* Slightly more gap between text and icon */
        }

        .sw-quick-questions-header .header-emoji {
            font-size: 28px;  /* Larger icon for better visual impact */
            color: var(--sw-primary);
            flex-shrink: 0;  /* Prevent icon from shrinking */
        }

        .sw-quick-questions-header .header-emoji svg {
            width: 20px;
            height: 20px;
            display: inline-block;
        }

        .sw-quick-questions-list {
            display: flex;
            flex-direction: column;
            gap: 10px;
            align-items: flex-end;
        }

        .sw-quick-question-btn {
            background: white;
            border: 1.5px solid #e5e7eb;
            border-radius: 20px;
            padding: 12px 20px;
            font-size: 14px;
            color: var(--sw-text-primary);
            cursor: pointer;
            transition: background var(--sw-timing-normal) var(--sw-ease-premium),
                        border-color var(--sw-timing-normal) var(--sw-ease-premium),
                        box-shadow var(--sw-timing-normal) var(--sw-ease-premium),
                        transform var(--sw-timing-normal) var(--sw-ease-premium);
            font-family: inherit;
            text-align: left;
            width: auto;
            max-width: 90%;
            box-shadow: var(--shadow-sm);
            position: relative;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            animation: sw-questionStagger 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        /* Stagger animation keyframe - fade-in + slide for premium feel */
        @keyframes sw-questionStagger {
            0% {
                opacity: 0;
                transform: translateX(20px);
            }
            100% {
                opacity: 1;
                transform: translateX(0);
            }
        }

        .sw-quick-question-btn::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(17, 24, 39, 0.04); /* Neutral grey - works with any primary color */
            opacity: 0;
            transition: opacity var(--sw-timing-normal) ease;
            z-index: 0;
        }

        .sw-quick-question-btn .question-text {
            position: relative;
            z-index: 1;
        }

        .sw-quick-question-btn .question-emoji {
            position: relative;
            z-index: 1;
            font-size: 18px;
            flex-shrink: 0;
        }

        .sw-quick-question-btn:hover {
            transform: translateX(-4px) translateY(-2px) scale(1.02);
            border-color: var(--sw-primary-light);
            box-shadow: var(--shadow-md);
        }

        .sw-quick-question-btn:hover::before {
            opacity: 1;
        }

        .sw-quick-question-btn:active {
            transform: translateX(-2px) translateY(-1px);
            box-shadow: var(--shadow-sm);
        }

        /* Messages */
        .sw-message {
            display: flex;
            flex-direction: column;
            max-width: 92%;
            animation: sw-messageSlideIn var(--sw-timing-fast) var(--sw-ease-premium);
        }

        @keyframes sw-messageSlideIn {
            from {
                opacity: 0;
                transform: translateY(15px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .sw-bot-message {
            align-self: flex-start;
        }

        .sw-user-message {
            align-self: flex-end;
        }

        .sw-message-wrapper {
            display: flex;
            align-items: flex-start;
            gap: 8px;
        }

        .sw-message-avatar {
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: #f3f4f6;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--sw-primary);
            font-size: 14px;
            flex-shrink: 0;
            box-shadow: var(--shadow-sm);
            overflow: hidden;
            transition: all var(--sw-timing-fast) var(--sw-ease-smooth);
        }

        .sw-message-avatar:hover {
            transform: scale(1.05) rotate(5deg);
            box-shadow: var(--shadow-md);
        }

        .sw-message-avatar img,
        .sw-chat-logo img,
        .sw-morph-icon img,
        .sw-bubble-bot-icon-inner img,
        .sw-chat-avatar-mini img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 50%;
            transition: opacity var(--sw-timing-fast) var(--sw-ease-smooth);
        }

        .sw-message-content {
            padding: 16px 20px;
            border-radius: 20px;
            font-size: 16px;
            line-height: 1.45;
            letter-spacing: -0.011em;
            word-wrap: break-word;
            word-break: break-word;
            overflow-wrap: break-word;
            max-width: 100%;
            box-shadow: var(--shadow-sm);
        }

        .sw-bot-message .sw-message-content {
            background: var(--sw-message-bot-bg);
            color: var(--sw-text-primary);
            box-shadow: var(--shadow-sm);
        }

        .sw-bot-message .sw-message-content ul {
            margin: 10px 0 0 0;
            padding-left: 0;
            list-style: none;
        }

        .sw-bot-message .sw-message-content li {
            margin: 6px 0;
            color: #4b5563;
            padding-left: 20px;
            position: relative;
        }

        .sw-bot-message .sw-message-content li::before {
            content: '•';
            position: absolute;
            left: 0;
            color: var(--sw-primary);
        }

        .sw-user-message .sw-message-content {
            background: var(--sw-message-user-bg);
            color: white;
            box-shadow: 0 2px 12px rgba(139, 92, 246, 0.25);
        }

        /* Typing Indicator */
        .sw-typing-indicator {
            display: flex;
            gap: 5px;
            padding: 14px 18px;
            background: #f9fafb;
            border-radius: 20px;
            border-bottom-left-radius: 6px;
            width: fit-content;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }

        .sw-typing-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: var(--sw-primary);
            animation: sw-typing 1.4s infinite ease-in-out;
        }

        .sw-typing-dot:nth-child(1) { animation-delay: 0s; }
        .sw-typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .sw-typing-dot:nth-child(3) { animation-delay: 0.4s; }

        @keyframes sw-typing {
            0%, 60%, 100% {
                transform: translateY(0);
                opacity: 0.4;
            }
            30% {
                transform: translateY(-12px);
                opacity: 1;
            }
        }

        /* LAYER 3b: Elevated Input Card at Bottom */
        .sw-chat-input-area {
            padding: 8px;
            background: var(--sw-input-area-bg);
            display: flex;
            flex-direction: column;
            gap: 6px;
            flex-shrink: 0;
            border-radius: 20px;
            margin: 0 8px 8px 8px;
            box-shadow:
                0 -2px 8px rgba(0, 0, 0, 0.04),
                0 2px 8px rgba(0, 0, 0, 0.06);
            position: relative;
            z-index: 2;
        }

        .sw-input-wrapper {
            position: relative;
            display: flex;
            align-items: center;
            background: var(--sw-input-field-bg);
            border-radius: 16px;
            border: 2px solid transparent;
            transition: all 0.25s;
            margin: 0;
            outline: none;
        }

        .sw-input-wrapper:focus-within {
            border-color: var(--sw-input-border-active);
        }

        .sw-panel-chat-input {
            flex: 1;
            border: none;
            border-radius: 16px;
            outline: none;
            background: transparent;
            padding: 12px 60px 12px 16px;
            font-size: 16px;
            font-family: inherit;
            color: var(--sw-text-primary);
            transition: all 0.25s;
            min-height: 44px;
            max-height: 150px;
            line-height: 1.5;
            overflow-y: hidden;
            resize: none;
        }

        .sw-panel-chat-input::placeholder {
            color: var(--sw-text-secondary);
        }

        .sw-panel-chat-input:focus-visible {
            outline: none;
        }

        .sw-panel-send-btn {
            position: absolute;
            right: 6px;
            top: 50%;
            transform: translateY(-50%);
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: #9DA3AF; /* gray-400 - disabled state */
            border: none;
            color: white;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
            flex-shrink: 0;
        }

        .sw-panel-send-btn:not(:disabled) {
            background: var(--sw-primary); /* Primary color when enabled */
            color: white;
            box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
        }

        .sw-panel-send-btn:hover:not(:disabled) {
            transform: translateY(-50%) scale(1.08);
            box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
        }

        .sw-panel-send-btn:disabled {
            cursor: default;
        }

        .sw-panel-send-btn svg {
            width: 16px;
            height: 16px;
        }

        /* Powered by Fylio Attribution */
        .sw-powered-by {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
            padding: 0;
            font-size: 11px;
            color: #9ca3af;
            flex-shrink: 0;
        }

        .sw-powered-by-text {
            color: #9ca3af;
            font-weight: 400;
        }

        .sw-powered-by-link {
            display: flex;
            align-items: center;
            gap: 4px;
            text-decoration: none;
            color: #6b7280;
            transition: all 0.2s ease;
            padding: 2px 4px;
            border-radius: 4px;
        }

        .sw-powered-by-link:hover {
            color: var(--sw-primary);
            background: rgba(139, 92, 246, 0.05);
        }

        .sw-powered-by-icon {
            width: 14px;
            height: 14px;
            border-radius: 50%;
            object-fit: cover;
            flex-shrink: 0;
        }

        .sw-powered-by-brand {
            font-weight: 500;
            letter-spacing: -0.01em;
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
            /* Fix body scroll on mobile */
            body.sw-chat-open {
                overflow: hidden;
                position: fixed;
                width: 100%;
                touch-action: none;
            }
            
            .sw-chat-input-bar {
                display: none !important;
                width: calc(100% - 40px);
                max-width: 320px;
            }
            
            .sw-chat-input-bar.expanded {
                width: calc(100% - 40px);
                max-width: 360px;
            }
            
            /* MODIFIED: Fix panel height and overflow */
            .sw-chat-panel {
                top: 0;
                right: 0;
                left: 0;
                bottom: 0;
                width: 100%;
                height: 100vh;
                height: 100dvh; /* ADD: Dynamic viewport height */
                border-radius: 0;
                padding: 0;
                gap: 0;
                overflow: hidden; /* ADD: Prevent scroll on panel */
            }
            
            .sw-chat-header {
                top: 12px;
                max-width: calc(100% - 70px);
                padding: 8px 10px 8px 8px;
            }

            .sw-chat-header-title {
                font-size: 15px;
            }

            .sw-chat-logo {
                width: 32px;
                height: 32px;
                font-size: 16px;
            }

            .sw-header-minimize-btn {
                top: 18px; /* Aligned with mobile pill vertical center */
                right: 12px;
                width: 36px;
                height: 36px;
            }

            .sw-header-minimize-btn svg {
                width: 16px;
                height: 16px;
            }

            .sw-header-background {
                height: 75px;  /* Extended for better spacing below pill */

                /* Mobile frosted glass: slightly stronger for better readability */
                backdrop-filter: blur(20px) saturate(180%);
                -webkit-backdrop-filter: blur(20px) saturate(180%);
                background: rgba(255, 255, 255, 0.88);
            }

            /* MODIFIED: Fix messages overflow */
            .sw-chat-messages {
                padding: 88px 16px 16px 10px;  /* Reduced left padding for more content space on mobile */
                overflow-x: hidden; /* ADD: Prevent horizontal scroll */
                -webkit-overflow-scrolling: touch; /* ADD: Smooth iOS scrolling */
            }
            
            .sw-chat-input-area {
                padding: 8px;
                border-radius: 18px;
                margin: 0 6px 6px 6px;
            }
            
            .sw-chat-widget-bubble {
                bottom: 16px;
                right: 16px;
                width: 52px;  /* Mobile: slightly smaller */
                height: 52px;
            }

            .sw-chat-widget-bubble svg {
                width: 32px;  /* Mobile icon: maintains proportion */
                height: 32px;
            }

            /* NEW: Fix input font size to prevent iOS zoom */
            .sw-panel-chat-input,
            .sw-bar-chat-input {
                font-size: 16px !important;
            }
            
            /* NEW: Fix main card height */
            .sw-chat-main-card {
                height: 100%;
                overflow: hidden;
                border-radius: 0;
            }

            /* Powered by mobile adjustments */
            .sw-powered-by {
                padding: 0;
                font-size: 10px;
            }

            .sw-powered-by-icon {
                width: 12px;
                height: 12px;
            }
        }

        @media (max-width: 480px) {
            .sw-chat-panel {
                padding: 8px;
            }
        }

        /* Accessibility: Focus Indicators */
        *:focus-visible {
            outline: 3px solid var(--sw-primary);
            outline-offset: 2px;
        }

        .sw-quick-question-btn:focus-visible {
            outline: 3px solid var(--sw-primary);
            outline-offset: 3px;
        }

        .sw-panel-send-btn:focus-visible,
        .sw-header-icon-btn:focus-visible,
        .sw-bar-icon-btn:focus-visible {
            outline: 3px solid white;
            outline-offset: 2px;
        }

        .sw-chat-widget-bubble:focus-visible {
            outline: 4px solid var(--sw-primary);
            outline-offset: 4px;
        }

        /* ========================================
           PREMIUM OPENING ANIMATION
           ======================================== */

        /* Morphing Element - Transforms from bubble to header pill */
        .sw-morph-element {
            position: fixed;
            z-index: 999999;
            pointer-events: none;
            will-change: width, height, border-radius, left, top;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--sw-primary);
            color: white;
            box-shadow: var(--shadow-lg);
            overflow: hidden;
        }

        /* Initial circle state: no gap, text takes no space */
        .sw-morph-element.circle-state {
            gap: 0;
            padding: 10px;
        }

        /* Pill state: has gap for spacing */
        .sw-morph-element.pill-state {
            gap: 10px;
            padding: 10px 16px 10px 10px;
        }

        .sw-morph-icon {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(10px);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            flex-shrink: 0;
            box-shadow: var(--shadow-sm);
            transition: all var(--sw-timing-fast) var(--sw-ease-smooth);
        }

        .sw-morph-text {
            font-size: 16px;
            font-weight: 600;
            letter-spacing: -0.02em;
            white-space: nowrap;
            opacity: 0;
            max-width: 0;
            overflow: hidden;
            transition:
                opacity var(--sw-timing-normal) ease,
                max-width var(--sw-timing-normal) ease;
        }

        .sw-morph-element.show-text .sw-morph-text {
            opacity: 1;
            max-width: 300px;  /* Increased from 200px to accommodate longer names */
        }

        /* Panel reveal animation */
        @keyframes sw-panelFadeIn {
            from {
                opacity: 0;
            }
            to {
                opacity: 1;
            }
        }

        .sw-chat-panel.animating-in {
            animation: sw-panelFadeIn 0.6s ease forwards;
        }

        /* Hide elements during animation */
        .sw-chat-header.hidden-during-animation {
            opacity: 0 !important;
            pointer-events: none;
        }

        .sw-chat-widget-bubble.hidden-during-animation {
            opacity: 0 !important;
            pointer-events: none;
            transform: scale(0.8);
        }

        /* ========================================
           CLICK ANIMATION: Bounce & Icon Swap
           ======================================== */

        /* Stage 1: Click press - Button depression */
        @keyframes sw-bubbleClickPress {
            0% {
                transform: scale(1);
            }
            100% {
                transform: scale(0.92);
            }
        }

        /* Stage 2: Elastic bounce with overshoot */
        @keyframes sw-bubbleBounceUp {
            0% {
                transform: scale(0.92);
            }
            60% {
                transform: scale(1.08);
            }
            100% {
                transform: scale(1.0);
            }
        }

        /* Widget icon fades out during bounce */
        @keyframes sw-widgetIconFadeOut {
            0% {
                opacity: 1;
                transform: scale(1);
            }
            50% {
                opacity: 0;
                transform: scale(0.7);
            }
            100% {
                opacity: 0;
                transform: scale(0.7);
            }
        }

        /* Bot icon fades in during bounce */
        @keyframes sw-botIconFadeIn {
            0% {
                opacity: 0;
                transform: scale(0.5);
            }
            50% {
                opacity: 1;
                transform: scale(1);
            }
            100% {
                opacity: 1;
                transform: scale(1);
            }
        }

        /* Classes to trigger animations */
        .sw-chat-widget-bubble.clicking {
            animation: sw-bubbleClickPress 250ms cubic-bezier(0.34, 0.1, 0.5, 1) forwards;
        }

        .sw-chat-widget-bubble.bouncing {
            animation: sw-bubbleBounceUp 400ms cubic-bezier(0.34, 1.4, 0.64, 1) forwards;
        }

        /* Icon container inside bubble during animation */
        .sw-bubble-widget-icon {
            position: absolute;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: sw-widgetIconFadeOut 200ms ease forwards;
            animation-play-state: paused;
        }

        .sw-bubble-widget-icon.animating {
            animation-play-state: running;
        }

        .sw-bubble-bot-icon-click {
            position: absolute;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            animation: sw-botIconFadeIn 200ms ease forwards;
            animation-play-state: paused;
        }

        .sw-bubble-bot-icon-click.animating {
            animation-play-state: running;
        }

        /* Inner icon with background circle - matches .sw-morph-icon */
        .sw-bubble-bot-icon-inner {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(10px);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        /* Accessibility: Reduced Motion Support */
        @media (prefers-reduced-motion: reduce) {
            *,
            *::before,
            *::after {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
                scroll-behavior: auto !important;
            }
        }

        /* Responsive: Larger max-width for 2xl screens */
        @media (min-width: 1536px) {
            .sw-chat-panel {
                max-width: 420px;
            }
        }

        /* ========================================
           RICH CONTENT STYLES (Markdown & Cards)
           ======================================== */

        /* Markdown Content Styling */
        .sw-message-content.markdown h1,
        .sw-message-content.markdown h2,
        .sw-message-content.markdown h3 {
            margin: 12px 0 8px 0;
            color: #1f2937;
            font-weight: 700;
            line-height: 1.3;
        }

        .sw-message-content.markdown h1 { font-size: 20px; }
        .sw-message-content.markdown h2 { font-size: 18px; }
        .sw-message-content.markdown h3 { font-size: 16px; }

        .sw-message-content.markdown p {
            margin: 8px 0;
        }

        .sw-message-content.markdown a {
            color: var(--sw-primary);
            text-decoration: none;
            border-bottom: 1px solid transparent;
            transition: border-color 0.2s;
        }

        .sw-message-content.markdown a:hover {
            border-bottom-color: var(--sw-primary);
        }

        .sw-message-content.markdown code {
            background: #f3f4f6;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Monaco', 'Courier New', monospace;
            font-size: 14px;
            color: #ef4444;
        }

        .sw-message-content.markdown pre {
            background: #1f2937;
            color: #f9fafb;
            padding: 12px;
            border-radius: 8px;
            overflow-x: auto;
            margin: 10px 0;
        }

        .sw-message-content.markdown pre code {
            background: transparent;
            padding: 0;
            color: inherit;
            font-size: 13px;
        }

        .sw-message-content.markdown blockquote {
            border-left: 4px solid var(--sw-primary);
            padding-left: 12px;
            margin: 10px 0;
            color: var(--sw-text-secondary);
            font-style: italic;
        }

        /* Markdown Lists */
        .sw-message-content.markdown ul {
            margin: 10px 0;
            padding-left: 24px;
            list-style: none;
        }

        .sw-message-content.markdown ul li {
            position: relative;
            margin: 6px 0;
            padding-left: 8px;
        }

        .sw-message-content.markdown ul li::before {
            content: '•';
            position: absolute;
            left: -16px;
            color: var(--sw-primary);
            font-weight: bold;
        }

        .sw-message-content.markdown ol {
            margin: 10px 0;
            padding-left: 24px;
            list-style: decimal;
        }

        .sw-message-content.markdown ol li {
            margin: 6px 0;
            padding-left: 8px;
        }

        /* Nested lists */
        .sw-message-content.markdown li ul,
        .sw-message-content.markdown li ol {
            margin: 4px 0;
        }

        /* Card Container */
        .sw-card-container {
            display: flex;
            flex-direction: column;
            gap: 12px;
            padding: 0;
        }

        /* Single Card */
        .sw-card {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            overflow: hidden;
            transition: all 0.3s ease;
            cursor: pointer;
        }

        .sw-bot-message .sw-card {
            background: white;
            border: 1px solid #ede9fe;
        }

        .sw-card:hover {
            box-shadow: 0 4px 12px rgba(139, 92, 246, 0.15);
            transform: translateY(-2px);
        }

        /* Card Image */
        .sw-card-image {
            width: 100%;
            height: 180px;
            object-fit: cover;
            background: #f3f4f6;
        }

        .sw-card-image.loading {
            background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
            background-size: 200% 100%;
            animation: sw-shimmer 1.5s infinite;
        }

        @keyframes sw-shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
        }

        /* Card Content */
        .sw-card-content {
            padding: 14px;
        }

        .sw-card-title {
            font-size: 16px;
            font-weight: 700;
            color: #111827;
            margin: 0 0 6px 0;
            line-height: 1.3;
        }

        .sw-card-description {
            font-size: 14px;
            color: #6b7280;
            line-height: 1.5;
            margin: 0 0 10px 0;
        }

        .sw-card-metadata {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
            font-size: 12px;
            color: #9ca3af;
            margin-bottom: 10px;
        }

        /* Card Actions */
        .sw-card-actions {
            display: flex;
            gap: 8px;
            margin-top: 10px;
        }

        .sw-card-button {
            flex: 1;
            padding: 8px 14px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            border: none;
            font-family: inherit;
        }

        .sw-card-button.primary {
            background: var(--sw-primary);
            color: white;
            box-shadow: 0 2px 6px rgba(139, 92, 246, 0.3);
        }

        .sw-card-button.primary:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 10px rgba(139, 92, 246, 0.4);
        }

        .sw-card-button.secondary {
            background: white;
            color: var(--sw-primary);
            border: 1.5px solid #e5e7eb;
        }

        .sw-card-button.secondary:hover {
            background: #f9fafb;
            border-color: var(--sw-primary);
        }

        /* Carousel for Multiple Cards */
        .sw-card-carousel {
            display: flex;
            gap: 12px;
            overflow-x: auto;
            padding: 4px;
            scroll-snap-type: x mandatory;
            -webkit-overflow-scrolling: touch;
        }

        .sw-card-carousel::-webkit-scrollbar {
            height: 4px;
        }

        .sw-card-carousel::-webkit-scrollbar-track {
            background: #f3f4f6;
            border-radius: 4px;
        }

        .sw-card-carousel::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 4px;
        }

        .sw-card-carousel .sw-card {
            min-width: 280px;
            max-width: 280px;
            scroll-snap-align: start;
        }

        /* Mobile Responsive Cards */
        @media (max-width: 768px) {
            .sw-card-image {
                height: 140px;
            }

            .sw-card-carousel .sw-card {
                min-width: 240px;
                max-width: 240px;
            }
        }
    `;
    
    // ========================================
    // HTML TEMPLATE
    // ========================================

    /**
     * Generate HTML template with dynamic configuration values
     * @returns {string} HTML string
     */
    function generateHTML() {
        // Check ui.showPoweredBy first, fallback to poweredBy.enabled for backward compatibility
        const showPoweredBy = CONFIG.ui?.showPoweredBy ?? CONFIG.poweredBy.enabled;
        const poweredByHTML = showPoweredBy ? `
                    <!-- Powered by Attribution -->
                    <div class="sw-powered-by">
                        <span class="sw-powered-by-text">${CONFIG.poweredBy.text}</span>
                        <a href="${CONFIG.poweredBy.brandUrl}" target="_blank" rel="noopener noreferrer" class="sw-powered-by-link" aria-label="Visit ${CONFIG.poweredBy.brandName} website">
                            <img src="${CONFIG.poweredBy.logoUrl}" alt="${CONFIG.poweredBy.brandName} logo" class="sw-powered-by-icon" />
                            <span class="sw-powered-by-brand">${CONFIG.poweredBy.brandName}</span>
                        </a>
                    </div>` : '';

        // Conditionally include floating bar based on ui.showFloatingBar
        const floatingBarHTML = CONFIG.ui?.showFloatingBar ? `
        <!-- Compact Chat Input Bar -->
        <div id="sw-chat-input-bar" class="sw-chat-input-bar" role="search" aria-label="Quick chat input">
            <div class="sw-chat-avatar-mini" id="sw-avatar-mini" aria-hidden="true">${CONFIG.content.quickQuestionsHeaderEmoji || CONFIG.branding.botAvatar}</div>
            <input
                type="text"
                id="sw-bar-chat-input"
                class="sw-bar-chat-input"
                placeholder="${CONFIG.content.barPlaceholder}"
                autocomplete="off"
                aria-label="Type your question here"
            />
            <button class="sw-bar-icon-btn send-btn" id="sw-bar-send-btn" title="Send message" aria-label="Send message">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"/>
                </svg>
            </button>
            <button class="sw-bar-icon-btn close-btn" id="sw-bar-close-btn" title="Dismiss chat bar" aria-label="Dismiss chat bar">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
            </button>
        </div>
        ` : '';

        return `
        ${floatingBarHTML}
        <!-- Persistent Chat Widget Bubble -->
        <div id="sw-chat-widget-bubble" class="sw-chat-widget-bubble" role="button" aria-label="Open chat" tabindex="0">
            ${CONFIG.branding.widgetIcon}
        </div>

        <!-- Chat Panel with 3-Layer Hierarchy -->
        <div id="sw-chat-panel" class="sw-chat-panel" role="dialog" aria-label="Chat with ${CONFIG.branding.botName}" aria-modal="true">
            <!-- LAYER 2: White Main Card -->
            <div class="sw-chat-main-card">
                <!-- LAYER 3a: Header Background Zone -->
                <div class="sw-header-background"></div>

                <!-- Floating Pill Header -->
                <div class="sw-chat-header">
                    <div class="sw-chat-header-left">
                        <div class="sw-chat-logo">${CONFIG.branding.botAvatar}</div>
                        <h3 class="sw-chat-header-title">${CONFIG.branding.botName}</h3>
                    </div>
                </div>

                <!-- External New Chat Button -->
                <button id="sw-panel-new-chat-btn" class="sw-header-new-chat-btn" title="Start a new conversation" aria-label="Start a new conversation">
                    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
                        <line x1="8" y1="3" x2="8" y2="13"/>
                        <line x1="3" y1="8" x2="13" y2="8"/>
                    </svg>
                </button>

                <!-- External Minimize Button -->
                <button id="sw-panel-close-btn" class="sw-header-minimize-btn" title="Minimize chat" aria-label="Minimize chat">
                    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
                        <line x1="3" y1="8" x2="13" y2="8"/>
                    </svg>
                </button>

                <!-- Messages Area (Inside White Card) -->
                <div class="sw-chat-messages" id="sw-chat-messages" role="log" aria-live="polite" aria-label="Chat conversation">
                    <!-- Messages added dynamically -->
                    <!-- Scroll sentinel - always at bottom for reliable scrolling -->
                    <div id="sw-scroll-sentinel" style="height: 1px; margin: 0; padding: 0;"></div>
                </div>

                <!-- LAYER 3b: Elevated Input Card -->
                <div class="sw-chat-input-area">
                    <div class="sw-input-wrapper">
                        <textarea
                            id="sw-panel-chat-input"
                            class="sw-panel-chat-input"
                            rows="1"
                            placeholder="${CONFIG.content.panelPlaceholder}"
                            autocomplete="off"
                            aria-label="Type your message"
                        ></textarea>
                        <button id="sw-panel-send-btn" class="sw-panel-send-btn" aria-label="Send message" disabled>
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"/>
                            </svg>
                        </button>
                    </div>
${poweredByHTML}
                </div>
            </div>
        </div>
    `;
    }
    
    // ========================================
    // UTILITY: SSE-ENABLED FETCH WITH RETRY
    // ========================================
    async function postWithRetry(url, payload, options = {}) {
        const { retries = CONFIG.retries, timeoutMs = CONFIG.timeoutMs, headers = {} } = options;
        
        const attempt = async (tryIndex) => {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), timeoutMs);
            
            try {
                console.log('[Chatbot] Attempt', tryIndex + 1, 'POST', url, { payload, headers });
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'text/event-stream, application/x-ndjson, application/json',
                        ...headers
                    },
                    body: JSON.stringify(payload),
                    mode: 'cors',
                    cache: 'no-store',
                    keepalive: true,
                    signal: controller.signal
                });
                
                console.log('[Chatbot] Status:', response.status, 'Headers:', Array.from(response.headers.entries()));
                
                if (!response.ok && (response.status >= 500 || response.status === 429)) {
                    const text = await response.text();
                    throw new Error(`HTTP ${response.status}: ${text}`);
                }
                
                clearTimeout(timeout);
                return response;
            } catch (err) {
                clearTimeout(timeout);
                throw err;
            }
        };
        
        let lastError;
        for (let i = 0; i <= retries; i++) {
            try {
                return await attempt(i);
            } catch (err) {
                lastError = err;
                console.error('[Chatbot] Attempt failed', i + 1, err);
                if (i < retries) {
                    const backoff = Math.pow(2, i) * 1000;
                    await new Promise(resolve => setTimeout(resolve, backoff));
                    continue;
                }
            }
        }
        throw lastError;
    }
    
    // ========================================
    // ANIMATION TIMING CONFIGURATION
    // ========================================
    const ANIMATION_TIMING = {
        // Click sequence (Stage 0)
        clickPress: 250,
        bounce: 400,
        iconSwapDelay: 100,

        // Pill expansion (Stage 1)
        circleHold: 200,
        transitionEnable: 20,
        pillExpansion: 500,

        // Upward motion (Stage 2)
        unifiedRise: 700,
        headerFadeStart: 200,

        // Cleanup
        cleanupDelay: 100,

        // Fast animation
        fastPanelSlide: 400,
        fastCleanupDelay: 50,

        // Derived values (auto-calculated)
        get clickSequenceTotal() {
            return this.clickPress + this.bounce;
        },

        get pillExpansionTotal() {
            return this.transitionEnable + this.pillExpansion;
        },

        get fullAnimationTotal() {
            return this.clickSequenceTotal + this.circleHold +
                   this.pillExpansionTotal + this.unifiedRise;
        }
    };

    // ========================================
    // CHAT WIDGET CLASS
    // ========================================
    class ChatWidget {
        constructor() {
            this.isPanelOpen = false;
            this.isBarDismissed = false;
            this.messageHistory = [];
            this.firstMessageSent = false;
            this.lastScrollY = window.scrollY;
            this.scrollThreshold = 100;
            this.sessionId = this.generateUUID();
            this.streamingBuffer = { content: '', messageId: null };
            this.userIsScrolling = false;
            this.scrollTimeout = null;
            this.scrollPending = false; // Prevent overlapping scroll requests
            this.isActivelyStreaming = false; // Track active streaming for auto-scroll behavior
            this.isAnimating = false; // Legacy flag, kept for compatibility

            // Animation guard for robust state management
            this.animationLock = {
                isLocked: false,
                currentAnimation: null,

                acquire: function(animationName) {
                    if (this.isLocked) {
                        console.warn(`[ChatWidget] Animation blocked: ${animationName} (current: ${this.currentAnimation})`);
                        return false;
                    }
                    this.isLocked = true;
                    this.currentAnimation = animationName;
                    return true;
                },

                release: function() {
                    this.isLocked = false;
                    this.currentAnimation = null;
                },

                forceRelease: function() {
                    console.warn('[ChatWidget] Force releasing animation lock');
                    this.release();
                }
            };

            this.init();
        }
        
        generateUUID() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                const r = Math.random() * 16 | 0;
                const v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }

        // ========================================
        // CONVERSATION PERSISTENCE METHODS
        // ========================================

        saveConversation() {
            if (!CONFIG.persistence?.enabled) return;

            try {
                const data = {
                    messageHistory: this.messageHistory,
                    sessionId: this.sessionId,
                    lastActivity: Date.now(),
                    version: 1  // For future compatibility
                };
                localStorage.setItem(CONFIG.persistence.storageKey, JSON.stringify(data));
            } catch (error) {
                console.warn('[ChatWidget] Failed to save conversation:', error);
            }
        }

        loadConversation() {
            if (!CONFIG.persistence?.enabled) return false;

            try {
                const stored = localStorage.getItem(CONFIG.persistence.storageKey);
                if (!stored) return false;

                const data = JSON.parse(stored);

                // Validate data structure
                if (!data || !data.messageHistory || !data.sessionId || !data.lastActivity) {
                    console.warn('[ChatWidget] Invalid stored conversation data');
                    localStorage.removeItem(CONFIG.persistence.storageKey);
                    return false;
                }

                // Check TTL
                const age = Date.now() - data.lastActivity;
                if (age > CONFIG.persistence.conversationTTL) {
                    console.log('[ChatWidget] Conversation expired, starting fresh');
                    localStorage.removeItem(CONFIG.persistence.storageKey);
                    return false;
                }

                // Restore conversation state
                this.messageHistory = data.messageHistory;
                this.sessionId = data.sessionId;
                this.firstMessageSent = data.messageHistory.length > 0;

                console.log(`[ChatWidget] Restored conversation with ${data.messageHistory.length} messages`);
                return true;
            } catch (error) {
                console.warn('[ChatWidget] Failed to load conversation:', error);
                localStorage.removeItem(CONFIG.persistence.storageKey);
                return false;
            }
        }

        restoreMessagesUI() {
            // Re-render messages from history
            this.messageHistory.forEach(msg => {
                if (msg.role === 'user') {
                    this.addMessageToUI(msg.content, 'user');
                } else if (msg.role === 'bot') {
                    this.addMessageToUI(msg.content, 'bot');
                }
            });
        }

        addMessageToUI(content, sender) {
            // Helper to add message DOM without modifying messageHistory
            const messageDiv = document.createElement('article');
            messageDiv.className = `sw-message sw-${sender}-message`;
            messageDiv.setAttribute('role', 'article');
            messageDiv.setAttribute('aria-label', `${sender === 'bot' ? 'AI' : 'User'} message`);
            const messageId = `msg-${Date.now()}-${Math.random()}`;
            messageDiv.id = messageId;

            let contentDiv;

            if (sender === 'bot') {
                const wrapper = document.createElement('div');
                wrapper.className = 'sw-message-wrapper';

                const avatar = document.createElement('div');
                avatar.className = 'sw-message-avatar';
                avatar.setAttribute('aria-hidden', 'true');
                this.renderBotAvatar(avatar);
                wrapper.appendChild(avatar);

                contentDiv = document.createElement('div');
                contentDiv.className = 'sw-message-content';
                wrapper.appendChild(contentDiv);

                messageDiv.appendChild(wrapper);
            } else {
                contentDiv = document.createElement('div');
                contentDiv.className = 'sw-message-content';
                contentDiv.textContent = content;  // User messages are always plain text
                messageDiv.appendChild(contentDiv);
            }

            this.chatMessages.appendChild(messageDiv);

            // Ensure sentinel stays at bottom
            const sentinel = document.getElementById('sw-scroll-sentinel');
            if (sentinel && sentinel.parentNode === this.chatMessages) {
                this.chatMessages.appendChild(sentinel);
            }

            // Apply rich content rendering for bot messages (uses unified renderer)
            if (sender === 'bot') {
                this.renderContentToDOM(contentDiv, content);
            }
        }

        // Calculate and cache pill width for morphing animation
        calculateAndCachePillWidth() {
            // Use Canvas API for fast, non-DOM text measurement
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            ctx.font = '600 16px -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif';

            const textWidth = ctx.measureText(CONFIG.branding.botName).width;

            // Calculate total pill width (must match CSS values)
            const iconWidth = 36; // .sw-morph-icon width
            const gap = 10; // gap between icon and text
            const paddingLeft = 10; // pill-state padding-left
            const paddingRight = 16; // pill-state padding-right

            const pillWidth = iconWidth + gap + textWidth + paddingLeft + paddingRight;

            // Cache in CSS custom property for use in animations
            document.documentElement.style.setProperty('--sw-cached-pill-width', `${pillWidth}px`);

            // Also cache for JavaScript access
            this.cachedPillWidth = pillWidth;

            return pillWidth;
        }

        // Helper function to detect if botAvatar is an image URL
        isImageUrl(str) {
            return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(str);
        }

        // Helper function to render bot avatar (image or emoji)
        renderBotAvatar(container) {
            const avatarContent = CONFIG.branding.botAvatar;

            if (this.isImageUrl(avatarContent)) {
                const img = document.createElement('img');
                img.src = avatarContent;
                img.alt = CONFIG.branding.botName;
                container.appendChild(img);
            } else {
                container.textContent = avatarContent;
            }
        }

        // ========================================
        // RICH CONTENT RENDERING FUNCTIONS
        // ========================================

        detectMessageType(data) {
            // Backwards compatible: plain string = text
            if (typeof data === 'string') {
                return { type: 'text', content: data };
            }

            // Object with type field
            if (data && typeof data === 'object') {
                // Explicit type specified
                if (data.type) {
                    return data;
                }

                // Auto-detect card structure
                if (data.title || data.image || data.buttons) {
                    return { type: 'card', ...data };
                }

                // Auto-detect multiple items (carousel)
                if (Array.isArray(data.items)) {
                    return { type: 'carousel', items: data.items };
                }

                // Default to text if has content field
                if (data.content) {
                    return { type: 'text', content: data.content };
                }
            }

            // Fallback: treat as plain text
            return { type: 'text', content: String(data) };
        }

        hasMarkdownSyntax(text) {
            // Quick heuristic to detect if text contains markdown
            const markdownPatterns = [
                /^#+\s/m,          // Headers
                /\*\*.*\*\*/,      // Bold
                /\*.*\*/,          // Italic
                /\[.*\]\(.*\)/,    // Links
                /`.*`/,            // Code
                /^[-*+]\s/m,       // Lists (proper markdown)
                /[:.] - .+/,       // Inline lists (will be normalized)
                /^>\s/m            // Blockquotes
            ];

            return markdownPatterns.some(pattern => pattern.test(text));
        }

        escapeHtml(text) {
            const map = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            };
            return String(text).replace(/[&<>"']/g, m => map[m]);
        }

        normalizeMarkdown(text) {
            // Convert inline list patterns to proper markdown format
            // Handles cases like: "text: - Item1. - Item2. - Item3"

            // Pattern 1: Lists after colon or period with inline dashes
            // Match: ": - " or ". - " followed by text
            text = text.replace(/([:.]) - ([^\n-]+?)(\. - |\.$|$)/g, (match, separator, item, ending) => {
                // Check if this looks like a list item (not just a dash in sentence)
                if (item.length > 0 && item.length < 200) {
                    if (ending === '. - ') {
                        return `${separator}\n- ${item}\n`;
                    } else {
                        return `${separator}\n- ${item}${ending}`;
                    }
                }
                return match;
            });

            // Pattern 2: Multiple inline dashes in a row (catch remaining)
            // Match remaining inline " - " patterns not caught by Pattern 1
            text = text.replace(/ - ([^-\n]{3,}?)(?=\. - | - |\.$|$)/g, (match, item) => {
                if (item.trim().length > 0) {
                    return `\n- ${item.trim()}`;
                }
                return match;
            });

            // Clean up any double newlines created
            text = text.replace(/\n{3,}/g, '\n\n');

            return text;
        }

        renderMarkdown(content) {
            // Normalize inline lists to proper markdown format
            content = this.normalizeMarkdown(content);
            // Feature check
            if (!CONFIG.enableMarkdown || !LIBRARIES_LOADED.marked || !LIBRARIES_LOADED.DOMPurify) {
                // Fallback to plain text
                return this.escapeHtml(content);
            }

            try {
                // Configure marked
                window.marked.setOptions({
                    breaks: true,        // Convert \n to <br>
                    gfm: true,          // GitHub Flavored Markdown
                    headerIds: false,   // Don't add IDs to headers
                    mangle: false       // Don't escape emails
                });

                // Render markdown
                const rawHtml = window.marked.parse(content);

                // Sanitize with DOMPurify
                const cleanHtml = window.DOMPurify.sanitize(rawHtml, {
                    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li',
                                  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote',
                                  'code', 'pre', 'hr'],
                    ALLOWED_ATTR: ['href', 'title', 'target', 'rel'],
                    ALLOW_DATA_ATTR: false
                });

                return cleanHtml;
            } catch (error) {
                console.error('[Chatbot] Markdown rendering failed:', error);
                return this.escapeHtml(content);
            }
        }

        renderCard(cardData) {
            if (!CONFIG.enableCards) {
                // Fallback: render as text
                const text = `${cardData.title || ''}\n${cardData.description || ''}`;
                return this.escapeHtml(text);
            }

            try {
                const card = document.createElement('div');
                card.className = 'sw-card';

                // Image (if provided)
                if (cardData.image) {
                    const img = document.createElement('img');
                    img.className = 'sw-card-image loading';
                    img.src = cardData.image;
                    img.alt = cardData.title || 'Card image';
                    img.loading = 'lazy';

                    img.onload = () => img.classList.remove('loading');
                    img.onerror = () => {
                        img.style.display = 'none';
                        console.warn('[Chatbot] Card image failed to load:', cardData.image);
                    };

                    card.appendChild(img);
                }

                // Content area
                const content = document.createElement('div');
                content.className = 'sw-card-content';

                // Title
                if (cardData.title) {
                    const title = document.createElement('div');
                    title.className = 'sw-card-title';
                    title.textContent = cardData.title;
                    content.appendChild(title);
                }

                // Description
                if (cardData.description) {
                    const desc = document.createElement('div');
                    desc.className = 'sw-card-description';
                    desc.textContent = cardData.description;
                    content.appendChild(desc);
                }

                // Metadata (optional)
                if (cardData.metadata && Array.isArray(cardData.metadata)) {
                    const metadata = document.createElement('div');
                    metadata.className = 'sw-card-metadata';

                    cardData.metadata.forEach(item => {
                        const metaItem = document.createElement('span');
                        metaItem.textContent = item;
                        metadata.appendChild(metaItem);
                    });

                    content.appendChild(metadata);
                }

                // Buttons/Actions
                if (cardData.buttons && Array.isArray(cardData.buttons)) {
                    const actions = document.createElement('div');
                    actions.className = 'sw-card-actions';

                    cardData.buttons.forEach((btn, index) => {
                        const button = document.createElement('button');
                        button.className = `sw-card-button ${index === 0 ? 'primary' : 'secondary'}`;
                        button.textContent = btn.label || btn.text;

                        button.onclick = () => {
                            if (btn.url) {
                                window.open(btn.url, '_blank', 'noopener,noreferrer');
                            } else if (btn.action === 'send') {
                                this.sendMessage(btn.value || btn.label);
                            }
                        };

                        actions.appendChild(button);
                    });

                    content.appendChild(actions);
                }

                card.appendChild(content);
                return card.outerHTML;
            } catch (error) {
                console.error('[Chatbot] Card rendering failed:', error);
                const text = `${cardData.title || ''}\n${cardData.description || ''}`;
                return this.escapeHtml(text);
            }
        }

        renderCarousel(items) {
            if (!CONFIG.enableCards || !Array.isArray(items)) {
                return this.escapeHtml('Multiple items available');
            }

            try {
                const carousel = document.createElement('div');
                carousel.className = 'sw-card-carousel';

                items.forEach(item => {
                    const cardHtml = this.renderCard(item);
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = cardHtml;
                    const cardElement = tempDiv.firstChild;
                    if (cardElement) {
                        carousel.appendChild(cardElement);
                    }
                });

                return carousel.outerHTML;
            } catch (error) {
                console.error('[Chatbot] Carousel rendering failed:', error);
                return this.escapeHtml(`${items.length} items available`);
            }
        }

        // ========================================
        // UNIFIED CONTENT RENDERER
        // Single source of truth for all content rendering
        // ========================================
        renderContentToDOM(contentDiv, content) {
            if (!contentDiv) return;

            // Reset classes
            contentDiv.classList.remove('markdown', 'card-container', 'carousel-container');

            try {
                // Detect message type
                const messageData = this.detectMessageType(content);

                switch (messageData.type) {
                    case 'text':
                        // Check if markdown is enabled and content has markdown syntax
                        if (CONFIG.enableMarkdown && this.hasMarkdownSyntax(messageData.content)) {
                            const html = this.renderMarkdown(messageData.content);
                            contentDiv.innerHTML = html;
                            contentDiv.classList.add('markdown');
                        } else {
                            // Plain text (safe, uses textContent)
                            contentDiv.textContent = messageData.content;
                        }
                        break;

                    case 'card':
                        if (CONFIG.enableRichContent && CONFIG.enableCards) {
                            const cardHtml = this.renderCard(messageData);
                            contentDiv.innerHTML = cardHtml;
                            contentDiv.classList.add('card-container');
                        } else {
                            // Fallback to plain text
                            const text = `${messageData.title || ''}\n${messageData.description || ''}`;
                            contentDiv.textContent = text;
                        }
                        break;

                    case 'carousel':
                        if (CONFIG.enableRichContent && CONFIG.enableCards) {
                            const carouselHtml = this.renderCarousel(messageData.items);
                            contentDiv.innerHTML = carouselHtml;
                            contentDiv.classList.add('carousel-container');
                        } else {
                            // Fallback to plain text
                            contentDiv.textContent = `${messageData.items?.length || 0} items available`;
                        }
                        break;

                    default:
                        // Unknown type, treat as plain text
                        contentDiv.textContent = String(content);
                }
            } catch (error) {
                console.error('[Chatbot] Content rendering failed:', error);
                // Fallback to plain text on error
                contentDiv.textContent = typeof content === 'string' ? content : String(content);
            }
        }

        init() {
            // Get DOM elements
            this.chatInputBar = document.getElementById('sw-chat-input-bar');
            this.barChatInput = document.getElementById('sw-bar-chat-input');
            this.barSendBtn = document.getElementById('sw-bar-send-btn');
            this.barCloseBtn = document.getElementById('sw-bar-close-btn');
            this.avatarMini = document.getElementById('sw-avatar-mini');

            this.chatWidgetBubble = document.getElementById('sw-chat-widget-bubble');
            this.chatPanel = document.getElementById('sw-chat-panel');
            this.chatMessages = document.getElementById('sw-chat-messages');
            this.panelChatInput = document.getElementById('sw-panel-chat-input');
            this.panelSendBtn = document.getElementById('sw-panel-send-btn');
            this.panelCloseBtn = document.getElementById('sw-panel-close-btn');
            this.panelNewChatBtn = document.getElementById('sw-panel-new-chat-btn');

            // Setup MutationObserver for automatic scroll on content changes
            this.scrollObserver = new MutationObserver(() => {
                // Only auto-scroll during active streaming when user hasn't scrolled away
                if (this.isActivelyStreaming && !this.userIsScrolling && !this.scrollPending) {
                    this.scrollPending = true;
                    requestAnimationFrame(() => {
                        const sentinel = document.getElementById('sw-scroll-sentinel');
                        if (sentinel) {
                            sentinel.scrollIntoView({ behavior: 'instant', block: 'end', inline: 'nearest' });
                        }
                        this.scrollPending = false;
                    });
                }
            });

            // Start observing chat messages for content changes
            if (this.chatMessages) {
                this.scrollObserver.observe(this.chatMessages, {
                    childList: true,      // Watch for added/removed nodes
                    subtree: true,        // Watch all descendants
                    characterData: true   // Watch for text content changes
                });
                console.log('[SCROLL] MutationObserver initialized for auto-scroll');
            }

            // Populate chat logo with bot avatar (image or emoji)
            const chatLogo = this.chatPanel.querySelector('.sw-chat-logo');
            if (chatLogo) {
                chatLogo.innerHTML = '';  // Clear template placeholder
                this.renderBotAvatar(chatLogo);
            }

            // Pre-calculate pill width for smooth animations (eliminates layout thrashing)
            this.calculateAndCachePillWidth();

            // Load conversation from localStorage if available
            const conversationLoaded = this.loadConversation();
            if (conversationLoaded && this.messageHistory.length > 0) {
                // Restore message UI from loaded history
                this.restoreMessagesUI();
            }

            // Bind events for bar (only if bar is enabled)
            if (this.chatInputBar && this.barChatInput && this.barSendBtn && this.barCloseBtn) {
                this.barChatInput.addEventListener('focus', () => this.expandBar());
                this.barChatInput.addEventListener('blur', () => this.contractBar());
                this.barChatInput.addEventListener('input', () => this.onBarInputChange());
                this.barChatInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        this.sendFromBar();
                    }
                });
                this.barSendBtn.addEventListener('click', () => this.sendFromBar());
                this.barCloseBtn.addEventListener('click', () => this.dismissBar());
            }

            // Bind events for bubble - always use animation (discovery moment)
            this.chatWidgetBubble.addEventListener('click', () => {
                const animationTier = this.getAnimationTier();

                if (animationTier === 'instant') {
                    this.openPanelImmediate();
                } else if (animationTier === 'fast') {
                    // Mobile/tablet/small screens always use fast animation
                    this.openPanelWithFastAnimation();
                } else {
                    // Desktop: Session-based animation - full on first open, fast on subsequent
                    const hasOpenedThisSession = sessionStorage.getItem('sw_widget_opened_this_session');

                    if (!hasOpenedThisSession) {
                        // First open this session - show full premium animation
                        this.openPanelWithAnimation();
                        sessionStorage.setItem('sw_widget_opened_this_session', 'true');
                    } else {
                        // Subsequent opens - fast streamlined animation
                        this.openPanelWithFastAnimation();
                    }
                }
            });
            
            // Bind events for panel
            this.panelChatInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendFromPanel();
                }
                // Shift+Enter allows new line (default behavior)
            });
            this.panelChatInput.addEventListener('input', () => {
                this.autoResizeTextarea(this.panelChatInput);
                // Enable/disable send button based on input
                const hasText = this.panelChatInput.value.trim().length > 0;
                this.panelSendBtn.disabled = !hasText;
            });
            this.panelSendBtn.addEventListener('click', () => this.sendFromPanel());
            this.panelCloseBtn.addEventListener('click', () => this.closePanel());
            this.panelNewChatBtn.addEventListener('click', () => this.startNewChat());

            // Scroll behavior
            window.addEventListener('scroll', () => this.handleScroll());

            // Detect user scrolling away from bottom during streaming
            this.chatMessages.addEventListener('scroll', () => {
                // Only care about scroll position during active streaming
                if (!this.isActivelyStreaming) {
                    return;
                }

                // Check if user scrolled away from bottom
                const container = this.chatMessages;
                const scrolledToBottom = Math.abs(
                    container.scrollHeight - container.scrollTop - container.clientHeight
                ) < 50; // 50px threshold

                if (!scrolledToBottom) {
                    // User scrolled away from bottom - pause auto-scroll
                    this.userIsScrolling = true;
                    clearTimeout(this.scrollTimeout);

                    // Resume auto-scroll after user stops for 1 second
                    this.scrollTimeout = setTimeout(() => {
                        this.userIsScrolling = false;
                    }, 1000);
                }
            });

            // Keyboard shortcuts for accessibility
            document.addEventListener('keydown', (e) => {
                // Escape to close panel
                if (e.key === 'Escape' && this.isPanelOpen) {
                    e.preventDefault();
                    this.closePanel();
                }

                // Cmd/Ctrl + K to open chat
                if ((e.metaKey || e.ctrlKey) && e.key === 'k' && !this.isPanelOpen) {
                    e.preventDefault();
                    this.openPanel();
                }
            });
        }

        expandBar() {
            if (!this.chatInputBar) return; // Bar is disabled
            if (!this.isBarDismissed && !this.chatInputBar.classList.contains('expanded')) {
                this.chatInputBar.classList.add('expanding');
                this.chatInputBar.classList.add('expanded');
                setTimeout(() => this.chatInputBar.classList.remove('expanding'), 300);
            }
        }

        contractBar() {
            if (!this.chatInputBar) return; // Bar is disabled
            if (this.chatInputBar.classList.contains('expanded')) {
                this.chatInputBar.classList.add('expanding');
                this.chatInputBar.classList.remove('expanded');
                setTimeout(() => this.chatInputBar.classList.remove('expanding'), 300);
            }
        }

        onBarInputChange() {
            if (!this.barChatInput || !this.barSendBtn) return; // Bar is disabled
            const hasText = this.barChatInput.value.trim().length > 0;
            if (hasText) {
                this.barSendBtn.classList.add('active');
            } else {
                this.barSendBtn.classList.remove('active');
            }
        }

        dismissBar() {
            if (!this.chatInputBar) return; // Bar is disabled
            this.isBarDismissed = true;
            this.chatInputBar.classList.add('dismissed');
        }

        handleScroll() {
            if (!this.chatInputBar || this.isBarDismissed || this.isPanelOpen) return;

            const currentScrollY = window.scrollY;
            const scrollingDown = currentScrollY > this.lastScrollY;
            const scrollingUp = currentScrollY < this.lastScrollY;

            if (scrollingDown && currentScrollY > this.scrollThreshold) {
                this.chatInputBar.classList.add('hidden');
            } else if (scrollingUp) {
                this.chatInputBar.classList.remove('hidden');
            }

            this.lastScrollY = currentScrollY;
        }
        
        addDateSeparator() {
            const now = new Date();
            const dateStr = now.toLocaleDateString('en-GB', { 
                day: '2-digit', 
                month: 'short', 
                year: 'numeric' 
            }) + ', ' + now.toLocaleTimeString('en-GB', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            
            const separator = document.createElement('div');
            separator.className = 'sw-date-separator';
            separator.textContent = dateStr;
            this.chatMessages.appendChild(separator);
        }
        
        renderQuickQuestions(fastMode = false) {
            const existingSection = document.querySelector('.sw-quick-questions-section');
            if (existingSection) existingSection.remove();

            const section = document.createElement('div');
            section.className = 'sw-quick-questions-section';

            const header = document.createElement('h2');
            header.className = 'sw-quick-questions-header';

            // Add text first
            const textSpan = document.createElement('span');
            textSpan.textContent = CONFIG.content.quickQuestionsHeader;
            header.appendChild(textSpan);

            // Add emoji/SVG after text if configured
            if (CONFIG.content.quickQuestionsHeaderEmoji) {
                const emojiSpan = document.createElement('span');
                emojiSpan.className = 'header-emoji';
                // Use innerHTML for SVG support, textContent for emoji
                if (CONFIG.content.quickQuestionsHeaderEmoji.startsWith('<svg')) {
                    emojiSpan.innerHTML = CONFIG.content.quickQuestionsHeaderEmoji;
                } else {
                    emojiSpan.textContent = CONFIG.content.quickQuestionsHeaderEmoji;
                }
                emojiSpan.setAttribute('aria-hidden', 'true');
                header.appendChild(emojiSpan);
            }

            section.appendChild(header);

            const list = document.createElement('div');
            list.className = 'sw-quick-questions-list';
            list.setAttribute('role', 'list');

            // Use shorter delays for fast mode (second open)
            const baseDelay = fastMode ? 0.1 : 1.3;
            const incrementDelay = fastMode ? 0.05 : 0.1;

            CONFIG.quickQuestions.forEach((question, index) => {
                const btn = document.createElement('button');
                btn.className = 'sw-quick-question-btn';
                btn.setAttribute('role', 'listitem');
                btn.setAttribute('aria-label', question.text);
                btn.style.animationDelay = `${baseDelay + (index * incrementDelay)}s`;
                btn.style.opacity = '0';

                const textSpan = document.createElement('span');
                textSpan.className = 'question-text';
                textSpan.textContent = question.text;
                btn.appendChild(textSpan);

                const emojiSpan = document.createElement('span');
                emojiSpan.className = 'question-emoji';
                emojiSpan.textContent = question.emoji;
                emojiSpan.setAttribute('aria-hidden', 'true');
                btn.appendChild(emojiSpan);

                // Clear animation after completion to allow hover transforms to work
                btn.addEventListener('animationend', () => {
                    btn.style.opacity = '1';  // Lock in final opacity
                    btn.style.animation = 'none';  // Remove animation to unblock hover
                }, { once: true });

                btn.addEventListener('click', () => this.sendQuickQuestion(question.text));
                list.appendChild(btn);
            });

            section.appendChild(list);
            this.chatMessages.appendChild(section);
        }
        
        hideQuickQuestions() {
            const section = document.querySelector('.sw-quick-questions-section');
            if (section) {
                // Instant removal - no fade animation to prevent friction
                section.remove();
            }
        }
        
        async sendQuickQuestion(question) {
            this.hideQuickQuestions();
            this.firstMessageSent = true;
            this.sendMessage(question);
        }
        
        startNewChat() {
            this.messageHistory = [];
            this.chatMessages.innerHTML = '';
            this.firstMessageSent = false;
            this.sessionId = this.generateUUID();

            // Clear localStorage (for conversation persistence)
            if (CONFIG.persistence?.enabled) {
                localStorage.removeItem(CONFIG.persistence.storageKey);
            }

            this.renderQuickQuestions(true);  // Use fast mode for intentional resets
        }
        
        async sendFromBar() {
            if (!this.barChatInput || !this.barSendBtn || !this.chatInputBar) return; // Bar is disabled
            const message = this.barChatInput.value.trim();
            if (!message) return;

            this.barChatInput.value = '';
            this.barSendBtn.classList.remove('active');
            this.chatInputBar.classList.remove('expanded');

            // Remove quick questions immediately (no timeout) to prevent them appearing in panel
            if (!this.firstMessageSent) {
                const section = document.querySelector('.sw-quick-questions-section');
                if (section) section.remove();  // Immediate removal, no race condition
                this.firstMessageSent = true;
            }

            this.openPanelImmediate();  // Immediate open for task completion - no animation delay
            this.sendMessage(message);
        }
        
        async sendFromPanel() {
            const message = this.panelChatInput.value.trim();
            if (!message) return;

            this.panelChatInput.value = '';
            this.autoResizeTextarea(this.panelChatInput); // Reset height
            this.panelChatInput.disabled = true;
            this.panelSendBtn.disabled = true; // Keep disabled while sending

            if (!this.firstMessageSent) {
                this.hideQuickQuestions();
                this.firstMessageSent = true;
            }

            try {
                await this.sendMessage(message);
            } catch (error) {
                console.error('[Chatbot] Send from panel error:', error);
            } finally {
                // ALWAYS re-enable, even if there's an error
                this.panelChatInput.disabled = false;
                this.panelSendBtn.disabled = false;
                this.panelChatInput.focus();
            }
        }
        
        async sendMessage(content) {
            const messageTimestamp = new Date();
            this.addMessage(content, 'user');
            
            // Create bot message with empty content (shows typing indicator)
            const botMessageId = Date.now().toString();
            this.addBotMessage(botMessageId, '');
            this.showTypingIndicator(botMessageId);
            
            try {
                const requestId = `${this.sessionId}-${messageTimestamp.getTime()}`;
                const payload = {
                    message: content,
                    timestamp: messageTimestamp.toISOString(),
                    session_id: this.sessionId,
                    request_id: requestId
                };
                
                const response = await postWithRetry(
                    CONFIG.apiEndpoint,
                    payload,
                    { headers: { 'X-Request-Id': requestId } }
                );
                
                console.log('[Chatbot] Webhook response status:', response.status);

                // Process SSE streaming response with timeout protection
                const streamTimeout = 30000; // 30 seconds
                const streamPromise = this.processStreamingResponse(response, botMessageId);
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Stream timeout after 30 seconds')), streamTimeout)
                );

                await Promise.race([streamPromise, timeoutPromise]);

            } catch (error) {
                console.error('[Chatbot] Error sending message:', error);
                this.updateMessage(botMessageId, CONFIG.fallbackResponse);
            } finally {
                // Defensive: Also hide here in case processStreamingResponse errors before its finally
                this.hideTypingIndicator(botMessageId);
            }
        }
        
        async processStreamingResponse(response, messageId) {
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) {
                throw new Error('No response body reader available');
            }

            // Set streaming state for auto-scroll behavior
            console.log('[SCROLL-DEBUG] ========== STREAMING STARTED ==========');
            this.isActivelyStreaming = true;

            let buffer = '';
            let firstChunkReceived = false;

            // NEW: Chunk queue for controlled streaming display
            const chunkQueue = [];
            let displayedContent = '';
            let isProcessingQueue = false;
            let streamComplete = false;
            let queueFinishedResolve = null;
            const queueFinishedPromise = new Promise(resolve => queueFinishedResolve = resolve);

            // Reset streaming buffer
            this.streamingBuffer = {
                content: '',
                messageId: messageId,
                isStructured: false
            };

            // Process queue: character-level streaming for true typewriter effect
            const processQueue = () => {
                if (isProcessingQueue) {
                    return;
                }

                // If stream is complete and queue is empty, signal completion
                if (streamComplete && chunkQueue.length === 0) {
                    console.log('[Chatbot] Queue processing complete');
                    queueFinishedResolve();
                    return;
                }

                // No more chunks to process right now
                if (chunkQueue.length === 0) {
                    return;
                }

                isProcessingQueue = true;
                const chunk = chunkQueue.shift();

                // Split chunk into individual characters for typewriter effect
                const characters = chunk.split('');
                let charIndex = 0;

                const displayNextCharacter = () => {
                    if (charIndex < characters.length) {
                        // Add one character to displayed content
                        displayedContent += characters[charIndex];
                        this.streamingBuffer.content = displayedContent;

                        // PERFORMANCE: During streaming, set plain text directly
                        // Avoids expensive markdown rendering on every character (30ms intervals)
                        const messageDiv = document.getElementById(messageId);
                        if (messageDiv) {
                            const contentDiv = messageDiv.querySelector('.sw-message-content');
                            if (contentDiv) {
                                contentDiv.textContent = displayedContent;
                                // MutationObserver triggers auto-scroll
                            }
                        }

                        charIndex++;

                        // Schedule next character
                        setTimeout(displayNextCharacter, CONFIG.streamCharDelayMs);
                    } else {
                        // Chunk complete, ready for next chunk
                        isProcessingQueue = false;

                        // Process next chunk if available
                        if (chunkQueue.length > 0) {
                            processQueue();
                        } else if (streamComplete) {
                            // All done
                            console.log('[Chatbot] Queue processing complete');
                            queueFinishedResolve();
                        }
                    }
                };

                // Start displaying characters
                displayNextCharacter();
            };
            
            try {
                while (true) {
                    const { done, value } = await reader.read();
                    
                    if (done) {
                        console.log('[Chatbot] Stream complete');
                        break;
                    }
                    
                    // Decode chunk and add to buffer
                    buffer += decoder.decode(value, { stream: true });
                    
                    // Process complete lines in buffer
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';
                    
                    for (const line of lines) {
                        if (!line.trim()) continue;
                        
                        try {
                            const raw = line.trim();
                            let dataStr = raw;
                            
                            // Handle SSE format
                            if (raw.startsWith('data:')) {
                                dataStr = raw.slice(5).trim();
                                if (!dataStr) continue;
                            }
                            if (raw.startsWith('event:') || raw.startsWith(':')) {
                                continue;
                            }
                            
                            let item;
                            if (dataStr.startsWith('{')) {
                                item = JSON.parse(dataStr);
                            } else {
                                item = { type: 'item', content: dataStr };
                            }
                            
                            // Extract content from streaming items
                            if (item.type === 'item' && item.content) {
                                // Hide typing indicator on first chunk
                                if (!firstChunkReceived) {
                                    this.hideTypingIndicator(messageId);
                                    firstChunkReceived = true;
                                }

                                let chunkContent = '';

                                // Check if content is JSON with output field or structured data
                                if (typeof item.content === 'string' && item.content.startsWith('{')) {
                                    try {
                                        const contentObj = JSON.parse(item.content);

                                        // Final output object
                                        if (contentObj.output) {
                                            this.streamingBuffer.content = contentObj.output;
                                            console.log('[Chatbot] Found final output:', contentObj.output);
                                            continue;
                                        }

                                        // NEW: Card or structured data (complete object)
                                        if (contentObj.type === 'card' || contentObj.type === 'carousel' || contentObj.title) {
                                            // Don't stream cards - display immediately
                                            this.streamingBuffer.content = contentObj;
                                            this.streamingBuffer.isStructured = true;
                                            this.updateMessage(messageId, contentObj);
                                            console.log('[Chatbot] Received structured content:', contentObj.type || 'card');
                                            continue;
                                        }
                                    } catch {
                                        chunkContent = item.content;
                                    }
                                } else {
                                    chunkContent = item.content;
                                }

                                // NEW: Add chunk to queue (only for text streaming, not structured data)
                                if (chunkContent && !this.streamingBuffer.isStructured) {
                                    chunkQueue.push(chunkContent);
                                    console.log('[Chatbot] Queued chunk:', chunkContent);

                                    // Start processing if not already running
                                    if (!isProcessingQueue) {
                                        processQueue();
                                    }
                                }
                            }
                        } catch (lineError) {
                            console.warn('[Chatbot] Failed to parse line:', line, lineError);
                        }
                    }
                }
            } finally {
                // CRITICAL: Always release the reader to prevent hanging
                try {
                    reader.releaseLock();
                } catch (e) {
                    console.warn('[Chatbot] Reader release failed:', e);
                }

                // Signal that stream is complete
                streamComplete = true;
                console.log('[Chatbot] Stream complete, chunks in queue:', chunkQueue.length);

                // If structured content or no queue, resolve immediately
                if (this.streamingBuffer.isStructured || chunkQueue.length === 0) {
                    console.log('[Chatbot] No queue processing needed, resolving immediately');
                    queueFinishedResolve();
                } else {
                    // Process any remaining items in queue
                    console.log('[Chatbot] Waiting for queue to finish processing...');
                    processQueue();
                }

                // Wait for queue to finish processing all chunks
                await queueFinishedPromise;
                console.log('[Chatbot] Queue processing finished');

                // Hide typing indicator after queue is done
                this.hideTypingIndicator(messageId);

                // Reset streaming state
                console.log('[SCROLL-DEBUG] ========== STREAMING ENDED ==========');
                this.isActivelyStreaming = false;

                // FINALIZATION: Apply rich content rendering to final complete text
                // This is done ONCE after streaming, not on every character update
                const finalContent = displayedContent || this.streamingBuffer.content;
                if (finalContent && typeof finalContent === 'string') {
                    console.log('[Chatbot] Finalizing content rendering (applying markdown)');
                    const messageDiv = document.getElementById(messageId);
                    if (messageDiv) {
                        const contentDiv = messageDiv.querySelector('.sw-message-content');
                        if (contentDiv) {
                            this.renderContentToDOM(contentDiv, finalContent);
                        }
                    }
                }

                // Final save - use displayed content (what actually showed to user)

                if (finalContent) {
                    console.log('[Chatbot] Saving final content, length:', typeof finalContent === 'string' ? finalContent.length : 'structured');

                    // Add bot response to message history and persist
                    const contentText = typeof finalContent === 'string' ? finalContent : JSON.stringify(finalContent);
                    this.messageHistory.push({ role: 'bot', content: contentText, time: new Date() });
                    this.saveConversation();
                } else {
                    // Check if we got any content
                    console.error('[Chatbot] No content extracted from stream');
                    this.updateMessage(messageId, '⚠️ No content received from stream');
                    this.messageHistory.push({ role: 'bot', content: '⚠️ No content received from stream', time: new Date() });
                    this.saveConversation();
                }
            }

            // CRITICAL: Explicitly return resolved Promise to signal completion
            return Promise.resolve();
        }
        
        openPanel() {
            // Check if user prefers reduced motion
            const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

            // Use animation if not already animating and user doesn't prefer reduced motion
            if (!prefersReducedMotion && !this.isAnimating) {
                this.openPanelWithAnimation();
            } else {
                this.openPanelImmediate();
            }
        }

        getAnimationTier() {
            // Determine animation complexity based on device capabilities
            const width = window.innerWidth;
            const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

            // Instant for reduced motion preference
            if (prefersReducedMotion) return 'instant';

            // Fast animation for mobile devices and small screens
            if (isMobile || width < 1024) return 'fast';

            // Full complex animation for desktop
            return 'full';
        }

        preventBodyScroll() {
            // Save current scroll position to prevent page jump on mobile
            this.scrollPosition = window.pageYOffset || document.documentElement.scrollTop;

            // Apply scroll lock with position preservation
            document.body.classList.add('sw-chat-open');

            // On mobile, maintain scroll position visually
            if (window.innerWidth <= 768) {
                document.body.style.top = `-${this.scrollPosition}px`;
            }
        }

        restoreBodyScroll() {
            // Remove scroll lock
            document.body.classList.remove('sw-chat-open');

            // Restore scroll position on mobile
            if (window.innerWidth <= 768 && this.scrollPosition !== undefined) {
                document.body.style.top = '';
                window.scrollTo(0, this.scrollPosition);
            }
        }

        openPanelImmediate() {
            this.isPanelOpen = true;
            this.chatPanel.classList.add('visible');
            this.chatWidgetBubble.classList.add('chat-open');
            if (this.chatInputBar) {
                this.chatInputBar.classList.add('hidden');
            }

            // Prevent body scroll on mobile (with position preservation)
            this.preventBodyScroll();

            // Show quick questions on first open (timestamp only appears after first Q&A pair)
            // But NOT when sending from floating bar (firstMessageSent will be true)
            if (this.messageHistory.length === 0 && !this.firstMessageSent) {
                this.renderQuickQuestions();
            }

            // Focus input on desktop only (prevents unwanted scroll on mobile)
            if (window.innerWidth > 768) {
                setTimeout(() => this.panelChatInput.focus(), 500);
            }
        }

        openPanelWithAnimation() {
            // Prevent multiple animations from running simultaneously
            if (!this.animationLock.acquire('full-open')) return;

            // Keep legacy flag for compatibility
            this.isAnimating = true;

            const bubble = this.chatWidgetBubble;
            const panel = this.chatPanel;
            const header = panel.querySelector('.sw-chat-header');

            // ========================================
            // STAGE 0: CLICK ANIMATION SEQUENCE
            // ========================================

            // Save original bubble content
            const originalBubbleContent = bubble.innerHTML;

            // Create icon containers for smooth transition
            const widgetIconContainer = document.createElement('div');
            widgetIconContainer.className = 'sw-bubble-widget-icon';
            widgetIconContainer.innerHTML = originalBubbleContent;

            const botIconContainer = document.createElement('div');
            botIconContainer.className = 'sw-bubble-bot-icon-click';

            // Create inner icon with background circle (matches morph icon)
            const botIconInner = document.createElement('div');
            botIconInner.className = 'sw-bubble-bot-icon-inner';
            this.renderBotAvatar(botIconInner);

            botIconContainer.appendChild(botIconInner);

            // Replace bubble content with layered icons
            bubble.innerHTML = '';
            bubble.appendChild(widgetIconContainer);
            bubble.appendChild(botIconContainer);

            // Force reflow
            bubble.offsetHeight;

            // STAGE 1: Click Press
            bubble.classList.add('clicking');

            setTimeout(() => {
                // Remove click class
                bubble.classList.remove('clicking');

                // STAGE 2: Bounce with Icon Swap
                bubble.classList.add('bouncing');

                // Start icon swap animations at bounce start
                setTimeout(() => {
                    widgetIconContainer.classList.add('animating');
                    botIconContainer.classList.add('animating');
                }, ANIMATION_TIMING.iconSwapDelay);

                setTimeout(() => {
                    // Remove bounce class
                    bubble.classList.remove('bouncing');

                    // STAGE 3: Settle & Hold
                    // Clean up - restore bubble to final state
                    bubble.innerHTML = '';
                    bubble.style.opacity = '0'; // Ready to hide for morph

                    // STAGE 4: Start Pill Expansion
                    // Now create the morph element and continue with existing animation
                    this.startPillExpansion(bubble, panel, header);

                }, ANIMATION_TIMING.bounce);

            }, ANIMATION_TIMING.clickPress);
        }

        startPillExpansion(bubble, panel, header) {
            // Get bubble position
            const bubbleRect = bubble.getBoundingClientRect();

            // Create morphing element with bot emoji (not widget SVG)
            const morph = document.createElement('div');
            morph.className = 'sw-morph-element';

            const morphIcon = document.createElement('div');
            morphIcon.className = 'sw-morph-icon';
            this.renderBotAvatar(morphIcon);

            const morphText = document.createElement('span');
            morphText.className = 'sw-morph-text';
            morphText.textContent = CONFIG.branding.botName;

            morph.appendChild(morphIcon);
            morph.appendChild(morphText);

            // Set initial circle state - NO transitions yet
            morph.classList.add('circle-state');
            morph.style.transition = 'none';
            morph.style.left = bubbleRect.left + 'px';
            morph.style.top = bubbleRect.top + 'px';
            morph.style.width = bubbleRect.width + 'px';
            morph.style.height = bubbleRect.height + 'px';
            morph.style.borderRadius = '50%';

            document.body.appendChild(morph);

            // Force reflow to ensure initial state is rendered
            morph.offsetHeight;

            // Hide original bubble
            bubble.classList.add('hidden-during-animation');

            // Render quick questions BEFORE animation so content is already laid out
            // But NOT when sending from floating bar (firstMessageSent will be true)
            if (this.messageHistory.length === 0 && !this.firstMessageSent) {
                this.renderQuickQuestions();
            }

            // Position panel below viewport for slide-up animation
            this.isPanelOpen = true;
            panel.style.visibility = 'visible'; // Make visible but positioned below
            panel.style.opacity = '0';  // Start transparent
            panel.style.transform = 'translateY(calc(100% + 50px))';  // Position below viewport
            panel.style.transition = 'none';  // Disable transitions initially
            panel.classList.add('visible');

            if (header) header.classList.add('hidden-during-animation');

            // Hide floating bar
            if (this.chatInputBar) {
                this.chatInputBar.classList.add('hidden');
            }
            this.preventBodyScroll();

            // Calculate header position - triple RAF for better layout settling
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {  // Triple RAF for stable position
                        if (!header) {
                            this.finishAnimation(morph, bubble, panel, header);
                            return;
                        }

                        const headerRect = header.getBoundingClientRect();

                        // Use cached pill width (calculated once at init for performance)
                        const requiredPillWidth = this.cachedPillWidth;

                        // STAGE 1: Hold circle (user sees emoji clearly)
                        setTimeout(() => {
                            // Enable transitions for width/height/left changes to expand leftward
                            morph.style.transition = 'width 0.5s cubic-bezier(0.16, 1.3, 0.3, 1), height 0.5s cubic-bezier(0.16, 1.3, 0.3, 1), left 0.5s cubic-bezier(0.16, 1.3, 0.3, 1), border-radius 0.5s ease';

                            // STAGE 2: Expand to pill LEFTWARD (keeping right edge anchored)
                            setTimeout(() => {
                                morph.classList.remove('circle-state');
                                morph.classList.add('pill-state', 'show-text');

                                // Calculate new left position to keep right edge fixed
                                // Using dynamically calculated width instead of header width
                                const newLeft = bubbleRect.right - requiredPillWidth;

                                morph.style.left = newLeft + 'px';
                                morph.style.width = requiredPillWidth + 'px';
                                morph.style.height = headerRect.height + 'px';
                                morph.style.borderRadius = '999px';
                            }, ANIMATION_TIMING.transitionEnable);

                            // STAGE 3: UNIFIED upward motion - pill + panel rise together
                            setTimeout(() => {
                                // Premium easing curve for buttery-smooth deceleration
                                const premiumEasing = 'cubic-bezier(0.22, 1, 0.36, 1)';

                                // Animate pill upward with fade out from start
                                morph.style.transition = `all 0.7s ${premiumEasing}, opacity 0.5s ${premiumEasing}`;
                                morph.style.left = headerRect.left + 'px';
                                morph.style.top = headerRect.top + 'px';
                                morph.style.opacity = '0';  // Fade out as it reaches top

                                // Simultaneously animate panel upward (slide from below)
                                panel.style.transition = `transform 0.7s ${premiumEasing}, opacity 0.4s ${premiumEasing}`;
                                panel.style.transform = 'translateY(0)';  // Slide up to final position
                                panel.style.opacity = '1';  // Fade in during slide
                                panel.style.pointerEvents = '';

                                // Fade in real header during upward motion (smooth crossfade with CSS delay)
                                if (header) {
                                    header.style.transition = `opacity 0.4s ${premiumEasing} 0.2s`;  // 400ms fade with 200ms delay
                                    header.classList.remove('hidden-during-animation');
                                }
                            }, ANIMATION_TIMING.pillExpansionTotal);

                            // STAGE 4: Complete animation
                            setTimeout(() => {
                                this.finishAnimation(morph, bubble, panel, header);
                            }, ANIMATION_TIMING.fullAnimationTotal);

                        }, ANIMATION_TIMING.circleHold);
                    });
                });
            });
        }

        finishAnimation(morph, bubble, panel, header) {
            // Show real header
            if (header) {
                header.classList.remove('hidden-during-animation');
                header.style.transition = '';  // Clear inline transition
            }

            // Remove morphing element
            if (morph && morph.parentNode) {
                morph.remove();
            }

            // Update bubble state
            bubble.classList.remove('hidden-during-animation');
            bubble.classList.add('chat-open');

            // Clean up panel inline styles to prevent conflicts
            panel.classList.remove('animating-in');
            panel.style.transform = '';  // Clear inline transform, let CSS take over
            panel.style.transition = '';  // Clear inline transition

            // Quick questions already rendered before animation started

            // Re-bind close button (ensure it works)
            this.panelCloseBtn = document.getElementById('sw-panel-close-btn');
            if (this.panelCloseBtn) {
                // Remove old listener if exists and add fresh one
                this.panelCloseBtn.replaceWith(this.panelCloseBtn.cloneNode(true));
                this.panelCloseBtn = document.getElementById('sw-panel-close-btn');
                this.panelCloseBtn.addEventListener('click', () => this.closePanel());
            }

            // Focus input and reset animation flag
            setTimeout(() => {
                // Focus input on desktop only (prevents unwanted scroll on mobile)
                if (this.panelChatInput && window.innerWidth > 768) {
                    this.panelChatInput.focus();
                }
                this.isAnimating = false;
                this.animationLock.release();
            }, ANIMATION_TIMING.cleanupDelay);
        }

        openPanelWithFastAnimation() {
            // Streamlined animation for repeat opens within same session (~600ms total)
            if (!this.animationLock.acquire('fast-open')) return;

            // Keep legacy flag for compatibility
            this.isAnimating = true;

            const bubble = this.chatWidgetBubble;
            const panel = this.chatPanel;

            // Hide bubble immediately
            bubble.classList.add('chat-open');

            // Hide floating bar
            if (this.chatInputBar) {
                this.chatInputBar.classList.add('hidden');
            }
            this.preventBodyScroll();

            // Render quick questions if needed - use fast mode for second open
            // But NOT when sending from floating bar (firstMessageSent will be true)
            if (this.messageHistory.length === 0 && !this.firstMessageSent) {
                this.renderQuickQuestions(true);  // Fast mode
            }

            // Fast panel animation: shorter duration, less transform
            this.isPanelOpen = true;
            panel.classList.add('visible');
            panel.style.transition = 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.4s ease';

            // Panel starts slightly below and scaled down
            requestAnimationFrame(() => {
                panel.style.transform = 'scale(1) translateY(0)';
                panel.style.opacity = '1';
            });

            // Clean up and focus
            setTimeout(() => {
                panel.style.transition = '';
                panel.style.transform = '';
                // Focus input on desktop only (prevents unwanted scroll on mobile)
                if (this.panelChatInput && window.innerWidth > 768) {
                    this.panelChatInput.focus();
                }
                this.isAnimating = false;
                this.animationLock.release();
            }, ANIMATION_TIMING.fastPanelSlide + ANIMATION_TIMING.fastCleanupDelay);
        }

        closePanel() {
            this.isPanelOpen = false;

            // Device-adaptive animation: faster and simpler on mobile
            const isMobile = window.innerWidth <= 768;
            const closeDuration = isMobile ? 180 : 200;  // Snappy on both devices
            const closeEasing = 'cubic-bezier(0.4, 0, 1, 1)';  // Accelerating ease-in

            // Premium exit animation: scale down + slide + fade (simplified on mobile)
            this.chatPanel.style.transition = `transform ${closeDuration}ms ${closeEasing}, opacity ${closeDuration}ms ease-in`;
            this.chatPanel.style.transform = isMobile ? 'translateY(30px)' : 'scale(0.95) translateY(20px)';
            this.chatPanel.style.opacity = '0';

            // Complete exit, then clean up
            setTimeout(() => {
                this.chatPanel.classList.remove('visible');
                this.chatPanel.classList.remove('animating-in');  // Remove animation class

                // CRITICAL FIX: Clear inline styles set during animation
                // These inline styles override CSS classes, preventing proper closing
                this.chatPanel.style.visibility = '';
                this.chatPanel.style.opacity = '';
                this.chatPanel.style.transform = '';  // Clear transform from slide animation
                this.chatPanel.style.transition = '';  // Clear custom transitions
                this.chatPanel.style.pointerEvents = '';
            }, closeDuration);

            this.chatWidgetBubble.classList.remove('chat-open');

            // Clear bubble inline styles to make it visible again
            this.chatWidgetBubble.style.opacity = '';
            this.chatWidgetBubble.style.visibility = '';

            // Restore widget icon in bubble (cleared during animation)
            this.chatWidgetBubble.innerHTML = CONFIG.branding.widgetIcon;

            // Re-enable body scroll (with position restoration on mobile)
            this.restoreBodyScroll();

            if (this.chatInputBar && !this.isBarDismissed) {
                this.chatInputBar.classList.remove('hidden');
            }

            // Clear chat content if panel was opened but no conversation happened
            // This prevents FAQ buttons from persisting as "zombies" in the DOM
            if (this.messageHistory.length === 0) {
                this.chatMessages.innerHTML = '';
                this.firstMessageSent = false;
            }
        }
        
        addMessage(content, sender) {
            // Add timestamp before user message
            if (sender === 'user') {
                if (this.messageHistory.length === 0) {
                    // First user message - always show timestamp
                    this.addTimestamp();
                } else {
                    // Subsequent messages - check if last was bot and 5+ mins passed
                    const lastMessage = this.messageHistory[this.messageHistory.length - 1];
                    if (lastMessage.role === 'bot') {
                        // Only show timestamp if 5+ minutes have passed
                        const timeSinceLastMessage = Date.now() - new Date(lastMessage.time).getTime();
                        const FIVE_MINUTES = 5 * 60 * 1000;

                        if (timeSinceLastMessage >= FIVE_MINUTES) {
                            this.addTimestamp();
                        }
                    }
                }
            }
            
            const messageDiv = document.createElement('article');
            messageDiv.className = `sw-message sw-${sender}-message`;
            messageDiv.setAttribute('role', 'article');
            messageDiv.setAttribute('aria-label', `${sender === 'bot' ? 'AI' : 'User'} message`);
            messageDiv.id = `msg-${Date.now()}`;
            
            if (sender === 'bot') {
                const wrapper = document.createElement('div');
                wrapper.className = 'sw-message-wrapper';
                
                const avatar = document.createElement('div');
                avatar.className = 'sw-message-avatar';
                avatar.setAttribute('aria-hidden', 'true');
                this.renderBotAvatar(avatar);
                wrapper.appendChild(avatar);
                
                const contentDiv = document.createElement('div');
                contentDiv.className = 'sw-message-content';
                contentDiv.textContent = content;
                wrapper.appendChild(contentDiv);
                
                messageDiv.appendChild(wrapper);
            } else {
                const contentDiv = document.createElement('div');
                contentDiv.className = 'sw-message-content';
                contentDiv.textContent = content;
                messageDiv.appendChild(contentDiv);
            }
            
            this.chatMessages.appendChild(messageDiv);

            // Ensure sentinel stays at bottom
            const sentinel = document.getElementById('sw-scroll-sentinel');
            if (sentinel && sentinel.parentNode === this.chatMessages) {
                this.chatMessages.appendChild(sentinel);
            }

            this.messageHistory.push({ role: sender, content, time: new Date() });
            this.saveConversation();  // Persist conversation to localStorage
            this.scrollToBottom();
        }
        
        addBotMessage(messageId, content) {
            const messageDiv = document.createElement('article');
            messageDiv.className = 'sw-message sw-bot-message';
            messageDiv.setAttribute('role', 'article');
            messageDiv.setAttribute('aria-label', 'AI message');
            messageDiv.id = messageId;

            const wrapper = document.createElement('div');
            wrapper.className = 'sw-message-wrapper';

            const avatar = document.createElement('div');
            avatar.className = 'sw-message-avatar';
            avatar.setAttribute('aria-hidden', 'true');
            this.renderBotAvatar(avatar);
            wrapper.appendChild(avatar);

            const contentDiv = document.createElement('div');
            contentDiv.className = 'sw-message-content';
            wrapper.appendChild(contentDiv);

            messageDiv.appendChild(wrapper);
            this.chatMessages.appendChild(messageDiv);

            // Ensure sentinel stays at bottom
            const sentinel = document.getElementById('sw-scroll-sentinel');
            if (sentinel && sentinel.parentNode === this.chatMessages) {
                this.chatMessages.appendChild(sentinel);
            }

            // Apply rendering if content is provided (uses unified renderer)
            // Empty content means streaming will populate it later
            if (content) {
                this.renderContentToDOM(contentDiv, content);
            }

            this.scrollToBottom();
        }

        updateMessage(messageId, content) {
            console.log('[SCROLL-DEBUG] updateMessage called', {
                messageId,
                contentLength: typeof content === 'string' ? content.length : 'structured',
                isActivelyStreaming: this.isActivelyStreaming,
                userIsScrolling: this.userIsScrolling
            });

            const messageDiv = document.getElementById(messageId);
            if (!messageDiv) return;

            const contentDiv = messageDiv.querySelector('.sw-message-content');
            if (!contentDiv) return;

            // Use unified renderer - single source of truth
            this.renderContentToDOM(contentDiv, content);

            // MutationObserver handles auto-scroll during streaming
        }
        
        showTypingIndicator(messageId) {
            const messageDiv = document.getElementById(messageId);
            if (messageDiv) {
                const contentDiv = messageDiv.querySelector('.sw-message-content');
                if (contentDiv) {
                    contentDiv.className = 'sw-typing-indicator';
                    contentDiv.innerHTML = '<div class="sw-typing-dot"></div><div class="sw-typing-dot"></div><div class="sw-typing-dot"></div>';
                }
            }
        }
        
        hideTypingIndicator(messageId) {
            const messageDiv = document.getElementById(messageId);
            if (messageDiv) {
                const contentDiv = messageDiv.querySelector('.sw-typing-indicator');
                if (contentDiv) {
                    contentDiv.className = 'sw-message-content';
                    contentDiv.innerHTML = '';
                }
            }
        }
        
        addTimestamp() {
            const now = new Date();
            // Format: "2025 Nov 15, 14:13"
            const year = now.getFullYear();
            const month = now.toLocaleDateString('en-US', { month: 'short' });
            const day = now.getDate();
            const time = now.toLocaleTimeString('en-GB', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
            const dateStr = `${year} ${month} ${day}, ${time}`;

            const timestamp = document.createElement('div');
            timestamp.className = 'sw-timestamp-separator';
            timestamp.setAttribute('role', 'separator');
            timestamp.setAttribute('aria-label', `Message sent at ${dateStr}`);
            timestamp.textContent = dateStr;
            this.chatMessages.appendChild(timestamp);

            // Ensure sentinel stays at bottom
            const sentinel = document.getElementById('sw-scroll-sentinel');
            if (sentinel && sentinel.parentNode === this.chatMessages) {
                this.chatMessages.appendChild(sentinel);
            }
        }

        scrollToBottom(smooth = false) {
            // Simple scroll for non-streaming scenarios (new messages, manual scroll)
            // MutationObserver handles streaming auto-scroll
            const sentinel = document.getElementById('sw-scroll-sentinel');
            if (sentinel) {
                sentinel.scrollIntoView({
                    behavior: smooth ? 'smooth' : 'instant',
                    block: 'end',
                    inline: 'nearest'
                });
            } else {
                // Fallback if sentinel not found
                this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
            }
        }
        
        // Check if user is at bottom of chat (within 100px)
        isNearBottom() {
            const threshold = 100;
            const position = this.chatMessages.scrollTop + this.chatMessages.clientHeight;
            const height = this.chatMessages.scrollHeight;
            return position >= height - threshold;
        }

        // Auto-resize textarea as user types
        autoResizeTextarea(textarea) {
            textarea.style.height = 'auto';
            const newHeight = Math.min(textarea.scrollHeight, 150);
            textarea.style.height = newHeight + 'px';

            // Only show scrollbar when content exceeds max-height
            if (textarea.scrollHeight > 150) {
                textarea.style.overflowY = 'auto';
            } else {
                textarea.style.overflowY = 'hidden';
            }
        }
    }
    
    // ========================================
    // INITIALIZATION
    // ========================================
    function injectStyles() {
        if (document.getElementById('semmelweis-chatbot-styles')) return;
        const styleEl = document.createElement('style');
        styleEl.id = 'semmelweis-chatbot-styles';
        // Inject CSS variables first, then main CSS
        styleEl.textContent = generateCSSVariables() + CSS;
        document.head.appendChild(styleEl);
    }
    
    function injectHTML() {
        if (document.getElementById('semmelweis-chat-widget')) return;
        const container = document.createElement('div');
        container.id = 'semmelweis-chat-widget';
        container.innerHTML = generateHTML();
        document.body.appendChild(container);
    }
    
    async function init() {
        const initialize = async () => {
            injectStyles();
            injectHTML();

            // Load libraries if markdown or rich content enabled
            if (CONFIG.enableMarkdown || CONFIG.enableRichContent) {
                console.log('[Chatbot] Loading rendering libraries...');
                await loadLibraries();
            }

            window.SemmelweisChatWidget = new ChatWidget();
            console.log('✅ Semmelweis Chatbot Widget v1.0.0 initialized');
            console.log('[Chatbot] Markdown:', CONFIG.enableMarkdown ? 'enabled' : 'disabled');
            console.log('[Chatbot] Rich content:', CONFIG.enableRichContent ? 'enabled' : 'disabled');
            if (CONFIG.enableRichContent) {
                console.log('[Chatbot] Cards:', CONFIG.enableCards ? 'enabled' : 'disabled');
            }
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initialize);
        } else {
            await initialize();
        }
    }
    
    init();
})();
