import { ChangeEvent, useEffect, useMemo, useState } from "react";
import type { Floor, HouseModel, HouseObject, Wall } from "./model";
import { validateHouseModel } from "./model";
import { Plan2D } from "./Plan2D";
import { sampleHouse } from "./sampleHouse";
import { Scene3D } from "./Scene3D";
import {
  formatTimeMinutes,
  getDateStringFromDayOfYear,
  getDayOfYear,
  getLocalDateString,
  getMonthMarkers,
  getSunPosition,
  isLeapYear,
  type SunStudySettings,
} from "./solar";

const STORAGE_KEY = "ciurbesti-house-model-v2";
const STORAGE_FORMAT = 1;
const SAMPLE_SIGNATURE = hashString(JSON.stringify(sampleHouse));
const SUN_STUDY_LOCATION = {
  latitude: 47.09680103263453,
  longitude: 27.52868553863555,
  timeZone: "Europe/Bucharest",
} as const;
const DEFAULT_MODEL_NORTH_DEGREES = 226.9;

type StoredModelEnvelope = {
  storageFormat: typeof STORAGE_FORMAT;
  sourceSignature: string;
  model: HouseModel;
};

function saveModel(model: HouseModel) {
  const envelope: StoredModelEnvelope = {
    storageFormat: STORAGE_FORMAT,
    sourceSignature: SAMPLE_SIGNATURE,
    model,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
}

function loadInitialModel(): HouseModel {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    saveModel(sampleHouse);
    return sampleHouse;
  }

  try {
    const parsed = JSON.parse(saved);
    if (isStoredModelEnvelope(parsed)) {
      if (parsed.sourceSignature !== SAMPLE_SIGNATURE || validateHouseModel(parsed.model).length > 0) {
        saveModel(sampleHouse);
        return sampleHouse;
      }
      return parsed.model;
    }

    saveModel(sampleHouse);
    return sampleHouse;
  } catch {
    saveModel(sampleHouse);
    return sampleHouse;
  }
}

function isStoredModelEnvelope(value: unknown): value is StoredModelEnvelope {
  const envelope = value as StoredModelEnvelope;
  return (
    !!envelope &&
    typeof envelope === "object" &&
    envelope.storageFormat === STORAGE_FORMAT &&
    typeof envelope.sourceSignature === "string" &&
    !!envelope.model &&
    typeof envelope.model === "object"
  );
}

function hashString(value: string) {
  let hash = 5381;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33) ^ value.charCodeAt(index);
  }
  return (hash >>> 0).toString(36);
}

function cloneModel(model: HouseModel): HouseModel {
  return JSON.parse(JSON.stringify(model)) as HouseModel;
}

function updateFloor(model: HouseModel, floorId: string, updater: (floor: Floor) => void) {
  const next = cloneModel(model);
  const floor = next.floors.find((item) => item.id === floorId);
  if (floor) updater(floor);
  return next;
}

function downloadJson(model: HouseModel) {
  const blob = new Blob([JSON.stringify(model, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${model.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function nextWallId(model: HouseModel) {
  const usedIds = new Set(model.floors.flatMap((floor) => floor.walls.map((wall) => wall.id)));
  let index = 1;
  while (usedIds.has(`w${index}`)) index += 1;
  return `w${index}`;
}

export function App() {
  const [model, setModel] = useState(loadInitialModel);
  const [jsonText, setJsonText] = useState(() => JSON.stringify(loadInitialModel(), null, 2));
  const [activeFloorId, setActiveFloorId] = useState(() => loadInitialModel().floors[0]?.id ?? "");
  const [jsonError, setJsonError] = useState("");
  const [wireframe, setWireframe] = useState(true);
  const [showAllFloors, setShowAllFloors] = useState(true);
  const [mobileControlsOpen, setMobileControlsOpen] = useState(false);
  const [controlMode, setControlMode] = useState(false);
  const [sunStudy, setSunStudy] = useState<SunStudySettings>(() => ({
    ...SUN_STUDY_LOCATION,
    date: getLocalDateString(new Date()),
    timeMinutes: 15 * 60,
    modelNorthDegrees: DEFAULT_MODEL_NORTH_DEGREES,
  }));

  const activeFloor = useMemo(
    () => model.floors.find((floor) => floor.id === activeFloorId) ?? model.floors[0],
    [activeFloorId, model.floors],
  );
  const validationIssues = useMemo(() => validateHouseModel(model), [model]);
  const sunPosition = useMemo(() => getSunPosition(sunStudy), [sunStudy]);
  const sunStudyYear = Number(sunStudy.date.slice(0, 4));
  const dayOfYear = useMemo(() => getDayOfYear(sunStudy.date), [sunStudy.date]);
  const monthMarkers = useMemo(() => getMonthMarkers(sunStudyYear), [sunStudyYear]);

  useEffect(() => {
    document.body.classList.toggle("control-mode-active", controlMode);
    return () => document.body.classList.remove("control-mode-active");
  }, [controlMode]);

  const commitModel = (next: HouseModel) => {
    setModel(next);
    setJsonText(JSON.stringify(next, null, 2));
    saveModel(next);
  };

  const syncFromFile = () => {
    setJsonError("");
    commitModel(sampleHouse);
    setActiveFloorId(sampleHouse.floors[0]?.id ?? "");
  };

  const applyJson = () => {
    setJsonError("");
    try {
      const parsed = JSON.parse(jsonText);
      const issues = validateHouseModel(parsed);
      if (issues.length > 0) {
        setJsonError(`${issues[0].path}: ${issues[0].message}`);
        return;
      }
      commitModel(parsed);
      setActiveFloorId(parsed.floors[0]?.id ?? "");
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : "Invalid JSON.");
    }
  };

  const importJson = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    file.text().then((text) => {
      setJsonText(text);
      try {
        const parsed = JSON.parse(text);
        const issues = validateHouseModel(parsed);
        if (issues.length > 0) {
          setJsonError(`${issues[0].path}: ${issues[0].message}`);
          return;
        }
        setJsonError("");
        commitModel(parsed);
        setActiveFloorId(parsed.floors[0]?.id ?? "");
      } catch (error) {
        setJsonError(error instanceof Error ? error.message : "Invalid JSON.");
      }
    });
  };

  const addFloor = () => {
    const index = model.floors.length + 1;
    const next = cloneModel(model);
    const elevation = Math.max(...next.floors.map((floor) => floor.elevation + floor.defaultWallHeight), 0) + 30;
    next.floors.push({
      id: `floor-${index}`,
      name: `Floor ${index}`,
      elevation,
      defaultWallHeight: 260,
      walls: [],
      spaces: [],
      objects: [],
    });
    commitModel(next);
    setActiveFloorId(`floor-${index}`);
  };

  const addWall = () => {
    const wallId = nextWallId(model);
    const next = updateFloor(model, activeFloor.id, (floor) => {
      const index = floor.walls.length + 1;
      const wall: Wall = {
        id: wallId,
        name: `Wall ${index}`,
        from: { x: 0, y: index * 80 },
        to: { x: 300, y: index * 80 },
        height: floor.defaultWallHeight,
        thickness: 30,
        thicknessSide: "center",
      };
      floor.walls.push(wall);
    });
    commitModel(next);
  };

  const addObject = () => {
    const next = updateFloor(model, activeFloor.id, (floor) => {
      const index = floor.objects.length + 1;
      const object: HouseObject = {
        id: `${floor.id}-object-${index}`,
        name: `Box ${index}`,
        type: "box",
        position: { x: 120 + index * 40, y: 120 + index * 40, z: 40 },
        size: { x: 80, y: 60, z: 80 },
        color: "#667b68",
        category: "custom",
      };
      floor.objects.push(object);
    });
    commitModel(next);
  };

  return (
    <main className={`app-shell ${mobileControlsOpen ? "mobile-controls-open" : ""} ${controlMode ? "control-mode" : ""}`}>
      <aside className={`sidebar ${mobileControlsOpen ? "open" : ""}`}>
        <div className="brand-block">
          <h1>{model.name}</h1>
          <p>Centimeter-based local draft model</p>
        </div>

        <section className="panel">
          <div className="toolbar">
            <label className="file-button">
              Import
              <input type="file" accept="application/json" onChange={importJson} />
            </label>
            <button onClick={() => downloadJson(model)}>Export</button>
            <button onClick={syncFromFile}>Sync File</button>
          </div>
          <div className="toggles">
            <label>
              <input type="checkbox" checked={wireframe} onChange={(event) => setWireframe(event.target.checked)} />
              Wireframe
            </label>
            <label>
              <input
                type="checkbox"
                checked={showAllFloors}
                onChange={(event) => setShowAllFloors(event.target.checked)}
              />
              All floors in 3D
            </label>
          </div>
        </section>

        <section className="panel">
          <div className="section-title">
            <h2>Floors</h2>
            <button onClick={addFloor}>Add</button>
          </div>
          <select value={activeFloor.id} onChange={(event) => setActiveFloorId(event.target.value)}>
            {model.floors.map((floor) => (
              <option key={floor.id} value={floor.id}>
                {floor.name} ({floor.elevation} cm)
              </option>
            ))}
          </select>
        </section>

        <section className="panel">
          <div className="section-title">
            <h2>Current Floor</h2>
            <div className="toolbar small">
              <button onClick={addWall}>Wall</button>
              <button onClick={addObject}>Box</button>
            </div>
          </div>
          <dl className="stats">
            <div>
              <dt>Walls</dt>
              <dd>{activeFloor.walls.length}</dd>
            </div>
            <div>
              <dt>Spaces</dt>
              <dd>{activeFloor.spaces.length}</dd>
            </div>
            <div>
              <dt>Objects</dt>
              <dd>{activeFloor.objects.length}</dd>
            </div>
          </dl>
        </section>

        <section className="panel">
          <div className="section-title">
            <h2>Sun Study</h2>
            <span className="panel-note">{SUN_STUDY_LOCATION.timeZone}</span>
          </div>
          <div className="sun-study-controls">
            <label>
              <span>Date</span>
              <input
                type="date"
                value={sunStudy.date}
                onChange={(event) => setSunStudy((current) => ({ ...current, date: event.target.value }))}
              />
            </label>
            <label>
              <span>Day of Year</span>
              <input
                type="range"
                min="1"
                max={isLeapYear(sunStudyYear) ? "366" : "365"}
                step="1"
                value={dayOfYear}
                list="sun-study-months"
                onChange={(event) =>
                  setSunStudy((current) => ({
                    ...current,
                    date: getDateStringFromDayOfYear(sunStudyYear, Number(event.target.value)),
                  }))
                }
              />
              <strong>Day {dayOfYear}</strong>
              <datalist id="sun-study-months">
                {monthMarkers.map((marker) => (
                  <option key={marker.label} value={marker.day} label={marker.label} />
                ))}
              </datalist>
              <div className="month-markers" aria-hidden="true">
                {monthMarkers.map((marker) => (
                  <span key={marker.label}>{marker.label}</span>
                ))}
              </div>
            </label>
            <label>
              <span>Time</span>
              <input
                type="time"
                step="60"
                value={formatTimeMinutes(sunStudy.timeMinutes)}
                onChange={(event) => {
                  const [hours, minutes] = event.target.value.split(":").map(Number);
                  setSunStudy((current) => ({ ...current, timeMinutes: hours * 60 + minutes }));
                }}
              />
              <input
                type="range"
                min="0"
                max={23 * 60 + 59}
                step="1"
                value={sunStudy.timeMinutes}
                onChange={(event) =>
                  setSunStudy((current) => ({ ...current, timeMinutes: Number(event.target.value) }))
                }
              />
              <strong>{formatTimeMinutes(sunStudy.timeMinutes)}</strong>
            </label>
            <label>
              <span>Model North</span>
              <input
                type="range"
                min="0"
                max="359"
                step="1"
                value={sunStudy.modelNorthDegrees}
                onChange={(event) =>
                  setSunStudy((current) => ({ ...current, modelNorthDegrees: Number(event.target.value) }))
                }
              />
              <strong>{sunStudy.modelNorthDegrees} deg</strong>
            </label>
          </div>
          <div className="toolbar small">
            <button onClick={() => setSunStudy((current) => ({ ...current, date: `${current.date.slice(0, 4)}-03-20` }))}>
              Mar 20
            </button>
            <button onClick={() => setSunStudy((current) => ({ ...current, date: `${current.date.slice(0, 4)}-06-21` }))}>
              Jun 21
            </button>
            <button onClick={() => setSunStudy((current) => ({ ...current, date: `${current.date.slice(0, 4)}-09-22` }))}>
              Sep 22
            </button>
            <button onClick={() => setSunStudy((current) => ({ ...current, date: `${current.date.slice(0, 4)}-12-21` }))}>
              Dec 21
            </button>
          </div>
          <dl className="stats sun-stats">
            <div>
              <dt>Altitude</dt>
              <dd>{sunPosition.altitudeDegrees.toFixed(1)} deg</dd>
            </div>
            <div>
              <dt>Azimuth</dt>
              <dd>{sunPosition.azimuthDegrees.toFixed(1)} deg</dd>
            </div>
            <div>
              <dt>Sun</dt>
              <dd>{sunPosition.altitudeDegrees > 0 ? "Above" : "Below"}</dd>
            </div>
          </dl>
        </section>

        <section className="panel json-panel">
          <div className="section-title">
            <h2>Model JSON</h2>
            <button onClick={applyJson}>Apply</button>
          </div>
          <textarea value={jsonText} spellCheck={false} onChange={(event) => setJsonText(event.target.value)} />
          {jsonError && <p className="error">{jsonError}</p>}
          {!jsonError && validationIssues.length > 0 && <p className="error">{validationIssues[0].message}</p>}
        </section>
      </aside>

      <section className="workspace">
        <div className="view-card large">
          <div className="view-header">
            <h2>3D Wire Model</h2>
            <span>{showAllFloors ? `${activeFloor.name} with sun study` : `${activeFloor.name} with sun study`}</span>
          </div>
          <div className="mobile-scene-toolbar">
            <button onClick={() => setMobileControlsOpen((current) => !current)}>
              {mobileControlsOpen ? "Hide Controls" : "Show Controls"}
            </button>
            <button onClick={() => setControlMode((current) => !current)}>
              {controlMode ? "Exit 3D Controls" : "Enter 3D Controls"}
            </button>
          </div>
          <Scene3D
            model={model}
            activeFloorId={activeFloor.id}
            showAllFloors={showAllFloors}
            wireframe={wireframe}
            sunStudy={sunStudy}
            interactionEnabled={controlMode}
          />
        </div>

        <div className="view-card plans-card">
          <div className="view-header">
            <h2>2D Plans</h2>
            <span>{model.floors.length} floors</span>
          </div>
          <div className="plans-stack">
            {model.floors.map((floor) => (
              <section className="plan-section" key={floor.id}>
                <div className="plan-section-header">
                  <h3>{floor.name}</h3>
                  <span>{floor.elevation} cm elevation</span>
                </div>
                <Plan2D floor={floor} />
              </section>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
