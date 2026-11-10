import { hydrateRoot } from 'react-dom/client';
import { WordLadderSolver } from './components/WordLadderSolver';

const root = document.getElementById('solver-root');
if (root) hydrateRoot(root, <WordLadderSolver />);
