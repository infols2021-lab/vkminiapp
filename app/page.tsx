'use client';

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import bridge from '@vkontakte/vk-bridge';
import { X, MessageCircle, Phone, FileText, Copy, Check } from 'lucide-react';
import {
  CLUSTERS,
  REGIONS_DATA,
  ClusterId,
  ClusterMeta,
  RegionItem,
} from './regionsData';

// Регионы, у контуров которых в исходных SVG стоит fill-rule="evenodd"
// (есть внутренние «дыры» — например, анклав Адыгеи внутри Краснодарского края).
const EVENODD_REGION_IDS = new Set(['bryansk', 'krasnodar', 'astrakhan', 'dnr', 'lnr']);

// Активная (наведённая/выбранная) подпись рисуется поверх карты
// с контрастной белой плашкой, чтобы не теряться в плотной застройке.
function ActiveRegionLabel({
  region,
  fontSize,
  lineHeight,
  onHoverRegion,
  onSelectRegion,
}: {
  region: RegionItem;
  fontSize: number;
  lineHeight: number;
  onHoverRegion: (id: string | null) => void;
  onSelectRegion: (region: RegionItem) => void;
}) {
  const textRef = useRef<SVGTextElement | null>(null);
  const [box, setBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el || typeof el.getBBox !== 'function') {
      setBox(null);
      return;
    }
    try {
      const b = el.getBBox();
      setBox({ x: b.x, y: b.y, width: b.width, height: b.height });
    } catch {
      setBox(null);
    }
  }, [region.id, region.labelX, region.labelY, fontSize, lineHeight]);

  const padX = 6;
  const padY = 3;

  return (
    <g
      onMouseEnter={() => onHoverRegion(region.id)}
      onMouseLeave={() => onHoverRegion(null)}
      onClick={() => onSelectRegion(region)}
      className="cursor-pointer"
    >
      {box && (
        <rect
          x={box.x - padX}
          y={box.y - padY}
          width={box.width + padX * 2}
          height={box.height + padY * 2}
          rx={Math.min(8, (box.height + padY * 2) / 2)}
          fill="#ffffff"
          stroke="#16324a"
          strokeWidth={1}
          opacity={0.97}
        />
      )}
      <text
        ref={textRef}
        x={region.labelX}
        y={region.labelY}
        textAnchor="middle"
        fill="#0d2336"
        style={{ fontSize: `${fontSize}px`, fontWeight: 700, letterSpacing: '0.01em' }}
      >
        {region.labelLines.map((line, idx) => (
          <tspan key={idx} x={region.labelX} dy={idx === 0 ? 0 : lineHeight}>
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );
}

function OutlinePinIcon({ className = 'w-6 h-6', filled = false }: { className?: string; filled?: boolean }) {
  return (
    <svg
      viewBox="0 0 28 34"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M14 1.5C7.37258 1.5 2 6.87258 2 13.5C2 21.75 14 32.2 14 32.2C14 32.2 26 21.75 26 13.5C26 6.87258 20.6274 1.5 14 1.5Z"
        fill={filled ? '#cde6f7' : '#e6f3fb'}
        stroke="#457b9d"
        strokeWidth="2.1"
        strokeLinejoin="round"
      />
      <circle
        cx="14"
        cy="13.2"
        r="4.2"
        fill={filled ? '#16324a' : '#ffffff'}
        stroke="#457b9d"
        strokeWidth="2"
      />
    </svg>
  );
}

function ClusterShowcaseSection({
  cluster,
  regions,
  selectedRegion,
  hoveredRegionId,
  onHoverRegion,
  onSelectRegion,
}: {
  cluster: ClusterMeta;
  regions: RegionItem[];
  selectedRegion: RegionItem | null;
  hoveredRegionId: string | null;
  onHoverRegion: (id: string | null) => void;
  onSelectRegion: (region: RegionItem) => void;
}) {
  // Размер подписи пропорционален ширине viewBox: крупная карта Кавказа (800)
  // и компактные карты (600) получают разный кегль. Межстрочный — плотный.
  const viewBoxWidth = parseInt(cluster.viewBox.trim().split(/\s+/)[2] ?? '600', 10) || 600;
  const fontSize = viewBoxWidth >= 800 ? 14.5 : 10.5;
  const lineHeight = Math.round(fontSize * 1.12);
  const haloWidth = `${(fontSize * 0.26).toFixed(2)}px`;

  const activeRegionId = hoveredRegionId ?? selectedRegion?.id ?? null;
  const activeRegion = activeRegionId
    ? regions.find((region) => region.id === activeRegionId) ?? null
    : null;

  return (
    <section
      id={cluster.id}
      className="relative overflow-hidden rounded-[28px] border border-[#cde0ec] bg-gradient-to-b from-[#ffffff] via-[#f6fbfe] to-[#e9f3fa] px-5 py-7 sm:px-10 sm:py-10 shadow-[0_14px_40px_rgba(22,50,74,0.06)]"
    >
      {/* Мягкие волны на фоне внизу */}
      <svg
        viewBox="0 0 1200 180"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-28 sm:h-36 w-full opacity-75"
        aria-hidden="true"
      >
        <path
          d="M0,95 C260,35 480,145 780,85 C980,45 1100,90 1200,70 L1200,180 L0,180 Z"
          fill="#dcebf5"
        />
        <path
          d="M0,125 C320,165 620,65 940,120 C1070,142 1150,115 1200,105 L1200,180 L0,180 Z"
          fill="#d2e5f2"
          opacity="0.75"
        />
      </svg>

      {/* Заголовок блока с пином и вертикальной чертой */}
      <div className="relative z-10 flex items-center gap-4 sm:gap-5 mb-6 sm:mb-8">
        <div className="shrink-0">
          <OutlinePinIcon className="w-9 h-11 sm:w-11 sm:h-14" />
        </div>
        <div className="h-12 sm:h-14 w-[2px] bg-[#3b6682] rounded-full shrink-0" />
        <div>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#16324a] leading-none">
            {cluster.title}
          </h2>
          <p className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs font-bold uppercase tracking-[0.22em] text-[#4a6c85]">
            {cluster.subtitle}
          </p>
        </div>
      </div>

      {/* Сетка: Карта слева + Список карточек справа */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
        {/* Левая колонка: Векторная карта макрорегиона */}
        <div className="lg:col-span-7 flex items-center justify-center">
          <svg
            viewBox={cluster.viewBox}
            className="w-full h-auto max-h-[450px] select-none"
            strokeLinecap="round"
            strokeLinejoin="round"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <filter id={`soft-map-shadow-${cluster.id}`} x="-10%" y="-10%" width="120%" height="120%">
                <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#16324a" floodOpacity="0.08" />
              </filter>
            </defs>

            <g filter={`url(#soft-map-shadow-${cluster.id})`}>
              {regions.map((region) => {
                const isSelected = selectedRegion?.id === region.id;
                const isHovered = hoveredRegionId === region.id;

                let fillColor = '#e8f2f8';
                if (isSelected) fillColor = '#b8dcf3';
                else if (isHovered) fillColor = '#cfe6f6';

                return (
                  <path
                    key={region.id}
                    d={region.svgPath}
                    fill={fillColor}
                    fillRule={EVENODD_REGION_IDS.has(region.id) ? 'evenodd' : undefined}
                    stroke="#4a6b7c"
                    strokeWidth={isSelected || isHovered ? '2.4' : '1.6'}
                    onMouseEnter={() => onHoverRegion(region.id)}
                    onMouseLeave={() => onHoverRegion(null)}
                    onClick={() => onSelectRegion(region)}
                    className="cursor-pointer transition-colors duration-200"
                  />
                );
              })}
            </g>

            {/* Подписи областей и точки внутри контуров */}
            {regions.map((region) => {
              const isSelected = selectedRegion?.id === region.id;
              const isHovered = hoveredRegionId === region.id;

              return (
                <g
                  key={`label-${region.id}`}
                  onMouseEnter={() => onHoverRegion(region.id)}
                  onMouseLeave={() => onHoverRegion(null)}
                  onClick={() => onSelectRegion(region)}
                  className="cursor-pointer"
                >
                  {/* Активную подпись рисуем отдельно, последней — поверх карты */}
                  {region.id !== activeRegion?.id && (
                    <text
                      x={region.labelX}
                      y={region.labelY}
                      textAnchor="middle"
                      fill={isSelected || isHovered ? '#0d2336' : '#16324a'}
                      style={{
                        fontSize: `${fontSize}px`,
                        fontWeight: 700,
                        paintOrder: 'stroke',
                        stroke: isSelected ? '#b8dcf3' : isHovered ? '#cfe6f6' : '#e8f2f8',
                        strokeWidth: haloWidth,
                        strokeLinejoin: 'round',
                      }}
                    >
                      {region.labelLines.map((line, idx) => (
                        <tspan
                          key={idx}
                          x={region.labelX}
                          dy={idx === 0 ? 0 : lineHeight}
                        >
                          {line}
                        </tspan>
                      ))}
                    </text>
                  )}

                  <circle
                    cx={region.dotX}
                    cy={region.dotY}
                    r={isSelected || isHovered ? 5.2 : 4}
                    fill="#16324a"
                    className="transition-all duration-200"
                  />
                </g>
              );
            })}

            {/* Активная подпись — последней, с белой плашкой-фоном */}
            {activeRegion && (
              <ActiveRegionLabel
                key={`active-${activeRegion.id}`}
                region={activeRegion}
                fontSize={fontSize}
                lineHeight={lineHeight}
                onHoverRegion={onHoverRegion}
                onSelectRegion={onSelectRegion}
              />
            )}
          </svg>
        </div>

        {/* Правая колонка: Стек белых карточек регионов */}
        <div className="lg:col-span-5 flex flex-col gap-2.5 sm:gap-3">
          {regions.map((region) => {
            const isSelected = selectedRegion?.id === region.id;
            const isHovered = hoveredRegionId === region.id;

            return (
              <button
                key={region.id}
                type="button"
                onMouseEnter={() => onHoverRegion(region.id)}
                onMouseLeave={() => onHoverRegion(null)}
                onClick={() => onSelectRegion(region)}
                className={`w-full text-left flex items-center gap-3.5 rounded-2xl border px-4 py-3.5 transition-all duration-200 ${
                  isSelected || isHovered
                    ? 'border-[#457b9d] bg-[#f0f8fe] shadow-[0_6px_18px_rgba(22,50,74,0.09)] -translate-y-0.5'
                    : 'border-[#c8dce8] bg-white/95 shadow-[0_3px_10px_rgba(22,50,74,0.03)] hover:border-[#457b9d]'
                }`}
              >
                <OutlinePinIcon
                  className="w-5 h-6 shrink-0"
                  filled={isSelected || isHovered}
                />
                <span className="text-[15px] sm:text-base font-bold text-[#16324a] leading-snug">
                  {region.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default function RegionsMapApp() {
  const [activeTab, setActiveTab] = useState<ClusterId | 'all'>('all');
  const [selectedRegion, setSelectedRegion] = useState<RegionItem | null>(null);
  const [hoveredRegionId, setHoveredRegionId] = useState<string | null>(null);
  const [showRequisites, setShowRequisites] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    bridge.send('VKWebAppInit').catch(() => {});

    const hash = window.location.hash.replace('#', '').toLowerCase();
    if (hash) {
      const foundCluster = CLUSTERS.find((c) => c.id === hash);
      if (foundCluster) {
        setActiveTab(foundCluster.id);
      } else {
        const foundRegion = REGIONS_DATA.find((r) => r.id === hash);
        if (foundRegion) {
          setActiveTab(foundRegion.cluster);
          setSelectedRegion(foundRegion);
        }
      }
    }
  }, []);

  useEffect(() => {
    document.body.style.overflow = selectedRegion ? 'hidden' : 'unset';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedRegion]);

  const handleSelectRegion = (region: RegionItem) => {
    setSelectedRegion(region);
    setShowRequisites(false);
    setCopied(false);
  };

  const handleCopyRequisites = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const visibleClusters =
    activeTab === 'all'
      ? CLUSTERS
      : CLUSTERS.filter((c) => c.id === activeTab);

  return (
    <div className="min-h-screen bg-[#eef5fa] text-[#16324a] font-sans pb-12">
      {/* Верхняя панель навигации по макрорегионам */}
      <div className="sticky top-0 z-30 bg-[#eef5fa]/90 backdrop-blur-md border-b border-[#d0e2ee] px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
              activeTab === 'all'
                ? 'bg-[#16324a] text-white shadow-sm'
                : 'bg-white text-[#456882] border border-[#c8dce8] hover:border-[#457b9d] hover:text-[#16324a]'
            }`}
          >
            Все регионы
          </button>

          {CLUSTERS.map((cluster) => {
            const isActive = activeTab === cluster.id;
            return (
              <button
                key={cluster.id}
                type="button"
                onClick={() => setActiveTab(cluster.id)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
                  isActive
                    ? 'bg-[#16324a] text-white shadow-sm'
                    : 'bg-white text-[#456882] border border-[#c8dce8] hover:border-[#457b9d] hover:text-[#16324a]'
                }`}
              >
                {cluster.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* Секции макрорегионов */}
      <main className="max-w-5xl mx-auto px-4 pt-6 flex flex-col gap-8">
        {visibleClusters.map((cluster) => (
          <ClusterShowcaseSection
            key={cluster.id}
            cluster={cluster}
            regions={REGIONS_DATA.filter((r) => r.cluster === cluster.id)}
            selectedRegion={selectedRegion}
            hoveredRegionId={hoveredRegionId}
            onHoverRegion={setHoveredRegionId}
            onSelectRegion={handleSelectRegion}
          />
        ))}
      </main>

      {/* Карточка контактов координатора */}
      <div
        className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 transition-opacity duration-200 ${
          selectedRegion ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div
          onClick={() => setSelectedRegion(null)}
          className="absolute inset-0 bg-[#16324a]/40 backdrop-blur-xs cursor-pointer"
        />

        <div
          className={`relative w-full max-w-lg bg-white border border-[#c8dce8] rounded-t-3xl sm:rounded-3xl p-5 sm:p-7 max-h-[90vh] overflow-y-auto shadow-[0_20px_50px_rgba(22,50,74,0.2)] transition-transform duration-300 ease-out ${
            selectedRegion ? 'translate-y-0' : 'translate-y-full sm:translate-y-6'
          }`}
        >
          {selectedRegion && (
            <div>
              <div className="w-10 h-1 bg-[#d0e2ee] rounded-full mx-auto mb-5 sm:hidden" />

              <div className="flex items-start justify-between gap-4 pb-4 mb-5 border-b border-[#e1eef6]">
                <div className="flex items-center gap-3.5">
                  <OutlinePinIcon className="w-7 h-9 shrink-0" filled />
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#457b9d]">
                      {CLUSTERS.find((c) => c.id === selectedRegion.cluster)?.title}
                    </div>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-[#16324a] leading-tight">
                      {selectedRegion.name}
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedRegion(null)}
                  aria-label="Закрыть"
                  className="w-9 h-9 rounded-xl border border-[#c8dce8] bg-[#f6fbfe] text-[#456882] hover:text-[#16324a] hover:border-[#457b9d] flex items-center justify-center shrink-0 transition"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="rounded-2xl border border-[#d0e2ee] bg-gradient-to-b from-[#f7fbfe] to-[#edf6fc] p-5 mb-5">
                <div className="text-xs font-bold uppercase tracking-wider text-[#457b9d] mb-1">
                  {selectedRegion.isDefaultCoordinator
                    ? 'Ответственный представитель'
                    : 'Региональный координатор'}
                </div>
                <div className="text-lg sm:text-xl font-extrabold text-[#16324a]">
                  {selectedRegion.coordinator}
                </div>
                <div className="text-sm font-semibold text-[#456882] mt-0.5">
                  {selectedRegion.school}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-[#d8e8f3] text-sm">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#6b8ba3] block mb-0.5">
                      Телефон
                    </span>
                    <a
                      href={`tel:${selectedRegion.phone}`}
                      className="font-bold text-[#16324a] hover:text-[#2b6cb0]"
                    >
                      {selectedRegion.phone}
                    </a>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#6b8ba3] block mb-0.5">
                      Электронная почта
                    </span>
                    <a
                      href={`mailto:${selectedRegion.email}`}
                      className="font-bold text-[#16324a] hover:text-[#2b6cb0] break-all"
                    >
                      {selectedRegion.email}
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                <a
                  href={selectedRegion.maxUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-5 rounded-xl bg-[#5c3df5] hover:bg-[#4b2ee0] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-[0_6px_16px_rgba(92,61,245,0.25)] transition"
                >
                  <MessageCircle size={18} />
                  Написать координатору в MAX
                </a>

                <div className="grid grid-cols-2 gap-2.5">
                  <a
                    href={`tel:${selectedRegion.phone}`}
                    className="py-3 px-4 rounded-xl border border-[#c8dce8] bg-white hover:bg-[#f4faff] text-[#16324a] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition"
                  >
                    <Phone size={15} className="text-[#457b9d]" />
                    Позвонить
                  </a>
                  <button
                    type="button"
                    onClick={() => setShowRequisites(!showRequisites)}
                    className="py-3 px-4 rounded-xl border border-[#c8dce8] bg-white hover:bg-[#f4faff] text-[#16324a] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition"
                  >
                    <FileText size={15} className="text-[#457b9d]" />
                    {showRequisites ? 'Скрыть реквизиты' : 'Реквизиты'}
                  </button>
                </div>
              </div>

              {showRequisites && (
                <div className="mt-4 rounded-2xl border border-[#2a4a63] bg-[#16324a] p-4 text-white">
                  <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[#2b4d68]">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#9ad0ec]">
                      Реквизиты организации
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyRequisites(selectedRegion.requisites)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#234866] hover:bg-[#2f5c80] text-[11px] font-bold text-white transition"
                    >
                      {copied ? <Check size={13} /> : <Copy size={13} />}
                      {copied ? 'Скопировано' : 'Копировать'}
                    </button>
                  </div>
                  <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-[#d7eaf6]">
                    {selectedRegion.requisites}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}