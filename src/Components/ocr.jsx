import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import LiveOCR from './liveOCR';
import { useOCR } from './OCRContext';
import {Send} from 'lucide-react';


// ⚙️ CONFIGURATION - Your ngrok URL
const API_PROXY_URL = "https://preanaphoral-arya-unthanked.ngrok-free.dev/api/artifact";

// 🎧 Audio Button Component
const AudioButton = ({ text }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const speak = () => {
    window.speechSynthesis.cancel();
    if (!text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };
  

  return (
    <button
      onClick={isSpeaking ? stopSpeaking : speak}
      className={`mt-3 w-full py-2 rounded-full text-white font-semibold flex items-center justify-center gap-2 transition-all duration-300 ${
        isSpeaking ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'
      }`}
    ><Button>
      {isSpeaking ? 'Stop 🔊' : 'Listen 🔊'}
      </Button>
    </button>
  );
};

// 📂 Dropdown Component
const Dropdown = ({ title, content }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="w-full mb-4">
      <div
        onClick={() => setOpen(!open)}
        className="p-4 bg-indigo-600 text-white rounded-xl cursor-pointer flex justify-between items-center font-semibold shadow-md hover:bg-indigo-700 transition-colors duration-200"
      >
        <span>{title}</span>
        <span className="text-lg">{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div className="mt-2 bg-white text-gray-800 p-4 rounded-xl shadow-lg leading-relaxed">
          {content || "No data available"}
          <AudioButton text={content} />
        </div>
      )}
    </div>
  );
};

// 🏺 Main App Component
const MuseumApp = () => {
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState("");
  const [artifactData, setArtifactData] = useState(null);
  const {ocrText} = useOCR();
  const handleInputChange = (e) => setInputText(e.target.value);

  const sendToN8N = async () => {
    if (!inputText.trim()) {
      setSendStatus("❌ Please enter artifact text first");
      return;
    }

    setSending(true);
    setSendStatus("📡 Sending to n8n...");
    setArtifactData(null);

    try {
      const response = await fetch(API_PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: inputText }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || `Server returned ${response.status}`);

      // ✅ Extract relevant fields only
      const parsed = JSON.parse(data[0].output);

const extracted = {
  title: parsed["artifact Name"] || parsed.Title || "Unknown Artifact",
  shortDescription: parsed["Short Description"] || parsed.ShortDescription || "No description available",
  story: parsed["Story"] || "No story available",
  recommendations: parsed["Recommendations"] || "No recommendations available",
};

      setArtifactData(extracted);
      setSendStatus("✅ Artifact data fetched successfully!");
    } catch (error) {
      console.error(error);
      setSendStatus("❌ " + error.message);
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    return () => window.speechSynthesis.cancel();
  }, []);
  useEffect(() => {
  if (ocrText) {
    setInputText(ocrText);
  }
}, [ocrText]);

  return (
    <div className="min-h-screen bg-[#1B1B1F] pb-8">
      {/* Header */}
      <div className="bg-[#1b1b1f] bg-opacity-95 p-5 shadow-lg sticky top-0 z-50 rounded-b-3xl">
        <h1 className="text-3xl font-extrabold text-center text-white mb-5 text-shadow-2xl mx-auto">Muse Scanner</h1>
        <p className="mt-2 text-sm text-gray-100 text-center mb-2">
          Enter artifact text to unlock their hidden stories
        </p>

        <LiveOCR/>
        
      </div>
      <div className="bg-white w-[6%] max-sm:w-[25%] py-2 px-2.5 mx-auto rounded-xl text-black font-bold hover:bg-black hover:text-white mt-5"><Link to="/flowchart">Flowchart</Link></div>
      {/* Body */}
      <div className="bg-slate-800 mt-5 rounded-3xl shadow-2xl overflow-hidden p-5 border border-white max-sm:w-5/6 mx-auto px-5 text-white">
        {/* Input Section */}
        <div className="mb-4">
          <label className="text-white font-semibold mb-2 flex justify-center text-md">Artifact Text</label>
          <textarea
            value={inputText}
            onChange={handleInputChange}
            placeholder="Type the artifact name or text here..."
            className="w-full h-32 p-4 border-2 rounded-xl border-indigo-100 focus:border-indigo-500 focus:outline-none resize-none text-white"
          />
        </div>
        

        {/* Send Button */}
        <button
          onClick={sendToN8N}
          disabled={sending}
          className={`mt-4 w-1/3 py-3 rounded-xl text-white font-bold text-lg shadow-lg transition-all duration-300 flex items-center justify-center gap-2 mx-auto drop-shadow-2xl ${
            sending ? 'bg-gray-400 cursor-not-allowed' : 'bg-black hover:bg-white hover:text-black'
          }`}
        >
          <Send size={20}/>
          {sending ? "Scanning..." : "Scan"}
         
        </button>

        {/* Status */}
        {sendStatus && (
          <div className={`mt-3 p-3 rounded-lg text-xs font-semibold whitespace-pre-wrap ${sendStatus.includes("✅") ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {sendStatus}
          </div>
        )}

        {/* Artifact Details */}
        {artifactData && (
          <div className="mt-6 pt-6 border-t-2 border-indigo-200">
            <h2 className="text-xl font-bold text-indigo-700 mb-4">📋 Artifact Details</h2>
            <Dropdown title="Artifact Name" content={artifactData.title} />
            <Dropdown title="Short Description" content={artifactData.shortDescription} />
            <Dropdown title="Story Behind the Artifact" content={artifactData.story} />
            <Dropdown title="Recommendations" content={artifactData.recommendations} />
          </div>
        )}
      </div>
      
    </div>
  );
};

export default MuseumApp;
