import React from "react";
import { Package, Trash2, CheckCircle, XCircle, AlertTriangle, Users, CalendarDays, Activity, FileText } from "lucide-react";

export default function LeaderMonthlyDashboard({
  selectedMonth,
  displayWeeksCount,
  displayWeekTitles,
  groupData,
  totalMonthlyPacked,
  totalMonthlyScrap,
  avgDefectRate,
  avgTotal,
  attSum
}) {
  const monthNum = parseInt(selectedMonth.split("-")[1], 10);

  const parseTitle = (t) => {
    const parts = t.split("<br>");
    return { name: parts[0] || "", dates: parts[1] || "" };
  };

  const renderDefectRow = (label, count, basePacked) => {
    if (count === undefined || count === null) return null;
    const rate = basePacked > 0 ? ((count / basePacked) * 100).toFixed(1) : "0.0";
    if (count === 0) {
      return (
        <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 10, color: "#cbd5e1", padding: "1px 3px" }}>
          <span>{label}</span><span>0</span>
        </div>
      );
    }
    return (
      <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 10, background: "#fff1f2", color: "#be123c", border: "1px solid #fecdd3", borderRadius: 3, padding: "2px 5px", marginBottom: 2, fontWeight: 600 }}>
        <span>{label}</span>
        <span style={{ display: "flex", gap: 3, alignItems: "center" }}>
          <span>{count}</span>
          <span style={{ fontSize: 9, opacity: 0.8 }}>({rate}%)</span>
        </span>
      </div>
    );
  };

  const getDefectBlock = (scrapObj, basePacked, itemName) => {
    const isHood = itemName && itemName.includes("Hood");
    const hasD = itemName && itemName.includes("DS CREW");
    if (isHood) {
      return (
        <div>
          {renderDefectRow("센터", scrapObj.scrapCenter, basePacked)}
          {renderDefectRow("사이드", scrapObj.scrapSide, basePacked)}
        </div>
      );
    }
    return (
      <div>
        {renderDefectRow("A", scrapObj.scrapA, basePacked)}
        {renderDefectRow("B", scrapObj.scrapB, basePacked)}
        {renderDefectRow("C", scrapObj.scrapC, basePacked)}
        {hasD && renderDefectRow("D", scrapObj.scrapD, basePacked)}
      </div>
    );
  };

  const thBase = {
    border: "1px solid #d1d5db",
    padding: "5px 6px",
    textAlign: "center",
    fontWeight: 600,
    fontSize: 11,
    background: "#f8fafc",
    color: "#374151",
    whiteSpace: "nowrap",
  };
  const tdBase = {
    border: "1px solid #d1d5db",
    padding: "3px 5px",
    verticalAlign: "middle",
    fontSize: 11,
  };

  return (
    <div style={{ width: "100%", fontFamily: "'Noto Sans KR', sans-serif", color: "#1f2937", display: "flex", flexDirection: "column", gap: 8 }}>

      {/* KPI 카드 3개 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        {[
          { label: "월간 총 포장완료", value: `${totalMonthlyPacked.toLocaleString()} EA`, icon: <Package size={16} color="#059669" />, iconBg: "#ecfdf5" },
          { label: "월간 총 폐기수량", value: `${totalMonthlyScrap.toLocaleString()} EA`, badge: `${avgDefectRate}%`, icon: <Trash2 size={16} color="#dc2626" />, iconBg: "#fff1f2" },
          { label: "근태 평균 총원", value: `${avgTotal} 명`, icon: <Users size={16} color="#2563eb" />, iconBg: "#eff6ff" },
        ].map((card, i) => (
          <div key={i} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "9px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <div>
              <div style={{ fontSize: 10, color: "#6b7280", marginBottom: 2 }}>{card.label}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: "#111827" }}>{card.value}</span>
                {card.badge && <span style={{ fontSize: 10, fontWeight: 700, background: "#fee2e2", color: "#b91c1c", borderRadius: 99, padding: "1px 6px" }}>{card.badge}</span>}
              </div>
            </div>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: card.iconBg, display: "flex", alignItems: "center", justifyContent: "center" }}>{card.icon}</div>
          </div>
        ))}
      </div>

      {/* 1. 생산 및 불량 테이블 */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", overflow: "hidden" }}>
        <div style={{ padding: "6px 12px", borderBottom: "1px solid #e5e7eb", background: "#f9fafb", display: "flex", alignItems: "center", gap: 5 }}>
          <Activity size={13} color="#4f46e5" />
          <span style={{ fontSize: 12, fontWeight: 700, color: "#1f2937" }}>1. {monthNum}월 공정별 생산 및 불량 실적</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", minWidth: 960 }}>
            <colgroup>
              <col style={{ width: 36 }} />
              <col style={{ width: 80 }} />
              <col style={{ width: 46 }} />
              <col style={{ width: 70 }} />
              {Array.from({ length: displayWeeksCount }).map((_, i) => (
                <col key={i} style={{ width: `${Math.floor((100 - 8) / displayWeeksCount)}%` }} />
              ))}
              <col style={{ width: 120 }} />
            </colgroup>
            <thead>
              <tr>
                <th rowSpan={2} style={thBase}>순번</th>
                <th rowSpan={2} style={thBase}>아이템</th>
                <th rowSpan={2} style={thBase}>구분</th>
                <th rowSpan={2} style={{ ...thBase, color: "#065f46" }}>포장완료</th>
                <th colSpan={displayWeeksCount} style={{ ...thBase, borderBottom: "1px solid #d1d5db" }}>주차별 폐기불량 현황</th>
                <th rowSpan={2} style={{ ...thBase, color: "#991b1b", background: "#fff7f7" }}>{monthNum}월 누적 불량</th>
              </tr>
              <tr>
                {displayWeekTitles.map((t, idx) => {
                  const pt = parseTitle(t);
                  return (
                    <th key={idx} style={{ ...thBase, fontWeight: 500 }}>
                      <div style={{ fontWeight: 700, color: "#1f2937", fontSize: 11 }}>{pt.name}</div>
                      <div style={{ fontSize: 9, color: "#9ca3af" }}>{pt.dates}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {groupData.map((g) => (
                <React.Fragment key={g.id}>
                  {g.variants.map((vData, vIdx) => {
                    const isFirst = vIdx === 0;
                    const itemName = g.name === "KM/KX Hood" ? g.name : `${g.name} ${vData.variant}`;

                    const groupWeeklyScraps = isFirst ? g.variants[0].weeklyScraps.map((_, wIdx) =>
                      g.variants.reduce((acc, v) => {
                        const ws = v.weeklyScraps[wIdx];
                        return {
                          wPacked: acc.wPacked + ws.wPacked,
                          scrapA: acc.scrapA + ws.scrapA,
                          scrapB: acc.scrapB + ws.scrapB,
                          scrapC: acc.scrapC + ws.scrapC,
                          scrapD: acc.scrapD + ws.scrapD,
                          scrapCenter: acc.scrapCenter + ws.scrapCenter,
                          scrapSide: acc.scrapSide + ws.scrapSide,
                        };
                      }, { wPacked: 0, scrapA: 0, scrapB: 0, scrapC: 0, scrapD: 0, scrapCenter: 0, scrapSide: 0 })
                    ) : [];

                    const groupTotalScrap = isFirst ? g.variants.reduce((acc, v) => {
                      const ts = v.totalScrap;
                      return {
                        scrapA: acc.scrapA + ts.scrapA,
                        scrapB: acc.scrapB + ts.scrapB,
                        scrapC: acc.scrapC + ts.scrapC,
                        scrapD: acc.scrapD + ts.scrapD,
                        scrapCenter: acc.scrapCenter + ts.scrapCenter,
                        scrapSide: acc.scrapSide + ts.scrapSide,
                      };
                    }, { scrapA: 0, scrapB: 0, scrapC: 0, scrapD: 0, scrapCenter: 0, scrapSide: 0 }) : null;

                    const groupMonthPacked = isFirst ? g.variants.reduce((acc, v) => acc + v.monthPacked, 0) : 0;

                    return (
                      <tr key={`${g.id}-${vIdx}`} style={{ background: vIdx % 2 === 0 ? "#fff" : "#f9fafb" }}>
                        {isFirst && (
                          <td rowSpan={g.variants.length} style={{ ...tdBase, textAlign: "center", color: "#6b7280", fontWeight: 600 }}>{g.id}</td>
                        )}
                        {isFirst && (
                          <td rowSpan={g.variants.length} style={{ ...tdBase, textAlign: "center", fontWeight: 700, color: "#111827", fontSize: 11 }}>{g.name}</td>
                        )}
                        <td style={{ ...tdBase, textAlign: "center" }}>
                          {vData.variant !== "-" ? (
                            <span style={{ display: "inline-block", background: "#f1f5f9", color: "#374151", borderRadius: 99, padding: "1px 7px", fontSize: 10, fontWeight: 600 }}>{vData.variant}</span>
                          ) : (
                            <span style={{ color: "#9ca3af", fontSize: 10 }}>전체</span>
                          )}
                        </td>
                        <td style={{ ...tdBase, textAlign: "center", fontWeight: 800, color: "#059669", fontSize: 12 }}>
                          {vData.monthPacked.toLocaleString()}
                        </td>

                        {isFirst && groupWeeklyScraps.slice(0, displayWeeksCount).map((ws, wIdx) => {
                          const totalS = ws.scrapA + ws.scrapB + ws.scrapC + ws.scrapD + ws.scrapCenter + ws.scrapSide;
                          return (
                            <td key={wIdx} rowSpan={g.variants.length} style={{ ...tdBase, verticalAlign: "top", padding: "3px 4px" }}>
                              {totalS === 0 ? (
                                <div style={{ textAlign: "center", color: "#d1d5db", fontSize: 10, fontStyle: "italic" }}>0</div>
                              ) : (
                                getDefectBlock(ws, ws.wPacked, itemName)
                              )}
                            </td>
                          );
                        })}

                        {isFirst && (() => {
                          const totalS = groupTotalScrap.scrapA + groupTotalScrap.scrapB + groupTotalScrap.scrapC + groupTotalScrap.scrapD + groupTotalScrap.scrapCenter + groupTotalScrap.scrapSide;
                          return (
                            <td rowSpan={g.variants.length} style={{ ...tdBase, verticalAlign: "top", background: "#fff7f7", padding: "3px 5px" }}>
                              {totalS === 0 ? (
                                <div style={{ textAlign: "center", color: "#d1d5db", fontSize: 10, fontStyle: "italic" }}>0</div>
                              ) : (
                                <div>
                                  <div style={{ textAlign: "center", fontWeight: 800, color: "#be123c", fontSize: 11, marginBottom: 2 }}>총 {totalS} EA</div>
                                  {getDefectBlock(groupTotalScrap, groupMonthPacked, itemName)}
                                </div>
                              )}
                            </td>
                          );
                        })()}
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. 근태현황 */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", overflow: "hidden" }}>
        <div style={{ padding: "6px 12px", borderBottom: "1px solid #e5e7eb", background: "#f9fafb", display: "flex", alignItems: "center", gap: 5 }}>
          <CalendarDays size={13} color="#2563eb" />
          <span style={{ fontSize: 12, fontWeight: 700, color: "#1f2937" }}>2. {monthNum}월 근태현황 누적 합산 (인일 기준)</span>
        </div>
        <div style={{ padding: "8px 12px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 7 }}>
            {[
              { label: "출근", value: attSum.present, icon: <CheckCircle size={12} color="#059669" />, bg: "#ecfdf5", border: "#a7f3d0", text: "#065f46" },
              { label: "결근", value: attSum.absent, icon: <XCircle size={12} color="#dc2626" />, bg: "#fff1f2", border: "#fecdd3", text: "#9f1239" },
              { label: "연차", value: attSum.annualLeave, icon: <FileText size={12} color="#2563eb" />, bg: "#eff6ff", border: "#bfdbfe", text: "#1e3a8a" },
              { label: "병가", value: attSum.sickLeave, icon: <AlertTriangle size={12} color="#d97706" />, bg: "#fffbeb", border: "#fde68a", text: "#78350f" },
              { label: "반차", value: attSum.halfLeave, icon: <Activity size={12} color="#7c3aed" />, bg: "#f5f3ff", border: "#ddd6fe", text: "#4c1d95" },
            ].map((item, i) => (
              <div key={i} style={{ background: item.bg, border: `1px solid ${item.border}`, borderRadius: 7, padding: "7px 10px" }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: item.text, display: "flex", alignItems: "center", gap: 3, marginBottom: 2 }}>{item.icon}{item.label}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: item.text }}>{item.value} <span style={{ fontSize: 10, fontWeight: 400 }}>인일</span></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}