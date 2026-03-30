import './styles/global.css';
import 'prismjs/themes/prism-tomorrow.css';
import '#modules/assignments/entry';
import { exposeMarkdownRenderer } from '#shared/markdown';

exposeMarkdownRenderer();

const root = document.getElementById('app');

if (root) {
  const app = document.createElement('cs-assignments');

  root.appendChild(app);
}
