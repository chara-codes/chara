# AI Providers Configuration Guide

This guide explains how to configure environment variables for the AI providers registry.

## Environment Variables

Copy the `.env.example` file to `.env` and configure the following variables based on which providers you want to use:

### OpenAI
```
OPENAI_API_KEY=your_openai_api_key_here
```
- **How to get**: Visit [OpenAI API Keys](https://platform.openai.com/api-keys)
- **Popular Models**: gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-3.5-turbo (specify when calling)
- **Cost**: Pay-per-use

### Anthropic
```
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```
- **How to get**: Visit [Anthropic Console](https://console.anthropic.com/)
- **Popular Models**: claude-3-5-sonnet-20241022, claude-3-5-haiku-20241022, claude-3-opus-20240229 (specify when calling)
- **Cost**: Pay-per-use

### Google AI
```
GOOGLE_GENERATIVE_AI_API_KEY=your_google_api_key_here
```
- **How to get**: Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
- **Popular Models**: gemini-1.5-pro, gemini-1.5-flash, gemini-pro (specify when calling)
- **Cost**: Free tier available, then pay-per-use

### Groq
```
GROQ_API_KEY=your_groq_api_key_here
```
- **How to get**: Visit [Groq Console](https://console.groq.com/keys)
- **Popular Models**: llama-3.1-70b-versatile, llama-3.1-8b-instant, mixtral-8x7b-32768 (specify when calling)
- **Cost**: Free tier available, very fast inference

### OpenRouter
```
OPEN_ROUTER_API_KEY=your_openrouter_api_key_here
```
- **How to get**: Visit [OpenRouter](https://openrouter.ai/keys)
- **Models**: Access to multiple models from different providers (check OpenRouter docs for current models)
- **Cost**: Varies by model, competitive pricing

### xAI (Grok)
```
XAI_API_KEY=your_xai_api_key_here
```
- **How to get**: Visit [xAI Console](https://console.x.ai/)
- **Popular Models**: grok-beta (specify when calling)
- **Cost**: Pay-per-use

### Ollama (Local)
```
OLLAMA_API_BASE_URL=http://127.0.0.1:11434
```
- **How to setup**: 
  1. Install [Ollama](https://ollama.ai/)
  2. Run `ollama serve` to start the server
  3. Pull models: `ollama pull llama3.1`, `ollama pull codellama`
- **Models**: Any model you've pulled with Ollama (llama3.1, codellama, mistral, etc.)
- **Cost**: Free (runs locally)

### AWS Bedrock
```
AWS_BEDROCK_CONFIG={"region":"us-east-1","accessKeyId":"your_access_key","secretAccessKey":"your_secret_key"}
```
- **How to get**: Configure AWS IAM credentials with Bedrock access
- **Popular Models**: anthropic.claude-3-sonnet-20240229-v1:0, meta.llama3-70b-instruct-v1:0 (check AWS docs for current models)
- **Cost**: Pay-per-use through AWS

### HuggingFace (Placeholder)
```
HuggingFace_API_KEY=your_huggingface_api_key_here
```
- **Status**: Not yet implemented
- **How to get**: Visit [HuggingFace Tokens](https://huggingface.co/settings/tokens)

## Quick Setup

1. **Copy the example file**:
   ```bash
   cp .env.example .env
   ```

2. **Choose your providers**: You don't need all providers. Pick 1-3 that suit your needs:
   - **For experimentation**: Groq (free, fast)
   - **For production**: OpenAI or Anthropic
   - **For local development**: Ollama
   - **For cost optimization**: Google AI (generous free tier)

3. **Add your API keys**: Replace the empty values in `.env` with your actual API keys

4. **Test the setup**: Run the example to verify your configuration:
   ```bash
   bun run examples/providers-demo.ts
   ```

## Provider Recommendations

### For Development
- **Groq**: Free tier, very fast responses
- **Ollama**: Completely free, runs offline
- **Google AI**: Generous free tier

### For Production
- **OpenAI**: Most reliable, best documentation
- **Anthropic**: Excellent for complex reasoning
- **OpenRouter**: Access to multiple models with one API

### For Specific Use Cases
- **Code generation**: Groq (fast), OpenAI GPT-4
- **Creative writing**: Anthropic Claude, OpenAI GPT-4
- **Analysis**: Anthropic Claude, Google Gemini
- **Cost-sensitive**: Google AI, Groq free tier

## Security Best Practices

1. **Never commit API keys**: Ensure `.env` is in your `.gitignore`
2. **Use environment-specific keys**: Different keys for dev/staging/production
3. **Rotate keys regularly**: Most providers allow key rotation
4. **Monitor usage**: Set up billing alerts to avoid unexpected charges
5. **Principle of least privilege**: Use API keys with minimal required permissions

## Troubleshooting

### Provider Not Available
- Check that the API key is correctly set in `.env`
- Verify the API key is valid and has proper permissions
- Ensure you have sufficient credits/quota

### Network Issues
- For Ollama: Ensure the server is running (`ollama serve`)
- Check firewall settings for local providers
- Verify internet connectivity for cloud providers

### Rate Limits
- Most providers have rate limits
- Consider implementing retry logic with exponential backoff
- Use multiple providers for load balancing

## Example Configuration

Here's a minimal `.env` for getting started:

```env
# Required: Choose at least one
OPENAI_API_KEY=sk-your-openai-key-here
GROQ_API_KEY=gsk_your-groq-key-here

# Optional: Local development
OLLAMA_API_BASE_URL=http://127.0.0.1:11434

# Optional: Additional providers
ANTHROPIC_API_KEY=your-anthropic-key-here
GOOGLE_GENERATIVE_AI_API_KEY=your-google-key-here
```

This configuration gives you access to both cloud providers (OpenAI, Groq) and a local option (Ollama) for development.