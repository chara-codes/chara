# Fetch Tool - llms.txt Support

The fetch tool now includes support for [llms.txt](https://llmstxt.org/) files, which provide structured information specifically designed for Large Language Models (LLMs).

## What is llms.txt?

The `llms.txt` standard allows websites to provide machine-readable information about their content, API documentation, and other relevant details that are particularly useful for AI systems. It's similar to `robots.txt` but focused on providing helpful information rather than restrictions.

## How it Works

When you use the fetch tool, it automatically checks for an `llms.txt` file at the root of the domain (e.g., `https://example.com/llms.txt`). The tool can handle this information in several ways:

### 1. Prefer llms.txt (Default)

By default, if an `llms.txt` file is found, the tool will return its content instead of fetching the main page:

```typescript
await fetchTool.execute({
  url: "https://example.com/some-page",
  preferLlmsTxt: true // This is the default
});
```

### 2. Include llms.txt as Additional Information

You can fetch both the main page and include the `llms.txt` content as supplementary information:

```typescript
await fetchTool.execute({
  url: "https://example.com/some-page",
  preferLlmsTxt: false,
  includeLlmsTxt: true
});
```

### 3. Ignore llms.txt

To completely ignore `llms.txt` and only fetch the main page:

```typescript
await fetchTool.execute({
  url: "https://example.com/some-page",
  preferLlmsTxt: false,
  includeLlmsTxt: false
});
```

## New Parameters

- `preferLlmsTxt` (boolean, default: `true`): When `true`, if an `llms.txt` file is available, return its content instead of the main page
- `includeLlmsTxt` (boolean, default: `false`): When `true` and `preferLlmsTxt` is `false`, include the `llms.txt` content as additional information alongside the main page content

## Benefits

Using `llms.txt` when available provides several advantages:

1. **More Relevant Information**: Sites often provide more structured and relevant information in their `llms.txt` files
2. **Faster Processing**: `llms.txt` files are typically smaller and more focused than full web pages
3. **Better Quality**: Content is specifically curated for AI consumption
4. **Reduced Noise**: Avoids processing navigation, ads, and other irrelevant page elements

## Example Output

When using `llms.txt`, the tool will indicate this in the response:

```
Contents of https://example.com/llms.txt (llms.txt - structured LLM-friendly information):

# Example Company

This is structured information about our company and services.

## API Documentation
- Base URL: https://api.example.com
- Authentication: Bearer token required
- Rate limits: 1000 requests/hour

## Contact
- Email: support@example.com
- Documentation: https://docs.example.com
```

## Fallback Behavior

If an `llms.txt` file is not available or cannot be fetched, the tool automatically falls back to fetching the main page content, ensuring reliable operation regardless of whether the site supports the `llms.txt` standard.

## Error Handling

The tool handles `llms.txt` errors gracefully:
- If the file doesn't exist (404), it continues with the main page
- If there's a network error fetching it, it continues with the main page
- The tool will never fail solely because of `llms.txt` issues

## Compliance

The tool respects the `llms.txt` standard as defined at [llmstxt.org](https://llmstxt.org/) and handles the content as plain text with minimal processing beyond trimming whitespace.