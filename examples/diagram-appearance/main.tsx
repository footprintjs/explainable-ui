import { createRoot } from 'react-dom/client';
import { DiagramAppearanceExample } from './DiagramAppearanceExample';
import '@xyflow/react/dist/style.css';
import './style.css';

createRoot(document.getElementById('root')!).render(<DiagramAppearanceExample />);
