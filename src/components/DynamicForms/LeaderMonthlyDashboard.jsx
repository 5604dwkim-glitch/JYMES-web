
import React from 'react';
import { Package, Trash2, FileText, CheckCircle, XCircle, AlertTriangle, Users, CalendarDays, Activity } from 'lucide-react';

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
  const monthNum = parseInt(selectedMonth.split('-')[1], 10);

  // Parse titles
  const parseTitle = (t) => {
    const parts = t.split('<br>');
    return { name: parts[0] || '', dates: parts[1] || '' };
  };

  const getDefectChips = (scrapObj, basePacked, itemName) => {
    const isHood = itemName && itemName.includes('Hood');
    const hasD = itemName && itemName.includes('DS CREW');

    const renderChip = (label, count) => {
      if (!count || count === 0) return null;
      const rate = basePacked > 0 ? ((count / basePacked) * 100).toFixed(1) : '0.0';
      return (
        <div key={label} className="flex items-center justify-between text-xs bg-red-50 text-red-700 px-2 py-1 rounded border border-red-100 mb-1">
          <span className="font-semibold">{label}</span>
          <span className="flex items-center gap-1">
            <span>{count}</span>
            <span className="opacity-75 text-[10px]">({rate}%)</span>
          </span>
        </div>
      );
    };

    if (isHood) {
      return (
        <div className="flex flex-col gap-1 w-full">
          {renderChip('센터', scrapObj.scrapCenter)}
          {renderChip('사이드', scrapObj.scrapSide)}
        </div>
      );
    } else {
      return (
        <div className="flex flex-col gap-1 w-full">
          {renderChip('A', scrapObj.scrapA)}
          {renderChip('B', scrapObj.scrapB)}
          {renderChip('C', scrapObj.scrapC)}
          {hasD && renderChip('D', scrapObj.scrapD)}
        </div>
      );
    }
  };

  return (
    <div className="w-full font-sans text-gray-800 space-y-6 max-w-screen-2xl mx-auto pb-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">월간 총 포장완료</p>
            <h3 className="text-3xl font-bold text-gray-900">{totalMonthlyPacked.toLocaleString()} <span className="text-base font-normal text-gray-500">EA</span></h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
            <Package className="w-6 h-6 text-emerald-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">월간 총 폐기수량 (불량률)</p>
            <div className="flex items-end gap-3">
              <h3 className="text-3xl font-bold text-gray-900">{totalMonthlyScrap.toLocaleString()} <span className="text-base font-normal text-gray-500">EA</span></h3>
              <span className="text-sm font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full mb-1">{avgDefectRate}%</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
            <Trash2 className="w-6 h-6 text-red-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">근태 평균 총원</p>
            <h3 className="text-3xl font-bold text-gray-900">{avgTotal} <span className="text-base font-normal text-gray-500">명</span></h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>

      {/* 1. Production & Defect Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h4 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600" />
            1. {monthNum}월 공정별 생산 및 불량 실적
          </h4>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap min-w-[1200px]">
            <thead>
              <tr className="bg-gray-50 text-gray-600 border-b border-gray-200 text-center">
                <th rowSpan="2" className="py-3 px-4 font-semibold border-r border-gray-200 w-16">순번</th>
                <th rowSpan="2" className="py-3 px-4 font-semibold border-r border-gray-200 w-32">아이템</th>
                <th rowSpan="2" className="py-3 px-4 font-semibold border-r border-gray-200 w-24">구분</th>
                <th rowSpan="2" className="py-3 px-4 font-semibold border-r border-gray-200 w-32 text-emerald-700">포장완료</th>
                <th colSpan={displayWeeksCount} className="py-2 px-4 font-semibold border-r border-gray-200 border-b">주차별 폐기불량 현황</th>
                <th rowSpan="2" className="py-3 px-4 font-bold text-red-700 bg-red-50/50 w-40">{monthNum}월 누적 불량</th>
              </tr>
              <tr className="bg-gray-50 text-gray-600 border-b border-gray-200 text-center">
                {displayWeekTitles.map((t, idx) => {
                  const pt = parseTitle(t);
                  return (
                    <th key={idx} className="py-2 px-2 font-medium border-r border-gray-200 w-32">
                      <div className="flex flex-col items-center">
                        <span className="text-gray-800 font-semibold">{pt.name}</span>
                        <span className="text-[10px] text-gray-500 font-normal">{pt.dates}</span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {groupData.map((g, gIdx) => (
                <React.Fragment key={g.id}>
                  {g.variants.map((vData, vIdx) => {
                    const isFirst = vIdx === 0;
                    const isLast = vIdx === g.variants.length - 1;
                    const itemName = g.name === 'KM/KX Hood' ? g.name : `${g.name} ${vData.variant}`;
                    
                    const groupWeeklyScraps = isFirst ? g.variants[0].weeklyScraps.map((_, wIdx) => {
                       return g.variants.reduce((acc, v) => {
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
                       }, { wPacked: 0, scrapA: 0, scrapB: 0, scrapC: 0, scrapD: 0, scrapCenter: 0, scrapSide: 0 });
                    }) : [];

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
                      <tr key={`${g.id}-${vIdx}`} className="hover:bg-gray-50/50 transition-colors">
                        {isFirst && (
                          <td rowSpan={g.variants.length} className="py-3 px-4 border-r border-gray-200 text-center text-gray-500 font-medium">
                            {g.id}
                          </td>
                        )}
                        {isFirst && (
                          <td rowSpan={g.variants.length} className="py-3 px-4 border-r border-gray-200 text-center font-bold text-gray-800">
                            {g.name}
                          </td>
                        )}
                        
                        <td className="py-3 px-4 border-r border-gray-200 text-center">
                          {vData.variant !== '-' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                              {vData.variant}
                            </span>
                          ) : (
                            <span className="text-gray-500 text-xs font-medium">전체</span>
                          )}
                        </td>
                        
                        <td className="py-3 px-4 border-r border-gray-200 text-center font-bold text-emerald-600">
                          {vData.monthPacked.toLocaleString()}
                        </td>

                        {isFirst && groupWeeklyScraps.slice(0, displayWeeksCount).map((ws, wIdx) => {
                          const totalS = ws.scrapA + ws.scrapB + ws.scrapC + ws.scrapD + ws.scrapCenter + ws.scrapSide;
                          const chips = getDefectChips(ws, ws.wPacked, itemName);
                          return (
                            <td key={wIdx} rowSpan={g.variants.length} className="py-2 px-3 border-r border-gray-200 align-top">
                              {totalS === 0 ? (
                                <div className="h-full w-full flex items-center justify-center text-gray-300 text-xs italic">0</div>
                              ) : (
                                <div className="flex flex-col gap-1 w-full max-w-[110px] mx-auto">
                                  {chips}
                                </div>
                              )}
                            </td>
                          );
                        })}

                        {isFirst && (
                          <td rowSpan={g.variants.length} className="py-2 px-3 border-r border-gray-200 bg-red-50/30 align-top">
                            {(() => {
                              const totalS = groupTotalScrap.scrapA + groupTotalScrap.scrapB + groupTotalScrap.scrapC + groupTotalScrap.scrapD + groupTotalScrap.scrapCenter + groupTotalScrap.scrapSide;
                              if (totalS === 0) return <div className="h-full flex items-center justify-center text-gray-300 text-xs italic">0</div>;
                              return (
                                <div className="flex flex-col gap-1 w-full max-w-[130px] mx-auto">
                                  <div className="text-center font-bold text-red-700 mb-1">
                                    총 {totalS} EA
                                  </div>
                                  {getDefectChips(groupTotalScrap, groupMonthPacked, itemName)}
                                </div>
                              );
                            })()}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Attendance Status */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h4 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-blue-600" />
            2. {monthNum}월 근태현황 누적 합산 (인일 기준)
          </h4>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="flex flex-col bg-emerald-50 rounded-lg p-4 border border-emerald-100">
              <span className="text-sm font-semibold text-emerald-700 mb-1 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> 출근</span>
              <span className="text-2xl font-bold text-emerald-900">{attSum.present} <span className="text-sm font-normal text-emerald-700">인일</span></span>
            </div>
            
            <div className="flex flex-col bg-red-50 rounded-lg p-4 border border-red-100">
              <span className="text-sm font-semibold text-red-700 mb-1 flex items-center gap-1"><XCircle className="w-4 h-4" /> 결근</span>
              <span className="text-2xl font-bold text-red-900">{attSum.absent} <span className="text-sm font-normal text-red-700">인일</span></span>
            </div>

            <div className="flex flex-col bg-blue-50 rounded-lg p-4 border border-blue-100">
              <span className="text-sm font-semibold text-blue-700 mb-1 flex items-center gap-1"><FileText className="w-4 h-4" /> 연차</span>
              <span className="text-2xl font-bold text-blue-900">{attSum.annualLeave} <span className="text-sm font-normal text-blue-700">인일</span></span>
            </div>

            <div className="flex flex-col bg-amber-50 rounded-lg p-4 border border-amber-100">
              <span className="text-sm font-semibold text-amber-700 mb-1 flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> 병가</span>
              <span className="text-2xl font-bold text-amber-900">{attSum.sickLeave} <span className="text-sm font-normal text-amber-700">인일</span></span>
            </div>

            <div className="flex flex-col bg-purple-50 rounded-lg p-4 border border-purple-100">
              <span className="text-sm font-semibold text-purple-700 mb-1 flex items-center gap-1"><Activity className="w-4 h-4" /> 반차</span>
              <span className="text-2xl font-bold text-purple-900">{attSum.halfLeave} <span className="text-sm font-normal text-purple-700">인일</span></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
