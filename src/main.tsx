import React from 'react';
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from "next-themes";
import { ApolloProvider } from "@apollo/client/react"
import client from "./lib/apolloClient.js"
createRoot(document.getElementById("root")!).render(
<React.StrictMode>
    <ApolloProvider client={client}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <App />
        </ThemeProvider>
    </ApolloProvider>
</React.StrictMode>
);
