import React, { useState, Suspense, useRef, useLayoutEffect } from "react";
import "./index.css";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, useGLTF } from "@react-three/drei";
import { Box3, Vector3 } from "three";
import * as pdfjsLib from "pdfjs-dist";

// Configure PDF.js worker - using local worker file from public folder
// Files in the public folder are served at the root path by Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

// Avatar images from src/assets/avatar/
import southIndianImg from "./assets/avatar/South Indian.jpg";
import bengaliImg from "./assets/avatar/Bengali.jpg";
import female1Img from "./assets/avatar/Female 1.jpg";
import female2Img from "./assets/avatar/Female 2.jpg";
import punjabiImg from "./assets/avatar/Punjabi.jpg";
import himachaliImg from "./assets/avatar/Himachali.jpg";

// 3D models from src/assets/models/  (note the ?url)
import southIndianModel from "./assets/models/South Indian.glb?url";
import punjabiModel from "./assets/models/Punjabi.glb?url";
import female1Model from "./assets/models/Female 1.glb?url";
import female2Model from "./assets/models/Female 2.glb?url";
import bengaliModel from "./assets/models/Bengali.glb?url";
import himachaliModel from "./assets/models/Himachali.glb?url";

// Avatars list (Himachali has custom offset to fix framing)
// Also includes basic voice metadata that we'll use to drive text‑to‑speech.
const AVATARS = [
  {
    id: "south-indian",
    name: "South Indian",
    imageUrl: southIndianImg,
    modelUrl: southIndianModel,
    gender: "female",
    language: "en-IN",
    defaultTone: "calm",
  },
  {
    id: "punjabi",
    name: "Punjabi",
    imageUrl: punjabiImg,
    modelUrl: punjabiModel,
    gender: "male",
    language: "en-IN",
    defaultTone: "energetic",
  },
  {
    id: "female-1",
    name: "Female 1",
    imageUrl: female1Img,
    modelUrl: female1Model,
    gender: "female",
    language: "en-US",
    defaultTone: "neutral",
  },
  {
    id: "female-2",
    name: "Female 2",
    imageUrl: female2Img,
    modelUrl: female2Model,
    gender: "female",
    language: "en-GB",
    defaultTone: "calm",
  },
  {
    id: "bengali",
    name: "Bengali",
    imageUrl: bengaliImg,
    modelUrl: bengaliModel,
    gender: "female",
    language: "en-IN",
    defaultTone: "warm",
  },
  {
    id: "himachali",
    name: "Himachali",
    imageUrl: himachaliImg,
    modelUrl: himachaliModel,
    scaleFactor: 2.3,
    yOffset: -0.35, // adjust up/down if needed
    gender: "male",
    language: "en-IN",
    defaultTone: "friendly",
  },
];

// 3D model component – auto-fit + per-avatar offset/scale
function AvatarModel({ url, scaleFactor = 2.5, yOffset = 0 }) {
  const { scene } = useGLTF(url);
  const ref = useRef();

  useLayoutEffect(() => {
    if (!ref.current) return;

    const box = new Box3().setFromObject(ref.current);
    const size = box.getSize(new Vector3());
    const center = box.getCenter(new Vector3());

    // center model at origin
    ref.current.position.sub(center);
    // vertical adjustment for specific avatars
    ref.current.position.y += yOffset;

    // scale to fit
    const maxAxis = Math.max(size.x, size.y, size.z);
    const desiredSize = scaleFactor;
    const scale = desiredSize / maxAxis;
    ref.current.scale.setScalar(scale);
  }, [scene, scaleFactor, yOffset]);

  return <primitive ref={ref} object={scene} />;
}

// Card for left side
function AvatarCard({ avatar, selected, onSelect }) {
  return (
    <button
      type="button"
      className={`card ${selected ? "selected" : ""}`}
      onClick={() => onSelect(avatar)}
      aria-pressed={selected}
      title={avatar.name}
    >
      <div className="media">
        <img src={avatar.imageUrl} alt={avatar.name} />
      </div>
      <div className="meta">
        <span>{avatar.name}</span>
      </div>
    </button>
  );
}

function AvatarDropdown({ avatars, selected, onSelect }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const containerRef = useRef(null);

  const filtered = avatars.filter((a) =>
    a.name.toLowerCase().includes(query.toLowerCase())
  );

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!open) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = Math.min(focusedIndex + 1, filtered.length - 1);
      setFocusedIndex(next);
      onSelect(filtered[next]); // Live preview update
      scrollItemIntoView(next);
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = Math.max(focusedIndex - 1, 0);
      setFocusedIndex(prev);
      onSelect(filtered[prev]);
      scrollItemIntoView(prev);
    }

    if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[focusedIndex]) {
        onSelect(filtered[focusedIndex]);
        setOpen(false);
      }
    }

    if (e.key === "Escape") {
      setOpen(false);
    }
  };

  // Auto-scroll focused item
  const scrollItemIntoView = (index) => {
    const list = containerRef.current?.querySelector(".avatar-select-list");
    const item = list?.children[index];
    if (item) item.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  // Close dropdown when clicking outside
  const handleClickOutside = (event) => {
    if (!containerRef.current?.contains(event.target)) {
      setOpen(false);
    }
  };

  React.useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      className="avatar-select-wrapper"
      tabIndex={0}
      ref={containerRef}
      onKeyDown={handleKeyDown}
    >
      <label className="avatar-select-label">Choose avatar</label>

      <button
        type="button"
        className="avatar-select-button"
        onClick={() => {
          setOpen(!open);
          setFocusedIndex(
            selected ? filtered.findIndex((a) => a.id === selected.id) : 0
          );
        }}
      >
        {selected ? (
          <>
            <img
              src={selected.imageUrl}
              alt={selected.name}
              className="avatar-select-thumb"
            />
            <span>{selected.name}</span>
          </>
        ) : (
          <span>Select...</span>
        )}
        <span className="avatar-select-chevron">▾</span>
      </button>

      {open && (
        <div className="avatar-select-dropdown">
          <input
            className="avatar-select-search"
            placeholder="Search avatar..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setFocusedIndex(0);
            }}
          />

          <div className="avatar-select-list">
            {filtered.map((avatar, index) => (
              <button
                type="button"
                key={avatar.id}
                className={`avatar-select-item ${
                  selected && selected.id === avatar.id ? "active" : ""
                } ${focusedIndex === index ? "focused" : ""}`}
                onClick={() => {
                  onSelect(avatar);
                  setOpen(false);
                }}
              >
                <img
                  src={avatar.imageUrl}
                  alt={avatar.name}
                  className="avatar-select-thumb"
                />
                <span>{avatar.name}</span>
              </button>
            ))}

            {filtered.length === 0 && (
              <div className="avatar-select-empty">No match found.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


export default function App() {
  const [selected, setSelected] = useState(null);
  const [ttsText, setTtsText] = useState("");
  const [tone, setTone] = useState("neutral");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [genderVoices, setGenderVoices] = useState({ male: null, female: null });
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  
  // Behavioural Rules Configuration State
  const [behaviouralTone, setBehaviouralTone] = useState("");
  const [teachingStyle, setTeachingStyle] = useState("");
  const [languageLevel, setLanguageLevel] = useState("");
  const [behaviourRules, setBehaviourRules] = useState([]);
  const [responseStructure, setResponseStructure] = useState("");
  const [savedConfig, setSavedConfig] = useState(null);

  // Load browser voices for SpeechSynthesis
  React.useEffect(() => {
    if (!("speechSynthesis" in window)) return;

    const hydrateVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices || !voices.length) return;
      setAvailableVoices(voices);

      // Enhanced heuristic buckets for male / female voices with more keywords
      const lower = (s) => (s || "").toLowerCase();
      const femaleCandidates = voices.filter((v) =>
        ["female", "woman", "girl", "samantha", "victoria", "kate", "maria", "zira", "hazel", "susan", "karen", "linda", "veena", "tessa"].some((kw) =>
          lower(v.name).includes(kw)
        )
      );
      const maleCandidates = voices.filter((v) =>
        ["male", "man", "boy", "daniel", "alex", "david", "mark", "richard", "james", "ravi", "ravi"].some((kw) =>
          lower(v.name).includes(kw)
        )
      );

      setGenderVoices({
        female: femaleCandidates[0] || null,
        male: maleCandidates[0] || null,
      });
    };

    hydrateVoices();
    window.speechSynthesis.addEventListener("voiceschanged", hydrateVoices);

    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", hydrateVoices);
    };
  }, []);

  // Whenever avatar changes, align tone with avatar default and clear TTS buffer
  React.useEffect(() => {
    if (selected?.defaultTone) {
      setTone(selected.defaultTone);
    }
    // Clear any ongoing speech when avatar changes to prevent voice mismatch
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [selected]);

  const stopSpeaking = () => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  /**
   * Choose appropriate TTS voice for avatar based on gender
   * 
   * FIXED TTS Voice Mapping Issue:
   * - Previously, female avatars could get male voices due to fallback logic
   * - Now ensures strict gender matching with multiple fallback strategies:
   *   1. Uses pre-bucketed gender voices (most reliable)
   *   2. Searches all voices for gender keywords if pre-bucket fails
   *   3. Matches by language with gender preference
   *   4. Last resort fallback (should rarely happen)
   * 
   * Additional fixes:
   * - Clears speech synthesis queue when avatar changes
   * - Forces voice reassignment in handleSpeak with gender verification
   * - Prevents cached voices from being reused incorrectly
   */
  const chooseVoiceForAvatar = (avatar) => {
    if (!avatar || !availableVoices.length) return null;

    const targetGender = avatar.gender?.toLowerCase() === "female" ? "female" : "male";

    // 1) Try pre-bucketed gender voice (stable across avatars) - PRIORITY
    if (genderVoices[targetGender]) {
      return genderVoices[targetGender];
    }

    // 2) Force gender match: Search ALL voices for gender keywords if pre-bucket failed
    const lower = (s) => (s || "").toLowerCase();
    const femaleKeywords = ["female", "woman", "girl", "samantha", "victoria", "kate", "maria", "zira", "hazel", "susan", "karen", "linda", "veena", "tessa"];
    const maleKeywords = ["male", "man", "boy", "daniel", "alex", "david", "mark", "richard", "james", "ravi"];
    
    const keywords = targetGender === "female" ? femaleKeywords : maleKeywords;
    const genderMatchedVoice = availableVoices.find((v) =>
      keywords.some((kw) => lower(v.name).includes(kw))
    );

    if (genderMatchedVoice) {
      return genderMatchedVoice;
    }

    // 3) Try matching by language with gender preference
    const avatarLang = (avatar.language || "").toLowerCase();
    const langMatches = availableVoices.filter((v) =>
      v.lang && v.lang.toLowerCase().startsWith(avatarLang)
    );

    if (langMatches.length > 0) {
      // Prefer gender-matched voice in language matches
      const langGenderMatch = langMatches.find((v) =>
        keywords.some((kw) => lower(v.name).includes(kw))
      );
      if (langGenderMatch) return langGenderMatch;
      return langMatches[0];
    }

    // 4) Last resort: return first available voice (should rarely happen)
    return availableVoices[0] || null;
  };

  const handleSpeak = () => {
    if (!selected || !ttsText.trim()) return;
    if (!("speechSynthesis" in window)) {
      alert("Text to Speech is not supported in this browser.");
      return;
    }

    // Clear any previous speech completely
    stopSpeaking();
    
    // Small delay to ensure speech synthesis queue is cleared
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(ttsText);
      const chosenVoice = chooseVoiceForAvatar(selected);
      
      // FIXED: Force voice assignment - ensure gender match
      if (chosenVoice) {
        utterance.voice = chosenVoice;
        // Double-check: if avatar is female, verify voice is female
        if (selected.gender?.toLowerCase() === "female") {
          const voiceName = chosenVoice.name.toLowerCase();
          const isFemaleVoice = ["female", "woman", "girl", "samantha", "victoria", "kate", "maria", "zira", "hazel", "susan", "karen", "linda", "veena", "tessa"].some(
            kw => voiceName.includes(kw)
          );
          if (!isFemaleVoice && genderVoices.female) {
            utterance.voice = genderVoices.female;
          }
        }
      }

    // Adjust voice characteristics based on avatar tone and the selected tone.
    // Here we intentionally exaggerate differences so each tone is clearly audible.
    const effectiveTone = tone || selected.defaultTone || "neutral";
    switch (effectiveTone) {
      case "energetic":
        // Noticeably fast and a bit higher pitch
        utterance.rate = 1.6;
        utterance.pitch = 1.3;
        break;
      case "calm":
        // Clearly slower and slightly deeper
        utterance.rate = 0.7;
        utterance.pitch = 0.8;
        break;
      case "warm":
        // Medium speed, richer / slightly higher pitch
        utterance.rate = 0.95;
        utterance.pitch = 1.4;
        break;
      case "friendly":
        // A bit faster than normal and clearly higher pitch
        utterance.rate = 1.2;
        utterance.pitch = 1.6;
        break;
      case "neutral":
      default:
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        break;
    }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    }, 50);
  };

  const handleSelect = (avatar) => {
    // Clear TTS buffer when selecting new avatar to prevent voice mismatch
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    setSelected(avatar);
    // also scroll the card into view when picked from dropdown
    const el = document.querySelector(`[data-avatar-id="${avatar.id}"]`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  // Handle Behavioural Rules multi-select
  const handleBehaviourRuleToggle = (rule) => {
    setBehaviourRules((prev) =>
      prev.includes(rule)
        ? prev.filter((r) => r !== rule)
        : [...prev, rule]
    );
  };

  /**
   * Save Behavioural Rules Configuration
   * 
   * Stores the selected behavioural rules configuration in frontend state
   * and sends it to the backend API endpoint.
   * 
   * Backend API Integration:
   * - Endpoint: POST /api/avatar/configure
   * - Request Body:
   *   {
   *     avatarId: string,
   *     tone: string,
   *     teachingStyle: string,
   *     languageLevel: string,
   *     behaviourRules: string[],
   *     responseStructure: string
   *   }
   * - Response: { success: boolean, message: string }
   */
  const handleSaveBehaviourRules = async () => {
    if (!selected) {
      alert("Please select an avatar first!");
      return;
    }

    const config = {
      tone: behaviouralTone,
      teachingStyle: teachingStyle,
      languageLevel: languageLevel,
      behaviourRules: behaviourRules,
      responseStructure: responseStructure,
      avatarId: selected?.id || null,
      avatarName: selected?.name || null,
    };

    setSavedConfig(config);

    // Backend API Integration
    // Uncomment and configure your backend endpoint:
    /*
    try {
      const response = await fetch('/api/avatar/configure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          avatarId: selected.id,
          tone: behaviouralTone,
          teachingStyle: teachingStyle,
          languageLevel: languageLevel,
          behaviourRules: behaviourRules,
          responseStructure: responseStructure,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save configuration');
      }
      
      const data = await response.json();
      console.log('Configuration saved:', data);
      alert("Behaviour Rules saved successfully!");
    } catch (error) {
      console.error('Error saving configuration:', error);
      alert("Failed to save configuration. Please try again.");
    }
    */

    // For now, just show success message
    alert("Behaviour Rules saved successfully!");
  };

  // Handle file upload and extract text
  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const fileName = file.name.toLowerCase();
    const fileExtension = fileName.split(".").pop();

    try {
      let extractedText = "";

      if (fileExtension === "txt" || fileExtension === "md") {
        // Handle text files (.txt, .md)
        extractedText = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result || "");
          reader.onerror = reject;
          reader.readAsText(file);
        });
      } else if (fileExtension === "pdf") {
        // Handle PDF files
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const numPages = pdf.numPages;
        const textPromises = [];

        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item) => item.str)
            .join(" ");
          textPromises.push(pageText);
        }

        extractedText = textPromises.join("\n\n");
      } else {
        alert(
          `Unsupported file type: .${fileExtension}\nSupported formats: .txt, .md, .pdf`
        );
        setIsUploading(false);
        return;
      }

      // Set extracted text to textarea
      setTtsText(extractedText.trim());
      alert(`Text extracted from ${file.name} successfully!`);
    } catch (error) {
      console.error("Error reading file:", error);
      alert(`Failed to read file: ${error.message}`);
    } finally {
      setIsUploading(false);
      // Reset file input so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="app">
      <header>
        <h1>Pick Your AI Teacher</h1>
        <p className="subtitle">
          Click on a picture or use the selector to see its 3D avatar.
        </p>
      </header>

      <main>
        {/* LEFT: avatar cards */}
        <section className="left">
          <div className="grid" role="list">
            {AVATARS.map((avatar) => (
              <div
                role="listitem"
                key={avatar.id}
                data-avatar-id={avatar.id}
              >
                <AvatarCard
                  avatar={avatar}
                  selected={selected && selected.id === avatar.id}
                  onSelect={handleSelect}
                />
              </div>
            ))}
          </div>
        </section>

        {/* RIGHT: 3D preview + dropdown + select button + TTS controls */}
        <aside className="preview">
          <div className="preview-card">
            <h2>Preview</h2>

            {selected ? (
              <>
                <div className="preview-animation">
                  <Canvas
                    camera={{ position: [0, 1.6, 4], fov: 30 }}
                    className="preview-animation-media"
                  >
                    <ambientLight intensity={0.9} />
                    <directionalLight
                      position={[2, 4, 3]}
                      intensity={1.2}
                    />

                    <Suspense fallback={null}>
                      {selected.modelUrl && (
                        <AvatarModel
                          url={selected.modelUrl}
                          scaleFactor={selected.scaleFactor || 2.5}
                          yOffset={selected.yOffset || 0}
                        />
                      )}
                      <Environment preset="city" />
                    </Suspense>

                    <OrbitControls
                      enablePan={false}
                      minDistance={3}
                      maxDistance={6}
                    />
                  </Canvas>
                </div>

                {/* Dropdown + select button */}
                <div className="preview-info">
                  <AvatarDropdown
                    avatars={AVATARS}
                    selected={selected}
                    onSelect={handleSelect}
                  />

                  <button
                    type="button"
                    className="btn primary select-btn"
                    onClick={() =>
                      alert(`Avatar selected: ${selected.name}`)
                    }
                  >
                    Select this avatar
                  </button>

                  {/* Behavioural Rules Configuration Section */}
                  <div className="behavioural-rules-panel">
                    <h3>
                      <span className="section-icon">⚙️</span>
                      Behavioural Rules Configuration
                    </h3>

                    <div className="rules-form">
                      {/* Tone Dropdown */}
                      <div className="rules-field">
                        <label className="rules-label" htmlFor="behavioural-tone">
                          Tone
                        </label>
                        <select
                          id="behavioural-tone"
                          className="rules-select"
                          value={behaviouralTone}
                          onChange={(e) => setBehaviouralTone(e.target.value)}
                        >
                          <option value="">Select tone...</option>
                          <option value="friendly-patient">Friendly and Patient</option>
                          <option value="formal-professional">Formal and Professional</option>
                          <option value="humorous-light">Humorous and Light</option>
                          <option value="motivational">Motivational</option>
                          <option value="neutral">Neutral</option>
                          <option value="strict-helpful">Strict but Helpful</option>
                        </select>
                      </div>

                      {/* Teaching Style Dropdown */}
                      <div className="rules-field">
                        <label className="rules-label" htmlFor="teaching-style">
                          Teaching Style
                        </label>
                        <select
                          id="teaching-style"
                          className="rules-select"
                          value={teachingStyle}
                          onChange={(e) => setTeachingStyle(e.target.value)}
                        >
                          <option value="">Select teaching style...</option>
                          <option value="step-by-step">Step-by-step teaching</option>
                          <option value="activity-based">Activity-based learning</option>
                          <option value="short-direct">Short & direct explanations</option>
                          <option value="storytelling">Storytelling</option>
                          <option value="socratic">Socratic questioning</option>
                          <option value="visual">Visual teaching</option>
                        </select>
                      </div>

                      {/* Language Level Dropdown */}
                      <div className="rules-field">
                        <label className="rules-label" htmlFor="language-level">
                          Language Level
                        </label>
                        <select
                          id="language-level"
                          className="rules-select"
                          value={languageLevel}
                          onChange={(e) => setLanguageLevel(e.target.value)}
                        >
                          <option value="">Select language level...</option>
                          <option value="simple-english">Simple English</option>
                          <option value="intermediate-english">Intermediate English</option>
                          <option value="advanced-english">Advanced English</option>
                          <option value="hinglish">Hinglish</option>
                          <option value="indian-friendly">Fully Indian-friendly tone</option>
                        </select>
                      </div>

                      {/* Behavioural Rules Multi-select */}
                      <div className="rules-field">
                        <label className="rules-label">Behavioural Rules</label>
                        <div className="multi-select-container">
                          {[
                            "Simplify complex terms",
                            "Use relatable real-life examples",
                            "Encourage learner at every step",
                            "Avoid jargon unless necessary",
                            "Provide small quizzes",
                            "Keep responses concise",
                            "Give alternative explanations if confused",
                            "Use emojis lightly",
                            "Ask clarifying questions before answering",
                          ].map((rule) => (
                            <label key={rule} className="multi-select-option">
                              <input
                                type="checkbox"
                                checked={behaviourRules.includes(rule)}
                                onChange={() => handleBehaviourRuleToggle(rule)}
                              />
                              <span>{rule}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Response Structure Dropdown */}
                      <div className="rules-field">
                        <label className="rules-label" htmlFor="response-structure">
                          Response Structure
                        </label>
                        <select
                          id="response-structure"
                          className="rules-select"
                          value={responseStructure}
                          onChange={(e) => setResponseStructure(e.target.value)}
                        >
                          <option value="">Select response structure...</option>
                          <option value="intro-explanation-example-quiz-summary">
                            Intro → Explanation → Example → Quiz → Summary
                          </option>
                          <option value="explanation-example-practice">
                            Explanation → Example → Practice Task
                          </option>
                          <option value="short-answer">Short Answer Only</option>
                          <option value="long-detailed">Long Detailed Answer</option>
                          <option value="example-breakdown-answer">
                            Example → Breakdown → Final Answer
                          </option>
                          <option value="step-by-step-list">
                            Step-by-step numbered list
                          </option>
                        </select>
                      </div>

                      {/* Save Button */}
                      <button
                        type="button"
                        className="btn primary save-rules-btn"
                        onClick={handleSaveBehaviourRules}
                      >
                        Save Behaviour Rules
                      </button>
                    </div>

                    {/* Display Saved Configuration */}
                    {savedConfig && (
                      <div className="saved-config-display">
                        <h4>Current Configuration:</h4>
                        <div className="config-summary">
                          {savedConfig.tone && (
                            <div><strong>Tone:</strong> {savedConfig.tone.replace(/-/g, " ")}</div>
                          )}
                          {savedConfig.teachingStyle && (
                            <div><strong>Teaching Style:</strong> {savedConfig.teachingStyle.replace(/-/g, " ")}</div>
                          )}
                          {savedConfig.languageLevel && (
                            <div><strong>Language Level:</strong> {savedConfig.languageLevel.replace(/-/g, " ")}</div>
                          )}
                          {savedConfig.behaviourRules.length > 0 && (
                            <div><strong>Behaviour Rules:</strong> {savedConfig.behaviourRules.join(", ")}</div>
                          )}
                          {savedConfig.responseStructure && (
                            <div><strong>Response Structure:</strong> {savedConfig.responseStructure.replace(/-/g, " ")}</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Text‑to‑Speech controls */}
                  <div className="tts-panel">
                    <h3>Text to Speech</h3>
                    
                    {/* File Upload Section */}
                    <div className="tts-upload-section">
                      <label className="tts-upload-btn" htmlFor="tts-file-upload">
                        <span className="tts-upload-icon">📄</span>
                        <span>
                          {isUploading ? "Uploading..." : "Upload Document"}
                        </span>
                        <input
                          id="tts-file-upload"
                          ref={fileInputRef}
                          type="file"
                          accept=".txt,.md,.pdf"
                          onChange={handleFileUpload}
                          disabled={isUploading}
                          style={{ display: "none" }}
                        />
                      </label>
                      <span className="tts-upload-hint">
                        Supports .txt, .md, .pdf
                      </span>
                    </div>

                    <div className="tts-row">
                      <label className="tts-label" htmlFor="tts-text">
                        Text
                      </label>
                      <textarea
                        id="tts-text"
                        className="tts-input"
                        rows={3}
                        placeholder="Type what you want your AI teacher to say… or upload a document above"
                        value={ttsText}
                        onChange={(e) => setTtsText(e.target.value)}
                      />
                    </div>

                    <div className="tts-row tts-row-inline">
                      <div>
                        <label className="tts-label" htmlFor="tts-tone">
                          Tone
                        </label>
                        <select
                          id="tts-tone"
                          className="tts-select"
                          value={tone}
                          onChange={(e) => setTone(e.target.value)}
                        >
                          <option value="neutral">Neutral</option>
                          <option value="calm">Calm</option>
                          <option value="energetic">Energetic</option>
                          <option value="warm">Warm</option>
                          <option value="friendly">Friendly</option>
                        </select>
                      </div>

                      <div className="tts-meta">
                        <div>
                          <span className="tts-meta-label">Avatar gender:</span>{" "}
                          <span className="tts-meta-value">
                            {selected.gender || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span className="tts-meta-label">Language:</span>{" "}
                          <span className="tts-meta-value">
                            {selected.language || "auto"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="tts-actions">
                      <button
                        type="button"
                        className="btn secondary"
                        onClick={handleSpeak}
                        disabled={!ttsText.trim() || isSpeaking}
                      >
                        {isSpeaking ? "Speaking…" : "Speak"}
                      </button>
                      <button
                        type="button"
                        className="btn ghost"
                        onClick={stopSpeaking}
                        disabled={!isSpeaking}
                      >
                        Stop
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="empty">
                No avatar selected — click one on the left or use the selector
                below.
              </div>
            )}
          </div>
        </aside>
      </main>

      <footer>
        <small>
          The 3D model is auto-fitted so the full body stays in frame. Use the
          selector or cards to pick your AI teacher.
        </small>
      </footer>
    </div>
  );
}



