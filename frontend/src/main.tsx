import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from "@/components/theme-provider";

ReactDOM.createRoot(document.getElementById('root')!).render(
		<BrowserRouter>
			{/* "Academic Prestige" ships a light scale only — forceTheme keeps a
			    dark-OS user from getting dark shadcn tokens inside a light UI.
			    Revisit once a dark palette is authored. */}
			<ThemeProvider defaultTheme="light" forcedTheme="light" storageKey="vite-ui-theme">
				<App />
			</ThemeProvider>
		</BrowserRouter>
);
