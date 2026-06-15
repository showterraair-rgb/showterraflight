import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { TRAVEL_ORIGIN } from '../../data/travelDestinations';
import { getMapPointsFromMatches, searchTravelDestinations } from '../../utils/searchDestinations';
import {
  getMapPointsFromAirportMatches,
  groupAirportsByCountry,
  searchFlightAirports,
} from '../../utils/searchFlightAirports';

function AirportOptionButton({ match, index, activeIndex, onHover, onSelect }) {
  return (
    <button
      type="button"
      className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors ${
        index === activeIndex ? 'bg-brand-50 text-brand-900' : 'text-slate-700 hover:bg-slate-50'
      }`}
      onMouseEnter={onHover}
      onClick={onSelect}
    >
      <span className="w-11 shrink-0 rounded-md bg-slate-100 px-1.5 py-1 text-center text-xs font-bold tracking-wide text-brand-700">
        {match.code}
      </span>
      <span className="min-w-0 flex-1 truncate">
        <span className="font-medium">{match.city}</span>
        <span className="text-slate-500"> · {match.countryCode}</span>
      </span>
    </button>
  );
}

function DestinationMiniMap({ points, mapId }) {
  const origin = TRAVEL_ORIGIN;
  const routeGradId = `${mapId}-route`;
  const originGlowId = `${mapId}-glow`;

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-gradient-to-br from-brand-950 to-brand-900 p-2">
      <svg
        viewBox="0 0 100 60"
        className="h-[120px] w-full sm:h-[140px]"
        role="img"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={routeGradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
          <radialGradient id={originGlowId}>
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
          </radialGradient>
        </defs>

        <ellipse cx="50" cy="32" rx="45" ry="26" fill="#1e3a5f" opacity="0.45" />
        <ellipse cx="25" cy="28" rx="18" ry="14" fill="#1e4976" opacity="0.35" />
        <ellipse cx="72" cy="35" rx="20" ry="16" fill="#1e4976" opacity="0.35" />

        {points.map((p) => (
          <line
            key={`line-${p.id}`}
            x1={origin.x}
            y1={origin.y}
            x2={p.x}
            y2={p.y}
            stroke={`url(#${routeGradId})`}
            strokeWidth="0.5"
            strokeDasharray="1.5 1"
            opacity="0.7"
          />
        ))}

        {points.map((p) => (
          <g key={`node-${p.id}`}>
            <circle cx={p.x} cy={p.y} r="2.8" fill="#38bdf8" opacity="0.2" />
            <circle cx={p.x} cy={p.y} r="1.3" fill="#38bdf8" />
          </g>
        ))}

        <circle cx={origin.x} cy={origin.y} r="6" fill={`url(#${originGlowId})`} />
        <circle cx={origin.x} cy={origin.y} r="2" fill="#fbbf24" />
      </svg>
      {points.length > 0 && (
        <div className="mt-1 flex flex-wrap justify-center gap-1 px-1 pb-1">
          {points.map((p) => (
            <span key={p.id} className="text-[10px] font-medium text-slate-300">
              {p.flag} {p.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DestinationPicker({
  id: idProp,
  label,
  value = '',
  onChange,
  placeholder = 'Type a country or city…',
  error,
  className = '',
  inputClassName = 'input-field',
  mode = 'destination',
}) {
  const isAirport = mode === 'airport';
  const autoId = useId();
  const inputId = idProp || autoId;
  const listId = `${inputId}-listbox`;
  const mapId = `${inputId}-map`;
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const panelRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [panelStyle, setPanelStyle] = useState(null);

  const destinationMatches = searchTravelDestinations(value);
  const airportMatches = searchFlightAirports(value);
  const matches = isAirport ? airportMatches : destinationMatches;
  const mapPoints = isAirport
    ? getMapPointsFromAirportMatches(airportMatches)
    : getMapPointsFromMatches(destinationMatches);
  const showPanel = open && (isAirport || value.trim().length >= 1);
  const airportGroups = isAirport && !value.trim()
    ? groupAirportsByCountry(airportMatches)
    : null;

  const updatePanelPosition = useCallback(() => {
    const input = inputRef.current;
    if (!input) return;

    const rect = input.getBoundingClientRect();
    const maxHeight = Math.min(isAirport ? 480 : 420, window.innerHeight * 0.7);
    const spaceBelow = window.innerHeight - rect.bottom - 8;
    const spaceAbove = rect.top - 8;
    const openUp = spaceBelow < 220 && spaceAbove > spaceBelow;

    setPanelStyle({
      position: 'fixed',
      left: rect.left,
      width: rect.width,
      maxHeight,
      zIndex: 9999,
      ...(openUp
        ? { bottom: window.innerHeight - rect.top + 4 }
        : { top: rect.bottom + 4 }),
    });
  }, []);

  useEffect(() => {
    if (!showPanel) {
      setPanelStyle(null);
      return undefined;
    }

    updatePanelPosition();
    window.addEventListener('scroll', updatePanelPosition, true);
    window.addEventListener('resize', updatePanelPosition);
    return () => {
      window.removeEventListener('scroll', updatePanelPosition, true);
      window.removeEventListener('resize', updatePanelPosition);
    };
  }, [showPanel, value, updatePanelPosition]);

  const renderAirportList = () => {
    if (airportGroups) {
      let optionIndex = -1;
      return airportGroups.map((group) => (
        <li key={group.countryCode} className="list-none">
          <div className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50 px-3 py-2">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
              {group.flag} {group.country} ({group.countryCode})
            </span>
          </div>
          <ul className="list-none">
            {group.airports.map((airport) => {
              optionIndex += 1;
              const idx = optionIndex;
              const match = { ...airport, id: airport.code, label: airport.code };
              return (
                <li key={airport.code} role="option" aria-selected={idx === activeIndex}>
                  <AirportOptionButton
                    match={match}
                    index={idx}
                    activeIndex={activeIndex}
                    onHover={() => setActiveIndex(idx)}
                    onSelect={() => selectMatch(match)}
                  />
                </li>
              );
            })}
          </ul>
        </li>
      ));
    }

    return matches.map((match, index) => (
      <li key={match.id} role="option" aria-selected={index === activeIndex}>
        <AirportOptionButton
          match={match}
          index={index}
          activeIndex={activeIndex}
          onHover={() => setActiveIndex(index)}
          onSelect={() => selectMatch(match)}
        />
      </li>
    ));
  };

  const renderDestinationList = () => matches.map((match, index) => (
    <li key={match.id} role="option" aria-selected={index === activeIndex}>
      <button
        type="button"
        className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors ${
          index === activeIndex ? 'bg-brand-50 text-brand-900' : 'text-slate-700 hover:bg-slate-50'
        }`}
        onMouseEnter={() => setActiveIndex(index)}
        onClick={() => selectMatch(match)}
      >
        <span className="text-base" aria-hidden>{match.flag}</span>
        <span className="flex-1">
          {match.city ? (
            <>
              <span className="font-medium">{match.city}</span>
              <span className="text-slate-500">, {match.country}</span>
            </>
          ) : (
            <span className="font-medium">{match.country}</span>
          )}
        </span>
      </button>
    </li>
  ));

  const selectMatch = useCallback(
    (match) => {
      onChange(isAirport ? match.code : match.label);
      setOpen(false);
      setActiveIndex(-1);
    },
    [onChange, isAirport],
  );

  useEffect(() => {
    const onDocClick = (e) => {
      if (wrapperRef.current?.contains(e.target) || panelRef.current?.contains(e.target)) return;
      setOpen(false);
      setActiveIndex(-1);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const onKeyDown = (e) => {
    if (!showPanel || !matches.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % matches.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? matches.length - 1 : i - 1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      selectMatch(matches[activeIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-semibold text-slate-700">
          {label}
        </label>
      )}

      <input
        ref={inputRef}
        id={inputId}
        type="text"
        role="combobox"
        aria-expanded={showPanel}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        className={inputClassName}
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(isAirport ? e.target.value.toUpperCase() : e.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />

      {showPanel && panelStyle && createPortal(
        <div
          ref={panelRef}
          style={panelStyle}
          className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
        >
          {matches.length > 0 ? (
            <>
              {(isAirport ? mapPoints.length > 0 : true) && (
                <DestinationMiniMap points={mapPoints} mapId={mapId} />
              )}
              <ul id={listId} role="listbox" className={`overflow-y-auto border-t border-slate-100 py-1 ${isAirport ? 'max-h-64' : 'max-h-48'}`}>
                {isAirport ? renderAirportList() : renderDestinationList()}
              </ul>
            </>
          ) : (
            <div className="px-4 py-6 text-center text-sm text-slate-500">
              {isAirport
                ? <>No airport matches &ldquo;{value.trim()}&rdquo;. Try DAC, DXB, or JED.</>
                : <>No destinations match &ldquo;{value.trim()}&rdquo;. Try Dubai, Jeddah, or Kuala Lumpur.</>}
            </div>
          )}
        </div>,
        document.body,
      )}

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
