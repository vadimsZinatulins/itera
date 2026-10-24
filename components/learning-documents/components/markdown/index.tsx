import ReactMarkdown from 'react-markdown';
import type { MarkdownProps } from './types';
import s from '../../learning-documents.module.css';

export default function Markdown({ children }: MarkdownProps) {
  return <div className={`${s.markdown} break-words`}><ReactMarkdown>{children}</ReactMarkdown></div>;
}
