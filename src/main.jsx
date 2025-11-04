import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { OCRProvider } from "./Components/OCRContext.jsx"; // ✅ Make sure path is correct

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <OCRProvider>     {/* ✅ Wrap App here */}
      <App />
    </OCRProvider>
  </StrictMode>,
)
