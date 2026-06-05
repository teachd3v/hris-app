"use client";

import { useState } from "react";

interface AssessmentChartsProps {
  assessments: any[];
  isPrintMode?: boolean;
}

export default function AssessmentCharts({ assessments, isPrintMode = false }: AssessmentChartsProps) {
  const [hoveredDim, setHoveredDim] = useState<number | null>(null);
  const completed = assessments.filter(a => a.status === 'Selesai' && a.answers);
  
  if (completed.length === 0) {
    return (
      <div className="p-10 text-center flex flex-col items-center gap-4">
        <span className="text-4xl">📈</span>
        <div className="text-ink-3 font-medium text-sm">Belum ada data jawaban yang bisa dianalisis.</div>
      </div>
    );
  }

  const getAvg = (answersList: any[], keys: string[]) => {
    let total = 0;
    let count = 0;
    answersList.forEach(ans => {
      keys.forEach(k => {
        if (ans[k]) {
          total += Number(ans[k]);
          count++;
        }
      });
    });
    return count > 0 ? (total / count) : 0;
  };

  const sdtDimensions = [
    { name: 'Intrinsik', keys: ['b5', 'b9', 'b16', 'b20'], desc: 'Kesenangan & kepuasan murni' },
    { name: 'Terintegrasi', keys: ['b6', 'b11', 'b19', 'b21'], desc: 'Sesuai dengan nilai hidup' },
    { name: 'Teridentifikasi', keys: ['b2', 'b8', 'b15', 'b22'], desc: 'Mencapai tujuan pribadi' },
    { name: 'Introjeksi', keys: ['b7', 'b12', 'b14', 'b23'], desc: 'Rasa bersalah/tanggung jawab' },
    { name: 'Eksternal', keys: ['b3', 'b10', 'b17', 'b24'], desc: 'Gaji & fasilitas' },
    { name: 'Amotivasi', keys: ['b4', 'b13', 'b18', 'b25'], desc: 'Hilang minat/putus asa' },
  ];

  const sdtResults = sdtDimensions.map(dim => ({
    ...dim,
    score: getAvg(completed.map(a => a.answers), dim.keys)
  }));

  const size = 450;
  const center = size / 2;
  const radius = (size / 2) - 80;
  const totalAxes = sdtResults.length;
  const angleStep = (Math.PI * 2) / totalAxes;

  const getCoordinates = (index: number, value: number, customRadius = radius) => {
    const angle = index * angleStep - Math.PI / 2;
    const x = center + (value / 7) * customRadius * Math.cos(angle);
    const y = center + (value / 7) * customRadius * Math.sin(angle);
    return { x, y };
  };

  const points = sdtResults.map((dim, i) => {
    const { x, y } = getCoordinates(i, dim.score);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className={`${isPrintMode ? '' : 'glass'} p-8 flex flex-col items-center gap-8 relative overflow-hidden`} style={isPrintMode ? { backgroundColor: '#F8FAFB' } : {}}>
      {/* Dynamic Header */}
      {!isPrintMode && (
        <div className="flex flex-col items-center text-center gap-2 z-10">
          <div className="px-3 py-1 rounded-full bg-hris-red/10 text-[10px] font-black text-hris-red uppercase tracking-widest border border-hris-red/10">
            SDT Analysis Profile
          </div>
          <h2 className="text-2xl font-black text-ink uppercase tracking-wider">Peta Spektrum Motivasi</h2>
          <p className="text-xs text-ink-3 max-w-lg leading-relaxed font-medium">
            Grafik di bawah menggambarkan sebaran rata-rata dorongan psikologis karyawan dalam bekerja. Tim yang sehat cenderung menonjol di sisi atas (Intrinsik).
          </p>
        </div>
      )}

      <div className="relative flex justify-center items-center w-full max-w-[600px] min-h-[450px]">
        {/* Radar SVG */}
        <svg width={size} height={size} className={`${isPrintMode ? '' : 'drop-shadow-2xl'} overflow-visible`}>
          <defs>
            <radialGradient id="radarGradient">
              <stop offset="0%" stopColor={isPrintMode ? "#EF4444" : "rgba(220, 38, 38, 0.4)"} stopOpacity={isPrintMode ? 0.3 : 0.4} />
              <stop offset="100%" stopColor={isPrintMode ? "#EF4444" : "rgba(220, 38, 38, 0.1)"} stopOpacity={isPrintMode ? 0.1 : 0.1} />
            </radialGradient>
            {!isPrintMode && (
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            )}
          </defs>

          {/* Grid Background */}
          {[1, 2, 3, 4, 5, 6, 7].map(level => (
            <polygon 
              key={level} 
              points={sdtResults.map((_, i) => {
                const { x, y } = getCoordinates(i, level);
                return `${x},${y}`;
              }).join(' ')}
              fill="none" 
              stroke={isPrintMode ? "#E2E8F0" : "rgba(0,0,0,0.04)"}
              strokeWidth="1.5"
            />
          ))}

          {/* Axis Lines */}
          {sdtResults.map((_, i) => {
            const { x, y } = getCoordinates(i, 7);
            return (
              <line 
                key={i} 
                x1={center} y1={center} x2={x} y2={y} 
                stroke={isPrintMode ? "#CBD5E1" : "rgba(0,0,0,0.06)"}
                strokeWidth="1.5" 
                strokeDasharray="4 4"
              />
            );
          })}

          {/* Main Area Polygon */}
          <polygon 
            points={points} 
            fill="url(#radarGradient)" 
            stroke="#DC2626" 
            strokeWidth="4"
            strokeLinejoin="round"
            className={isPrintMode ? "" : "transition-all duration-1000 ease-out pointer-events-none"}
            style={isPrintMode ? {} : { filter: 'url(#glow)' }}
          />

          {/* Points and Labels */}
          {sdtResults.map((dim, i) => {
            const { x, y } = getCoordinates(i, dim.score);
            const labelPos = getCoordinates(i, 7, radius + 45);
            const isActive = hoveredDim === i;
            
            return (
              <g key={i} onMouseEnter={() => setHoveredDim(i)} onMouseLeave={() => setHoveredDim(null)} className={isPrintMode ? "" : "cursor-pointer group"}>
                {/* Data Point */}
                <circle 
                  cx={x} cy={y} r={isPrintMode ? 4 : (isActive ? 8 : 5)} 
                  fill="#DC2626"
                  className={isPrintMode ? "" : `transition-all duration-300 ${isActive ? 'stroke-white stroke-4' : 'stroke-transparent'}`}
                />
                
                {/* Label Text */}
                <text 
                  x={labelPos.x} y={labelPos.y} 
                  textAnchor="middle" 
                  fill={isPrintMode ? "#15141A" : (isActive ? "#DC2626" : "#3C3A46")}
                  style={{ 
                    fontSize: '11px', 
                    fontWeight: '900', 
                    textTransform: 'uppercase',
                    opacity: isPrintMode ? 1 : (isActive ? 1 : 0.6)
                  }}
                >
                  {dim.name}
                </text>

                {/* Score Hint (Always visible in print) */}
                {(isPrintMode || isActive) && (
                  <text 
                    x={labelPos.x} y={labelPos.y + 14} 
                    textAnchor="middle" 
                    fill="#6B6878"
                    style={{ fontSize: '10px', fontWeight: 'bold' }}
                  >
                    {dim.score.toFixed(1)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip/Legend Info - DISABLED IN PRINT */}
        {!isPrintMode && hoveredDim !== null && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 flex flex-col items-center justify-center pointer-events-none text-center animate-in fade-in zoom-in duration-300">
            <div className="text-[10px] font-black text-hris-red uppercase tracking-widest mb-1">{sdtResults[hoveredDim].name}</div>
            <div className="text-3xl font-black text-ink">{sdtResults[hoveredDim].score.toFixed(1)}</div>
            <p className="text-[9px] text-ink-3 font-bold mt-1 px-2 leading-tight uppercase">{sdtResults[hoveredDim].desc}</p>
          </div>
        )}
      </div>

      {/* Footer Legend */}
      <div className={`grid grid-cols-3 ${isPrintMode ? 'lg:grid-cols-6' : 'lg:grid-cols-6'} gap-6 w-full pt-8 border-t z-10`} style={{ borderTopColor: isPrintMode ? '#E2E8F0' : 'rgba(0,0,0,0.05)' }}>
        {sdtResults.map((dim, idx) => (
          <div key={idx} className="flex flex-col items-center gap-1 text-center group">
            <div className={`w-8 h-1 rounded-full mb-1 ${isPrintMode ? 'bg-[#DC2626]' : (hoveredDim === idx ? 'bg-hris-red scale-x-125' : 'bg-black/10')}`}></div>
            <span className="text-[10px] font-black uppercase tracking-tighter" style={{ color: '#15141A' }}>{dim.name}</span>
            <span className="text-sm font-black" style={{ color: '#DC2626' }}>{dim.score.toFixed(1)}</span>
          </div>
        ))}
      </div>

      {/* Aesthetic Background Accents - HIDDEN IN PRINT */}
      {!isPrintMode && (
        <>
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-hris-yellow/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-hris-red/5 rounded-full blur-3xl pointer-events-none"></div>
        </>
      )}
    </div>
  );
}
