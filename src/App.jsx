import React, {
  useState,
  Suspense,
  useRef,
  useLayoutEffect,
} from "react";
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
const AVATARS = [
  {
    id: "south-indian",
    name: "South Indian",
    imageUrl: southIndianImg,
    modelUrl: southIndianModel,
  },
  {
    id: "punjabi",
    name: "Punjabi",
    imageUrl: punjabiImg,
    modelUrl: punjabiModel,
  },
  {
    id: "female-1",
    name: "Female 1",
    imageUrl: female1Img,
    modelUrl: female1Model,
  },
  {
    id: "female-2",
    name: "Female 2",
    imageUrl: female2Img,
    modelUrl: female2Model,
  },
  {
    id: "bengali",
    name: "Bengali",
    imageUrl: bengaliImg,
    modelUrl: bengaliModel,
  },
  {
    id: "himachali",
    name: "Himachali",
    imageUrl: himachaliImg,
    modelUrl: himachaliModel,
    scaleFactor: 2.3,
    yOffset: -0.35, // adjust up/down if needed
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

        {/* RIGHT: 3D preview + dropdown + select button */}
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



