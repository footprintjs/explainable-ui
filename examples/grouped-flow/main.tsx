import { StrictMode } from 'react';
import '@xyflow/react/dist/style.css';
import { createRoot } from 'react-dom/client';
import { GroupedFlowExample } from './demo';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GroupedFlowExample />
  </StrictMode>,
);
