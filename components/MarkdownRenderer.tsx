import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  variant?: 'dark' | 'light';
  className?: string;
}

/**
 * Pre-process markdown to fix common issues from AI output
 */
const preprocessMarkdown = (text: string): string => {
  if (!text) return '';

  let result = text
    // Remove citation references like [1][2][3]
    .replace(/\[\d+\]/g, '')
    // Clean up multiple spaces
    .replace(/  +/g, ' ')
    .trim();

  // Fix orphaned ** at start of text (no closing **)
  if (result.startsWith('**') && !result.substring(2).includes('**')) {
    result = result.substring(2).trim();
  }

  // Fix orphaned ** at end of text
  if (result.endsWith('**') && result.lastIndexOf('**') === result.length - 2) {
    const firstDoubleAsterisk = result.indexOf('**');
    if (firstDoubleAsterisk === result.length - 2) {
      result = result.substring(0, result.length - 2).trim();
    }
  }

  // Fix malformed bold with spaces
  result = result
    .replace(/\*\*\s+/g, '**')
    .replace(/\s+\*\*/g, '**')
    .replace(/\*\*\*\*/g, '')
    .replace(/([.!?])\s*([•\-\*]\s)/g, '$1\n\n$2')
    .replace(/([.!?])\s+(\d+\.)\s/g, '$1\n\n$2 ');

  return result;
};

// Inline styles voor PDF (light variant) - GEEN Tailwind classes
const pdfStyles = {
  container: { color: '#1e293b', maxWidth: 'none' },
  h1: { fontSize: '1.5rem', fontWeight: 'bold', color: '#0f172a', marginBottom: '1rem', marginTop: '1.5rem' },
  h2: { fontSize: '1.25rem', fontWeight: 'bold', color: '#0f172a', marginBottom: '0.75rem', marginTop: '1.25rem' },
  h3: { fontSize: '1.125rem', fontWeight: '600', color: '#1e293b', marginBottom: '0.5rem', marginTop: '1rem' },
  h4: { fontSize: '1rem', fontWeight: '600', color: '#1e293b', marginBottom: '0.5rem', marginTop: '0.75rem' },
  p: { color: '#1e293b', lineHeight: '1.625', marginBottom: '0.75rem' },
  strong: { fontWeight: 'bold', color: '#0f172a' },
  em: { fontStyle: 'italic', color: '#1e293b' },
  ul: { listStyle: 'none', margin: '0', padding: '0', marginBottom: '1rem' },
  ol: { listStyleType: 'decimal', listStylePosition: 'inside', marginBottom: '1rem', padding: '0' },
  li: { color: '#1e293b', lineHeight: '1.625', display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' },
  bullet: { marginTop: '0.5rem', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4f46e5', flexShrink: 0 },
  code: { backgroundColor: '#f1f5f9', color: '#4338ca', padding: '0.125rem 0.375rem', borderRadius: '0.25rem', fontSize: '0.875rem', fontFamily: 'monospace' },
  pre: { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '1rem', overflow: 'auto', marginBottom: '1rem' },
  a: { color: '#4f46e5', textDecoration: 'underline' },
  blockquote: { borderLeft: '4px solid #6366f1', paddingLeft: '1rem', fontStyle: 'italic', color: '#475569', margin: '1rem 0' },
};

// Dark theme styles (voor app UI)
const darkStyles = {
  container: 'prose prose-invert prose-slate max-w-none prose-ul:list-none prose-ul:pl-0 prose-li:pl-0 prose-li:my-0',
  h1: 'text-2xl font-bold text-white mb-4 mt-6 first:mt-0',
  h2: 'text-xl font-bold text-white mb-3 mt-5 first:mt-0',
  h3: 'text-lg font-semibold text-white mb-2 mt-4 first:mt-0',
  h4: 'text-base font-semibold text-slate-200 mb-2 mt-3 first:mt-0',
  p: 'text-slate-300 leading-relaxed mb-3 last:mb-0',
  strong: 'font-bold text-white',
  em: 'italic text-slate-200',
  ul: 'list-none space-y-2 mb-4 pl-0',
  ol: 'list-decimal list-inside space-y-2 mb-4 pl-0 marker:text-slate-400',
  li: 'text-slate-300 leading-relaxed flex items-start gap-2',
  bullet: 'mt-2 w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0',
  code: 'bg-slate-800 text-indigo-300 px-1.5 py-0.5 rounded text-sm font-mono',
  pre: 'bg-slate-900 border border-slate-700 rounded-lg p-4 overflow-x-auto mb-4',
  a: 'text-indigo-400 hover:text-indigo-300 underline',
  blockquote: 'border-l-4 border-indigo-500 pl-4 italic text-slate-400 my-4',
};

/**
 * Universele Markdown Renderer
 * Light variant: INLINE STYLES voor PDF betrouwbaarheid
 * Dark variant: Tailwind classes voor app UI
 */
export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  variant = 'dark',
  className = ''
}) => {
  if (!content) return null;

  const processedContent = preprocessMarkdown(content);
  const isDark = variant === 'dark';

  // LIGHT VARIANT: Pure inline styles voor PDF
  if (!isDark) {
    return (
      <div style={pdfStyles.container} className={className}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => <h1 style={pdfStyles.h1}>{children}</h1>,
            h2: ({ children }) => <h2 style={pdfStyles.h2}>{children}</h2>,
            h3: ({ children }) => <h3 style={pdfStyles.h3}>{children}</h3>,
            h4: ({ children }) => <h4 style={pdfStyles.h4}>{children}</h4>,
            p: ({ children }) => <p style={pdfStyles.p}>{children}</p>,
            strong: ({ children }) => <strong style={pdfStyles.strong}>{children}</strong>,
            em: ({ children }) => <em style={pdfStyles.em}>{children}</em>,
            ul: ({ children }) => <ul style={pdfStyles.ul}>{children}</ul>,
            ol: ({ children }) => <ol style={pdfStyles.ol}>{children}</ol>,
            li: ({ children }) => (
              <li style={pdfStyles.li}>
                <div style={pdfStyles.bullet}></div>
                <span style={{ color: '#1e293b' }}>{children}</span>
              </li>
            ),
            code: ({ children, className: codeClassName }) => {
              const isBlock = codeClassName?.includes('language-');
              if (isBlock) {
                return <code style={{ ...pdfStyles.code, display: 'block' }}>{children}</code>;
              }
              return <code style={pdfStyles.code}>{children}</code>;
            },
            pre: ({ children }) => <pre style={pdfStyles.pre}>{children}</pre>,
            a: ({ href, children }) => (
              <a href={href} target="_blank" rel="noopener noreferrer" style={pdfStyles.a}>
                {children}
              </a>
            ),
            blockquote: ({ children }) => <blockquote style={pdfStyles.blockquote}>{children}</blockquote>,
            hr: () => <hr style={{ borderColor: '#cbd5e1', margin: '1.5rem 0' }} />,
          }}
        >
          {processedContent}
        </ReactMarkdown>
      </div>
    );
  }

  // DARK VARIANT: Tailwind classes voor app UI
  return (
    <div className={`${darkStyles.container} ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className={darkStyles.h1}>{children}</h1>,
          h2: ({ children }) => <h2 className={darkStyles.h2}>{children}</h2>,
          h3: ({ children }) => <h3 className={darkStyles.h3}>{children}</h3>,
          h4: ({ children }) => <h4 className={darkStyles.h4}>{children}</h4>,
          p: ({ children }) => <p className={darkStyles.p}>{children}</p>,
          strong: ({ children }) => <strong className={darkStyles.strong}>{children}</strong>,
          em: ({ children }) => <em className={darkStyles.em}>{children}</em>,
          ul: ({ children }) => <ul className={darkStyles.ul}>{children}</ul>,
          ol: ({ children }) => <ol className={darkStyles.ol}>{children}</ol>,
          li: ({ children }) => (
            <li className={darkStyles.li}>
              <div className={darkStyles.bullet} style={{ backgroundColor: '#818cf8', minWidth: '6px', minHeight: '6px' }}></div>
              <span>{children}</span>
            </li>
          ),
          code: ({ children, className: codeClassName }) => {
            const isBlock = codeClassName?.includes('language-');
            if (isBlock) {
              return <code className={`${darkStyles.code} block`}>{children}</code>;
            }
            return <code className={darkStyles.code}>{children}</code>;
          },
          pre: ({ children }) => <pre className={darkStyles.pre}>{children}</pre>,
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className={darkStyles.a}>
              {children}
            </a>
          ),
          blockquote: ({ children }) => <blockquote className={darkStyles.blockquote}>{children}</blockquote>,
          hr: () => <hr className="border-slate-700 my-6" />,
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};

/**
 * Compact versie voor kortere teksten (geen extra margins)
 * Light variant: INLINE STYLES
 * Dark variant: Tailwind classes
 */
export const MarkdownInline: React.FC<MarkdownRendererProps> = ({
  content,
  variant = 'dark',
  className = ''
}) => {
  if (!content) return null;

  const isDark = variant === 'dark';
  const processedContent = preprocessMarkdown(content);

  // LIGHT VARIANT: Pure inline styles
  if (!isDark) {
    return (
      <span className={className} style={{ color: '#1e293b' }}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ children }) => <span style={{ color: '#1e293b' }}>{children}</span>,
            strong: ({ children }) => <strong style={{ fontWeight: 'bold', color: '#0f172a' }}>{children}</strong>,
            em: ({ children }) => <em style={{ fontStyle: 'italic', color: '#1e293b' }}>{children}</em>,
            code: ({ children }) => (
              <code style={{ backgroundColor: '#f1f5f9', color: '#4338ca', padding: '0.125rem 0.25rem', borderRadius: '0.25rem', fontSize: '0.875rem', fontFamily: 'monospace' }}>
                {children}
              </code>
            ),
            a: ({ href, children }) => (
              <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: '#4f46e5', textDecoration: 'underline' }}>
                {children}
              </a>
            ),
          }}
        >
          {processedContent}
        </ReactMarkdown>
      </span>
    );
  }

  // DARK VARIANT: Tailwind classes
  return (
    <span className={`${className} text-slate-300`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <span className="text-slate-300">{children}</span>,
          strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
          em: ({ children }) => <em className="italic text-slate-200">{children}</em>,
          code: ({ children }) => (
            <code className="bg-slate-800 text-indigo-300 px-1 py-0.5 rounded text-sm font-mono">
              {children}
            </code>
          ),
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">
              {children}
            </a>
          ),
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </span>
  );
};

export default MarkdownRenderer;
