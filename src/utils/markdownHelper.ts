/**
 * Preprocesses markdown content to ensure proper rendering,
 * especially for content that starts with code blocks
 */
export const preprocessMarkdown = (markdown: string): string => {
  if (!markdown) return '';

  // Fix an issue where markdown starts with a code block
  // by ensuring proper markdown fence syntax is used
  const fixedMarkdown = markdown.replace(
    /^```(\w+)\n/m, 
    '```$1\n'
  );
  
  // Fix potential issues with nested code blocks
  return fixedMarkdown.replace(
    /```markdown\n([\s\S]*?)```/g, 
    (match, content) => {
      // Replace inner code blocks with properly escaped markers
      const processedContent = content
        .replace(/```(\w+)/g, '\\```$1')
        .replace(/```/g, '\\```');
      
      return processedContent;
    }
  );
};

/**
 * Determines if a string is likely a markdown content that needs special handling
 */
export const isMarkdownCodeBlock = (content: string): boolean => {
  return content.trim().startsWith('```');
};
