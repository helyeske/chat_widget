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
    const DEFAULT_CONFIG = {
        apiEndpoint: 'https://your-n8n.yourdomain.com/webhook/chat',
        quickQuestions: [
            { text: "What programs do you offer?", emoji: "🎓" },
            { text: "How can I apply?", emoji: "📝" },
            { text: "Tell me about tuition fees", emoji: "💰" }
        ],
        fallbackResponse: "I'm sorry, I'm having trouble connecting right now. Please try again or contact us at tmk@semmelweis.hu",
        retries: 2,
        timeoutMs: 20000,
        streamBatchIntervalMs: 150
    };
    
    // Merge with user config if provided
    const CONFIG = typeof window.ChatbotConfig !== 'undefined' 
        ? { ...DEFAULT_CONFIG, ...window.ChatbotConfig }
        : DEFAULT_CONFIG;
    
    // ========================================
    // CSS INJECTION
    // ========================================
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
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%) scale(1);
            background: white;
            border-radius: 40px;
            box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
            padding: 6px 12px;
            display: flex;
            align-items: center;
            gap: 8px;
            width: 320px;
            transition: 
                transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
                width 0.4s cubic-bezier(0.4, 0, 0.2, 1),
                box-shadow 0.25s ease;
            pointer-events: all;
            will-change: transform, width;
        }

        .sw-chat-input-bar:hover:not(.expanding) {
            transform: translateX(-50%) scale(1.02);
            box-shadow: 0 6px 32px rgba(0, 0, 0, 0.18);
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
                transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1),
                width 0.45s cubic-bezier(0.4, 0, 0.2, 1),
                box-shadow 0.3s ease;
        }
        
        .sw-chat-input-bar.expanding:hover {
            transform: translateX(-50%) scale(1.01);
        }

        .sw-chat-input-bar.hidden {
            opacity: 0;
            transform: translateX(-50%) translateY(120%) scale(0.95);
            pointer-events: none;
            transition: 
                opacity 0.3s ease,
                transform 0.4s cubic-bezier(0.4, 0, 0.6, 1);
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
            color: #8B5CF6;
            font-size: 18px;
            cursor: default;
            transition: all 0.2s;
        }

        .sw-bar-chat-input {
            flex: 1;
            border: none;
            outline: none;
            background: transparent;
            font-size: 16px;
            color: #374151;
            padding: 4px 4px;
        }

        .sw-bar-chat-input::placeholder {
            color: #6b7280;
        }
        /* Prevent body scroll when chat panel is open */
            body.sw-chat-open {
                overflow: hidden;
                position: fixed;
                width: 100%;
                height: 100%;
            }
    
        /* Ensure chat panel fills viewport correctly */
        @media (max-width: 768px) {
            .sw-chat-panel {
                top: 0;
                right: 0;
                left: 0;
                bottom: 0;
                width: 100%;
                height: 100vh;
                height: 100dvh; /* Dynamic viewport height - accounts for mobile browser chrome */
                border-radius: 0;
                padding: 8px;
                gap: 8px;
                position: fixed;
                overflow: hidden; /* Prevent double scroll */
            }
    
            .sw-chat-main-card {
                height: 100%;
                overflow: hidden; /* Let only messages area scroll */
            }
    
            .sw-chat-messages {
                overflow-y: auto;
                overflow-x: hidden; /* Prevent horizontal scroll */
                -webkit-overflow-scrolling: touch; /* Smooth scrolling on iOS */
            }
        }

        .sw-bar-icon-btn {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: #f3f4f6;
            border: none;
            color: #9ca3af;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.25s;
            flex-shrink: 0;
        }

        .sw-bar-icon-btn.send-btn {
            background: #e5e7eb;
        }

        .sw-bar-icon-btn.send-btn.active {
            background: linear-gradient(135deg, #8B5CF6, #A78BFA);
            color: white;
            box-shadow: 0 2px 6px rgba(139, 92, 246, 0.3);
        }

        .sw-bar-icon-btn.send-btn.active:hover {
            transform: scale(1.08);
        }

        .sw-bar-icon-btn.close-btn:hover {
            background: #fee2e2;
            color: #ef4444;
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
            width: 64px;
            height: 64px;
            border-radius: 50%;
            background: linear-gradient(135deg, #8B5CF6, #A78BFA);
            box-shadow: 0 4px 20px rgba(139, 92, 246, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            color: white;
            font-size: 28px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            pointer-events: all;
        }

        .sw-chat-widget-bubble:hover {
            transform: scale(1.08);
            box-shadow: 0 6px 28px rgba(139, 92, 246, 0.5);
        }

        .sw-chat-widget-bubble:active {
            transform: scale(0.95);
        }

        .sw-chat-widget-bubble.chat-open {
            opacity: 0;
            transform: scale(0.8);
            pointer-events: none;
        }

        /* Notification Badge */
        .sw-bubble-badge {
            position: absolute;
            top: -4px;
            right: -4px;
            background: #ef4444;
            color: white;
            border-radius: 50%;
            width: 22px;
            height: 22px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 700;
            border: 2px solid white;
            animation: sw-badgePulse 2s infinite;
        }

        @keyframes sw-badgePulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.15); }
        }

        /* LAYER 1: Grey Outer Container Card */
        .sw-chat-panel {
            position: fixed;
            top: 20px;
            bottom: 20px;
            right: 20px;
            width: 420px;
            height: calc(100vh - 40px);
            background: linear-gradient(135deg, #f1f3f5 0%, #e9ecef 100%);
            border-radius: 32px;
            box-shadow: 
                0 0 0 1px rgba(0, 0, 0, 0.05),
                0 20px 60px rgba(0, 0, 0, 0.2);
            display: flex;
            flex-direction: column;
            opacity: 0;
            transform: scale(0.92) translateY(30px);
            pointer-events: none;
            transition: all 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
            z-index: 10000;
            padding: 8px;
            gap: 8px;
        }

        .sw-chat-panel.visible {
            opacity: 1;
            transform: scale(1) translateY(0);
            pointer-events: all;
        }

        /* LAYER 2: White Main Chat Card */
        .sw-chat-main-card {
            flex: 1;
            background: #ffffff;
            border-radius: 24px;
            box-shadow: 
                0 2px 8px rgba(0, 0, 0, 0.04),
                0 1px 2px rgba(0, 0, 0, 0.03);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            position: relative;
        }

        /* LAYER 3a: Elevated Purple Header Card */
        .sw-chat-header {
            padding: 18px 20px;
            background: linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%);
            color: white;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-radius: 20px;
            flex-shrink: 0;
            margin: 8px 8px 0 8px;
            box-shadow: 
                0 4px 12px rgba(139, 92, 246, 0.25),
                0 2px 4px rgba(0, 0, 0, 0.1);
            position: relative;
            z-index: 2;
        }

        .sw-chat-header-left {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .sw-chat-logo {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(10px);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .sw-chat-header-title {
            font-size: 22px;
            font-weight: 700;
            margin: 0;
            letter-spacing: -0.02em;
        }

        .sw-chat-header-right {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .sw-header-icon-btn {
            background: rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(10px);
            border: none;
            color: white;
            width: 40px;
            height: 40px;
            border-radius: 12px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 22px;
            transition: all 0.2s;
            font-weight: 400;
        }

        .sw-header-icon-btn:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: scale(1.05);
        }

        .sw-header-icon-btn.new-chat-btn {
            font-size: 24px;
            font-weight: 300;
        }

        /* Chat Messages Area - Inside White Card */
        .sw-chat-messages {
            flex: 1;
            overflow-y: auto;
            overflow-x: hidden;
            padding: 20px;
            display: flex;
            flex-direction: column;
            gap: 20px;
        }

        .sw-chat-messages::-webkit-scrollbar {
            width: 6px;
        }

        .sw-chat-messages::-webkit-scrollbar-track {
            background: transparent;
            margin: 16px 0;
        }

        .sw-chat-messages::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 10px;
            transition: background 0.2s ease;
        }

        .sw-chat-messages::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
        }

        .sw-chat-messages {
            scrollbar-width: thin;
            scrollbar-color: #cbd5e1 transparent;
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
        }

        .sw-quick-questions-section.hidden {
            display: none;
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
            font-size: 18px;
            font-weight: 800;
            color: #111827;
            text-align: left;
            letter-spacing: -0.03em;
            margin-bottom: 8px;
            line-height: 1.2;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .sw-quick-questions-header::before {
            content: '✨';
            font-size: 20px;
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
            color: #374151;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            font-family: inherit;
            text-align: left;
            width: auto;
            max-width: 90%;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
            position: relative;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
        }

        .sw-quick-question-btn::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(167, 139, 250, 0.08));
            opacity: 0;
            transition: opacity 0.3s ease;
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
            transform: translateX(-4px) translateY(-2px);
            border-color: #A78BFA;
            box-shadow: 0 4px 12px rgba(139, 92, 246, 0.2);
            color: #8B5CF6;
        }

        .sw-quick-question-btn:hover::before {
            opacity: 1;
        }

        .sw-quick-question-btn:active {
            transform: translateX(-2px) translateY(-1px);
            box-shadow: 0 2px 6px rgba(139, 92, 246, 0.15);
        }

        /* Messages */
        .sw-message {
            display: flex;
            flex-direction: column;
            max-width: 85%;
            animation: sw-messageSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
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
            gap: 10px;
        }

        .sw-message-avatar {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: #f3f4f6;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #8B5CF6;
            font-size: 18px;
            flex-shrink: 0;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
        }

        .sw-message-content {
            padding: 14px 18px;
            border-radius: 20px;
            font-size: 15px;
            line-height: 1.6;
            word-wrap: break-word;
            word-break: break-word;
            overflow-wrap: break-word;
            max-width: 100%;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }

        .sw-bot-message .sw-message-content {
            background: #f9fafb;
            color: #1f2937;
            border-bottom-left-radius: 6px;
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
            color: #8B5CF6;
        }

        .sw-user-message .sw-message-content {
            background: linear-gradient(135deg, #8B5CF6, #A78BFA);
            color: white;
            border-bottom-right-radius: 6px;
            box-shadow: 0 2px 10px rgba(139, 92, 246, 0.3);
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
            background: #8B5CF6;
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
            padding: 14px 18px;
            background: #ffffff;
            display: flex;
            gap: 12px;
            align-items: center;
            flex-shrink: 0;
            border-radius: 20px;
            margin: 0 8px 8px 8px;
            box-shadow: 
                0 -2px 8px rgba(0, 0, 0, 0.04),
                0 2px 8px rgba(0, 0, 0, 0.06);
            position: relative;
            z-index: 2;
        }

        .sw-panel-chat-input {
            flex: 1;
            border: 2px solid #e5e7eb;
            border-radius: 16px;
            outline: none;
            background: #f9fafb;
            padding: 12px 16px;
            font-size: 16px;
            font-family: inherit;
            color: #1f2937;
            transition: all 0.25s;
        }

        .sw-panel-chat-input:focus {
            border-color: #8B5CF6;
            background: #ffffff;
            box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
        }

        .sw-panel-chat-input::placeholder {
            color: #6b7280;
        }

        .sw-panel-send-btn {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: linear-gradient(135deg, #8B5CF6, #A78BFA);
            border: none;
            color: white;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
            flex-shrink: 0;
            box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
        }

        .sw-panel-send-btn:hover:not(:disabled) {
            transform: scale(1.08);
            box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
        }

        .sw-panel-send-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .sw-panel-send-btn svg {
            width: 20px;
            height: 20px;
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
            /* MODIFIED: Hide chat input bar on mobile */
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
                padding: 8px;
                gap: 8px;
                overflow: hidden; /* ADD: Prevent scroll on panel */
            }
            
            .sw-chat-header {
                padding: 16px 18px;
                border-radius: 18px;
                margin: 6px 6px 0 6px;
            }
            
            .sw-chat-header-title {
                font-size: 20px;
            }
            
            .new-chat-btn {
                display: none;
            }
            
            /* MODIFIED: Fix messages overflow */
            .sw-chat-messages {
                padding: 16px;
                overflow-x: hidden; /* ADD: Prevent horizontal scroll */
                -webkit-overflow-scrolling: touch; /* ADD: Smooth iOS scrolling */
            }
            
            .sw-chat-input-area {
                padding: 14px 16px;
                border-radius: 18px;
                margin: 0 6px 6px 6px;
            }
            
            .sw-chat-widget-bubble {
                bottom: 16px;
                right: 16px;
                width: 56px;
                height: 56px;
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
            }
        }
        
        @media (max-width: 480px) {
            .sw-chat-panel {
                padding: 8px;
            }
        }
    
    // ========================================
    // HTML TEMPLATE
    // ========================================
    const HTML = `
        <!-- Compact Chat Input Bar -->
        <div id="sw-chat-input-bar" class="sw-chat-input-bar" role="search" aria-label="Quick chat input">
            <div class="sw-chat-avatar-mini" id="sw-avatar-mini" aria-hidden="true">✨</div>
            <input 
                type="text" 
                id="sw-bar-chat-input" 
                class="sw-bar-chat-input"
                placeholder="Got any questions?"
                autocomplete="off"
                aria-label="Type your question here"
            />
            <button class="sw-bar-icon-btn send-btn" id="sw-bar-send-btn" title="Send message" aria-label="Send message">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                </svg>
            </button>
            <button class="sw-bar-icon-btn close-btn" id="sw-bar-close-btn" title="Dismiss chat bar" aria-label="Dismiss chat bar">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
            </button>
        </div>

        <!-- Persistent Chat Widget Bubble -->
        <div id="sw-chat-widget-bubble" class="sw-chat-widget-bubble" role="button" aria-label="Open chat" tabindex="0">
            💬
            <span class="sw-bubble-badge" aria-label="New messages available">1</span>
        </div>

        <!-- Chat Panel with 3-Layer Hierarchy -->
        <div id="sw-chat-panel" class="sw-chat-panel" role="dialog" aria-label="Chat with Semmelweis AI" aria-modal="true">
            <!-- LAYER 2: White Main Card -->
            <div class="sw-chat-main-card">
                <!-- LAYER 3a: Elevated Header Card -->
                <div class="sw-chat-header">
                    <div class="sw-chat-header-left">
                        <div class="sw-chat-logo">🤖</div>
                        <h3 class="sw-chat-header-title">Zsanett AI</h3>
                    </div>
                    <div class="sw-chat-header-right">
                        <button id="sw-new-chat-btn" class="sw-header-icon-btn new-chat-btn" title="Start new chat" aria-label="Start new chat">+</button>
                        <button id="sw-panel-close-btn" class="sw-header-icon-btn close-btn" title="Close chat" aria-label="Close chat">×</button>
                    </div>
                </div>
                
                <!-- Messages Area (Inside White Card) -->
                <div class="sw-chat-messages" id="sw-chat-messages" role="log" aria-live="polite" aria-label="Chat conversation">
                    <!-- Messages added dynamically -->
                </div>
                
                <!-- LAYER 3b: Elevated Input Card -->
                <div class="sw-chat-input-area">
                    <input 
                        type="text" 
                        id="sw-panel-chat-input" 
                        class="sw-panel-chat-input"
                        placeholder="Type a message..."
                        autocomplete="off"
                        aria-label="Type your message"
                    />
                    <button id="sw-panel-send-btn" class="sw-panel-send-btn" aria-label="Send message">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    `;
    
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
            this.init();
        }
        
        generateUUID() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                const r = Math.random() * 16 | 0;
                const v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
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
            this.newChatBtn = document.getElementById('sw-new-chat-btn');
            
            // Bind events for bar
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
            
            // Bind events for bubble
            this.chatWidgetBubble.addEventListener('click', () => this.openPanel());
            
            // Bind events for panel
            this.panelChatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendFromPanel();
                }
            });
            this.panelSendBtn.addEventListener('click', () => this.sendFromPanel());
            this.panelCloseBtn.addEventListener('click', () => this.closePanel());
            this.newChatBtn.addEventListener('click', () => this.startNewChat());
            
            // Scroll behavior
            window.addEventListener('scroll', () => this.handleScroll());
        }
        
        expandBar() {
            if (!this.isBarDismissed && !this.chatInputBar.classList.contains('expanded')) {
                this.chatInputBar.classList.add('expanding');
                this.chatInputBar.classList.add('expanded');
                setTimeout(() => this.chatInputBar.classList.remove('expanding'), 450);
            }
        }
        
        contractBar() {
            if (this.chatInputBar.classList.contains('expanded')) {
                this.chatInputBar.classList.add('expanding');
                this.chatInputBar.classList.remove('expanded');
                setTimeout(() => this.chatInputBar.classList.remove('expanding'), 450);
            }
        }
        
        onBarInputChange() {
            const hasText = this.barChatInput.value.trim().length > 0;
            if (hasText) {
                this.barSendBtn.classList.add('active');
            } else {
                this.barSendBtn.classList.remove('active');
            }
        }
        
        dismissBar() {
            this.isBarDismissed = true;
            this.chatInputBar.classList.add('dismissed');
        }
        
        handleScroll() {
            if (this.isBarDismissed || this.isPanelOpen) return;
            
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
        
        renderQuickQuestions() {
            const existingSection = document.querySelector('.sw-quick-questions-section');
            if (existingSection) existingSection.remove();
            
            const section = document.createElement('div');
            section.className = 'sw-quick-questions-section';
            
            const header = document.createElement('h2');
            header.className = 'sw-quick-questions-header';
            header.textContent = 'Frequently Asked Questions';
            section.appendChild(header);
            
            const list = document.createElement('div');
            list.className = 'sw-quick-questions-list';
            list.setAttribute('role', 'list');
            
            CONFIG.quickQuestions.forEach((question, index) => {
                const btn = document.createElement('button');
                btn.className = 'sw-quick-question-btn';
                btn.setAttribute('role', 'listitem');
                btn.setAttribute('aria-label', question.text);
                btn.style.animationDelay = `${index * 0.1}s`;
                
                const textSpan = document.createElement('span');
                textSpan.className = 'question-text';
                textSpan.textContent = question.text;
                btn.appendChild(textSpan);
                
                const emojiSpan = document.createElement('span');
                emojiSpan.className = 'question-emoji';
                emojiSpan.textContent = question.emoji;
                emojiSpan.setAttribute('aria-hidden', 'true');
                btn.appendChild(emojiSpan);
                
                btn.addEventListener('click', () => this.sendQuickQuestion(question.text));
                list.appendChild(btn);
            });
            
            section.appendChild(list);
            this.chatMessages.appendChild(section);
        }
        
        hideQuickQuestions() {
            const section = document.querySelector('.sw-quick-questions-section');
            if (section) {
                section.classList.add('hidden');
                setTimeout(() => section.remove(), 300);
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
            this.addDateSeparator();
            this.renderQuickQuestions();
        }
        
        async sendFromBar() {
            const message = this.barChatInput.value.trim();
            if (!message) return;
            
            this.barChatInput.value = '';
            this.barSendBtn.classList.remove('active');
            this.chatInputBar.classList.remove('expanded');
            this.openPanel();
            
            if (!this.firstMessageSent) {
                this.hideQuickQuestions();
                this.firstMessageSent = true;
            }
            
            this.sendMessage(message);
        }
        
        async sendFromPanel() {
            const message = this.panelChatInput.value.trim();
            if (!message) return;
            
            this.panelChatInput.value = '';
            this.panelChatInput.disabled = true;
            this.panelSendBtn.disabled = true;
            
            if (!this.firstMessageSent) {
                this.hideQuickQuestions();
                this.firstMessageSent = true;
            }
            
            await this.sendMessage(message);
            
            this.panelChatInput.disabled = false;
            this.panelSendBtn.disabled = false;
            this.panelChatInput.focus();
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
                
                // Process SSE streaming response
                await this.processStreamingResponse(response, botMessageId);
                
            } catch (error) {
                console.error('[Chatbot] Error sending message:', error);
                this.updateMessage(botMessageId, CONFIG.fallbackResponse);
            } finally {
                this.hideTypingIndicator(botMessageId);
            }
        }
        
        async processStreamingResponse(response, messageId) {
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            
            if (!reader) {
                throw new Error('No response body reader available');
            }
            
            let buffer = '';
            let firstChunkReceived = false;
            
            // Reset streaming buffer
            this.streamingBuffer = {
                content: '',
                messageId: messageId
            };
            
            // Start batch update interval
            const batchInterval = setInterval(() => {
                if (this.streamingBuffer.content && this.streamingBuffer.messageId) {
                    const contentToUpdate = this.streamingBuffer.content;
                    const msgId = this.streamingBuffer.messageId;
                    this.updateMessage(msgId, contentToUpdate);
                }
            }, CONFIG.streamBatchIntervalMs);
            
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
                                
                                // Check if content is JSON with output field
                                if (typeof item.content === 'string' && item.content.startsWith('{')) {
                                    try {
                                        const contentObj = JSON.parse(item.content);
                                        if (contentObj.output) {
                                            // Final output - update buffer immediately
                                            this.streamingBuffer.content = contentObj.output;
                                            console.log('[Chatbot] Found final output:', contentObj.output);
                                            continue;
                                        }
                                    } catch {
                                        chunkContent = item.content;
                                    }
                                } else {
                                    chunkContent = item.content;
                                }
                                
                                // Add chunk to buffer (no state update here)
                                if (chunkContent) {
                                    this.streamingBuffer.content += chunkContent;
                                    console.log('[Chatbot] Buffered chunk:', chunkContent);
                                }
                            }
                        } catch (lineError) {
                            console.warn('[Chatbot] Failed to parse line:', line, lineError);
                        }
                    }
                }
            } finally {
                // Stop batch updates
                clearInterval(batchInterval);
                
                // Final flush
                if (this.streamingBuffer.content && this.streamingBuffer.messageId) {
                    const finalContent = this.streamingBuffer.content;
                    const msgId = this.streamingBuffer.messageId;
                    this.updateMessage(msgId, finalContent);
                }
            }
            
            // Check if we got any content
            if (!this.streamingBuffer.content) {
                console.error('[Chatbot] No content extracted from stream');
                this.updateMessage(messageId, '⚠️ No content received from stream');
            }
        }
        
        openPanel() {
            this.isPanelOpen = true;
            this.chatPanel.classList.add('visible');
            this.chatWidgetBubble.classList.add('chat-open');
            this.chatInputBar.classList.add('hidden');
            
            // Prevent body scroll on mobile
            document.body.classList.add('sw-chat-open');
            
            const badge = document.querySelector('.sw-bubble-badge');
            if (badge) badge.style.display = 'none';
            
            // Show quick questions on first open (timestamp only appears after first Q&A pair)
            if (this.messageHistory.length === 0) {
                this.renderQuickQuestions();
            }
            
            setTimeout(() => this.panelChatInput.focus(), 500);
        }
        
        closePanel() {
            this.isPanelOpen = false;
            this.chatPanel.classList.remove('visible');
            this.chatWidgetBubble.classList.remove('chat-open');
            
            // Re-enable body scroll
            document.body.classList.remove('sw-chat-open');
            
            if (!this.isBarDismissed) {
                this.chatInputBar.classList.remove('hidden');
            }
        }
        
        addMessage(content, sender) {
            // Add timestamp before user message if completing a pair
            if (sender === 'user' && this.messageHistory.length > 0) {
                const lastMessage = this.messageHistory[this.messageHistory.length - 1];
                if (lastMessage.role === 'bot') {
                    this.addTimestamp();
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
                avatar.textContent = '🤖';
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
            this.messageHistory.push({ role: sender, content, time: new Date() });
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
            avatar.textContent = '🤖';
            wrapper.appendChild(avatar);
            
            const contentDiv = document.createElement('div');
            contentDiv.className = 'sw-message-content';
            contentDiv.textContent = content;
            wrapper.appendChild(contentDiv);
            
            messageDiv.appendChild(wrapper);
            this.chatMessages.appendChild(messageDiv);
            this.scrollToBottom();
        }
        
        updateMessage(messageId, content) {
            const messageDiv = document.getElementById(messageId);
            if (messageDiv) {
                const contentDiv = messageDiv.querySelector('.sw-message-content');
                if (contentDiv) {
                    contentDiv.textContent = content;
                    this.scrollToBottom();
                }
            }
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
            const dateStr = now.toLocaleDateString('en-GB', { 
                day: '2-digit', 
                month: 'short', 
                year: 'numeric' 
            }) + ', ' + now.toLocaleTimeString('en-GB', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            
            const timestamp = document.createElement('div');
            timestamp.className = 'sw-timestamp-separator';
            timestamp.setAttribute('role', 'separator');
            timestamp.setAttribute('aria-label', `Message sent at ${dateStr}`);
            timestamp.textContent = dateStr;
            this.chatMessages.appendChild(timestamp);
        }
        
        scrollToBottom() {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        }
    }
    
    // ========================================
    // INITIALIZATION
    // ========================================
    function injectStyles() {
        if (document.getElementById('semmelweis-chatbot-styles')) return;
        const styleEl = document.createElement('style');
        styleEl.id = 'semmelweis-chatbot-styles';
        styleEl.textContent = CSS;
        document.head.appendChild(styleEl);
    }
    
    function injectHTML() {
        if (document.getElementById('semmelweis-chat-widget')) return;
        const container = document.createElement('div');
        container.id = 'semmelweis-chat-widget';
        container.innerHTML = HTML;
        document.body.appendChild(container);
    }
    
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                injectStyles();
                injectHTML();
                window.SemmelweisChatWidget = new ChatWidget();
                console.log('✅ Semmelweis Chatbot Widget v1.0.0 initialized');
            });
        } else {
            injectStyles();
            injectHTML();
            window.SemmelweisChatWidget = new ChatWidget();
            console.log('✅ Semmelweis Chatbot Widget v1.0.0 initialized');
        }
    }
    
    init();
})();
