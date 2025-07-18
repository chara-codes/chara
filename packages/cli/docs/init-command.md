# Chara Init Command

The `chara init` command is used to initialize and configure AI provider settings for Chara Codes. It provides an interactive setup process to configure API keys and connection settings for various AI providers.

## Usage

```bash
chara init [options]
```

## Options

- `-f, --force` - Force initialization even if configuration already exists
- `-v, --verbose` - Enable verbose output for debugging
- `-s, --show` - Show current configuration and exit
- `-r, --reset` - Reset/clear all configuration

## Supported Providers

The init command supports configuration for the following AI providers:

### Cloud Providers (Require API Keys)

| Provider | Description | API Key Required | Help URL |
|----------|-------------|------------------|----------|
| **OpenAI** | GPT-4, GPT-3.5, and other OpenAI models | ✅ | [Get API Key](https://platform.openai.com/api-keys) |
| **Anthropic** | Claude-3, Claude-2, and other Claude models | ✅ | [Get API Key](https://console.anthropic.com/) |
| **Google** | Gemini models | ✅ | [Get API Key](https://aistudio.google.com/app/apikey) |
| **DeepSeek** | DeepSeek AI models | ✅ | [Get API Key](https://platform.deepseek.com/api_keys) |
| **OpenRouter** | Access to multiple models through one API | ✅ | [Get API Key](https://openrouter.ai/keys) |
| **DIAL** | Distributed AI Layer | ✅ | [Learn More](https://dialx.ai/) |

### Local Providers (URL Configuration)

| Provider | Description | Default URL | Help URL |
|----------|-------------|-------------|----------|
| **Ollama** | Local Ollama models | `http://127.0.0.1:11434/api` | [Download](https://ollama.com/download) |
| **LMStudio** | LMStudio local models | `http://localhost:1234/v1` | [Download](https://lmstudio.ai/) |

## Interactive Setup Process

When you run `chara init`, the command will:

1. **Check for existing configuration** - If a configuration already exists, you'll be prompted to update it (unless `--force` is used)

2. **Provider selection** - Choose which AI providers you want to configure using a multi-select interface

3. **Configuration input** - For each selected provider:
   - **API Key providers**: Enter your API key (with validation)
   - **Local providers**: Enter the base URL (with URL validation)
   - **Additional settings**: Configure any additional required settings (e.g., DIAL base URL)

4. **Validation** - The configuration is validated before saving:
   - API keys are checked for minimum length
   - URLs are validated for proper format
   - Required fields are verified

5. **Save configuration** - The configuration is saved to your global Chara config file

## Examples

### Basic initialization
```bash
chara init
```

### Force re-initialization
```bash
chara init --force
```

### Show current configuration
```bash
chara init --show
```

### Reset all configuration
```bash
chara init --reset
```

### Verbose output for debugging
```bash
chara init --verbose
```

## Environment Variable Detection

The init command automatically detects existing environment variables and uses them as default values. This allows you to:

- Use existing environment variables without re-entering them
- Mix saved configuration with environment variables
- Override saved settings with environment variables

When an environment variable is detected, you'll see a message like:
```
✓ Found OPENAI_API_KEY in environment variables
```

## Configuration Storage

The configuration is stored in your global Chara configuration file (`~/.chararc`) under the `env` field:

```json
{
  "env": {
    "OPENAI_API_KEY": "sk-...",
    "ANTHROPIC_API_KEY": "sk-ant-...",
    "OLLAMA_API_BASE_URL": "http://127.0.0.1:11434/api"
  }
}
```

## Configuration Precedence

Chara uses the following precedence order (highest to lowest):

1. **Environment variables** - Always take precedence
2. **Saved configuration** - Values stored in `~/.chararc`
3. **Default values** - Built-in defaults for local providers

This means you can:
- Override saved API keys by setting environment variables
- Use different configurations for different projects
- Mix saved and environment-based configuration

## Security Notes

- API keys are partially masked when displayed (showing only the last 4 characters)
- Configuration files are stored locally and not transmitted anywhere
- Always keep your API keys secure and never share them publicly

## Troubleshooting

### Configuration validation fails
- Ensure API keys are entered correctly
- Check that URLs are valid and accessible
- Use `--verbose` flag for detailed error information

### Cannot save configuration
- Check file permissions in your home directory
- Ensure you have write access to create/modify `~/.chararc`

### Provider not working after setup
- Use `chara init --show` to verify configuration
- Check that the provider service is running (for local providers)
- Verify API key validity on the provider's website

## Next Steps

After running `chara init`:

1. Run `chara dev` in your project directory to start development
2. Configure project-specific settings in `chara.config.js`
3. Start using Chara Codes with your configured AI providers

For more help, run `chara --help` or `chara init --help`.
