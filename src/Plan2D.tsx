import type { Floor } from "./model";
import {
  getFloorBounds,
  getStructuralAxes,
  wallOpeningSegment,
  wallFootprint,
  wallLabelPoint,
  wallMetrics,
} from "./geometry";

type Plan2DProps = {
  floor: Floor;
};

const isSolidStepOrPlatform = (id: string) =>
  id.startsWith("green-platform-") || id === "garage-platform" || id.startsWith("garage-step-") || id === "garage-car-rav4-prime";

export function Plan2D({ floor }: Plan2DProps) {
  const bounds = getFloorBounds(floor);
  const structuralAxes = getStructuralAxes(floor);
  const padding = 80;
  const viewBox = `${bounds.minX - padding} ${bounds.minY - padding} ${bounds.width + padding * 2} ${bounds.height + padding * 2}`;

  return (
    <svg className="plan" viewBox={viewBox} role="img" aria-label={`${floor.name} plan`}>
      <defs>
        <pattern id="grid-cm" width="100" height="100" patternUnits="userSpaceOnUse">
          <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#d7dde5" strokeWidth="2" />
        </pattern>
      </defs>
      <rect
        x={bounds.minX - padding}
        y={bounds.minY - padding}
        width={bounds.width + padding * 2}
        height={bounds.height + padding * 2}
        fill="url(#grid-cm)"
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
              y1={bounds.minY - padding}
              x2={axis.coordinate}
              y2={bounds.maxY + padding}
            />
            <text x={axis.coordinate} y={bounds.minY - padding / 2} textAnchor="middle">
              {axis.label}
            </text>
          </g>
        ) : (
          <g key={axis.id} className="structural-axis">
            <line
              x1={bounds.minX - padding}
              y1={axis.coordinate}
              x2={bounds.maxX + padding}
              y2={axis.coordinate}
            />
            <text x={bounds.minX - padding / 2} y={axis.coordinate + 8} textAnchor="middle">
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
        <g key={object.id} transform={`translate(${object.position.x} ${object.position.y}) rotate(${((object.rotationZ ?? 0) * 180) / Math.PI})`}>
          <rect
            x={-object.size.x / 2}
            y={-object.size.y / 2}
            width={object.size.x}
            height={object.size.y}
            fill={object.color ?? "#69788c"}
            fillOpacity={isSolidStepOrPlatform(object.id) ? "1" : "0.85"}
            stroke="#27313f"
            strokeWidth="4"
          />
          <text y="6" textAnchor="middle" className="plan-label">
            {object.name}
          </text>
        </g>
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
    </svg>
  );
}
