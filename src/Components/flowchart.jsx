import React, { useState, useRef, useEffect } from 'react';
import { Link } from "react-router-dom";


// Firebase will be loaded from CDN and available globally
let db = null;

// Initialize Firebase
const initFirebase = async () => {
  if (db) return db;
  
  try {
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js');
    const { getFirestore } = await import('https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js');
    const { getAnalytics } = await import('https://www.gstatic.com/firebasejs/12.5.0/firebase-analytics.js');
    
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
    const analytics = getAnalytics(app);
    db = getFirestore(app);
    
    return db;
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    throw error;
  }
};

export default function MuseumFlowchart() {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [artifactNodes, setArtifactNodes] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastTouchDistance, setLastTouchDistance] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const workspaceRef = useRef(null);

  const mainNodes = [
    { 
      id: 1, 
      x: 200, 
      y: 300, 
      title: 'British Era Artifacts', 
      subtitle: '1858-1947',
      color: 'from-blue-600 via-blue-700 to-blue-900',
      icon: '🏰',
      iconBg: 'bg-blue-500'
    },
    { 
      id: 2, 
      x: 800, 
      y: 500, 
      title: 'Mauryan Empire', 
      subtitle: '322-185 BCE',
      color: 'from-emerald-600 via-emerald-700 to-emerald-900',
      icon: '⚔️',
      iconBg: 'bg-emerald-500'
    },
    { 
      id: 3, 
      x: 500, 
      y: 900, 
      title: 'Harappan Civilization', 
      subtitle: '3300-1300 BCE',
      color: 'from-amber-600 via-amber-700 to-amber-900',
      icon: '🏛️',
      iconBg: 'bg-amber-500'
    }
  ];

  useEffect(() => {
    loadArtifacts();
  }, []);

  const loadArtifacts = async () => {
    try {
      setLoading(true);
      const firestore = await initFirebase();
      const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js');
      const artifactsCollection = collection(firestore, 'artifacts');
      const snapshot = await getDocs(artifactsCollection);
      const artifacts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const processed = artifacts.map((a) => ({
        id: a.id,
        parentId: parseInt(a.no),
        slotNo: parseInt(a.slot || 1),
        title: a.Title,
        name: a['artifact Name'] || a.Title,
        desc: a['Short Description'] || '',
        story: a.Story || '',
        recommendations: a.Recommendations || ''
      }));

      setArtifactNodes(processed);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to load artifacts.');
      setLoading(false);
    }
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY * -0.001;
    setZoom(Math.min(Math.max(0.1, zoom + delta), 3));
  };

  const handleMouseDown = (e) => {
    if (e.target === workspaceRef.current || e.target.closest('.workspace-bg')) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Touch handlers
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y });
    } else if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      setLastTouchDistance(distance);
      setIsDragging(false);
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 1 && isDragging) {
      const touch = e.touches[0];
      setPan({ x: touch.clientX - dragStart.x, y: touch.clientY - dragStart.y });
    } else if (e.touches.length === 2) {
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      
      if (lastTouchDistance > 0) {
        const delta = (distance - lastTouchDistance) * 0.01;
        setZoom(Math.min(Math.max(0.1, zoom + delta), 3));
      }
      
      setLastTouchDistance(distance);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setLastTouchDistance(0);
  };

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart]);

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const drawConnection = (from, to) => {
    const midX = (from.x + to.x) / 2;
    return `M ${from.x} ${from.y} Q ${midX} ${from.y}, ${to.x} ${to.y}`;
  };

  // Calculate 9 slot positions in a semicircle around a main node
  const getSlotPositions = (node) => {
    const radius = 250;
    const startAngle = -Math.PI / 2 - Math.PI / 3;
    const angleStep = Math.PI / 8;
    const positions = [];

    for (let i = 0; i < 9; i++) {
      const angle = startAngle + i * angleStep;
      const x = node.x + 120 + radius * Math.cos(angle);
      const y = node.y + 70 + radius * Math.sin(angle);
      positions.push({ x, y });
    }
    return positions;
  };

  const getParentNode = (parentId) => mainNodes.find(n => n.id === parentId);

  return (
    <div className="w-full h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800 overflow-hidden relative touch-none">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-slate-800/95 via-slate-900/95 to-slate-800/95 backdrop-blur-sm py-3 px-4 md:py-4 md:px-6 shadow-2xl z-30 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg md:text-2xl font-bold text-white bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
              Museum Flowchart
            </h1>
            <p className="text-gray-400 text-xs md:text-sm hidden sm:block">Interactive Indian Historical Artifacts</p>
          </div>
          <button
            onClick={() => setShowControls(!showControls)}
            className="md:hidden bg-blue-600/90 hover:bg-blue-700 text-white p-2 rounded-lg shadow-lg backdrop-blur-sm"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </button>
        </div>
        <div><Link to="/">Home</Link></div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800 z-40">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-500/30 border-t-blue-500 mb-4"></div>
            <p className="text-white text-lg font-semibold">Loading artifacts from Firebase...</p>
            <p className="text-gray-400 text-sm mt-2">Please wait</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-40 bg-red-600/90 backdrop-blur-sm text-white px-6 py-4 rounded-xl shadow-2xl max-w-md border border-red-400/30">
          <p className="font-semibold mb-2 flex items-center gap-2">
            <span className="text-xl">⚠️</span> Error
          </p>
          <p className="text-sm">{error}</p>
          <button 
            onClick={loadArtifacts}
            className="mt-3 px-4 py-2 bg-white text-red-600 rounded-lg font-semibold text-sm hover:bg-gray-100 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Controls */}
      <div className={`absolute top-20 md:top-24 left-4 z-20 bg-slate-800/95 backdrop-blur-sm rounded-xl p-3 shadow-2xl border border-white/10 transition-all duration-300 ${showControls ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 md:translate-x-0 md:opacity-100'}`}>
        <div className="flex flex-col gap-2">
          <button 
            onClick={() => setZoom(Math.min(zoom + 0.2, 3))} 
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-semibold text-sm shadow-lg transition-all transform hover:scale-105"
          >
            Zoom +
          </button>
          <button 
            onClick={() => setZoom(Math.max(zoom - 0.2, 0.1))} 
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-semibold text-sm shadow-lg transition-all transform hover:scale-105"
          >
            Zoom -
          </button>
          <button 
            onClick={resetView} 
            className="px-4 py-2.5 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white rounded-lg font-semibold text-sm shadow-lg transition-all transform hover:scale-105"
          >
            Reset
          </button>
          <div className="text-white text-xs text-center mt-1 pt-2 border-t border-white/20 font-mono">
            {(zoom * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Workspace */}
      <div
        ref={workspaceRef}
        className="workspace-bg w-full h-full cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          backgroundImage: `
            radial-gradient(circle at 2px 2px, rgba(59, 130, 246, 0.15) 1px, transparent 0)
          `,
          backgroundSize: `${30 * zoom}px ${30 * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            width: '3000px',
            height: '3000px',
            position: 'relative',
          }}
        >
          {/* SVG Connections */}
          <svg style={{ position: 'absolute', width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}>
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style={{ stopColor: 'rgba(59, 130, 246, 0.6)', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: 'rgba(16, 185, 129, 0.6)', stopOpacity: 1 }} />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            {mainNodes.map((main) => {
              const slots = getSlotPositions(main);
              return slots.map((slot, i) => {
                const artifact = artifactNodes.find(
                  (a) => a.parentId === main.id && a.slotNo === i + 1
                );
                return (
                  <path
                    key={`${main.id}-slot-${i}`}
                    d={drawConnection({ x: main.x + 120, y: main.y + 80 }, slot)}
                    stroke="url(#lineGradient)"
                    strokeWidth="2.5"
                    fill="none"
                    strokeDasharray={artifact ? "0" : "6,6"}
                    opacity={artifact ? 0.8 : 0.3}
                    filter="url(#glow)"
                  />
                );
              });
            })}
          </svg>

          {/* Main Nodes + Slots */}
          {mainNodes.map((main) => {
            const slots = getSlotPositions(main);
            return (
              <React.Fragment key={main.id}>
                {/* Main Node */}
                <div
                  className={`bg-gradient-to-br ${main.color} absolute rounded-2xl p-5 shadow-2xl text-white border-2 border-white/20 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-3xl`}
                  style={{ 
                    left: main.x, 
                    top: main.y, 
                    width: '240px', 
                    minHeight: '140px',
                    zIndex: 10
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className={`${main.iconBg} p-3 rounded-xl text-3xl shadow-lg`}>
                      {main.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-1">{main.title}</h3>
                      <p className="text-xs text-white/80 font-medium">{main.subtitle}</p>
                      <div className="mt-3 text-xs bg-white/20 rounded-lg px-2 py-1 inline-block backdrop-blur-sm">
                        Main Collection
                      </div>
                    </div>
                  </div>
                </div>

                {/* Slots */}
                {slots.map((slot, i) => {
                  const artifact = artifactNodes.find(
                    (a) => a.parentId === main.id && a.slotNo === i + 1
                  );
                  const parentNode = getParentNode(main.id);
                  return (
                    <div
                      key={`${main.id}-artifact-${i}`}
                      className={`absolute rounded-full shadow-xl flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                        artifact 
                          ? 'bg-gradient-to-br from-blue-500 to-blue-700 text-white cursor-pointer hover:scale-125 hover:shadow-2xl border-2 border-white/30' 
                          : 'bg-gradient-to-br from-gray-700 to-gray-800 text-gray-400 border-2 border-white/10'
                      }`}
                      style={{
                        left: slot.x,
                        top: slot.y,
                        width: '50px',
                        height: '50px',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 15
                      }}
                      onClick={() => artifact && setExpandedId(expandedId === artifact.id ? null : artifact.id)}
                    >
                      {artifact ? artifact.slotNo : i + 1}
                    </div>
                  );
                })}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Expanded Artifact Modal */}
      {expandedId && (() => {
        const artifact = artifactNodes.find(a => a.id === expandedId);
        if (!artifact) return null;
        const parentNode = getParentNode(artifact.parentId);
        return (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fadeIn"
              onClick={() => setExpandedId(null)}
            />
            
            {/* Modal */}
            <div className="fixed inset-x-4 md:left-1/2 md:-translate-x-1/2 top-20 md:top-24 z-50 max-w-2xl animate-slideUp">
              <div className={`bg-gradient-to-br ${parentNode?.color || 'from-gray-700 to-gray-900'} rounded-2xl shadow-2xl border-2 border-white/20 overflow-hidden`}>
                {/* Header */}
                <div className="bg-black/30 backdrop-blur-sm p-4 md:p-6 border-b border-white/10">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`${parentNode?.iconBg || 'bg-blue-500'} p-3 rounded-xl text-2xl md:text-3xl shadow-lg flex-shrink-0`}>
                        {parentNode?.icon || '📜'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs md:text-sm text-white/60 font-semibold mb-1">Slot #{artifact.slotNo}</div>
                        <h2 className="text-lg md:text-2xl font-bold text-white mb-1 break-words">{artifact.name}</h2>
                        <p className="text-xs md:text-sm text-white/80 italic break-words">{artifact.title}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setExpandedId(null)}
                      className="flex-shrink-0 bg-white/20 hover:bg-white/30 text-white rounded-lg p-2 transition-all backdrop-blur-sm"
                    >
                      <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 md:p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                  {artifact.desc && (
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                      <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                        <span className="text-lg">📝</span> Description
                      </h3>
                      <p className="text-white/90 text-sm leading-relaxed">{artifact.desc}</p>
                    </div>
                  )}

                  {artifact.story && (
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                      <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                        <span className="text-lg">📖</span> Story
                      </h3>
                      <p className="text-white/90 text-sm leading-relaxed">{artifact.story}</p>
                    </div>
                  )}

                  {artifact.recommendations && (
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                      <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                        <span className="text-lg">💡</span> Recommendations
                      </h3>
                      <p className="text-white/90 text-sm leading-relaxed">{artifact.recommendations}</p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="bg-black/30 backdrop-blur-sm p-4 border-t border-white/10">
                  <button
                    onClick={() => setExpandedId(null)}
                    className="w-full px-4 py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl font-semibold transition-all backdrop-blur-sm"
                  >
                    Close Details
                  </button>
                </div>
              </div>
            </div>
          </>
        );
      })()}

      {/* Instructions */}
      <div className="absolute bottom-4 right-4 bg-slate-800/95 backdrop-blur-sm rounded-xl p-3 md:p-4 shadow-2xl text-white text-xs md:text-sm max-w-xs border border-white/10">
        <p className="font-semibold mb-2 text-blue-400 flex items-center gap-2">
          <span className="text-base">ℹ️</span> Navigation
        </p>
        <ul className="space-y-1.5 text-gray-300">
          <li className="hidden md:block">• Scroll to zoom in/out</li>
          <li className="md:hidden">• Pinch to zoom</li>
          <li className="hidden md:block">• Click and drag to pan</li>
          <li className="md:hidden">• Drag to pan around</li>
          <li>• Tap numbered slots to view details</li>
        </ul>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}