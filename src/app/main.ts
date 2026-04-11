import '#styles/global.css';
import '#modules/assignments/entry';
import '#ui/containers/assignments-page/assignments-page';

const root = document.getElementById('app');

if (root) {
  const app = document.createElement('cs-assignments-app');

  root.appendChild(app);
}
