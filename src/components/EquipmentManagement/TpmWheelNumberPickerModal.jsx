import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '../../contexts/I18nContext';

const ITEM_HEIGHT = 40;

export default function TpmWheelNumberPickerModal({
  isOpen,
  title = '수치 선택',
  initialValue = '',
  defaultCenter = 60,
  tolerance = 10,
  minSpec,
  maxSpec,
  range = 30,
  unit = '℃',
  centerLabel = '기준',
  allowX = false,
  onConfirm,
  onClose
}) {
  const { lang, td } = useI18n();
  const wheelRef = useRef(null);
  const dragStateRef = useRef({ isDragging: false, startY: 0, startScrollTop: 0 });

  const minVal = Math.round(defaultCenter - range);
  const maxVal = Math.round(defaultCenter + range);
  const effMinSpec = Number.isFinite(minSpec)
    ? minSpec
    : (tolerance !== null && tolerance !== undefined ? defaultCenter - tolerance : null);
  const effMaxSpec = Number.isFinite(maxSpec)
    ? maxSpec
    : (tolerance !== null && tolerance !== undefined ? defaultCenter + tolerance : null);

  const numbersList = useMemo(() => {
    const arr = [];
    for (let v = minVal; v <= maxVal; v++) {
      arr.push(v);
    }
    return arr;
  }, [minVal, maxVal]);

  const computeInitialNumber = () => {
    const trimmed = initialValue !== undefined && initialValue !== null ? String(initialValue).trim() : '';
    const parsed = trimmed !== '' ? Number(trimmed) : NaN;
    const base = Number.isFinite(parsed) ? Math.round(parsed) : Math.round(defaultCenter);
    return Math.max(minVal, Math.min(maxVal, base));
  };

  const [selectedNumber, setSelectedNumber] = useState(computeInitialNumber);

  // 모달이 열릴 때 기준값(또는 기존 선택 수치) 위치로 즉시 셋팅
  useLayoutEffect(() => {
    if (!isOpen) return;
    const startNum = computeInitialNumber();
    setSelectedNumber(startNum);
    const idx = numbersList.indexOf(startNum);
    if (wheelRef.current && idx !== -1) {
      wheelRef.current.scrollTop = idx * ITEM_HEIGHT;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialValue, defaultCenter, minVal, maxVal]);

  const scrollToValue = (val, smooth = true) => {
    const idx = numbersList.indexOf(val);
    if (idx !== -1 && wheelRef.current) {
      wheelRef.current.scrollTo({
        top: idx * ITEM_HEIGHT,
        behavior: smooth ? 'smooth' : 'auto'
      });
      setSelectedNumber(val);
    }
  };

  const handleWheelScroll = () => {
    const el = wheelRef.current;
    if (!el) return;
    const rawIdx = Math.round(el.scrollTop / ITEM_HEIGHT);
    const clampedIdx = Math.max(0, Math.min(numbersList.length - 1, rawIdx));
    const nextVal = numbersList[clampedIdx];
    setSelectedNumber(nextVal);
  };

  const handleConfirm = () => {
    if (
      effMinSpec !== null &&
      effMaxSpec !== null &&
      (selectedNumber < effMinSpec || selectedNumber > effMaxSpec)
    ) {
      const outMsg = lang === 'en'
        ? `Value is outside the spec (${effMinSpec}~${effMaxSpec}${unit}). Enter anyway?`
        : lang === 'th'
          ? `ค่าอยู่นอกเกณฑ์ (${effMinSpec}~${effMaxSpec}${unit}) ต้องการบันทึกหรือไม่?`
          : lang === 'vi'
            ? `Giá trị nằm ngoài tiêu chuẩn (${effMinSpec}~${effMaxSpec}${unit}). Vẫn nhập?`
            : `점검기준(${effMinSpec}~${effMaxSpec}${unit}) 범위를 벗어납니다. 그래도 입력하시겠습니까?`;
      if (!window.confirm(outMsg)) {
        return;
      }
    }
    if (onConfirm) onConfirm(String(selectedNumber));
  };

  // PC 마우스 드래그 스크롤 및 키보드(Enter/Escape) 지원 (Rule 13: cleanup 철저)
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleMouseMove = (e) => {
      if (!dragStateRef.current.isDragging || !wheelRef.current) return;
      const walk = (e.pageY - dragStateRef.current.startY) * 1.4;
      wheelRef.current.scrollTop = dragStateRef.current.startScrollTop - walk;
    };

    const handleMouseUp = () => {
      if (!dragStateRef.current.isDragging || !wheelRef.current) return;
      dragStateRef.current.isDragging = false;
      wheelRef.current.style.scrollSnapType = 'y mandatory';
      const nearest = Math.round(wheelRef.current.scrollTop / ITEM_HEIGHT) * ITEM_HEIGHT;
      wheelRef.current.scrollTo({ top: nearest, behavior: 'smooth' });
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        if (onClose) onClose();
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const rawPresets = effMinSpec !== null && effMaxSpec !== null
    ? (() => {
        const quarter = Math.max(5, Math.round(((effMaxSpec - effMinSpec) / 4) / 5) * 5);
        return [
          effMinSpec,
          defaultCenter - quarter,
          defaultCenter,
          defaultCenter + quarter,
          effMaxSpec
        ];
      })()
    : [
        defaultCenter - 10,
        defaultCenter - 5,
        defaultCenter,
        defaultCenter + 5,
        defaultCenter + 10
      ];
  const presets = Array.from(new Set(rawPresets)).filter((p) => p >= minVal && p <= maxVal);
  const compactPresetUnit = unit.length > 2 ? '' : unit;
  const headerIcon = unit === 'kg/cm²' ? '⏲️' : '🌡️';

  const modalContent = (
    <div
      data-tpm-wheel-modal="1"
      onClick={(e) => {
        e.stopPropagation();
        if (e.target === e.currentTarget && onClose) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10200,
        background: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff',
          width: '100%',
          maxWidth: '370px',
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.28)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '15px 18px',
            background: 'linear-gradient(135deg, #0284c7, #0369a1)',
            color: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ fontSize: '15px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{headerIcon}</span>
            <span>{td(title)}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#ffffff', fontSize: '24px', cursor: 'pointer', lineHeight: 1 }}
          >
            &times;
          </button>
        </div>

        {/* 기준값 프리셋 버튼 바 */}
        <div
          style={{
            padding: '10px 12px',
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            justifyContent: 'center'
          }}
        >
          {presets.map((p) => {
            const isCenter = p === defaultCenter;
            const isCur = p === selectedNumber;
            return (
              <button
                key={p}
                type="button"
                onClick={() => scrollToValue(p, true)}
                style={{
                  padding: '5px 11px',
                  fontSize: '12px',
                  fontWeight: 700,
                  border: `1px solid ${isCenter || isCur ? '#0284c7' : '#cbd5e1'}`,
                  background: isCenter ? '#e0f2fe' : '#ffffff',
                  borderRadius: '999px',
                  color: isCenter ? '#0369a1' : '#334155',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {isCenter ? `${td(centerLabel)} (${p}${compactPresetUnit})` : `${p}${compactPresetUnit}`}
              </button>
            );
          })}
        </div>

        {/* 스크롤 휠 영역 */}
        <div
          style={{
            position: 'relative',
            height: '200px',
            background: '#ffffff',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
            userSelect: 'none'
          }}
        >
          {/* 중앙 선택 하이라이트 밴드 */}
          <div
            style={{
              position: 'absolute',
              top: '80px',
              left: '16px',
              right: '16px',
              height: '40px',
              background: 'rgba(2, 132, 199, 0.1)',
              borderTop: '2px solid #0284c7',
              borderBottom: '2px solid #0284c7',
              borderRadius: '8px',
              pointerEvents: 'none',
              zIndex: 1
            }}
          />
          {unit && (
            <div
              style={{
                position: 'absolute',
                left: 'calc(50% + 36px)',
                fontSize: unit.length > 2 ? '15px' : '18px',
                fontWeight: 800,
                color: '#0284c7',
                zIndex: 2,
                pointerEvents: 'none',
                whiteSpace: 'nowrap'
              }}
            >
              {unit}
            </div>
          )}

          <div
            ref={wheelRef}
            data-tpm-wheel-list="1"
            onScroll={handleWheelScroll}
            onMouseDown={(e) => {
              if (!wheelRef.current) return;
              dragStateRef.current = {
                isDragging: true,
                startY: e.pageY,
                startScrollTop: wheelRef.current.scrollTop
              };
              wheelRef.current.style.scrollSnapType = 'none';
            }}
            style={{
              width: '100%',
              height: '200px',
              overflowY: 'scroll',
              scrollSnapType: 'y mandatory',
              textAlign: 'center',
              scrollbarWidth: 'thin'
            }}
          >
            <div style={{ height: '80px' }} />
            {numbersList.map((n) => {
              const isSelected = n === selectedNumber;
              const isOutOfSpec =
                effMinSpec !== null &&
                effMaxSpec !== null &&
                (n < effMinSpec || n > effMaxSpec);
              return (
                <div
                  key={n}
                  onClick={() => scrollToValue(n, true)}
                  style={{
                    height: `${ITEM_HEIGHT}px`,
                    lineHeight: `${ITEM_HEIGHT}px`,
                    fontSize: isSelected ? '24px' : '18px',
                    fontWeight: isSelected ? 800 : 600,
                    color: isSelected ? (isOutOfSpec ? '#dc2626' : '#0284c7') : '#94a3b8',
                    scrollSnapAlign: 'center',
                    cursor: 'pointer',
                    transition: 'font-size 0.1s ease, color 0.1s ease'
                  }}
                >
                  {n}
                </div>
              );
            })}
            <div style={{ height: '80px' }} />
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '13px 16px',
            background: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              onClick={() => {
                if (onConfirm) onConfirm('');
              }}
              style={{
                padding: '9px 14px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#64748b',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              {td('삭제')}
            </button>
            {allowX && (
              <button
                type="button"
                onClick={() => {
                  if (onConfirm) onConfirm('X');
                }}
                style={{
                  padding: '9px 14px',
                  border: '1px solid #fca5a5',
                  background: '#fef2f2',
                  color: '#dc2626',
                  borderRadius: '8px',
                  fontWeight: 800,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                {td('X 이상')}
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 16px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#475569',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              {td('취소')}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              style={{
                padding: '9px 22px',
                border: 'none',
                background: '#0284c7',
                color: '#ffffff',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
              }}
            >
              {td('확인')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}
