# Security Policy

## Supported Versions

We actively maintain and provide security updates for the following versions of Chara Codes:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| 0.x.x   | :x:                |

## Reporting a Vulnerability

We take the security of Chara Codes seriously. If you discover a security vulnerability, please report it responsibly by following these guidelines:

### How to Report

**DO NOT** create a public GitHub issue for security vulnerabilities.

Instead, please report security issues by emailing: **hi@chara-ai.dev**

Include the following information in your report:
- A clear description of the vulnerability
- Steps to reproduce the issue
- Potential impact and severity assessment
- Any suggested fixes or mitigations
- Your contact information for follow-up questions

### Security Scope

The following components are within scope for security reporting:

#### Core Components
- **CLI Package** (`@chara-codes/cli`): Command-line interface and core functionality
- **Server Package**: API endpoints and backend services
- **Web Interface**: Frontend application and user interactions
- **Tunnel Service**: Secure tunneling and proxy functionality
- **Agent System**: AI provider integrations and context handling

#### Security-Sensitive Areas
- File system access controls
- Terminal command execution
- Network proxy and tunneling
- AI provider API integrations
- Model Context Protocol (MCP) connections

### Types of Vulnerabilities

We are particularly interested in reports of:

- **Code Injection**: Command injection, code injection, or script injection
- **Authentication Bypass**: Unauthorized access to protected resources
- **Information Disclosure**: Exposure of sensitive data or configuration
- **File System Attacks**: Path traversal, arbitrary file read/write
- **Network Security**: Man-in-the-middle, proxy bypass, tunnel vulnerabilities
- **Dependency Vulnerabilities**: Issues in third-party packages
- **AI/ML Security**: Prompt injection, model poisoning, data leakage

### Out of Scope

The following are generally considered out of scope:
- Issues requiring physical access to the user's machine
- Social engineering attacks
- Denial of service attacks against third-party services
- Issues in third-party dependencies without demonstrable impact
- Theoretical vulnerabilities without proof of concept

## Security Best Practices

### For Users

When using Chara Codes, follow these security best practices:

#### API Key Management
- Store API keys in environment variables, never in code
- Use different API keys for development and production
- Regularly rotate API keys
- Limit API key permissions where possible

#### File System Security
- Be cautious when granting file system access to AI agents
- Review file operations before execution
- Use the built-in security validation features
- Regularly audit file access logs

#### Network Security
- Use HTTPS/TLS for all external communications
- Validate tunnel configurations before use
- Monitor network traffic for unusual patterns
- Keep tunnel service updated

#### Environment Security
- Keep your Chara Codes installation updated
- Use secure environment configurations
- Regularly review and audit AI tool permissions
- Monitor logs for suspicious activity

### For Developers

#### Secure Development Practices
- Follow the security guidelines in `CONTRIBUTING.md`
- Use TypeScript for type safety
- Validate all user inputs
- Implement proper error handling
- Use secure coding patterns

#### Code Review Focus Areas
- Input validation and sanitization
- Authentication and authorization logic
- File system operations
- Network communications
- Dependency management
- Error message content

## Contact Information

For security-related questions or concerns:

- **Security Team**: hi@chara-ai.dev
- **General Contact**: hi@chara-ai.dev
- **Documentation**: See [CONTRIBUTING.md](CONTRIBUTING.md) for development security guidelines

## Acknowledgments

We appreciate the security research community and will acknowledge researchers who responsibly disclose vulnerabilities (with their permission).
