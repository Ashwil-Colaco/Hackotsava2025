import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MuseumApp from "./Components/ocr";
import MuseumFlowchart from "./Components/flowchart";
function App() {


  return (
    <>
       <Router>
      <Routes>
        <Route path="/" element={<MuseumApp />} />
        <Route path="/flowchart" element={<MuseumFlowchart />} />
      </Routes>
    </Router>
      
  
    </>
  )
}

export default App