import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import LiveOCR from './LiveOCR';
import { useOCR } from './OCRContext';

// ⚙️ CONFIGURATION - Your ngrok URL
const API_PROXY_URL = "https://preanaphoral-arya-unthanked.ngrok-free.dev/api/artifact";

// ✅ Firebase initialization (only runs once)
const initFirebase = async () => {
  const { initializeApp } = await import('https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js');
  const { getFirestore } = await import('https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js');

  const firebaseConfig = {
    apiKey: "AIzaSyDdWmdvkQYjEnOa9kcmWqQTdaCw2KLw6Iw",
    authDomain: "flowchart-c5446.firebaseapp.com",
    projectId: "flowchart-c5446",
    storageBucket: "flowchart-c5446.firebasestorage.app",
    messagingSenderId: "570992052076",
    appId: "1:570992052076:web:fcc2b8702e45cb438f5549",
    measurementId: "G-ZMGRCRVFFJ"
  };

  const app = initializeApp(firebaseConfig);
  return getFirestore(app);
};

// ✅ Function to add parsed artifact
const addArtifact = async (parsed) => {
  // Extract fields safely from parsed JSON
  const extracted = {
    no: parsed["no"] || parsed.no || "1",
    title: parsed["artifact Name"] || parsed.Title || "Unknown Artifact",
    shortDescription: parsed["Short Description"] || parsed.ShortDescription || "No description available",
    story: parsed["Story"] || "No story available",
    recommendations: parsed["Recommendations"] || "No recommendations available",
  };

  console.log("Extracted artifact:", extracted);

  try {
    const firestore = await initFirebase();
    const { collection, addDoc } = await import('https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js');
    
    const artifactsCollection = collection(firestore, 'artifacts');
    const docRef = await addDoc(artifactsCollection, extracted);

    console.log("✅ Artifact added with ID:", docRef.id);
    return { id: docRef.id, ...extracted };
  } catch (error) {
    console.error("❌ Error adding artifact:", error);
    throw error;
  }
};

// ✅ Load all artifacts (for reference)
const loadArtifacts = async () => {
  try {
    const firestore = await initFirebase();
    const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js');

    const artifactsCollection = collection(firestore, 'artifacts');
    const snapshot = await getDocs(artifactsCollection);

    const artifacts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log("Loaded artifacts:", artifacts);
    return artifacts;
  } catch (error) {
    console.error("❌ Error loading artifacts:", error);
  }
};

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
    >
      {isSpeaking ? 'Stop 🔊' : 'Listen 🔊'}
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

      // ✅ Parse the response
      const parsed = JSON.parse(data[0].output);

      // ✅ Add to Firebase and get the extracted data back
      const artifactWithId = await addArtifact(parsed);
      
      setArtifactData(artifactWithId);
      setSendStatus("✅ Artifact data fetched and saved successfully!");
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
    <div className="min-h-screen bg-linear-to-br from-indigo-600 to-purple-700 pb-8">
      {/* Header */}
      <div className="bg-white bg-opacity-95 p-5 shadow-lg sticky top-0 z-50 rounded-b-3xl">
        <h1 className="text-3xl font-extrabold text-center text-indigo-700 mb-5">🏛 Museum Scanner</h1>
        <LiveOCR/>
      </div>

      {/* Body */}
      <div className="bg-white m-5 rounded-3xl shadow-2xl overflow-hidden p-5 border border-black w-5/6 max-sm:w-full mx-auto">
        {/* Input Section */}
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2">Artifact Text:</label>
          <textarea
            value={inputText}
            onChange={handleInputChange}
            placeholder="Type the artifact name or text here..."
            className="w-full h-32 p-4 border-2 border-indigo-300 rounded-xl focus:border-indigo-500 focus:outline-none resize-none text-gray-800"
          />
        </div>

        {/* Send Button */}
        <button
          onClick={sendToN8N}
          disabled={sending}
          className={`mt-4 w-full py-3 rounded-xl text-white font-bold text-lg shadow-lg transition-all duration-300 flex items-center justify-center gap-2 ${
            sending ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          {sending ? "Sending..." : "Send to n8n"}
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
            <Dropdown title="📜 Artifact Name" content={artifactData.title} />
            <Dropdown title="📝 Short Description" content={artifactData.shortDescription} />
            <Dropdown title="📖 Story Behind the Artifact" content={artifactData.story} />
            <Dropdown title="💡 Recommendations" content={artifactData.recommendations} />
          </div>
        )}
      </div>
      <div className="bg-indigo-300 w-[6%] max-sm:w-[25%] py-2 px-2.5 mx-auto rounded-xl text-black font-bold hover:bg-indigo-700 hover:text-white">
        <Link to="/flowchart">Flowchart</Link>
      </div>
    </div>
  );
};

export default MuseumApp;