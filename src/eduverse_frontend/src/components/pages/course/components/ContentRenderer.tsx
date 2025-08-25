// ContentRenderer.tsx
import React, { useState, useEffect } from 'react';

interface ContentRendererProps {
  content: string;
  onProgressUpdate?: (progress: number) => void;
}

const ContentRenderer: React.FC<ContentRendererProps> = ({ content, onProgressUpdate }) => {
  const [visibleElements, setVisibleElements] = useState(new Set<number>());
  const lines = content.split('\n').filter((line) => line.trim() !== '');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = parseInt(entry.target.getAttribute('data-index') || '0');
          if (entry.isIntersecting) {
            setVisibleElements((prev) => new Set([...prev, index]));
          }
        });
      },
      {
        threshold: 0.7,
        rootMargin: '0px 0px -50px 0px',
      }
    );

    // Observe all content elements
    const elements = document.querySelectorAll('[data-index]');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [content]);

  useEffect(() => {
    if (onProgressUpdate && lines.length > 0) {
      const progress = Math.min(100, (visibleElements.size / lines.length) * 100);
      onProgressUpdate(progress);
    }
  }, [visibleElements, lines.length, onProgressUpdate]);

  return (
    <div className="prose prose-slate max-w-none">
      {lines.map((line, index) => {
        const key = `line-${index}`;
        const dataIndex = index;

        if (line.startsWith('**') && line.endsWith('**')) {
          return (
            <h3
              key={key}
              data-index={dataIndex}
              className="mt-6 mb-3 text-lg font-bold text-gray-800"
            >
              {line.replace(/\*\*/g, '')}
            </h3>
          );
        } else if (line.startsWith('- **') && line.includes('**:')) {
          const match = line.match(/- \*\*(.*?)\*\*: (.*)/);
          if (match) {
            return (
              <li key={key} data-index={dataIndex} className="mb-2 ml-6 list-disc text-white">
                <strong className="text-blue-600">{match[1]}</strong>: {match[2]}
              </li>
            );
          }
        } else if (line.startsWith('- ')) {
          return (
            <li key={key} data-index={dataIndex} className="mb-1 ml-6 list-disc text-white">
              {line.substring(2)}
            </li>
          );
        } else if (line.match(/^\d+\. /)) {
          return (
            <li key={key} data-index={dataIndex} className="mb-1 ml-6 list-decimal text-white">
              {line.replace(/^\d+\. /, '')}
            </li>
          );
        } else if (line.trim() === '') {
          return <br key={key} />;
        } else {
          return (
            <p key={key} data-index={dataIndex} className="mb-4 leading-relaxed text-white">
              {line}
            </p>
          );
        }
      })}
    </div>
  );
};

export default ContentRenderer;
