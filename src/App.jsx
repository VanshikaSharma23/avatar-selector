import React, { useState, Suspense, useRef, useLayoutEffect } from "react";
import "./index.css";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, useGLTF } from "@react-three/drei";
import { Box3, Vector3 } from "three";

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

  // Load browser voices for SpeechSynthesis
  React.useEffect(() => {
    if (!("speechSynthesis" in window)) return;

    const hydrateVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices || !voices.length) return;
      setAvailableVoices(voices);

      // Heuristic buckets for male / female voices so we can pick more stable voices per gender.
      const lower = (s) => (s || "").toLowerCase();
      const femaleCandidates = voices.filter((v) =>
        ["female", "woman", "girl", "samantha", "victoria", "kate", "maria"].some((kw) =>
          lower(v.name).includes(kw)
        )
      );
      const maleCandidates = voices.filter((v) =>
        ["male", "man", "boy", "daniel", "alex", "david"].some((kw) =>
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

  // Whenever avatar changes, align tone with avatar default
  React.useEffect(() => {
    if (selected?.defaultTone) {
      setTone(selected.defaultTone);
    }
  }, [selected]);

  const stopSpeaking = () => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const chooseVoiceForAvatar = (avatar) => {
    if (!avatar || !availableVoices.length) return null;

    const targetGender = avatar.gender?.toLowerCase() === "female" ? "female" : "male";

    // 1) Try pre-bucketed gender voice (stable across avatars).
    if (genderVoices[targetGender]) {
      return genderVoices[targetGender];
    }

    // 2) Try matching by language and simple gender keyword hints.
    const avatarLang = (avatar.language || "").toLowerCase();
    const langMatches = availableVoices.filter((v) =>
      v.lang && v.lang.toLowerCase().startsWith(avatarLang)
    );

    const genderHint = targetGender;
    const genderMatched =
      langMatches.find((v) =>
        v.name.toLowerCase().includes(genderHint)
      ) || langMatches[0];

    // 3) Fallback to first available voice.
    return genderMatched || availableVoices[0] || null;
  };

  const handleSpeak = () => {
    if (!selected || !ttsText.trim()) return;
    if (!("speechSynthesis" in window)) {
      alert("Text to Speech is not supported in this browser.");
      return;
    }

    stopSpeaking();

    const utterance = new SpeechSynthesisUtterance(ttsText);
    const chosenVoice = chooseVoiceForAvatar(selected);
    if (chosenVoice) {
      utterance.voice = chosenVoice;
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
  };

  const handleSelect = (avatar) => {
    setSelected(avatar);
    // also scroll the card into view when picked from dropdown
    const el = document.querySelector(`[data-avatar-id="${avatar.id}"]`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
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

                  {/* Text‑to‑Speech controls */}
                  <div className="tts-panel">
                    <h3>Text to Speech</h3>
                    <div className="tts-row">
                      <label className="tts-label" htmlFor="tts-text">
                        Text
                      </label>
                      <textarea
                        id="tts-text"
                        className="tts-input"
                        rows={3}
                        placeholder="Type what you want your AI teacher to say…"
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



