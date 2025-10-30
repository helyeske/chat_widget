# Semmelweis University Translational Medicine Chatbot Widget

A production-ready, SSE-streaming chat widget for Semmelweis University's Translational Medicine Centre. Provides real-time AI-powered answers about programs, admissions, tuition, and more.

## ✨ Features

- **Real-time Streaming**: Server-Sent Events (SSE) for instant, token-by-token responses
- **Zero Dependencies**: Pure vanilla JavaScript - no frameworks required
- **Mobile Responsive**: Optimized UX for desktop, tablet, and mobile devices
- **Easy Integration**: Single `<script>` tag deployment
- **Customizable**: Override API endpoints and quick questions
- **Performance Optimized**: Minimal bundle size (~20KB), lazy loading, efficient DOM updates
- **Accessible**: WCAG 2.1 compliant with proper ARIA labels

## 🚀 Quick Start

### Basic Integration

Add this single line before your closing `</body>` tag:
```html
<!-- Semmelweis Chatbot Widget -->
<script src="https://your-project.pages.dev/chat-widget.js" defer></script>
```

That's it! The widget will automatically initialize and appear on your website.

---

## ⚙️ Configuration

### Custom N8N Endpoint

By default, the widget uses a placeholder endpoint. To connect to your N8N webhook:
```html
<script>
  window.ChatbotConfig = {
    apiEndpoint: 'https://your-n8n.yourdomain.com/webhook/chat'
  };
</script>
<script src="https://your-project.pages.dev/chat-widget.js" defer></script>
```

### Custom Quick Questions

Override the default quick questions:
```html
<script>
  window.ChatbotConfig = {
    apiEndpoint: 'https://your-n8n.yourdomain.com/webhook/chat',
    quickQuestions: [
      { text: "What are the admission requirements?", emoji: "📋" },
      { text: "Tell me about scholarships", emoji: "💰" },
      { text: "When does the program start?", emoji: "📅" }
    ]
  };
</script>
<script src="https://your-project.pages.dev/chat-widget.js" defer></script>
```

### Full Configuration Options
```javascript
window.ChatbotConfig = {
  // Required: Your N8N webhook endpoint
  apiEndpoint: 'https://your-n8n.yourdomain.com/webhook/chat',
  
  // Quick question buttons shown on first load
  quickQuestions: [
    { text: "Question 1?", emoji: "🎓" },
    { text: "Question 2?", emoji: "📝" },
    { text: "Question 3?", emoji: "💰" }
  ],
  
  // Fallback message if API fails
  fallbackResponse: "Sorry, I'm having trouble right now. Contact us at tmk@semmelweis.hu",
  
  // Retry configuration
  retries: 2,                   // Number of retry attempts
  timeoutMs: 20000,             // Request timeout in milliseconds
  streamBatchIntervalMs: 100    // Streaming update interval
};
```

---

## 🏗️ Architecture

### Tech Stack

- **Frontend**: Vanilla JavaScript (ES6+), CSS3
- **Streaming**: Server-Sent Events (SSE) with ReadableStream API
- **Backend**: N8N Workflow (hosted on Render VPS)
- **Database**: Supabase (vector search, RAG)
- **Hosting**: Cloudflare Pages CDN

### Request Flow
```
User → Widget (CDN) → N8N Webhook (SSE Stream) → Supabase (Vector DB) → AI Agent → Stream Response
```

### SSE Streaming Protocol

The widget expects N8N to return an SSE stream with the following format:
```
data: {"type": "item", "content": "Hello"}
data: {"type": "item", "content": " world"}
data: {"type": "item", "content": "!"}
```

Or final output format:
```json
{
  "type": "item",
  "content": "{\"output\": \"Complete response text here\"}"
}
```

---

## 📦 Deployment

### Cloudflare Pages Setup

1. **Fork/Clone** this repository
2. **Connect to Cloudflare Pages**:
   - Go to Cloudflare Dashboard → Pages
   - Create new project → Connect to Git
   - Select your repository
3. **Build Settings**:
   - Build command: (none - static files only)
   - Build output directory: `/`
   - Root directory: `/`
4. **Deploy**
5. **Custom Domain** (optional):
   - Add your domain in Cloudflare Pages settings
   - Update integration code with new URL

### GitHub Deployment

1. Push these files to your repository:
```
   /
   ├── chat-widget.js
   ├── index.html
   └── README.md
```

2. Enable GitHub Pages (optional) or use Cloudflare Pages (recommended)

---

## 🔧 N8N Configuration Requirements

Your N8N workflow must:

1. **Accept POST requests** with this payload structure:
```json
   {
     "message": "User question",
     "timestamp": "2025-01-15T10:30:00.000Z",
     "session_id": "uuid-here",
     "request_id": "uuid-timestamp"
   }
```

2. **Return SSE stream** with `Content-Type: text/event-stream`

3. **Stream response** in chunks:
```
   data: {"type": "item", "content": "chunk"}
```

4. **Handle CORS** - Add these headers:
```
   Access-Control-Allow-Origin: *
   Access-Control-Allow-Methods: POST, OPTIONS
   Access-Control-Allow-Headers: Content-Type, X-Request-Id
```

---

## 🎨 UI Components

### Chat Elements

- **Floating Input Bar**: Compact input at bottom center (expands on focus)
- **Chat Bubble**: Persistent button (bottom-right) to open full panel
- **Chat Panel**: Full-featured chat interface with:
  - Message history
  - Typing indicators
  - Quick question buttons
  - New chat button
  - Mobile-responsive layout

### Styling

The widget uses scoped CSS classes prefixed with `sw-` to avoid conflicts with host website styles.

---

## 📊 Performance

- **Bundle Size**: ~20KB (minified)
- **Load Time**: <100ms (via CDN)
- **Memory**: <5MB runtime
- **Streaming Latency**: <200ms first token

---

## 🔒 Security

- **CORS-enabled**: Safe cross-origin requests
- **Session-based**: Unique UUID per chat session
- **No PII storage**: Client-side only stores session ID
- **XSS Protection**: All user input is sanitized

---

## 🐛 Troubleshooting

### Widget not appearing?

1. Check browser console for errors
2. Verify `chat-widget.js` is loading (Network tab)
3. Ensure no CSP blocking scripts

### No response from chatbot?

1. Check N8N endpoint URL in `ChatbotConfig`
2. Verify N8N workflow is active and responding
3. Check Network tab for failed requests
4. Review N8N logs for errors

### Streaming not working?

1. Confirm N8N returns `Content-Type: text/event-stream`
2. Check CORS headers are set correctly
3. Verify SSE format matches expected structure

---

## 📝 Version History

- **v1.0.0** (2025-01-15): Initial production release
  - SSE streaming support
  - Mobile responsive design
  - Configurable endpoints
  - Quick questions feature

---

## 📧 Support

For technical support or questions:

- **Email**: tmk@semmelweis.hu
- **Website**: [Semmelweis University Translational Medicine](https://semmelweis.hu/translational-medicine)

---

## 📄 License

© 2025 Semmelweis University. All rights reserved.

This widget is proprietary software for Semmelweis University's use.
