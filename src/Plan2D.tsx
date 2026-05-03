import { PointerEvent, WheelEvent, useMemo, useRef, useState } from "react";
import type { Floor } from "./model";
import {
  getFloorBounds,
  getStructuralAxes,
  wallOpeningSegment,
  wallFootprint,
  wallLabelPoint,
  wallMetrics,
} from "./geometry";
import { isSolidStructuralStep } from "./houseObjects";

type Plan2DProps = {
  floor: Floor;
};

const PLAN_PADDING_X = 140;
const PLAN_PADDING_Y = 96;
const AXIS_LABEL_GAP = 28;

export function Plan2D({ floor }: Plan2DProps) {
  const bounds = useMemo(() => getFloorBounds(floor), [floor]);
  const structuralAxes = useMemo(() => getStructuralAxes(floor), [floor]);
  const viewMinX = bounds.minX - PLAN_PADDING_X;
  const viewMinY = bounds.minY - PLAN_PADDING_Y;
  const viewWidth = bounds.width + PLAN_PADDING_X * 2;
  const viewHeight = bounds.height + PLAN_PADDING_Y * 2;
  const viewBox = `${viewMinX} ${viewMinY} ${viewWidth} ${viewHeight}`;
  const viewCenterX = viewMinX + viewWidth / 2;
  const viewCenterY = viewMinY + viewHeight / 2;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragState, setDragState] = useState<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  const clampScale = (value: number) => Math.min(4, Math.max(0.6, value));
  const transform = `translate(${viewCenterX + pan.x} ${viewCenterY + pan.y}) scale(${scale}) translate(${-viewCenterX} ${-viewCenterY})`;

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const direction = event.deltaY > 0 ? -1 : 1;
    if (!containerRef.current) return;

    const nextScale = clampScale(scale * (1 + direction * 0.04));
    const rect = containerRef.current.getBoundingClientRect();
    const pointerX = event.clientX - rect.left;
    const pointerY = event.clientY - rect.top;
    const worldX =
      viewMinX + ((pointerX / rect.width) * viewWidth - pan.x - viewWidth / 2) / scale + viewWidth / 2;
    const worldY =
      viewMinY + ((pointerY / rect.height) * viewHeight - pan.y - viewHeight / 2) / scale + viewHeight / 2;
    const nextPanX = (pointerX / rect.width) * viewWidth - viewWidth / 2 - scaleToOffset(worldX, viewCenterX, nextScale);
    const nextPanY = (pointerY / rect.height) * viewHeight - viewHeight / 2 - scaleToOffset(worldY, viewCenterY, nextScale);

    setScale(nextScale);
    setPan({ x: nextPanX, y: nextPanY });
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);
    setDragState({
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: pan.x,
      originY: pan.y,
    });
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragState || dragState.pointerId !== event.pointerId || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const unitsPerPixelX = viewWidth / rect.width;
    const unitsPerPixelY = viewHeight / rect.height;
    setPan({
      x: dragState.originX + (event.clientX - dragState.startX) * unitsPerPixelX,
      y: dragState.originY + (event.clientY - dragState.startY) * unitsPerPixelY,
    });
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setDragState(null);
  };

  return (
    <div
      ref={containerRef}
      className={`plan-shell ${dragState ? "dragging" : ""}`}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className="plan-toolbar">
        <button type="button" onClick={() => setScale((current) => clampScale(current * 1.2))}>
          Zoom In
        </button>
        <button type="button" onClick={() => setScale((current) => clampScale(current / 1.2))}>
          Zoom Out
        </button>
        <button type="button" onClick={() => {
          setScale(1);
          setPan({ x: 0, y: 0 });
        }}>
          Reset
        </button>
        <span>{Math.round(scale * 100)}%</span>
      </div>
      <svg className="plan" viewBox={viewBox} role="img" aria-label={`${floor.name} plan`}>
        <defs>
          <pattern id={`grid-cm-${floor.id}`} width="100" height="100" patternUnits="userSpaceOnUse">
            <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#d7dde5" strokeWidth="2" />
          </pattern>
        </defs>
        <g transform={transform}>
          <rect
            x={viewMinX}
            y={viewMinY}
            width={viewWidth}
            height={viewHeight}
            fill={`url(#grid-cm-${floor.id})`}
          />
          {floor.spaces.map((space) => (
            <polygon
              key={space.id}
              points={space.boundary.map((point) => `${point.x},${point.y}`).join(" ")}
              fill={space.color ?? "#eef3f9"}
              stroke="#b7c1cf"
              strokeWidth="4"
            />
          ))}
          {structuralAxes.map((axis) =>
            axis.orientation === "vertical" ? (
              <g key={axis.id} className="structural-axis">
                <line
                  x1={axis.coordinate}
                  y1={viewMinY}
                  x2={axis.coordinate}
                  y2={bounds.maxY + PLAN_PADDING_Y}
                />
                <text x={axis.coordinate} y={viewMinY - AXIS_LABEL_GAP} textAnchor="middle">
                  {axis.label}
                </text>
                <text x={axis.coordinate} y={bounds.maxY + PLAN_PADDING_Y + AXIS_LABEL_GAP} textAnchor="middle">
                  {axis.label}
                </text>
              </g>
            ) : (
              <g key={axis.id} className="structural-axis">
                <line
                  x1={viewMinX}
                  y1={axis.coordinate}
                  x2={bounds.maxX + PLAN_PADDING_X}
                  y2={axis.coordinate}
                />
                <text x={viewMinX - AXIS_LABEL_GAP} y={axis.coordinate + 8} textAnchor="middle">
                  {axis.label}
                </text>
                <text x={bounds.maxX + PLAN_PADDING_X + AXIS_LABEL_GAP} y={axis.coordinate + 8} textAnchor="middle">
                  {axis.label}
                </text>
              </g>
            ),
          )}
          {floor.walls.map((wall) => (
            <g key={wall.id}>
              <polygon
                points={wallFootprint(wall).map((point) => `${point.x},${point.y}`).join(" ")}
                fill={wall.color ?? "#222a35"}
                stroke={wall.color ?? "#222a35"}
                strokeWidth="2"
              />
              {wall.openings?.map((opening, index) => {
                const [from, to] = wallOpeningSegment(wall, opening);
                return (
                  <line
                    key={`${wall.id}-opening-${index}`}
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke={opening.type === "door" ? "#476b88" : "#8ab4cc"}
                    strokeWidth={Math.max(8, wall.thickness * 0.55)}
                    strokeLinecap="square"
                  />
                );
              })}
            </g>
          ))}
          {floor.objects.map((object) => (
            object.type === "box" ? (
              <g key={object.id} transform={`translate(${object.position.x} ${object.position.y}) rotate(${((object.rotationZ ?? 0) * 180) / Math.PI})`}>
                <rect
                  x={-object.size.x / 2}
                  y={-object.size.y / 2}
                  width={object.size.x}
                  height={object.size.y}
                  fill={object.color ?? "#69788c"}
                  fillOpacity={isSolidStructuralStep(object.id) ? "1" : "0.85"}
                  stroke="#27313f"
                  strokeWidth="4"
                />
                <text y="6" textAnchor="middle" className="plan-label">
                  {object.name}
                </text>
              </g>
            ) : (
              <g key={object.id}>
                <polygon
                  points={object.boundary.map((point) => `${point.x},${point.y}`).join(" ")}
                  fill={object.color ?? "#69788c"}
                  fillOpacity="0.85"
                  stroke="#27313f"
                  strokeWidth="4"
                />
                <text
                  x={averageCoordinate(object.boundary, "x")}
                  y={averageCoordinate(object.boundary, "y")}
                  textAnchor="middle"
                  className="plan-label"
                >
                  {object.name}
                </text>
              </g>
            )
          ))}
          {floor.walls.map((wall) => {
            const metrics = wallMetrics(wall.from, wall.to);
            const labelPoint = wallLabelPoint(wall);
            return (
              <text key={`${wall.id}-label`} x={labelPoint.x} y={labelPoint.y - 18} textAnchor="middle" className="plan-label">
                {wall.id} · {Math.round(metrics.length)} cm
              </text>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

function scaleToOffset(worldCoordinate: number, viewCenterCoordinate: number, scale: number) {
  return (worldCoordinate - viewCenterCoordinate) * scale;
}

function averageCoordinate(points: { x: number; y: number }[], axis: "x" | "y") {
  if (points.length === 0) return 0;
  return points.reduce((sum, point) => sum + point[axis], 0) / points.length;
}
