# Fylio AI Chat Widget

A production-ready AI chat widget that delivers instant, intelligent responses to your website visitors. Built for modern websites that demand exceptional user experience.

---

## Features

### Core Capabilities
- **Real-time AI Responses** - Instant, streaming answers that appear as they're generated
- **Zero Dependencies** - Pure JavaScript with no external libraries required
- **Mobile-First Design** - Flawless experience on desktop, tablet, and mobile devices
- **One-Line Integration** - Deploy with a single script tag
- **Conversation Persistence** - Chats resume seamlessly across page navigations
- **Fully Customizable** - Brand colors, content, and behavior

### Advanced Features
- **Rich Content Support** - Markdown formatting, lists, links, and code blocks
- **Quick Questions** - Pre-configured conversation starters
- **Session Management** - Smart conversation handling with configurable persistence
- **Responsive Layout** - Automatic adaptation from 270px to 4K displays
- **Floating Chat Bar** - Optional bottom-bar interface for quick access
- **Accessibility** - WCAG 2.1 compliant with full keyboard navigation

### Performance
- **Lightweight** - Minimal impact on page load time
- **CDN Delivery** - Global distribution for instant availability
- **Smart Caching** - Optimized for repeat visitors
- **Smooth Animations** - Hardware-accelerated transitions

---

## Quick Start

### Basic Integration

Add this single line before your closing `</body>` tag:

```html
<script src="https://your-domain.pages.dev/chat-widget.js" defer></script>
```

The widget initializes automatically and appears in the bottom-right corner of your page.

---

## Configuration

### Minimal Setup

```html
<script>
  window.ChatbotConfig = {
    apiEndpoint: 'https://your-api-endpoint.com/chat'
  };
</script>
<script src="https://your-domain.pages.dev/chat-widget.js" defer></script>
```

### Full Customization

```html
<script>
  window.ChatbotConfig = {
    // API Configuration
    apiEndpoint: 'https://your-api-endpoint.com/chat',

    // Branding
    branding: {
      botName: 'Your Assistant',
      botAvatar: 'https://your-domain.com/avatar.png',  // Image URL or emoji
      widgetIcon: '<svg>...</svg>',  // Custom SVG icon (optional)
      colors: {
        primary: '#6366f1'  // Your brand color
      }
    },

    // Content Customization
    content: {
      barPlaceholder: 'Ask me anything...',
      panelPlaceholder: 'Type your message...',
      quickQuestions: [
        { text: "How does this work?", emoji: "🤔" },
        { text: "What can you help me with?", emoji: "💡" },
        { text: "Tell me more", emoji: "📚" }
      ],
      quickQuestionsHeader: 'Popular Questions',
      quickQuestionsHeaderEmoji: '✨'  // Emoji or SVG
    },

    // UI Visibility Controls
    ui: {
      showFloatingBar: true,   // Show/hide bottom chat bar
      showPoweredBy: true      // Show/hide attribution
    },

    // Rich Content Features
    enableRichContent: true,   // Enable advanced formatting
    enableMarkdown: true,      // Enable markdown in responses
    enableCards: false,        // Enable card-based responses

    // Conversation Persistence
    persistence: {
      enabled: true,                  // Save conversations
      conversationTTL: 'MEDIUM'       // 'SHORT' (24h), 'MEDIUM' (3d), 'LONG' (7d)
      // Or use custom milliseconds: conversationTTL: 5 * 24 * 60 * 60 * 1000
    }
  };
</script>
<script src="https://your-domain.pages.dev/chat-widget.js" defer></script>
```

### Backward Compatible Configuration

The widget also supports legacy flat configuration:

```html
<script>
  window.ChatbotConfig = {
    apiEndpoint: 'https://your-api-endpoint.com/chat',
    quickQuestions: [
      { text: "Question 1", emoji: "🎓" },
      { text: "Question 2", emoji: "📝" }
    ],
    enableRichContent: true,
    enableMarkdown: true
  };
</script>
```

---

## API Requirements

Your backend endpoint must:

1. **Accept POST requests** with JSON payload:
   ```json
   {
     "message": "User's question",
     "timestamp": "2025-01-15T10:30:00.000Z",
     "session_id": "unique-session-id",
     "request_id": "unique-request-id"
   }
   ```

2. **Return streaming responses** in real-time

3. **Handle CORS** with appropriate headers for your domain

Contact Fylio for detailed API specifications and integration support.

---

## Responsive Design

The widget automatically adapts to any screen size:

- **Desktop (≥640px)** - Side panel with 400px width
- **Mobile (<640px)** - Full-screen immersive experience
- **Ultra-small (≤270px)** - Optimized scaling for all elements

All interactions are touch-optimized with minimum 32px tap targets.

---

## Browser Support

- Chrome/Edge (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- iOS Safari (iOS 14+)
- Chrome Mobile (Android 10+)

---

## Security & Privacy

- **Client-side only** - No data stored on Fylio servers
- **Session-based** - Unique identifiers per conversation
- **Sanitized content** - Protection against XSS attacks
- **HTTPS required** - Secure communication only

---

## Deployment

### Cloudflare Pages (Recommended)

1. Deploy files to Cloudflare Pages
2. Configure custom domain (optional)
3. Update integration code with your CDN URL

### GitHub Pages

1. Upload `chat-widget.js` to your repository
2. Enable GitHub Pages
3. Reference the file in your integration code

---

## Troubleshooting

**Widget not appearing?**
- Check browser console for errors
- Verify the script URL is correct and accessible
- Ensure no Content Security Policy blocking scripts

**No responses from chatbot?**
- Confirm `apiEndpoint` is correctly configured
- Verify your API endpoint is active and responding
- Check browser Network tab for failed requests

**Styling conflicts?**
- The widget uses scoped `sw-` prefixed classes
- Verify your CSS isn't using `!important` on global selectors

---

## Support

**Commercial Support**
- Email: support@fylio.com
- Documentation: https://docs.fylio.com
- Integration Help: Available to enterprise customers

**Enterprise Features**
- White-label options
- Custom integrations
- Priority support
- SLA guarantees

---

## License

© 2025 Fylio. All rights reserved.

This is proprietary software. Unauthorized copying, modification, or distribution is prohibited.

For licensing inquiries, contact: sales@fylio.com

---

## About Fylio

Fylio builds intelligent conversation experiences for modern websites. Our AI chat widgets combine cutting-edge technology with beautiful design to help businesses engage their visitors.

Learn more at [fylio.com](https://fylio.com)
