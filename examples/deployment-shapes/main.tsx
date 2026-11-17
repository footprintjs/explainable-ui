import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@xyflow/react/dist/style.css';
import { DeploymentExample } from './DeploymentExample';
import './style.css';

createRoot(document.getElementById('root')!).render(<StrictMode><DeploymentExample /></StrictMode>);
