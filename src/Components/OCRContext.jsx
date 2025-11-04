import { createContext, useContext, useState } from "react";

const OCRContext = createContext(null);

export const OCRProvider = ({ children }) => {
  const [ocrText, setOCRText] = useState("");

  return (
    <OCRContext.Provider value={{ ocrText, setOCRText }}>
      {children}
    </OCRContext.Provider>
  );
};


export const useOCR = () => useContext(OCRContext);
