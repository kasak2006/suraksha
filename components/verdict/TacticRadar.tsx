"use client";

import { useTranslations } from "next-intl";
import { TACTIC_AXES, type TacticScores } from "@/lib/engine/tactics";

/*
 * Custom SVG 8-axis radar (spec §4.3) — the demo money-shot. No charting
 * dependency (keeps the §10 JS budget). Uses the neutral accent/primary tokens
 * via CSS variables, not the reserved verdict-colour tokens: the radar shows
 * *what is being done to you*, not a verdict band.
 */

// Extra horizontal room so long axis labels (e.g. "Irreversible payment") never
// clip; multi-word labels also wrap to two lines below.
const WIDTH = 380;
const HEIGHT = 300;
const CX = WIDTH / 2;
const CY = HEIGHT / 2;
const RADIUS = 92;
const LABEL_RADIUS = RADIUS + 18;
const RINGS = [25, 50, 75, 100];

/** Point on the radar for axis index `i` at value `v` (0–100). */
function point(i: number, v: number): { x: number; y: number } {
  const angle = (-90 + i * (360 / TACTIC_AXES.length)) * (Math.PI / 180);
  const r = (RADIUS * v) / 100;
  return { x: CX + r * Math.cos(angle), y: CY + r * Math.sin(angle) };
}

function polygon(values: number[]): string {
  return values.map((v, i) => `${point(i, v).x},${point(i, v).y}`).join(" ");
}

export function TacticRadar({ tactics }: { tactics: TacticScores }) {
  const t = useTranslations("tactics");
  const values = TACTIC_AXES.map((a) => tactics[a]);

  // Accessible summary: the axes that are meaningfully lit.
  const lit = TACTIC_AXES.filter((a) => tactics[a] >= 40).map((a) => t(a));
  const summary = lit.length > 0 ? lit.join(", ") : t(TACTIC_AXES[0]);

  return (
    <figure className="mx-auto flex max-w-md flex-col items-center">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full"
        role="img"
        aria-label={`Manipulation tactics detected: ${summary}`}
      >
        {/* Grid rings */}
        {RINGS.map((ring) => (
          <polygon
            key={ring}
            points={polygon(TACTIC_AXES.map(() => ring))}
            fill="none"
            stroke="var(--border)"
            strokeWidth={1}
          />
        ))}

        {/* Spokes */}
        {TACTIC_AXES.map((axis, i) => {
          const end = point(i, 100);
          return (
            <line
              key={axis}
              x1={CX}
              y1={CY}
              x2={end.x}
              y2={end.y}
              stroke="var(--border)"
              strokeWidth={1}
            />
          );
        })}

        {/* Data polygon */}
        <polygon
          points={polygon(values)}
          fill="var(--accent)"
          fillOpacity={0.22}
          stroke="var(--accent)"
          strokeWidth={2}
          strokeLinejoin="round"
        />
        {TACTIC_AXES.map((axis, i) => {
          const p = point(i, tactics[axis]);
          return (
            <circle
              key={axis}
              cx={p.x}
              cy={p.y}
              r={tactics[axis] >= 40 ? 3.5 : 2}
              fill="var(--accent)"
            />
          );
        })}

        {/* Axis labels — multi-word labels wrap onto two lines */}
        {TACTIC_AXES.map((axis, i) => {
          const angle = (-90 + i * (360 / TACTIC_AXES.length)) * (Math.PI / 180);
          const x = CX + LABEL_RADIUS * Math.cos(angle);
          const y = CY + LABEL_RADIUS * Math.sin(angle);
          const cos = Math.cos(angle);
          const anchor = cos > 0.3 ? "start" : cos < -0.3 ? "end" : "middle";
          const strong = tactics[axis] >= 40;
          const lines = t(axis).split(" ");
          return (
            <text
              key={axis}
              x={x}
              y={y}
              textAnchor={anchor}
              dominantBaseline="middle"
              className={strong ? "font-semibold" : ""}
              fill={strong ? "var(--foreground)" : "var(--muted-foreground)"}
              fontSize={10.5}
            >
              {lines.map((line, li) => (
                <tspan
                  key={line}
                  x={x}
                  dy={li === 0 ? `${(-(lines.length - 1) * 0.5).toFixed(2)}em` : "1em"}
                >
                  {line}
                </tspan>
              ))}
            </text>
          );
        })}
      </svg>
    </figure>
  );
}
