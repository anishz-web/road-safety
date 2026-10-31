import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { api } from '../services/api';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import {
  Filter,
  Search,
  Eye,
  Activity,
  FileCheck,
  AlertTriangle,
  CloudRain,
  Car,
  Maximize2,
  RefreshCw,
  X
} from 'lucide-react';

// Custom Marker Icons for Leaflet
function createCustomIcon(color) {
  return L.divIcon({
    className: 'custom-map-pin',
    html: `
      <div style="
        background-color: ${color};
        width: 18px;
        height: 18px;
        border-radius: 50%;
        border: 2px solid #ffffff;
        box-shadow: 0 0 10px ${color};
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="width: 6px; height: 6px; background-color: #ffffff; border-radius: 50%;"></div>
      </div>
    `,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -10],
  });
}

const ICONS = {
  Critical: createCustomIcon('#ef4444'),
  High: createCustomIcon('#f97316'),
  Medium: createCustomIcon('#eab308'),
  Low: createCustomIcon('#10b981'),
};

// Component to handle map centering when a road is selected
function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom, { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
}

export default function RoadMap() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [roads, setRoads] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [selectedRoad, setSelectedRoad] = useState(null);
  const [roadDetail, setRoadDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Filters
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedRiskLevel, setSelectedRiskLevel] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Map state (Centered on central Tamil Nadu: Trichy/Dindigul area)
  const [mapCenter, setMapCenter] = useState([11.1271, 78.6569]);
  const [mapZoom, setMapZoom] = useState(7);

  const fetchRoads = async () => {
    try {
      const params = {};
      if (selectedDistrict) params.district_id = selectedDistrict;
      if (selectedRiskLevel && selectedRiskLevel !== 'All') params.risk_level = selectedRiskLevel;
      if (searchQuery) params.search = searchQuery;

      const data = await api.getRoads(params);
      setRoads(data);

      // If road_id in query param, auto-select it
      const targetId = searchParams.get('road_id');
      if (targetId) {
        const found = data.find((r) => r.id === parseInt(targetId, 10));
        if (found) {
          handleSelectRoad(found);
        }
      }
    } catch (err) {
      console.error('Failed to load road markers:', err);
    }
  };

  useEffect(() => {
    api.getDistricts().then(setDistricts).catch(console.error);
  }, []);

  useEffect(() => {
    fetchRoads();
  }, [selectedDistrict, selectedRiskLevel, searchQuery]);

  const handleSelectRoad = async (road) => {
    setSelectedRoad(road);
    setMapCenter([road.latitude, road.longitude]);
    setMapZoom(13);
    setLoadingDetail(true);

    try {
      const detail = await api.getRoadDetail(road.id);
      setRoadDetail(detail);
    } catch (err) {
      console.error('Failed to load road details:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <div className="h-[calc(100vh-6.5rem)] flex flex-col space-y-4">
      {/* Top Bar with Filter Controls */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* District Selector */}
          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="">All 38 TN Districts</option>
              {districts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.zone})
                </option>
              ))}
            </select>
          </div>

          {/* Risk Level Filter */}
          <div className="flex items-center space-x-1">
            {['All', 'Critical', 'High', 'Medium', 'Low'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedRiskLevel(lvl)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                  selectedRiskLevel === lvl
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search corridor (e.g. Kathipara, OMR)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-4 text-xs font-semibold text-slate-300">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500/50" />
            <span>Critical (&gt;75)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
            <span>High (55-74)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
            <span>Medium</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Low</span>
          </div>
        </div>
      </div>

      {/* Main Map View and Inspector Split */}
      <div className="flex-1 flex overflow-hidden rounded-xl border border-slate-800 shadow-2xl relative">
        {/* Leaflet Map */}
        <div className="flex-1 h-full w-full relative z-0">
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            scrollWheelZoom={true}
            className="h-full w-full"
            style={{ background: '#0b1120' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />

            <MapController center={mapCenter} zoom={mapZoom} />

            {roads.map((road) => (
              <Marker
                key={road.id}
                position={[road.latitude, road.longitude]}
                icon={ICONS[road.risk_level] || ICONS.Low}
                eventHandlers={{
                  click: () => handleSelectRoad(road),
                }}
              >
                <Popup className="roadguard-popup">
                  <div className="p-1 min-w-[200px]">
                    <div className="font-bold text-xs text-white">{road.road_name}</div>
                    <div className="text-[11px] text-cyan-400 font-medium">{road.district_name} • {road.road_code}</div>
                    <div className="mt-1 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Score: <strong className="text-white">{road.risk_score}</strong></span>
                      <StatusBadge status={road.risk_level} size="xs" />
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Selected Road Detail Inspector Drawer */}
        {selectedRoad && (
          <div className="w-96 bg-[#0f172a] border-l border-slate-800 flex flex-col h-full overflow-y-auto z-10 shadow-2xl animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-start justify-between bg-slate-900/50">
              <div>
                <div className="flex items-center space-x-2">
                  <StatusBadge status={selectedRoad.risk_level} />
                  <span className="text-[10px] text-slate-400 font-mono">{selectedRoad.chainage || 'KM 00+000'}</span>
                </div>
                <h3 className="text-sm font-bold text-white mt-1 leading-snug">{selectedRoad.road_name}</h3>
                <div className="text-xs text-cyan-400 mt-0.5">{selectedRoad.district_name} • {selectedRoad.road_code}</div>
              </div>
              <button
                onClick={() => setSelectedRoad(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4 flex-1 text-xs">
              {/* Risk Score Meter */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">AI Risk Score</span>
                  <span className="text-base font-extrabold text-white">{selectedRoad.risk_score} / 100</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      selectedRoad.risk_score >= 75 ? 'bg-rose-500' : selectedRoad.risk_score >= 55 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${selectedRoad.risk_score}%` }}
                  />
                </div>
              </div>

              {/* Road Structure Specs */}
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Corridor Engineering Geometry
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400">Classification</span>
                    <div className="font-semibold text-slate-200 mt-0.5 truncate">{selectedRoad.road_type}</div>
                  </div>
                  <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400">Speed Limit</span>
                    <div className="font-semibold text-slate-200 mt-0.5">{selectedRoad.speed_limit} km/h</div>
                  </div>
                  <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400">Carriageway</span>
                    <div className="font-semibold text-slate-200 mt-0.5">{selectedRoad.lanes} Lanes Divided</div>
                  </div>
                  <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400">Junction Geometry</span>
                    <div className="font-semibold text-slate-200 mt-0.5 truncate">{selectedRoad.junction_type}</div>
                  </div>
                </div>
              </div>

              {/* Live Traffic & Weather Context */}
              {roadDetail && (
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Telemetry Observations
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                      <span className="text-slate-400 flex items-center">
                        <Car className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
                        Traffic Flow Rate
                      </span>
                      <span className="font-bold text-white">
                        {roadDetail.traffic_observation?.vehicle_count || 3200} PCU/hr
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                      <span className="text-slate-400 flex items-center">
                        <CloudRain className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
                        Weather State
                      </span>
                      <span className="font-bold text-white">
                        {roadDetail.weather_observation?.weather_condition || 'Partly Cloudy'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Identified Hazards */}
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Active Surface Hazards</span>
                  <span className="text-rose-400 font-bold">{roadDetail?.hazards?.length || 0}</span>
                </div>
                {roadDetail?.hazards?.length > 0 ? (
                  <div className="space-y-2">
                    {roadDetail.hazards.map((h) => (
                      <div key={h.id} className="p-2 rounded bg-rose-500/10 border border-rose-500/30">
                        <div className="font-semibold text-rose-300">{h.hazard_type}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5 flex justify-between">
                          <span>Severity: {h.severity}</span>
                          <span className="text-cyan-400">AI Conf: {Math.round(h.ai_confidence * 100)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-2 text-center text-slate-500 bg-slate-900/40 rounded border border-slate-800">
                    No open structural hazards registered
                  </div>
                )}
              </div>

              {/* Suggested Engineering Intervention */}
              {roadDetail?.recommendations?.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Recommended Engineering Treatment
                  </div>
                  <div className="p-2.5 rounded bg-blue-500/10 border border-blue-500/30">
                    <div className="font-bold text-cyan-300">{roadDetail.recommendations[0].title}</div>
                    <div className="text-[11px] text-slate-300 mt-1 line-clamp-2">
                      {roadDetail.recommendations[0].suggested_solution}
                    </div>
                    <div className="mt-2 text-[10px] flex items-center justify-between text-slate-400">
                      <span>Expected Crash Reduction: <strong className="text-emerald-400">{roadDetail.recommendations[0].expected_risk_reduction_pct}%</strong></span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Bar Footer */}
            <div className="p-3 border-t border-slate-800 bg-slate-900/90 space-y-2">
              <button
                onClick={() => navigate(`/simulation?location_id=${selectedRoad.id}`)}
                className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Simulate in Digital Twin</span>
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => navigate('/cameras')}
                  className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center justify-center space-x-1"
                >
                  <Eye className="w-3 h-3 text-cyan-400" />
                  <span>CCTV Stream</span>
                </button>
                <button
                  onClick={() => navigate('/work-orders')}
                  className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center justify-center space-x-1"
                >
                  <FileCheck className="w-3 h-3 text-emerald-400" />
                  <span>Work Order</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

