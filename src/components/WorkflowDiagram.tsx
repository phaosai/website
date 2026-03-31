import { useEffect, useState, useRef } from "react";
import { Phone, Bot, UserCheck, Database, Truck } from "lucide-react";

const nodes = [
  { label: "Missed Call", icon: Phone, x: 60, y: 100 },
  { label: "Voice AI Answers", icon: Bot, x: 260, y: 100 },
  { label: "Lead Qualified", icon: UserCheck, x: 460, y: 100 },
  { label: "CRM Updated", icon: Database, x: 660, y: 100 },
  { label: "Dispatch Sent", icon: Truck, x: 860, y: 100 },
];

const WorkflowDiagram = () => {
  const [activeNode, setActiveNode] = useState(-1);
  const [activePath, setActivePath] = useState(-1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let step = 0;
    const totalSteps = nodes.length * 2; // node + path for each

    const tick = () => {
      const phase = step % totalSteps;
      const nodeIndex = Math.floor(phase / 2);
      const isPath = phase % 2 === 1;

      if (isPath) {
        setActivePath(nodeIndex);
      } else {
        setActiveNode(nodeIndex);
        setActivePath(-1);
      }

      step++;
      if (step >= totalSteps) {
        // Pause at end then restart
        setTimeout(() => {
          setActiveNode(-1);
          setActivePath(-1);
          step = 0;
        }, 2000);
      }
    };

    intervalRef.current = setInterval(tick, 800);
    tick(); // Start immediately

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div className="rounded-3xl bg-card border border-border/50 p-6 md:p-10 overflow-hidden">
      <div className="text-center mb-8">
        <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2">
          How It <span className="text-gradient-purple">Works</span>
        </h3>
        <p className="text-sm text-muted-foreground">From missed call to dispatched technician — fully automated</p>
      </div>

      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox="0 0 920 200"
          className="w-full min-w-[600px] h-auto"
          role="img"
          aria-label="Workflow automation diagram showing: Missed Call, Voice AI Answers, Lead Qualified, CRM Updated, Dispatch Sent"
        >
          <defs>
            <linearGradient id="pathGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(263 70% 58%)" />
              <stop offset="100%" stopColor="hsl(270 80% 68%)" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Connection paths */}
          {nodes.slice(0, -1).map((node, i) => {
            const nextNode = nodes[i + 1];
            const isActive = activePath >= i || activeNode > i;
            return (
              <line
                key={`path-${i}`}
                x1={node.x + 30}
                y1={node.y}
                x2={nextNode.x - 30}
                y2={nextNode.y}
                stroke={isActive ? "url(#pathGrad)" : "hsl(240 10% 20%)"}
                strokeWidth={isActive ? 3 : 2}
                strokeDasharray={isActive ? "none" : "8 4"}
                filter={isActive ? "url(#glow)" : "none"}
                style={{
                  transition: "stroke 0.6s ease, stroke-width 0.6s ease",
                }}
              />
            );
          })}

          {/* Nodes */}
          {nodes.map((node, i) => {
            const isActive = activeNode >= i;
            const isCurrent = activeNode === i;
            return (
              <g key={`node-${i}`}>
                {/* Outer glow ring when current */}
                {isCurrent && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="38"
                    fill="none"
                    stroke="hsl(263 70% 58%)"
                    strokeWidth="2"
                    opacity="0.4"
                    filter="url(#glow)"
                  >
                    <animate attributeName="r" values="36;42;36" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" repeatCount="indefinite" />
                  </circle>
                )}

                {/* Node circle */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="30"
                  fill={isActive ? "hsl(263 70% 58% / 0.15)" : "hsl(240 15% 10%)"}
                  stroke={isActive ? "hsl(263 70% 58%)" : "hsl(240 10% 20%)"}
                  strokeWidth={isCurrent ? 2.5 : 1.5}
                  style={{ transition: "all 0.6s ease" }}
                />

                {/* Label below */}
                <text
                  x={node.x}
                  y={node.y + 50}
                  textAnchor="middle"
                  fill={isActive ? "hsl(0 0% 95%)" : "hsl(240 5% 55%)"}
                  fontSize="11"
                  fontWeight={isCurrent ? "600" : "400"}
                  fontFamily="Inter, sans-serif"
                  style={{ transition: "fill 0.6s ease" }}
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Icon overlays positioned via CSS since SVG foreignObject can be flaky */}
        <div className="absolute inset-0 pointer-events-none min-w-[600px]" style={{ aspectRatio: "920/200" }}>
          {nodes.map((node, i) => {
            const isActive = activeNode >= i;
            const Icon = node.icon;
            // Convert SVG coords to percentages
            const leftPct = (node.x / 920) * 100;
            const topPct = (node.y / 200) * 100;
            return (
              <div
                key={`icon-${i}`}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${leftPct}%`,
                  top: `${topPct}%`,
                  transition: "all 0.6s ease",
                }}
              >
                <Icon
                  className="w-5 h-5"
                  style={{
                    color: isActive ? "hsl(270 80% 68%)" : "hsl(240 5% 55%)",
                    transition: "color 0.6s ease",
                  }}
                  aria-hidden="true"
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WorkflowDiagram;
