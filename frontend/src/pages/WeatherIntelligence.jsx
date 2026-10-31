import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import PageHeader from '../components/PageHeader';
import MetricCard from '../components/MetricCard';
import StatusBadge from '../components/StatusBadge';
import {
  CloudRain,
  Wind,
  Eye,
  Thermometer,
  ShieldAlert,
  AlertTriangle,
  Droplets,
  Layers,
  ArrowRight,
  TrendingUp,
  MapPin
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';

export default function WeatherIntelligence() {
  const [weatherList, setWeatherList] = useState([]);
  const [selectedDistrictId, setSelectedDistrictId] = useState(1); // Default Chennai
  const [districtData, setDistrictData] = useState(null);
  const [correlationData, setCorrelationData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWeatherData();
  }, []);

  const loadWeatherData = async () => {
    setLoading(true);
    try {
      const [list, corr] = await Promise.all([
        api.getWeather(),
        api.getWeatherCorrelation()
      ]);
      setWeatherList(list);
      setCorrelationData(corr.correlation_data || []);
      if (list.length > 0) {
        loadDistrictDetail(list[0].district_id);
      }
    } catch (err) {
      console.error('Failed to load weather:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadDistrictDetail = async (distId) => {
    setSelectedDistrictId(distId);
    try {
      const res = await api.getDistrictWeather(distId);
      setDistrictData(res);
    } catch (err) {
      console.error('Failed to load district weather:', err);
    }
  };

  const currentW = districtData?.weather || {};
  const impact = districtData?.impact_analysis || {};

  return (
    <div className="space-y-6">
      <PageHeader
        title="Statewide Road Weather Intelligence Network"
        subtitle="Real-time precipitation, atmospheric fog visibility, and pavement aquaplaning friction coefficient tracking"
        badge={districtData?.api_status || "IMD Radar Network"}
      />

      {/* District Selector Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        {weatherList.map((w) => (
          <button
            key={w.id}
            onClick={() => loadDistrictDetail(w.district_id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition border ${
              selectedDistrictId === w.district_id
                ? 'bg-blue-600 border-cyan-400 text-white shadow-md shadow-blue-600/30'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            {w.district_name}
            {w.rainfall_mm > 10 && <span className="ml-1.5 text-cyan-300 animate-pulse">🌧</span>}
          </button>
        ))}
      </div>

      {/* Selected District Telemetry Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Precipitation Intensity"
          value={`${currentW.rainfall_mm || 0} mm/hr`}
          subtitle={currentW.weather_condition || 'Normal'}
          icon={CloudRain}
          color="cyan"
          badge={currentW.rainfall_mm > 20 ? 'Torrential' : currentW.rainfall_mm > 5 ? 'Showers' : 'Dry'}
        />
        <MetricCard
          title="Surface Temperature"
          value={`${currentW.temperature_c || 31}°C`}
          subtitle={`Humidity: ${currentW.humidity_pct || 65}%`}
          icon={Thermometer}
          color="orange"
        />
        <MetricCard
          title="Visibility Distance"
          value={`${((currentW.visibility_meters || 9000) / 1000).toFixed(1)} km`}
          subtitle={impact.visibility_advisory || 'Clear Sightlines'}
          icon={Eye}
          color="blue"
          badge={(currentW.visibility_meters || 9000) < 3000 ? 'Fog Alert' : 'Good'}
        />
        <MetricCard
          title="Stopping Distance Buffer"
          value={`${impact.stopping_distance_multiplier || 1.0}x`}
          subtitle={`Skid Risk: ${impact.skid_probability_pct || 8}%`}
          icon={ShieldAlert}
          color={impact.stopping_distance_multiplier > 1.4 ? 'red' : 'emerald'}
          badge={impact.aquaplaning_warning ? 'Aquaplaning Risk' : 'Adherent'}
        />
      </div>

      {/* Empirical Physics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rainfall vs Stopping Distance Chart */}
        <div className="lg:col-span-2 bg-[#0f172a] border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Pavement Friction & Stopping Distance Multiplier (IRC:SP:44)
              </h3>
              <p className="text-xs text-slate-400">
                Mathematical correlation between water film depth and emergency braking distance at 50 km/h
              </p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-cyan-400 border border-blue-500/20">
              HRS Guidelines
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={correlationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="rainfall_mm"
                  stroke="#64748b"
                  fontSize={11}
                  label={{ value: 'Rainfall Intensity (mm/hr)', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 10 }}
                />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line
                  type="monotone"
                  dataKey="stopping_distance_meters"
                  name="Stopping Distance (meters)"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="pavement_friction_bpn"
                  name="Skid Resistance (BPN x 10)"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Severe Weather Advisories Panel */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white tracking-wide flex items-center space-x-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>State Highway Weather Advisories</span>
              </h3>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs">
                <div className="font-bold text-rose-300">Salem (NH-44 Bypass) - Torrential Flash Flood</div>
                <div className="text-[11px] text-slate-300 mt-1">
                  28.0 mm/hr downpour recorded. High risk of waterlogging at underpasses. Variable Message Signs (VMS) set to 30 km/h limit.
                </div>
                <div className="mt-2 text-[10px] text-rose-400 font-semibold">Alert Level: SEVERE WARNING</div>
              </div>

              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs">
                <div className="font-bold text-amber-300">Chennai Coastal GST Road - Rain Slick</div>
                <div className="text-[11px] text-slate-300 mt-1">
                  14.5 mm/hr coastal monsoon showers. Wet road factor 1.45x. Anti-skid ramps active at Kathipara interchange.
                </div>
                <div className="mt-2 text-[10px] text-amber-400 font-semibold">Alert Level: ADVISORY</div>
              </div>

              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs">
                <div className="font-bold text-emerald-300">Madurai & Central Region - High Visibility</div>
                <div className="text-[11px] text-slate-300 mt-1">
                  Dry pavement conditions (9.8 km visibility). Pavement skid resistance optimal at 0.70 BPN.
                </div>
                <div className="mt-2 text-[10px] text-emerald-400 font-semibold">Alert Level: NORMAL</div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
            Automated sensor inputs sync with IMD Radar & District Disaster Management Authority (DDMA).
          </div>
        </div>
      </div>
    </div>
  );
}

