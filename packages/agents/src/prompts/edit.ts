export const editPrompt = (params: {
  languageName?: string;
  isInsert: boolean;
  documentContent: string;
  isTruncated?: boolean;
  contentType: string;
  userPrompt: string;
  rewriteSection?: string;
  diagnosticErrors?: Array<{
    line_number: number;
    error_message: string;
    code_content: string;
  }>;
}) => `${
  params.languageName
    ? `Here's a file of ${params.languageName} that I'm going to ask you to make an edit to.`
    : `Here's a file of text that I'm going to ask you to make an edit to.`
}

${
  params.isInsert
    ? `The point you'll need to insert at is marked with <insert_here></insert_here>.`
    : `The section you'll need to rewrite is marked with <rewrite_this></rewrite_this> tags.`
}

<document>
${params.documentContent}
</document>

${
  params.isTruncated
    ? "The context around the relevant section has been truncated (possibly in the middle of a line) for brevity."
    : ""
}

${
  params.isInsert
    ? `You can't replace ${params.contentType}, your answer will be inserted in place of the \`<insert_here></insert_here>\` tags. Don't include the insert_here tags in your output.

Generate ${params.contentType} based on the following prompt:

<prompt>
${params.userPrompt}
</prompt>

Match the indentation in the original file in the inserted ${params.contentType}, don't include any indentation on blank lines.

Immediately start with the following format with no remarks:

\`\`\`
\$\{INSERTED_CODE\}
\`\`\``
    : `Edit the section of ${params.contentType} in <rewrite_this></rewrite_this> tags based on the following prompt:

<prompt>
${params.userPrompt}
</prompt>

${
  params.rewriteSection
    ? `And here's the section to rewrite based on that prompt again for reference:

<rewrite_this>
${params.rewriteSection}
</rewrite_this>

${
  params.diagnosticErrors && params.diagnosticErrors.length > 0
    ? `Below are the diagnostic errors visible to the user.  If the user requests problems to be fixed, use this information, but do not try to fix these errors if the user hasn't asked you to.

${params.diagnosticErrors
  .map(
    (error) =>
      `<diagnostic_error>
    <line_number>${error.line_number}</line_number>
    <error_message>${error.error_message}</error_message>
    <code_content>${error.code_content}</code_content>
</diagnostic_error>`,
  )
  .join("\n")}`
    : ""
}`
    : ""
}

Only make changes that are necessary to fulfill the prompt, leave everything else as-is. All surrounding ${params.contentType} will be preserved.

Start at the indentation level in the original file in the rewritten ${params.contentType}. Don't stop until you've rewritten the entire section, even if you have no more changes to make, always write out the whole section with no unnecessary elisions.

Immediately start with the following format with no remarks:

\`\`\`
\$\{REWRITTEN_CODE\}
\`\`\``
}`;
