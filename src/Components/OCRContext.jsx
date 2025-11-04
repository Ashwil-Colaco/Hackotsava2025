import { createContext, useContext, useState } from "react";

const OCRContext = createContext(null);

export function OCRProvider({ children }) {
  const [ocrText, setOCRText] = useState("");

  return (
    <OCRContext.Provider value={{ ocrText, setOCRText }}>
      {children}
    </OCRContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useOCR() {
  return useContext(OCRContext);
}
