# Privacy Policy for Chara Codes Chrome Extension

**Last Updated:** October 2025

## Introduction

Chara Codes ("we," "our," or "the extension") is committed to protecting your privacy. This Chrome extension is designed as a development tool for frontend developers and operates with a privacy-first approach.

## Our Privacy Commitment

**Chara Codes does NOT collect, store, or transmit any personal data.**

The extension operates entirely within your browser, and all data processing happens locally on your device.

## Data Collection

We **DO NOT** collect:
- Personal information or personally identifiable information (PII)
- Browsing history or visited URLs
- Webpage content or HTML/CSS outside of user-selected elements
- User credentials, passwords, or authentication tokens
- Usage statistics or analytics
- Behavioral data or tracking information
- IP addresses or device information
- Cookies for tracking purposes

## How the Extension Works

### What We Access

The extension only accesses webpage data when you explicitly request it:

1. **Element Selection**: When you click the "Select Element" button and choose an element on a webpage, the extension extracts:
   - HTML structure of the selected element
   - Applied CSS styles for the selected element
   - Text content within the selected element
   - Current page URL (for context)

2. **Local Processing**: All extracted data is:
   - Processed locally within your browser
   - Displayed in the extension's side panel
   - Temporarily stored in browser memory during your session
   - Never transmitted to external servers
   - Automatically cleared when you close the extension or browser

### What We Don't Access

- The extension does NOT scan or collect data from pages automatically
- The extension does NOT access webpage content without explicit user action
- The extension does NOT run in the background when not actively being used
- The extension does NOT track which websites you visit

## Permissions Explained

The extension requires certain Chrome permissions to function. Here's exactly how we use each one:

### activeTab
- **Why we need it**: To interact with the webpage you're currently viewing when you activate element selection
- **What we do**: Read element data only when you click "Select Element" and choose an element
- **What we don't do**: Monitor or track your browsing activity

### Host Permissions (<all_urls>)
- **Why we need it**: Developers work on websites across many domains (localhost, staging, production sites)
- **What we do**: Enable element selection on any website where you choose to use the tool
- **What we don't do**: Automatically access or collect data from pages you visit

### scripting
- **Why we need it**: To inject the visual element selector interface into webpages
- **What we do**: Insert UI components and extract element information when you explicitly request it
- **What we don't do**: Run scripts automatically or collect data in the background

### sidePanel
- **Why we need it**: To display the extension's interface without blocking your view of the webpage
- **What we do**: Show the chat interface and extracted element information
- **What we don't do**: Access or display any data without your explicit action

### tabs
- **Why we need it**: To send messages between the side panel and the element selector
- **What we do**: Query the active tab ID to enable communication between extension components
- **What we don't do**: Track, monitor, or store information about tabs you open or websites you visit

## Data Storage

### Local Storage Only
- User preferences (theme, settings) are stored locally in your browser using Chrome's storage API
- No data is synchronized across devices unless you explicitly enable Chrome sync (controlled by Chrome, not our extension)
- All stored data remains on your device

### Session Data
- Element information extracted during your session is temporarily held in browser memory
- This data is automatically cleared when you close the extension or browser
- No persistent logs or history are maintained

## Data Transmission

**We do NOT transmit any data to external servers.**

All functionality of Chara Codes operates entirely within your browser:
- No network requests to remote servers for analytics or tracking
- No third-party services integrated for data collection
- No telemetry or usage reporting
- No communication with external APIs (unless you configure your own AI service, which is separate from the extension)

## Third-Party Services

Chara Codes does not integrate with or share data with any third-party services for tracking, analytics, or data collection purposes.

**Note**: If you configure the extension to connect to your own AI service or API (such as OpenAI, Anthropic, etc.), that communication is direct between your browser and the service you configure. We do not intercept, store, or have access to that communication. You should review the privacy policy of any external service you choose to use.

## Children's Privacy

Chara Codes is a developer tool not intended for children under the age of 13. We do not knowingly collect data from children. Since we don't collect any personal data at all, no special provisions are needed, but parents should supervise any use by minors.

## Your Privacy Rights

You have complete control over the extension and your data:

### You Can:
- Use the extension without creating an account or providing personal information
- Remove all extension data by uninstalling the extension
- Disable or enable the extension at any time through Chrome settings
- Clear locally stored preferences through the extension settings
- Review all permissions in Chrome's extension settings

### How to Remove Your Data:
1. Right-click the extension icon
2. Select "Remove from Chrome"
3. Confirm removal

All extension data will be immediately deleted from your browser.

## Security

We take security seriously:
- The extension uses Chrome's secure extension APIs
- Content Security Policy (CSP) prevents injection of malicious scripts
- Shadow DOM isolation protects the extension UI from webpage interference
- No eval() or unsafe JavaScript execution
- All code is static and bundled with the extension (no remote code execution)

## Changes to This Privacy Policy

We may update this privacy policy from time to time to reflect changes in:
- Extension functionality
- Legal requirements
- Best practices

**How We Notify You:**
- Updated "Last Updated" date at the top of this policy
- Significant changes will be communicated through the extension's changelog
- Major privacy-related changes will require acceptance before continued use

We encourage you to review this policy periodically.

## Open Source

Chara Codes is an open-source project. You can review the complete source code to verify our privacy practices at:
- **Repository**: https://github.com/chara-codes/chara/
- **License**: Apache License

## Compliance

This extension complies with:
- Chrome Web Store Developer Program Policies
- Chrome Extension Manifest V3 requirements
- General Data Protection Regulation (GDPR) principles
- California Consumer Privacy Act (CCPA) requirements
- Privacy and data protection best practices

## Contact Us

If you have questions or concerns about this privacy policy or the extension's privacy practices:

**Email**: kucherenko.andrey+chara@gmail.com
**Support**: https://github.com/chara-codes/chara/issues
**Issues**: https://github.com/chara-codes/chara/issues

We will respond to privacy inquiries within 48 hours.

## Developer Information

**Extension Name**: Chara Codes
**Developer**: Andrey Kucherenko
**Version**: 0.1.29
**Website**: https://chara-ai.dev/

## Legal

This privacy policy constitutes a legal agreement between you (the user) and the developer of Chara Codes. By installing and using this extension, you agree to the terms outlined in this privacy policy.

**Effective Date**: This privacy policy is effective as of the date listed at the top of this document.

---

## Summary

**In Plain English:**

Chara Codes is a developer tool that works entirely in your browser. We don't collect your data, track your browsing, or send anything to external servers. When you select an element on a webpage, we show you its HTML and CSS—that's it. Everything stays on your computer. Uninstall the extension anytime to remove all traces.

We built this tool for developers, and we respect your privacy the way we'd want ours respected.
