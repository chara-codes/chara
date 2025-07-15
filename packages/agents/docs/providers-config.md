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

### DeepSeek
```
DEEPSEEK_API_KEY=your_deepseek_api_key_here
```
- **How to get**: Visit [DeepSeek Platform](https://platform.deepseek.com/)
- **Popular Models**: deepseek-chat, deepseek-reasoner (specify when calling)
- **Cost**: Pay-per-use with competitive pricing

### OpenRouter
```
OPEN_ROUTER_API_KEY=your_openrouter_api_key_here
```
- **How to get**: Visit [OpenRouter](https://openrouter.ai/keys)
- **Models**: Access to multiple models from different providers (check OpenRouter docs for current models)
- **Cost**: Varies by model, competitive pricing

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

### LMStudio (Local)
```
LMSTUDIO_API_BASE_URL=http://127.0.0.1:1234/v1
```
- **How to setup**:
  1. Install [LMStudio](https://lmstudio.ai/)
  2. Load a model and start the local server
  3. Configure the API base URL (default: http://127.0.0.1:1234/v1)
- **Models**: Any model you've loaded in LMStudio
- **Cost**: Free (runs locally)


### Moonshot

```env
MOONSHOT_API_KEY=your_moonshot_api_key_here
```


### DIAL
```
DIAL_API_KEY=your_dial_api_key_here
DIAL_API_BASE_URL=your_dial_base_url_here
```

- **How to get**: Contact your DIAL provider for API credentials
- **Models**: Depends on your DIAL deployment
- **Cost**: Varies by deployment

## Quick Setup

1. **Copy the example file**:
   ```bash
   cp .env.example .env
   ```

2. **Choose your providers**: You don't need all providers. Pick 1-3 that suit your needs:
   - **For experimentation**: Google AI (generous free tier)
   - **For production**: OpenAI, Anthropic, or DeepSeek
   - **For local development**: Ollama or LMStudio
   - **For cost optimization**: Google AI (generous free tier), DeepSeek

3. **Add your API keys**: Replace the empty values in `.env` with your actual API keys

4. **Test the setup**: Run the example to verify your configuration:
   ```bash
   bun run examples/providers-demo.ts
   ```

## Provider Recommendations

### For Development
- **Ollama**: Completely free, runs offline
- **LMStudio**: Free, user-friendly local interface
- **Google AI**: Generous free tier

### For Production
- **OpenAI**: Most reliable, best documentation
- **Anthropic**: Excellent for complex reasoning
- **DeepSeek**: Strong reasoning capabilities, competitive pricing
- **OpenRouter**: Access to multiple models with one API

### For Specific Use Cases
- **Code generation**: OpenAI GPT-4, Anthropic Claude, DeepSeek Chat
- **Creative writing**: Anthropic Claude, OpenAI GPT-4
- **Analysis & Reasoning**: Anthropic Claude, DeepSeek Reasoner, Google Gemini
- **Cost-sensitive**: Google AI, DeepSeek, Ollama/LMStudio (local)

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
GOOGLE_GENERATIVE_AI_API_KEY=your-google-key-here

# Optional: Local development
OLLAMA_API_BASE_URL=http://127.0.0.1:11434
LMSTUDIO_API_BASE_URL=http://127.0.0.1:1234/v1

# Optional: Additional providers
ANTHROPIC_API_KEY=your-anthropic-key-here
DEEPSEEK_API_KEY=your-deepseek-key-here
MOONSHOT_API_KEY=your-moonshot-key-here
OPEN_ROUTER_API_KEY=your-openrouter-key-here
```

This configuration gives you access to both cloud providers (OpenAI, Google AI, DeepSeek) and local options (Ollama, LMStudio) for development.
