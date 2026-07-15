import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { 
  MapPin, 
  Search, 
  Filter, 
  RefreshCw, 
  Phone, 
  Users, 
  Award, 
  X, 
  Menu, 
  Info, 
  Calendar, 
  Navigation, 
  Database,
  ExternalLink,
  FileSpreadsheet,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  BarChart2,
  FileText,
  Sparkles,
  Map as MapIcon,
  HelpCircle,
  Eye,
  EyeOff,
  HeartHandshake,
  Upload,
  Layers,
  Locate,
  ArrowLeftRight,
  Download,
  Settings,
  Car,
  Bike,
  Footprints,
  Play,
  Square,
  Compass,
  Pause
} from 'lucide-react';
import { NguoiCoCong } from './types';
import { MOCK_DATA, DEFAULT_PORTRAIT_URL, parseCSVToNguoiCoCong } from './data';

export default function App() {
  // Database URL state
  const [sheetUrl, setSheetUrl] = useState<string>(() => {
    return localStorage.getItem('saved_sheet_url') || '';
  });

  // Main data state
  const [data, setData] = useState<NguoiCoCong[]>(() => {
    const saved = localStorage.getItem('saved_nguoi_co_cong_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : MOCK_DATA;
      } catch (e) {
        return MOCK_DATA;
      }
    }
    return MOCK_DATA;
  });

  // UI state
  const [selectedPerson, setSelectedPerson] = useState<NguoiCoCong | null>(null);
  const [actionPerson, setActionPerson] = useState<NguoiCoCong | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');
  const [showGlobalSearchResults, setShowGlobalSearchResults] = useState<boolean>(false);
  const [selectedDienChinhSach, setSelectedDienChinhSach] = useState<string>('Tất cả');
  const [selectedTinhTrang, setSelectedTinhTrang] = useState<string>('Tất cả');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Saved Settings State
  const [savedCenter, setSavedCenter] = useState<[number, number]>(() => {
    const saved = localStorage.getItem('saved_map_center');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 2 && typeof parsed[0] === 'number' && typeof parsed[1] === 'number') {
          return parsed as [number, number];
        }
      } catch (e) {}
    }
    return [21.9863, 105.0863]; // Default center
  });
  const [savedCenterUrl, setSavedCenterUrl] = useState<string>(() => {
    return localStorage.getItem('saved_map_center_url') || '21.9863, 105.0863';
  });
  const [defaultYearSetting, setDefaultYearSetting] = useState<string>(() => {
    return localStorage.getItem('saved_default_year') || '';
  });

  const [hideHuutri, setHideHuutri] = useState<boolean>(() => {
    return localStorage.getItem('hide_huutri') === 'true';
  });
  const [hideDaMat, setHideDaMat] = useState<boolean>(() => {
    return localStorage.getItem('hide_damat') === 'true';
  });
  const [hideDangCongTac, setHideDangCongTac] = useState<boolean>(() => {
    return localStorage.getItem('hide_dangcongtac') === 'true';
  });
  
  // Unified sidebar and dropdown menu states
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isMenuDropdownOpen, setIsMenuDropdownOpen] = useState<boolean>(false);
  const [showSyncModal, setShowSyncModal] = useState<boolean>(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState<"stats" | "profiles" | "settings" | "sync" | "reset" | "guide" | "directions" | null>(null);
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [resetFromDate, setResetFromDate] = useState<string>('');
  const [resetToDate, setResetToDate] = useState<string>('');
  const [resetMode, setResetMode] = useState<'all' | 'range' | 'empty'>('all');
  
  const [activeSyncTab, setActiveSyncTab] = useState<'sheets' | 'local'>('sheets');

  // --- SYNC WITH EXPRESS SERVER ---
  const updateDataAndServer = (newData: NguoiCoCong[]) => {
    setData(newData);
    localStorage.setItem('saved_nguoi_co_cong_data', JSON.stringify(newData));
    fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: newData })
    }).catch(err => console.error("Error writing data to server:", err));
  };

  const updateSheetUrlAndServer = (newUrl: string) => {
    setSheetUrl(newUrl);
    if (newUrl) {
      localStorage.setItem('saved_sheet_url', newUrl);
    } else {
      localStorage.removeItem('saved_sheet_url');
    }
    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sheetUrl: newUrl })
    }).catch(err => console.error("Error writing sheet URL to server:", err));
  };

  const updateDefaultYearSettingAndServer = (newYear: string) => {
    setDefaultYearSetting(newYear);
    if (newYear) {
      localStorage.setItem('saved_default_year', newYear);
    } else {
      localStorage.removeItem('saved_default_year');
    }
    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ defaultYear: newYear })
    }).catch(err => console.error("Error writing default year to server:", err));
  };

  // Load initial data and settings from Express backend server on mount
  useEffect(() => {
    let active = true;

    async function loadServerData() {
      try {
        // 1. Fetch settings
        const settingsRes = await fetch('/api/settings');
        if (settingsRes.ok) {
          const settings = await settingsRes.json();
          if (active) {
            if (settings.sheetUrl) {
              setSheetUrl(settings.sheetUrl);
              localStorage.setItem('saved_sheet_url', settings.sheetUrl);
            }
            if (settings.defaultYear) {
              setDefaultYearSetting(settings.defaultYear);
              localStorage.setItem('saved_default_year', settings.defaultYear);
            }
          }
        }

        // 2. Fetch data
        const dataRes = await fetch('/api/data');
        if (dataRes.ok) {
          const result = await dataRes.json();
          if (active) {
            if (result.exists) {
              setData(result.data);
              localStorage.setItem('saved_nguoi_co_cong_data', JSON.stringify(result.data));
            } else {
              // Server has no data saved yet. Let's upload current client state (localStorage or MOCK_DATA)
              const currentLocalData = localStorage.getItem('saved_nguoi_co_cong_data');
              let dataToUpload = MOCK_DATA;
              if (currentLocalData) {
                try {
                  dataToUpload = JSON.parse(currentLocalData);
                } catch (e) {}
              }
              fetch('/api/data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: dataToUpload })
              }).catch(err => console.error("Error initializing server data:", err));
            }
          }
        }
      } catch (err) {
        console.error("Failed to connect to backend api, using local storage fallback:", err);
      }
    }

    loadServerData();
    return () => {
      active = false;
    };
  }, []);

  const parseDateString = (dStr: string) => {
    if (!dStr) return null;
    if (dStr.includes('/')) {
        const parts = dStr.split('/');
        const year = parts[parts.length - 1];
        const month = parts.length >= 2 ? parseInt(parts[parts.length - 2]).toString().padStart(2, '0') : '01';
        const day = parts.length >= 3 ? parseInt(parts[parts.length - 3]).toString().padStart(2, '0') : '01';
        return new Date(`${year}-${month}-${day}`);
    } else if (dStr.includes('-')) {
        const parts = dStr.split('-');
        const year = parts[0];
        const month = parts.length >= 2 ? parseInt(parts[1]).toString().padStart(2, '0') : '01';
        const day = parts.length >= 3 ? parseInt(parts[2]).toString().padStart(2, '0') : '01';
        return new Date(`${year}-${month}-${day}`);
    } else {
        const d = new Date(dStr);
        if (!isNaN(d.getTime())) return d;
    }
    return null;
  };

  const executeResetData = () => {
    let finalData = data;
    if (resetMode === 'empty') {
      updateDataAndServer([]);
      updateSheetUrlAndServer('');
      setSuccessMsg('Đã xóa toàn bộ dữ liệu.');
      finalData = [];
    } else if (resetMode === 'all') {
      updateDataAndServer(MOCK_DATA);
      updateSheetUrlAndServer('');
      setSuccessMsg('Đã khôi phục toàn bộ dữ liệu mẫu gốc.');
      finalData = MOCK_DATA;
    } else {
      // Khôi phục theo thời gian
      const from = resetFromDate ? new Date(resetFromDate) : null;
      let to = resetToDate ? new Date(resetToDate) : null;
      if (to) {
        to.setDate(to.getDate() + 1); // Include full day
      }

      const isDateInRange = (d: Date | null) => {
        if (!d) return false;
        if (from && d < from) return false;
        if (to && d >= to) return false;
        return true;
      };

      // Giữ lại dữ liệu hiện tại KHÔNG NẰM TRONG khoảng thời gian reset
      const remainingData = data.filter(item => {
        const d = parseDateString(item.namDuLieu || '');
        return !isDateInRange(d); // Keep if NOT in range
      });

      // Lấy dữ liệu gốc (MOCK_DATA) NẰM TRONG khoảng thời gian reset
      const restoredMockData = MOCK_DATA.filter(item => {
        const d = parseDateString(item.namDuLieu || '');
        return isDateInRange(d); // Get if IN range
      });

      finalData = [...remainingData, ...restoredMockData];
      updateDataAndServer(finalData);

      setSuccessMsg('Đã khôi phục dữ liệu gốc cho khoảng thời gian đã chọn.');
    }
    
    setShowResetModal(false);
    setActiveSidebarTab('profiles');
    setTimeout(() => {
      fitAllMarkers(finalData);
    }, 400);
  };
  

  // Map settings, layers and directions state
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'terrain' | 'voyager'>('roadmap');
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [showTraffic, setShowTraffic] = useState<boolean>(false);
  const [showTransit, setShowTransit] = useState<boolean>(false);
  const [showBiking, setShowBiking] = useState<boolean>(false);
  const [showLayerPanel, setShowLayerPanel] = useState<boolean>(false);
  const [showWildfire, setShowWildfire] = useState<boolean>(false);
  const [showAirQuality, setShowAirQuality] = useState<boolean>(false);

  // Distance measuring states
  const [isMeasuring, setIsMeasuring] = useState<boolean>(false);
  const [measuredDistance, setMeasuredDistance] = useState<number | null>(null);
  const [measurePoints, setMeasurePoints] = useState<L.LatLng[]>([]);

  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [googleMapsEmbedUrl, setGoogleMapsEmbedUrl] = useState<string | null>(null);
  const [startType, setStartType] = useState<'gps' | 'person'>('gps');
  const [startPersonId, setStartPersonId] = useState<string>('');
  const [destPersonId, setDestPersonId] = useState<string>('');
  const [calculatedDistance, setCalculatedDistance] = useState<number | null>(null);
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);
  const [gpsCoords, setGpsCoords] = useState<[number, number] | null>(null);
  const [directionInstructions, setDirectionInstructions] = useState<string[]>([]);
  const [travelMode, setTravelMode] = useState<'driving' | 'foot' | 'bicycle'>('driving');
  const [routeDuration, setRouteDuration] = useState<number | null>(null);
  const [directionsLoading, setDirectionsLoading] = useState<boolean>(false);
  
  // Real-time navigation and simulation states
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [currentNavIndex, setCurrentNavIndex] = useState<number>(0);
  const [routeGeometry, setRouteGeometry] = useState<[number, number][]>([]);
  const watchPositionIdRef = useRef<number | null>(null);
  const simulationIntervalRef = useRef<any>(null);

  // Map references
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersGroupRef = useRef<L.FeatureGroup | null>(null);
  const markerMapRef = useRef<Map<string, L.Marker>>(new Map());
  const routingLineRef = useRef<L.Polyline | null>(null);
  const gpsMarkerRef = useRef<L.Marker | null>(null);
  const centerMarkerRef = useRef<L.Marker | null>(null);

  // References for Google Maps overlays
  const trafficLayerRef = useRef<L.TileLayer | null>(null);
  const transitLayerRef = useRef<L.TileLayer | null>(null);
  const bikingLayerRef = useRef<L.TileLayer | null>(null);
  const wildfireLayerRef = useRef<L.TileLayer | null>(null);
  const airQualityLayerRef = useRef<L.TileLayer | null>(null);

  // References for distance measurement
  const isMeasuringRef = useRef<boolean>(false);
  const measurePointsRef = useRef<L.LatLng[]>([]);
  const measureLineRef = useRef<L.Polyline | null>(null);
  const measureMarkersGroupRef = useRef<L.FeatureGroup | null>(null);

  // Set default view on map or adjust bounds to match markers
  const vietnamCenter: [number, number] = savedCenter; // Dynamic center based on user configuration

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapRef.current) return;

    // Initialize leaflet map
    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView(vietnamCenter, 14);

    // Custom scale & zoom placement
    // L.control.zoom({ position: 'topright' }).addTo(map);
    L.control.scale({ position: 'bottomleft', imperial: false }).addTo(map);

    const markersGroup = L.featureGroup().addTo(map);

    // Initial center marker (blinking red button)
    const centerIcon = L.divIcon({
      html: `<div class="relative flex items-center justify-center">
              <span class="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-red-500 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-4 w-4 bg-red-600 border-2 border-white shadow-lg"></span>
             </div>`,
      className: 'custom-center-marker-icon',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const initialCenterMarker = L.marker(vietnamCenter, { icon: centerIcon })
      .addTo(map)
      .bindPopup(`<div class="p-1.5 text-center"><b class="text-red-700 text-xs block mb-1">Vị Trí Trung Tâm Bản Đồ</b><span class="font-mono text-[10px] text-slate-500 block">${vietnamCenter[0].toFixed(5)}, ${vietnamCenter[1].toFixed(5)}</span></div>`);

    centerMarkerRef.current = initialCenterMarker;

    mapRef.current = map;
    setMapInstance(map);
    markersGroupRef.current = markersGroup;

    // Trigger initial fitBounds if we have data
    if (data?.length > 0) {
      setTimeout(() => {
        fitAllMarkers(data);
      }, 500);
    }

    // Add map click listener to show coordinates and copy button, or measure distance if enabled
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (isMeasuringRef.current) {
        const pts = [...measurePointsRef.current, e.latlng];
        measurePointsRef.current = pts;
        setMeasurePoints(pts);

        // Make sure the measure layers are added
        if (!measureMarkersGroupRef.current) {
          measureMarkersGroupRef.current = L.featureGroup().addTo(map);
        }

        // Add a marker styled exactly like Google Maps measuring points (white circle with blue border)
        const marker = L.marker(e.latlng, {
          icon: L.divIcon({
            className: 'custom-measure-marker-icon',
            html: `<div class="w-3.5 h-3.5 bg-white border-2 border-blue-600 rounded-full shadow-md flex items-center justify-center transition-transform hover:scale-125">
                     <div class="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                   </div>`,
            iconSize: [14, 14],
            iconAnchor: [7, 7]
          })
        }).addTo(measureMarkersGroupRef.current);

        // Update or draw polyline
        if (measureLineRef.current) {
          measureLineRef.current.setLatLngs(pts);
        } else {
          measureLineRef.current = L.polyline(pts, {
            color: '#2563EB',
            weight: 3,
            dashArray: '6, 6',
            lineJoin: 'round'
          }).addTo(map);
        }

        // Calculate cumulative distance
        let totalDist = 0;
        for (let i = 1; i < pts.length; i++) {
          totalDist += getHaversineDistance(pts[i - 1].lat, pts[i - 1].lng, pts[i].lat, pts[i].lng);
        }
        setMeasuredDistance(totalDist);

        // Add label overlay for the point showing current step or total distance
        const labelText = pts.length === 1 
          ? 'Điểm xuất phát' 
          : (totalDist >= 1 ? `${totalDist.toFixed(2)} km` : `${(totalDist * 1000).toFixed(0)} m`);

        marker.bindTooltip(labelText, {
          permanent: true,
          direction: 'top',
          offset: [0, -6],
          className: 'bg-blue-600 text-white font-bold text-[10px] px-2 py-0.5 rounded shadow-md border-none whitespace-nowrap z-[1000]'
        }).openTooltip();

        return;
      }

      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      const latLngStr = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

      L.popup()
        .setLatLng(e.latlng)
        .setContent(`
          <div class="p-2.5 font-sans text-center min-w-[200px]">
            <p class="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">Tọa độ điểm bấm</p>
            <p class="font-mono text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 py-1.5 px-2 rounded mb-2.5 select-all">${latLngStr}</p>
            <button 
              id="copy-coords-btn" 
              data-coords="${latLngStr}"
              class="w-full bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold py-1.5 px-2.5 rounded cursor-pointer transition-colors shadow-xs font-sans uppercase tracking-wider"
            >
              Sao chép tọa độ
            </button>
          </div>
        `)
        .openOn(map);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        setMapInstance(null);
      }
    };
  }, []);

  // Listen for copy coordinate clicks from map popups
  useEffect(() => {
    const handleCopyClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.id === 'copy-coords-btn') {
        const coords = target.getAttribute('data-coords');
        if (coords) {
          navigator.clipboard.writeText(coords)
            .then(() => {
              setSuccessMsg(`Đã sao chép tọa độ: ${coords}`);
              setTimeout(() => setSuccessMsg(null), 2500);
            })
            .catch(() => {
              // Fallback
              try {
                const tempInput = document.createElement('input');
                tempInput.value = coords;
                document.body.appendChild(tempInput);
                tempInput.select();
                document.execCommand('copy');
                document.body.removeChild(tempInput);
                setSuccessMsg(`Đã sao chép tọa độ: ${coords}`);
                setTimeout(() => setSuccessMsg(null), 2500);
              } catch (err) {
                console.error("Clipboard copy failed:", err);
              }
            });
        }
      }
    };

    document.addEventListener('click', handleCopyClick);
    return () => {
      document.removeEventListener('click', handleCopyClick);
    };
  }, []);

  // Synchronize isMeasuring to ref
  useEffect(() => {
    isMeasuringRef.current = isMeasuring;
    if (!isMeasuring) {
      // Clear measure layers
      if (measureMarkersGroupRef.current && mapInstance) {
        mapInstance.removeLayer(measureMarkersGroupRef.current);
        measureMarkersGroupRef.current = null;
      }
      if (measureLineRef.current && mapInstance) {
        mapInstance.removeLayer(measureLineRef.current);
        measureLineRef.current = null;
      }
      measurePointsRef.current = [];
      setMeasurePoints([]);
      setMeasuredDistance(null);
    }
  }, [isMeasuring, mapInstance]);

  // Manage map layers based on mapType state and overlays
  useEffect(() => {
    if (!mapInstance) return;

    if (tileLayerRef.current) {
      mapInstance.removeLayer(tileLayerRef.current);
    }

    if (trafficLayerRef.current) {
      mapInstance.removeLayer(trafficLayerRef.current);
      trafficLayerRef.current = null;
    }
    if (transitLayerRef.current) {
      mapInstance.removeLayer(transitLayerRef.current);
      transitLayerRef.current = null;
    }
    if (bikingLayerRef.current) {
      mapInstance.removeLayer(bikingLayerRef.current);
      bikingLayerRef.current = null;
    }
    if (wildfireLayerRef.current) {
      mapInstance.removeLayer(wildfireLayerRef.current);
      wildfireLayerRef.current = null;
    }
    if (airQualityLayerRef.current) {
      mapInstance.removeLayer(airQualityLayerRef.current);
      airQualityLayerRef.current = null;
    }

    let url = '';
    let maxZoom = 21;

    if (mapType === 'voyager') {
      url = showLabels 
        ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png';
      maxZoom = 19;
    } else if (mapType === 'roadmap') {
      url = showLabels 
        ? 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}'
        : 'https://mt1.google.com/vt/lyrs=r&x={x}&y={y}&z={z}';
      maxZoom = 21;
    } else if (mapType === 'satellite') {
      url = showLabels
        ? 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}' // Satellite with roads & labels
        : 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'; // Satellite imagery only
      maxZoom = 21;
    } else if (mapType === 'terrain') {
      url = showLabels
        ? 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}' // Terrain with roads & labels
        : 'https://mt1.google.com/vt/lyrs=t&x={x}&y={y}&z={z}'; // Terrain only
      maxZoom = 21;
    }

    const options: L.TileLayerOptions = {
      maxZoom,
      attribution: mapType === 'voyager' ? '© OpenStreetMap, © CartoDB' : '© Google Maps'
    };
    if (mapType === 'voyager') {
      options.subdomains = 'abcd';
    }
    const tileLayer = L.tileLayer(url, options);
    tileLayer.addTo(mapInstance);
    tileLayerRef.current = tileLayer;

    // Add overlays if enabled
    if (showTraffic) {
      const trafficLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=h,traffic&x={x}&y={y}&z={z}', {
        maxZoom: 21,
        attribution: '© Google Maps Traffic'
      });
      trafficLayer.addTo(mapInstance);
      trafficLayerRef.current = trafficLayer;
    }

    if (showTransit) {
      const transitLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=h,transit&x={x}&y={y}&z={z}', {
        maxZoom: 21,
        attribution: '© Google Maps Transit'
      });
      transitLayer.addTo(mapInstance);
      transitLayerRef.current = transitLayer;
    }

    if (showBiking) {
      const bikingLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=h,bicycling&x={x}&y={y}&z={z}', {
        maxZoom: 21,
        attribution: '© Google Maps Bicycling'
      });
      bikingLayer.addTo(mapInstance);
      bikingLayerRef.current = bikingLayer;
    }

    if (showWildfire) {
      // Simulate/Show wildfire overlay using transparent active lines or highlight active regions
      const wildfireLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=h&x={x}&y={y}&z={z}', {
        maxZoom: 21,
        opacity: 0.35,
        attribution: '© Google Maps Wildfire'
      });
      wildfireLayer.addTo(mapInstance);
      wildfireLayerRef.current = wildfireLayer;
    }

    if (showAirQuality) {
      // Air quality custom tile overlay
      const airQualityLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=h&x={x}&y={y}&z={z}', {
        maxZoom: 21,
        opacity: 0.25,
        attribution: '© Google Maps Air Quality'
      });
      airQualityLayer.addTo(mapInstance);
      airQualityLayerRef.current = airQualityLayer;
    }
  }, [mapInstance, mapType, showLabels, showTraffic, showTransit, showBiking, showWildfire, showAirQuality]);

  // Haversine formula helper
  const getHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Bearing text helper
  const getBearingText = (lat1: number, lon1: number, lat2: number, lon2: number): string => {
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const lat1Rad = lat1 * Math.PI / 180;
    const lat2Rad = lat2 * Math.PI / 180;
    
    const y = Math.sin(dLon) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
              Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
    let brng = Math.atan2(y, x) * 180 / Math.PI;
    brng = (brng + 360) % 360;
    
    const directions = ['Bắc', 'Đông Bắc', 'Đông', 'Đông Nam', 'Nam', 'Tây Nam', 'Tây', 'Tây Bắc'];
    const index = Math.round(brng / 45) % 8;
    return directions[index];
  };

  // Find current GPS location of the user
  const detectGPSLocation = () => {
    if (!navigator.geolocation) {
      alert('Trình duyệt của bạn không hỗ trợ định vị GPS.');
      return;
    }
    setGpsLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: [number, number] = [position.coords.latitude, position.coords.longitude];
        setGpsCoords(coords);
        setGpsLoading(false);
        
        // Add or update GPS marker on map
        if (mapInstance) {
          if (gpsMarkerRef.current) {
            mapInstance.removeLayer(gpsMarkerRef.current);
          }
          
          const gpsIcon = L.divIcon({
            html: `<div class="relative flex items-center justify-center">
                    <span class="animate-ping absolute inline-flex h-6 w-6 rounded-full bg-blue-400 opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-4 h-4 bg-blue-600 border-2 border-white shadow-md"></span>
                   </div>`,
            className: '',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          });
          
          const marker = L.marker(coords, { icon: gpsIcon })
            .addTo(mapInstance)
            .bindPopup('<b class="text-blue-600">Vị trí hiện tại của bạn</b>')
            .openPopup();
            
          gpsMarkerRef.current = marker;
          mapInstance.setView(coords, 15);
        }
      },
      (err) => {
        setGpsLoading(false);
        console.error(err ? err.message || err : 'Lỗi định vị');
        alert('Không thể xác định vị trí GPS của bạn. Vui lòng cấp quyền truy cập vị trí hoặc chọn điểm xuất phát từ danh sách.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Draw the flashing red center marker
  const drawCenterMarker = (coords: [number, number]) => {
    if (!mapInstance) return;

    if (centerMarkerRef.current) {
      mapInstance.removeLayer(centerMarkerRef.current);
    }

    const centerIcon = L.divIcon({
      html: `<div class="relative flex items-center justify-center">
              <span class="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-red-500 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-4 w-4 bg-red-600 border-2 border-white shadow-lg"></span>
             </div>`,
      className: 'custom-center-marker-icon',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const marker = L.marker(coords, { icon: centerIcon })
      .addTo(mapInstance)
      .bindPopup('<div class="p-1.5 text-center"><b class="text-red-700 text-xs block mb-1">Vị Trí Trung Tâm Bản Đồ</b><span class="font-mono text-[10px] text-slate-500 block">' + coords[0].toFixed(5) + ', ' + coords[1].toFixed(5) + '</span></div>')
      .openPopup();

    centerMarkerRef.current = marker;
  };

  // Helper to translate modifier to Vietnamese direction
  const translateOSRMModifier = (modifier: string): string => {
    switch (modifier) {
      case 'left': return 'rẽ trái';
      case 'right': return 'rẽ phải';
      case 'sharp left': return 'rẽ ngoặt bên trái';
      case 'sharp right': return 'rẽ ngoặt bên phải';
      case 'slight left': return 'chếch sang trái';
      case 'slight right': return 'chếch sang phải';
      case 'straight': return 'đi thẳng';
      case 'uturn': return 'quay đầu lại';
      default: return 'đi tiếp';
    }
  };

  // Helper to format OSRM distance nicely
  const formatRouteDistance = (meters: number): string => {
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
  };

  // Helper to format OSRM duration nicely
  const formatRouteDuration = (seconds: number): string => {
    if (seconds < 60) return 'Dưới 1 phút';
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes} phút`;
    const hours = Math.floor(minutes / 60);
    const remMins = minutes % 60;
    return remMins > 0 ? `${hours} giờ ${remMins} phút` : `${hours} giờ`;
  };

  // Draw the route line and update instructions
  const drawRouteLine = async (overrideStartCoords?: [number, number]) => {
    if (!mapInstance) return;

    // Clear existing routing line
    if (routingLineRef.current) {
      mapInstance.removeLayer(routingLineRef.current);
      routingLineRef.current = null;
    }

    let startLat = 0;
    let startLng = 0;
    let startName = '';

    if (overrideStartCoords) {
      startLat = overrideStartCoords[0];
      startLng = overrideStartCoords[1];
      startName = 'Vị trí hiện tại của bạn';
    } else if (startType === 'gps') {
      if (!gpsCoords) {
        alert('Vui lòng bật định vị GPS trước bằng cách bấm vào nút "Lấy Vị Trí Hiện Tại"!');
        return;
      }
      startLat = gpsCoords[0];
      startLng = gpsCoords[1];
      startName = 'Vị trí hiện tại của bạn';
    } else {
      const startP = data.find(p => p.id === startPersonId);
      if (!startP) {
        alert('Vui lòng chọn người có công xuất phát.');
        return;
      }
      startLat = startP.lat;
      startLng = startP.lng;
      startName = startP.hoTen;
    }

    const destP = data.find(p => p.id === destPersonId);
    if (!destP) {
      alert('Vui lòng chọn người có công đích đến.');
      return;
    }
    const destLat = destP.lat;
    const destLng = destP.lng;
    const destName = destP.hoTen;

    if (startLat === destLat && startLng === destLng) {
      alert('Điểm xuất phát và điểm đích trùng nhau!');
      return;
    }

    setDirectionsLoading(true);

    // OSRM Profile mapping
    const profileMap = {
      driving: 'driving',
      foot: 'foot',
      bicycle: 'bicycle'
    };
    const profile = profileMap[travelMode] || 'driving';

    try {
      // Fetch route from public OSRM server (lon,lat format)
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/${profile}/${startLng},${startLat};${destLng},${destLat}?overview=full&geometries=geojson&steps=true`
      );
      
      if (!response.ok) {
        throw new Error('OSRM response status is not OK');
      }

      const resData = await response.json();

      if (resData.code !== 'Ok' || !resData.routes || resData.routes.length === 0) {
        throw new Error('No valid route found in OSRM response');
      }

      const route = resData.routes[0];
      const distInKm = route.distance / 1000;
      setCalculatedDistance(distInKm);
      setRouteDuration(route.duration);

      // Convert coordinates from [longitude, latitude] to [latitude, longitude] for Leaflet
      const latlngs: [number, number][] = route.geometry.coordinates.map((coord: [number, number]) => [
        coord[1],
        coord[0]
      ]);
      setRouteGeometry(latlngs);

      // Styling parameters
      let lineColor = '#1d4ed8'; // Bold Blue for driving
      let lineDashArray = '';
      if (travelMode === 'foot') {
        lineColor = '#d97706'; // Amber/Orange
        lineDashArray = '5, 8';
      } else if (travelMode === 'bicycle') {
        lineColor = '#059669'; // Emerald Green
        lineDashArray = '2, 6';
      }

      const polyline = L.polyline(latlngs, {
        color: lineColor,
        weight: 5,
        dashArray: lineDashArray,
        opacity: 0.85,
        lineJoin: 'round'
      }).addTo(mapInstance);

      routingLineRef.current = polyline;

      // Fit map bounds to show the entire route
      mapInstance.fitBounds(polyline.getBounds(), { padding: [60, 60] });

      // Generate localized turn-by-turn routing steps
      const totalDistanceText = formatRouteDistance(route.distance);
      const totalDurationText = formatRouteDuration(route.duration);
      const modeText = travelMode === 'driving' ? 'Ô tô' : travelMode === 'bicycle' ? 'Xe đạp' : 'Đi bộ';

      const steps = route.legs?.[0]?.steps || [];
      const stepsInstructions: string[] = [];

      stepsInstructions.push(
        `Phương tiện: ${modeText} | Thời gian ước tính: ${totalDurationText} (${totalDistanceText})`
      );

      if (steps.length > 0) {
        steps.forEach((step: any, index: number) => {
          const stepName = step.name ? `vào ${step.name}` : 'vào đường tiếp theo';
          const stepDist = step.distance;
          const stepDistText = formatRouteDistance(stepDist);
          const type = step.maneuver?.type;
          const modifier = step.maneuver?.modifier;

          let stepInstruction = '';

          if (index === 0) {
            stepInstruction = `Khởi hành từ ${startName} ${stepName}, đi khoảng ${stepDistText}.`;
          } else if (index === steps.length - 1) {
            stepInstruction = `Đi tiếp ${stepDistText} để đến điểm hẹn: ${destName}.`;
          } else {
            const turnAction = translateOSRMModifier(modifier);
            if (type === 'turn') {
              stepInstruction = `${turnAction.charAt(0).toUpperCase() + turnAction.slice(1)} ${stepName}, đi khoảng ${stepDistText}.`;
            } else if (type === 'new name') {
              stepInstruction = `Đi tiếp ${stepName}, đi khoảng ${stepDistText}.`;
            } else if (type === 'ramp') {
              stepInstruction = `Lên đường nhánh ${stepName}, đi khoảng ${stepDistText}.`;
            } else if (type === 'roundabout') {
              stepInstruction = `Đi vào vòng xuyến ${stepName}, đi tiếp ${stepDistText}.`;
            } else {
              stepInstruction = `Tiếp tục đi thẳng ${stepName}, đi khoảng ${stepDistText}.`;
            }
          }

          stepsInstructions.push(stepInstruction);
        });
      } else {
        stepsInstructions.push(`Từ ${startName} di chuyển dọc theo lộ trình đường bộ đến ${destName}.`);
      }

      setDirectionInstructions(stepsInstructions);

    } catch (error) {
      console.warn('OSRM routing request failed. Falling back to straight-line estimation.', error);
      
      // Fallback straight line
      const dist = getHaversineDistance(startLat, startLng, destLat, destLng);
      setCalculatedDistance(dist);

      // Estimate duration based on mode
      let speedKmh = 40; // driving
      if (travelMode === 'foot') speedKmh = 5;
      else if (travelMode === 'bicycle') speedKmh = 15;
      
      const estimatedSecs = (dist / speedKmh) * 3600;
      setRouteDuration(estimatedSecs);

      const latlngs: [number, number][] = [
        [startLat, startLng],
        [destLat, destLng]
      ];

      // Draw route line (dashed, fallback)
      const polyline = L.polyline(latlngs, {
        color: '#ef4444', // Red for straight-line fallback
        weight: 4,
        dashArray: '8, 8',
        opacity: 0.8
      }).addTo(mapInstance);

      routingLineRef.current = polyline;
      mapInstance.fitBounds(polyline.getBounds(), { padding: [60, 60] });

      const distText = dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist.toFixed(2)} km`;
      const durationText = formatRouteDuration(estimatedSecs);
      const heading = getBearingText(startLat, startLng, destLat, destLng);
      const modeText = travelMode === 'driving' ? 'Ô tô' : travelMode === 'bicycle' ? 'Xe đạp' : 'Đi bộ';

      const fallbackInstructions = [
        `Chế độ: ${modeText} (Đường thẳng ước tính)`,
        `Điểm xuất phát: ${startName}`,
        `Điểm đến: ${destName} (${destP.dienChinhSach})`,
        `Thời gian di chuyển ước tính: khoảng ${durationText}`,
        `Khoảng cách đường thẳng ước tính: ${distText}`,
        `Hướng di chuyển chính: Hướng ${heading}`,
        `Gợi ý: Do lỗi kết nối bản đồ chi tiết, đang hiển thị đường thẳng ước tính. Nhấp "Mở Google Maps" để nhận lộ trình chính xác.`
      ];

      setDirectionInstructions(fallbackInstructions);
    } finally {
      setDirectionsLoading(false);
    }
  };

  // Clear directions and route line
  const clearRouteLine = () => {
    // Clean up live navigation and simulation
    if (watchPositionIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchPositionIdRef.current);
      watchPositionIdRef.current = null;
    }
    if (simulationIntervalRef.current !== null) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
    setIsNavigating(false);
    setIsSimulating(false);
    setCurrentNavIndex(0);
    setRouteGeometry([]);

    if (routingLineRef.current && mapInstance) {
      mapInstance.removeLayer(routingLineRef.current);
      routingLineRef.current = null;
    }
    if (gpsMarkerRef.current && mapInstance) {
      mapInstance.removeLayer(gpsMarkerRef.current);
      gpsMarkerRef.current = null;
    }
    setCalculatedDistance(null);
    setRouteDuration(null);
    setGpsCoords(null);
    setDirectionInstructions([]);
    setDirectionsLoading(false);
  };

  // Recalculate route automatically when travelMode changes and a route is already active
  useEffect(() => {
    if (activeSidebarTab === 'directions' && calculatedDistance !== null) {
      drawRouteLine();
    }
  }, [travelMode]);

  // Clean up watchers and timers on unmount
  useEffect(() => {
    return () => {
      if (watchPositionIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchPositionIdRef.current);
      }
      if (simulationIntervalRef.current !== null) {
        clearInterval(simulationIntervalRef.current);
      }
    };
  }, []);

  // Start live online navigation using GPS watchPosition
  const startLiveNavigation = () => {
    if (!mapInstance) return;

    if (!navigator.geolocation) {
      alert("Trình duyệt không hỗ trợ định vị GPS!");
      return;
    }

    if (watchPositionIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchPositionIdRef.current);
    }
    if (simulationIntervalRef.current !== null) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
    setIsSimulating(false);

    setDirectionsLoading(true);
    setIsNavigating(true);
    setStartType('gps');

    watchPositionIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newCoords: [number, number] = [latitude, longitude];
        setGpsCoords(newCoords);
        setDirectionsLoading(false);

        if (gpsMarkerRef.current) {
          mapInstance.removeLayer(gpsMarkerRef.current);
        }

        const navIcon = L.divIcon({
          html: `<div class="relative flex items-center justify-center">
                  <span class="animate-ping absolute inline-flex h-10 w-10 rounded-full bg-blue-500 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-5 w-5 bg-blue-600 border-2 border-white shadow-lg flex items-center justify-center">
                    <span class="w-2 h-2 rounded-full bg-white"></span>
                  </span>
                 </div>`,
          className: 'custom-nav-location-icon',
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        });

        const marker = L.marker(newCoords, { icon: navIcon })
          .addTo(mapInstance)
          .bindPopup('<b class="text-blue-700">Vị trí trực tuyến của bạn</b>');
        gpsMarkerRef.current = marker;

        mapInstance.setView(newCoords, 17);
        drawRouteLine(newCoords);
      },
      (error) => {
        setDirectionsLoading(false);
        console.error("Watch position error:", error);
        alert(`Lỗi định vị trực tuyến: ${error.message || 'Không thể lấy GPS'}`);
        stopLiveNavigation();
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const stopLiveNavigation = () => {
    if (watchPositionIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchPositionIdRef.current);
      watchPositionIdRef.current = null;
    }
    setIsNavigating(false);
  };

  // Start route movement simulation (virtual GPS progress along polyline coordinates)
  const startSimulation = () => {
    if (!mapInstance) return;
    if (routeGeometry.length === 0) {
      alert("Vui lòng nhấp vào 'Vẽ Chỉ Hướng' trước để tính lộ trình di chuyển.");
      return;
    }

    stopLiveNavigation();

    if (simulationIntervalRef.current !== null) {
      clearInterval(simulationIntervalRef.current);
    }

    setIsSimulating(true);
    setCurrentNavIndex(0);

    const intervalId = setInterval(() => {
      setCurrentNavIndex((prevIndex) => {
        const nextIndex = prevIndex + 1;
        if (nextIndex >= routeGeometry.length) {
          clearInterval(intervalId);
          setIsSimulating(false);
          alert("Mô phỏng hoàn thành! Bạn đã đến điểm đích.");
          return prevIndex;
        }

        const nextCoords = routeGeometry[nextIndex];
        
        if (gpsMarkerRef.current) {
          mapInstance.removeLayer(gpsMarkerRef.current);
        }

        const simIcon = L.divIcon({
          html: `<div class="relative flex items-center justify-center">
                  <span class="animate-ping absolute inline-flex h-10 w-10 rounded-full bg-emerald-500 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-5 w-5 bg-emerald-600 border-2 border-white shadow-lg flex items-center justify-center">
                    <span class="w-1.5 h-1.5 rounded-full bg-white"></span>
                  </span>
                 </div>`,
          className: 'custom-sim-location-icon',
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        });

        const marker = L.marker(nextCoords, { icon: simIcon })
          .addTo(mapInstance)
          .bindPopup('<b class="text-emerald-700">Mô phỏng di chuyển (GPS ảo)</b>')
          .openPopup();
        gpsMarkerRef.current = marker;

        mapInstance.setView(nextCoords, 17);

        return nextIndex;
      });
    }, 1500);

    simulationIntervalRef.current = intervalId;
  };

  const stopSimulation = () => {
    if (simulationIntervalRef.current !== null) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
    setIsSimulating(false);
  };

  // Helper to generate and download a perfectly structured and formatted Excel file template
  const downloadExcelTemplate = () => {
    try {
      // Perfect column headers as expected by parseCSVToNguoiCoCong with separate family columns
      const headers = [
        'Họ tên',
        'Năm sinh',
        'Diện chính sách',
        'Tình trạng',
        'Địa chỉ',
        'Tọa độ Lat',
        'Tọa độ Lng',
        'Họ tên thân nhân',
        'SĐT thân nhân',
        'Quan hệ với người có công',
        'Tiểu sử và Thành tích',
        'Hình ảnh',
        'Năm dữ liệu'
      ];

      // Highly detailed, realistic Vietnamese sample rows matching the application MOCK_DATA
      const samples = [
        {
          'Họ tên': 'Nguyễn Văn A',
          'Năm sinh': '1948',
          'Diện chính sách': 'Thương binh hạng 2/4',
          'Tình trạng': 'Hưu trí (Cựu chiến binh)',
          'Địa chỉ': 'Thôn 1, xã Hàm Yên, huyện Hàm Yên, tỉnh Tuyên Quang',
          'Tọa độ Lat': 21.9863,
          'Tọa độ Lng': 105.0863,
          'Họ tên thân nhân': 'Nguyễn Văn Hải',
          'SĐT thân nhân': '0912345678',
          'Quan hệ với người có công': 'Con ruột',
          'Tiểu sử và Thành tích': 'Tham gia kháng chiến chống Mỹ cứu nước, chiến đấu tại chiến trường Quảng Trị năm 1972. Được trao tặng Huân chương Kháng chiến hạng Nhì, Huân chương Chiến sĩ vẻ vang.',
          'Hình ảnh': 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
          'Năm dữ liệu': '2026'
        },
        {
          'Họ tên': 'Trần Thị B',
          'Năm sinh': '1930',
          'Diện chính sách': 'Bà mẹ Việt Nam Anh hùng',
          'Tình trạng': 'Đã mất (Đã chết)',
          'Địa chỉ': 'Thôn 3, xã Hàm Yên, huyện Hàm Yên, tỉnh Tuyên Quang',
          'Tọa độ Lat': 21.9885,
          'Tọa độ Lng': 105.0890,
          'Họ tên thân nhân': 'Trần Văn Khang',
          'SĐT thân nhân': '0987654321',
          'Quan hệ với người có công': 'Cháu nội',
          'Tiểu sử và Thành tích': 'Có chồng và hai con trai hy sinh trong kháng chiến chống Mỹ cứu nước. Được phong tặng danh hiệu cao quý "Bà mẹ Việt Nam Anh hùng" năm 1996.',
          'Hình ảnh': 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150',
          'Năm dữ liệu': '2026'
        },
        {
          'Họ tên': 'Phạm Văn C',
          'Năm sinh': '1955',
          'Diện chính sách': 'Bệnh binh',
          'Tình trạng': 'Đang công tác',
          'Địa chỉ': 'Thôn 2, xã Hàm Yên, huyện Hàm Yên, tỉnh Tuyên Quang',
          'Tọa độ Lat': 21.9840,
          'Tọa độ Lng': 105.0845,
          'Họ tên thân nhân': 'Lê Thị Hoa',
          'SĐT thân nhân': '0905123456',
          'Quan hệ với người có công': 'Vợ',
          'Tiểu sử và Thành tích': 'Tham gia chiến đấu bảo vệ biên giới phía Bắc năm 1979. Là cựu chiến binh tích cực tham gia các phong trào xã hội tại địa phương.',
          'Hình ảnh': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
          'Năm dữ liệu': '2026'
        }
      ];

      // Convert json to sheet with explicitly defined headers
      const ws = XLSX.utils.json_to_sheet(samples, { header: headers });

      // Precise column widths (in characters) to avoid text truncating
      ws['!cols'] = [
        { wch: 22 }, // Họ tên
        { wch: 10 }, // Năm sinh
        { wch: 28 }, // Diện chính sách
        { wch: 18 }, // Tình trạng
        { wch: 45 }, // Địa chỉ
        { wch: 14 }, // Tọa độ Lat
        { wch: 14 }, // Tọa độ Lng
        { wch: 22 }, // Họ tên thân nhân
        { wch: 16 }, // SĐT thân nhân
        { wch: 24 }, // Quan hệ với người có công
        { wch: 65 }, // Tiểu sử và Thành tích
        { wch: 30 }, // Hình ảnh
        { wch: 12 }  // Năm dữ liệu
      ];

      // Create new workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Mau_Danh_Sach');

      // Export file
      XLSX.writeFile(wb, 'Mau_Danh_Sach_Nguoi_Co_Cong_Ham_Yen.xlsx');
      setSuccessMsg('Tải file Excel mẫu thành công! Bạn có thể chỉnh sửa tệp này và tải lên lại.');
    } catch (err: any) {
      setError(`Không thể tạo file mẫu Excel: ${err.message}`);
    }
  };

  // Sync / Load spreadsheet data
  const handleSync = async (urlToSync: string) => {
    if (!urlToSync) {
      setError('Vui lòng nhập đường dẫn Google Sheets CSV hợp lệ.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const response = await fetch(urlToSync);
      if (!response.ok) {
        throw new Error('Không thể kết nối đến tệp dữ liệu. Vui lòng kiểm tra lại URL và quyền chia sẻ.');
      }
      const csvText = await response.text();

      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.data && results.data?.length > 0) {
            const parsed = parseCSVToNguoiCoCong(results.data);
            if (parsed?.length === 0) {
              setError('Kết nối thành công nhưng cấu trúc các cột (headers) không khớp với tiêu chuẩn. Vui lòng tải dữ liệu đúng cấu trúc.');
              setIsLoading(false);
            } else {
              updateDataAndServer(parsed);
              updateSheetUrlAndServer(urlToSync);
              setSuccessMsg(`Đồng bộ thành công! Đã cập nhật thông tin của ${parsed?.length} người có công.`);
              setShowSyncModal(false);
              setActiveSidebarTab('profiles');
              setIsLoading(false);
              
              // Fit map bounds to new markers
              setTimeout(() => {
                fitAllMarkers(parsed);
              }, 400);
            }
          } else {
            setError('File dữ liệu trống hoặc định dạng không đúng.');
            setIsLoading(false);
          }
        },
        error: (err) => {
          setError(`Lỗi phân tích dữ liệu: ${err.message}`);
          setIsLoading(false);
        }
      });
    } catch (err: any) {
      setError(err.message || 'Lỗi bất định khi kết nối với Google Sheets.');
      setIsLoading(false);
    }
  };

  // Upload local Excel (.xlsx, .xls) or CSV
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData = XLSX.utils.sheet_to_json(ws);

        if (rawData && rawData?.length > 0) {
          const parsed = parseCSVToNguoiCoCong(rawData);
          if (parsed?.length === 0) {
            setError('Đọc tệp thành công nhưng cấu trúc các cột không khớp với tiêu chuẩn. Vui lòng kiểm tra dòng tiêu đề (headers) tiếng Việt của tệp.');
            setIsLoading(false);
          } else {
            updateDataAndServer(parsed);
            setSuccessMsg(`Đồng bộ thành công từ tệp cục bộ! Đã cập nhật thông tin của ${parsed?.length} người có công.`);
            setShowSyncModal(false);
            setActiveSidebarTab('profiles');
            setIsLoading(false);
            
            // Fit map bounds to new markers
            setTimeout(() => {
              fitAllMarkers(parsed);
            }, 400);
          }
        } else {
          setError('Tệp trống hoặc định dạng không đúng.');
          setIsLoading(false);
        }
      } catch (err: any) {
        setError(`Lỗi xử lý tệp: ${err.message}`);
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
      setError('Lỗi đọc tập tin.');
      setIsLoading(false);
    };
    reader.readAsBinaryString(file);
  };

  // Reset to default mock data
  
  // Dynamic filter lists
  
  const listYears = useMemo(() => {
    const years = new Set<string>();
    const currentYear = new Date().getFullYear().toString();
    years.add(currentYear); // Always include current year
    data.forEach(item => {
      const dStr = item.namDuLieu || '';
      const match = dStr.match(/\b(20\d{2})\b/);
      if (match) {
        years.add(match[1]);
      }
    });
    return Array.from(years).sort().reverse(); // Newest first
  }, [data]);

  const listDienChinhSach = useMemo(() => {
    const list = new Set<string>([
      'Lão thành cách mạng',
      'Cán bộ tiền khởi nghĩa',
      'Liệt sĩ',
      'Bà mẹ Việt Nam anh hùng',
      'Anh hùng Lực lượng vũ trang nhân dân',
      'Anh hùng Lao động trong thời kỳ kháng chiến',
      'Thương binh',
      'Bệnh binh',
      'Người hoạt động kháng chiến bị nhiễm chất độc hóa học',
      'Người hoạt động cách mạng, kháng chiến, bảo vệ Tổ quốc, làm nghĩa vụ quốc tế bị địch bắt tù, đày',
      'Người hoạt động kháng chiến giải phóng dân tộc, bảo vệ Tổ quốc, làm nghĩa vụ quốc tế',
      'Người có công giúp đỡ cách mạng'
    ]);
    data.forEach(item => {
      if (item.dienChinhSach) {
        list.add(item.dienChinhSach);
      }
    });
    return ['Tất cả', ...Array.from(list)];
  }, [data]);

    

  

  // Compute filtered items
  const filteredData = useMemo(() => {
    return (data || []).filter((item) => {
      const activeSearch = searchQuery || globalSearchQuery;
      const matchSearch = 
        item.hoTen.toLowerCase().includes(activeSearch.toLowerCase()) || 
        item.diaChi.toLowerCase().includes(activeSearch.toLowerCase());
      
      const matchDien = selectedDienChinhSach === 'Tất cả' || item.dienChinhSach === selectedDienChinhSach;
      const matchTinhTrang = (() => {
        if (selectedTinhTrang === 'Tất cả') return true;
        if (selectedTinhTrang === 'Hưu trí (Cựu chiến binh)' || selectedTinhTrang === 'Còn sống') {
          return item.tinhTrang === 'Hưu trí (Cựu chiến binh)' || item.tinhTrang === 'Còn sống' || item.tinhTrang === 'Đang công tác';
        }
        if (selectedTinhTrang === 'Đang công tác') {
          return item.tinhTrang === 'Đang công tác';
        }
        if (selectedTinhTrang === 'Đã mất') {
          return item.tinhTrang === 'Đã mất' || item.tinhTrang === 'Đã mất (Đã chết)';
        }
        return item.tinhTrang === selectedTinhTrang;
      })();
      const matchTime = (() => {
        let matchesMonth = true;
        let itemDate = null;
        const dStr = item.namDuLieu || '';
        
        // Parse date for range comparison
        if (dStr.includes('/')) {
            const parts = dStr.split('/');
            const year = parts[parts.length - 1];
            const month = parts.length >= 2 ? parseInt(parts[parts.length - 2]).toString().padStart(2, '0') : '01';
            const day = parts.length >= 3 ? parseInt(parts[parts.length - 3]).toString().padStart(2, '0') : '01';
            itemDate = new Date(`${year}-${month}-${day}`);
        } else if (dStr.includes('-')) {
            const parts = dStr.split('-');
            const year = parts[0];
            const month = parts.length >= 2 ? parseInt(parts[1]).toString().padStart(2, '0') : '01';
            const day = parts.length >= 3 ? parseInt(parts[2]).toString().padStart(2, '0') : '01';
            itemDate = new Date(`${year}-${month}-${day}`);
        } else {
            const d = new Date(dStr);
            if (!isNaN(d.getTime())) {
                itemDate = d;
            }
        }

        // Check month/year if selected
        if (selectedYear || selectedMonth) {
            let itemYear = '';
            let itemMonth = '';
            
            // Extract Year
            if (itemDate && !isNaN(itemDate.getTime())) {
                itemYear = itemDate.getFullYear().toString();
            } else if (dStr.match(/\b(20\d{2})\b/)) {
                itemYear = dStr.match(/\b(20\d{2})\b/)[1];
            } else if (dStr.match(/\b(\d{4})\b/)) {
                itemYear = dStr.match(/\b(\d{4})\b/)[1];
            }
            
            // Extract Month ONLY if it actually exists in the string
            if (dStr.includes('/')) {
                const p = dStr.split('/');
                if (p.length >= 2) itemMonth = parseInt(p[p.length - 2]).toString().padStart(2, '0');
            } else if (dStr.includes('-')) {
                const p = dStr.split('-');
                if (p.length >= 2) itemMonth = parseInt(p[1]).toString().padStart(2, '0');
            }

            if (selectedYear && itemYear !== selectedYear) matchesMonth = false;
            if (selectedMonth && itemMonth !== selectedMonth) matchesMonth = false;
        }

        return matchesMonth;
      })();

      const matchHideSettings = (() => {
        if (hideHuutri && (item.tinhTrang === 'Hưu trí (Cựu chiến binh)' || item.tinhTrang === 'Còn sống')) return false;
        if (hideDaMat && (item.tinhTrang === 'Đã mất (Đã chết)' || item.tinhTrang === 'Đã mất')) return false;
        if (hideDangCongTac && item.tinhTrang === 'Đang công tác') return false;
        return true;
      })();

      return matchSearch && matchDien && matchTinhTrang && matchTime && matchHideSettings;
    });
  }, [data, searchQuery, globalSearchQuery, selectedDienChinhSach, selectedTinhTrang, selectedYear, selectedMonth, hideHuutri, hideDaMat, hideDangCongTac]);

  // Global Search Results
  const globalSearchResults = useMemo(() => {
    if (!globalSearchQuery.trim() || !data) return [];
    return data.filter(item => 
      item.hoTen.toLowerCase().includes(globalSearchQuery.toLowerCase()) || 
      item.diaChi.toLowerCase().includes(globalSearchQuery.toLowerCase())
    ).slice(0, 10); // Limit to 10 results
  }, [data, globalSearchQuery]);

  // Dashboard Statistics
  const stats = useMemo(() => {
    const total = (data || [])?.length;
    const conSong = (data || []).filter(item => item.tinhTrang === 'Hưu trí (Cựu chiến binh)' || item.tinhTrang === 'Còn sống')?.length;
    const dangCongTac = (data || []).filter(item => item.tinhTrang === 'Đang công tác')?.length;
    const daMat = (data || []).filter(item => item.tinhTrang === 'Đã mất (Đã chết)')?.length;
    return { total, conSong, dangCongTac, daMat };
  }, [data]);

  // Map automatic fitting helper
  const fitAllMarkers = (points: NguoiCoCong[]) => {
    if (!mapRef.current || !markersGroupRef.current || points?.length === 0) return;
    try {
      const bounds = L.latLngBounds(points.map(p => [p.lat, p.lng]));
      mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    } catch (e) {
      console.error("Fit bounds failed:", e);
    }
  };

  // Helper to create custom Marker icons with dynamic color based on status
  const createMarkerIcon = (person: NguoiCoCong, isSelected: boolean) => {
    let colorClass = 'bg-red-600 border-red-100 text-white';
    let ringClass = 'ring-red-400/50';
    let pulseClass = 'marker-pulse-red';
    let iconSymbol = '★';

    if (person.tinhTrang === 'Đã mất (Đã chết)') {
      colorClass = 'bg-slate-500 border-slate-200 text-slate-100';
      ringClass = 'ring-slate-300/50';
      pulseClass = ''; // No pulse animation for deceased heroes
      iconSymbol = '🕯';
    } else if (person.tinhTrang === 'Đang công tác') {
      colorClass = 'bg-amber-500 border-amber-100 text-amber-950';
      ringClass = 'ring-amber-300/50';
      pulseClass = 'marker-pulse-amber';
      iconSymbol = '💼';
    }

    const scaleClass = isSelected 
      ? 'scale-125 z-[999] shadow-red-950/40 ring-4 ring-yellow-400 border-yellow-300' 
      : 'scale-100 hover:scale-110';
      
    const innerHtml = person.hinhAnh && person.hinhAnh !== ''
      ? `<img src="${person.hinhAnh}" class="w-full h-full object-cover rounded-full relative z-10" alt="${person.hoTen}" onerror="this.onerror=null; this.parentElement.innerHTML='<span class=\'text-xs font-semibold leading-none relative z-10\'>${iconSymbol}</span>';" />`
      : `<span class="text-xs font-semibold leading-none relative z-10">${iconSymbol}</span>`;
      
    const pingHtml = ''; // Removed in favor of CSS pulseClass

    return L.divIcon({
      html: `
        <div class="relative flex items-center justify-center w-10 h-10 rounded-full border-2 shadow-md transition-all duration-300 ${colorClass} ${ringClass} ${scaleClass} ${pulseClass}">
          ${innerHtml}
        </div>
      `,
      className: 'custom-leaflet-icon-container !bg-transparent !border-0',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20]
    });
  };

  // Re-render markers on Map when filteredData changes
  useEffect(() => {
    if (!mapRef.current || !markersGroupRef.current) return;

    // Clear existing layers
    markersGroupRef.current.clearLayers();
    markerMapRef.current.clear();

    // Re-draw filtered markers
    filteredData.forEach((person) => {
      const isSelected = selectedPerson?.id === person.id;
      const marker = L.marker([person.lat, person.lng], {
        icon: createMarkerIcon(person, isSelected)
      });

      // Simple Leaflet popup
      const popupContent = document.createElement('div');
      popupContent.className = 'p-3 font-sans w-64';
      popupContent.innerHTML = `
        <div class="flex flex-col gap-1.5">
          <div class="flex items-start justify-between gap-1">
            <h4 class="font-bold text-gray-900 text-sm leading-tight">${person.hoTen}</h4>
            <span class="px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 uppercase tracking-wide ${
              person.tinhTrang === 'Đã mất (Đã chết)' ? 'bg-slate-100 text-slate-700 border border-slate-300' :
              person.tinhTrang === 'Đang công tác' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
              'bg-red-50 text-red-700 border border-red-200'
            }">${person.tinhTrang}</span>
          </div>
          <div class="text-[11px] text-gray-600 space-y-1">
            <div class="flex items-center gap-1">
              <span class="font-medium text-gray-800">Năm sinh:</span> ${person.namSinh}
            </div>
            <div class="flex items-center gap-1">
              <span class="font-medium text-gray-800">Đối tượng:</span> ${person.dienChinhSach}
            </div>
            <div class="truncate">
              <span class="font-medium text-gray-800">Địa chỉ:</span> ${person.diaChi}
            </div>
          </div>
          <button id="view-pop-${person.id}" class="mt-2 w-full bg-red-900 hover:bg-red-800 text-amber-100 text-[10px] font-semibold py-1.5 px-2.5 rounded transition-all duration-200 flex items-center justify-center gap-1 uppercase tracking-wider cursor-pointer">
            Chi Tiết Hồ Sơ ➔
          </button>
        </div>
      `;

      marker.bindPopup(popupContent, {
        closeButton: true,
        autoPan: true
      });

      // Bind listener to custom button in Popup
      marker.on('popupopen', () => {
        const btn = document.getElementById(`view-pop-${person.id}`);
        if (btn) {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            setSelectedPerson(person);
            if (window.innerWidth < 768) {
              setIsSidebarOpen(false);
            }
          });
        }
      });

      marker.on('click', () => {
        setSelectedPerson(person);
      });

      markersGroupRef.current?.addLayer(marker);
      markerMapRef.current.set(person.id, marker);
    });

    // Adjust zoom if multiple markers are shown
    if (filteredData?.length > 0 && mapRef.current) {
      const bounds = markersGroupRef.current.getBounds();
      // If single item, center and zoom in
      if (filteredData?.length === 1) {
        mapRef.current.setView([filteredData[0].lat, filteredData[0].lng], 16);
      } else {
        mapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
      }
    }

    // Auto-open popup for the selected person if they are on the map
    if (selectedPerson) {
      setTimeout(() => {
        const marker = markerMapRef.current.get(selectedPerson.id);
        if (marker) {
          marker.openPopup();
          
          // Add a strong visual highlight to the marker element
          const el = marker.getElement();
          if (el) {
            const innerDiv = el.querySelector('div');
            if (innerDiv) {
              innerDiv.classList.add('ring-8', 'ring-amber-400', 'animate-bounce', '!bg-amber-400', 'shadow-[0_0_20px_rgba(251,191,36,0.8)]', 'z-[1000]');
              setTimeout(() => {
                innerDiv.classList.remove('ring-8', 'ring-amber-400', 'animate-bounce', '!bg-amber-400', 'shadow-[0_0_20px_rgba(251,191,36,0.8)]', 'z-[1000]');
              }, 3000);
            }
          }
        }
      }, 100);
    } else if (filteredData?.length === 1) {
      // If there is only one result, open its popup automatically too!
      setTimeout(() => {
        const marker = markerMapRef.current.get(filteredData[0].id);
        if (marker) {
          marker.openPopup();
        }
      }, 100);
    }
  }, [filteredData, selectedPerson]);

  // Map focus only (without opening full profile details modal)
  const handleFocusOnMap = (person: NguoiCoCong) => {
    if (mapRef.current) {
      mapRef.current.setView([person.lat, person.lng], 16);
      
      // Delay so marker map can update if filteredData changed
      setTimeout(() => {
        const marker = markerMapRef.current.get(person.id);
        if (marker) {
          marker.openPopup();
          
          // Add a strong visual highlight to the marker element
          const el = marker.getElement();
          if (el) {
            const innerDiv = el.querySelector('div');
            if (innerDiv) {
              innerDiv.classList.add('ring-8', 'ring-amber-400', 'animate-bounce', '!bg-amber-400', 'shadow-[0_0_20px_rgba(251,191,36,0.8)]', 'z-[1000]');
              setTimeout(() => {
                innerDiv.classList.remove('ring-8', 'ring-amber-400', 'animate-bounce', '!bg-amber-400', 'shadow-[0_0_20px_rgba(251,191,36,0.8)]', 'z-[1000]');
              }, 3000);
            }
          }
        }
      }, 300);
    }

    // Auto-close mobile drawer
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  // Selection trigger: Zoom map & Open Popup
  const handleSelectPerson = (person: NguoiCoCong) => {
    setSelectedPerson(person);
    handleFocusOnMap(person);
  };

  // Parse Google Maps URLs or standard coordinates format
  const parseCoordinates = (input: string): [number, number] | null => {
    if (!input) return null;
    
    // Try regex for coordinate pattern: latitude, longitude (e.g. 21.9863, 105.0863)
    const coordRegex = /(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/;
    let match = input.match(coordRegex);
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      if (!isNaN(lat) && !isNaN(lng)) {
        return [lat, lng];
      }
    }
    
    // Try regex for @lat,lng style inside google maps url (e.g. @21.9863,105.0863)
    const urlRegex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
    match = input.match(urlRegex);
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      if (!isNaN(lat) && !isNaN(lng)) {
        return [lat, lng];
      }
    }

    // Try regex for query parameter ?q=lat,lng or query=lat,lng
    const queryRegex = /[?&](?:q|query|daddr)=(-?\d+\.\d+),(-?\d+\.\d+)/;
    match = input.match(queryRegex);
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      if (!isNaN(lat) && !isNaN(lng)) {
        return [lat, lng];
      }
    }

    // Try splitting by space or other characters
    const parts = input.trim().split(/[\s,]+/);
    if (parts.length >= 2) {
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);
      if (!isNaN(lat) && !isNaN(lng)) {
        return [lat, lng];
      }
    }

    return null;
  };

  // Live parsed center coordinates for UI status display
  const liveParsedCenter = useMemo(() => {
    return parseCoordinates(savedCenterUrl);
  }, [savedCenterUrl]);

  // Handle saving default year setting
  const handleSaveDefaultYear = (yearVal: string) => {
    const trimmed = yearVal.trim();
    if (trimmed) {
      updateDefaultYearSettingAndServer(trimmed);
      setSuccessMsg(`Đã lưu năm lưu hồ sơ mặc định: ${trimmed}`);
    } else {
      updateDefaultYearSettingAndServer('');
      setSuccessMsg('Đã xóa cấu hình năm lưu hồ sơ mặc định');
    }
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Handle saving map center coordinates
  const handleSaveMapCenter = () => {
    const coords = parseCoordinates(savedCenterUrl);
    if (coords) {
      localStorage.setItem('saved_map_center', JSON.stringify(coords));
      localStorage.setItem('saved_map_center_url', savedCenterUrl);
      setSavedCenter(coords);
      setSuccessMsg(`Đã lưu vị trí trung tâm cố định: [${coords[0].toFixed(5)}, ${coords[1].toFixed(5)}]`);
      if (mapInstance) {
        mapInstance.setView(coords, 14);
        drawCenterMarker(coords);
      }
    } else {
      setError('Định dạng tọa độ hoặc liên kết Google Maps không hợp lệ.');
      setTimeout(() => setError(null), 4000);
    }
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Get current map coordinates to fill input
  const handleGetCurrentMapCenter = () => {
    if (mapInstance) {
      const center = mapInstance.getCenter();
      const formatted = `${center.lat.toFixed(6)}, ${center.lng.toFixed(6)}`;
      setSavedCenterUrl(formatted);
      setSuccessMsg('Đã lấy tọa độ trung tâm hiện tại của bản đồ!');
      setTimeout(() => setSuccessMsg(null), 2500);
    } else {
      setError('Bản đồ chưa sẵn sàng.');
      setTimeout(() => setError(null), 3000);
    }
  };

  // Reset map center back to default
  const handleResetMapCenter = () => {
    const defaultCoords: [number, number] = [21.9863, 105.0863];
    localStorage.removeItem('saved_map_center');
    localStorage.removeItem('saved_map_center_url');
    setSavedCenter(defaultCoords);
    setSavedCenterUrl('21.9863, 105.0863');
    setSuccessMsg('Đã khôi phục vị trí trung tâm mặc định.');
    if (mapInstance) {
      mapInstance.setView(defaultCoords, 14);
      drawCenterMarker(defaultCoords);
    }
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-50 overflow-hidden font-sans text-gray-800">
      
      {/* GLOBAL HEADER */}
      <header className="bg-gradient-to-r from-red-950 via-red-900 to-red-950 border-b-2 border-[#D4AF37] shadow-xl text-white py-3 px-4 md:px-6 z-[1000] shrink-0">
        <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div className="relative w-11 h-11 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
                  {/* Red Circular Shield Base */}
                  <circle cx="50" cy="50" r="45" fill="#B91C1C" stroke="#D4AF37" strokeWidth="3" />
                  {/* Inner Gold Ring */}
                  <circle cx="50" cy="50" r="37" fill="#991B1B" stroke="#FBBF24" strokeWidth="1" strokeDasharray="4,2" />
                  {/* Laurel Leaves left and right */}
                  <path d="M 22,50 C 22,65 35,78 50,78 C 65,78 78,65 78,50" fill="none" stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M 22,50 L 20,48 M 26,58 L 23,55 M 32,66 L 29,62 M 41,73 L 38,69 M 50,75 L 50,71 M 59,73 L 62,69 M 68,66 L 71,62 M 74,58 L 77,55 M 78,50 L 80,48" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" />
                  {/* Yellow Gold Star in Center */}
                  <polygon 
                    points="50,22 58,38 76,41 63,54 66,72 50,64 34,72 37,54 24,41 42,38" 
                    fill="url(#logoGoldGradient)" 
                    stroke="#F59E0B" 
                    strokeWidth="1" 
                  />
                  <defs>
                    <linearGradient id="logoGoldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#FDE047" />
                      <stop offset="50%" stopColor="#FBBF24" />
                      <stop offset="100%" stopColor="#D97706" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              
              <button
                onClick={() => {
                  setIsSidebarOpen(!isSidebarOpen);
                  setActiveSidebarTab(null); // Keep active tab null to show the options first
                }}
                className="flex items-center justify-center gap-2 bg-red-900 hover:bg-red-850 text-amber-200 hover:text-amber-100 text-sm font-black py-2.5 px-5 rounded-xl border-2 border-amber-500/30 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:scale-105 active:scale-95"
                title="Mở Menu chức năng"
              >
                <Menu className="w-5 h-5 text-amber-300" />
                <span className="tracking-wide">MENU</span>
              </button>
            </div>

            <div>
              <h1 className="text-sm md:text-lg font-bold font-display tracking-wide uppercase text-amber-200 flex items-center gap-1.5">
                Hệ thống bản đồ số người có công với cách mạng xã Hàm Yên
              </h1>
              <p className="text-[10px] md:text-xs text-red-100 font-medium">
                Quản lý hồ sơ • Bản đồ số • Tra cứu • Hỗ trợ người có công
              </p>
            </div>
          </div>

          {/* GLOBAL SEARCH BAR ON MAP */}
          <div className="w-full md:w-auto md:flex-1 max-w-md mx-0 md:mx-6 z-[1000] bg-transparent">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-red-300/70" />
              <input
                type="text"
                placeholder="Tìm nhanh người có công..."
                value={globalSearchQuery}
                onChange={(e) => {
                  setGlobalSearchQuery(e.target.value);
                  setSearchQuery('');
                  setActiveSidebarTab('profiles');
                  setIsSidebarOpen(true);
                  setShowGlobalSearchResults(true);
                }}
                onFocus={() => setShowGlobalSearchResults(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && globalSearchResults.length > 0) {
                    handleSelectPerson(globalSearchResults[0]);
                    handleFocusOnMap(globalSearchResults[0]);
                    setGlobalSearchQuery(globalSearchResults[0].hoTen);
                    setSearchQuery('');
                    setActiveSidebarTab('profiles');
                    setIsSidebarOpen(true);
                    setShowGlobalSearchResults(false);
                  }
                }}
                className="w-full pl-9 pr-8 py-2.5 bg-red-950/50 backdrop-blur-md border-red-800 text-amber-50 placeholder-red-300/70 border border-slate-200 rounded-xl text-sm shadow-lg focus:outline-none focus:ring-2 focus:ring-red-800 transition-all font-medium"
              />
              {globalSearchQuery && (
                <button 
                  onClick={() => {
                    setGlobalSearchQuery('');
                    setShowGlobalSearchResults(false);
                  }}
                  className="absolute right-3 top-3 text-slate-400 hover:text-red-200"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            
            {/* Search Results Dropdown */}
            {showGlobalSearchResults && globalSearchQuery.trim() !== '' && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden max-h-80 overflow-y-auto">
                {globalSearchResults.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">
                    Không tìm thấy kết quả phù hợp.
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {globalSearchResults.map(person => (
                      <button
                        key={person.id}
                        onClick={() => {
                          handleSelectPerson(person);
                          handleFocusOnMap(person);
                          setGlobalSearchQuery(person.hoTen);
                          setSearchQuery('');
                          setActiveSidebarTab('profiles');
                          setIsSidebarOpen(true);
                          setShowGlobalSearchResults(false);
                        }}
                        className="text-left p-3 hover:bg-red-50 border-b border-slate-50 last:border-0 transition-colors flex flex-col gap-1"
                      >
                        <div className="font-bold text-sm text-slate-800">{person.hoTen}</div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {person.diaChi}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sync & Toolbar Buttons */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <button
              onClick={() => {
                setActiveSidebarTab('sync');
                setIsSidebarOpen(true);
              }}
              className="flex items-center gap-1 bg-[#D4AF37] hover:bg-amber-500 text-red-950 text-xs font-bold py-1.5 px-3 rounded-lg border border-yellow-300 shadow-md transition-all cursor-pointer"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Đồng bộ dữ liệu</span>
            </button>
            
            <button 
              onClick={() => {
                setActiveSidebarTab('reset');
                setIsSidebarOpen(true);
              }}
              title="Khôi phục dữ liệu gốc"
              className="p-1.5 bg-red-800/40 hover:bg-red-800 text-red-100 rounded-lg border border-red-700/50 transition-all flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-xs font-semibold">Khôi phục</span>
            </button>

            <button
              onClick={() => {
                setActiveSidebarTab('guide');
                setIsSidebarOpen(true);
              }}
              className="flex items-center gap-1 bg-red-800/60 hover:bg-red-800 text-amber-200 text-xs font-semibold py-1.5 px-3 rounded-lg border border-red-700/50 transition-all cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Hướng dẫn</span>
            </button>
          </div>

        </div>
      </header>

      {/* SUCCESS & ERROR TOASTS */}
      {successMsg && (
        <div className="bg-emerald-50 border-b border-emerald-200 text-emerald-800 px-4 py-2 text-xs font-medium flex items-center justify-between z-[999] animate-fade-in shrink-0">
          <div className="flex items-center gap-2">
            <span className="p-1 bg-emerald-500 text-white rounded-full text-[8px]">✓</span>
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      {error && (
        <div className="bg-rose-50 border-b border-rose-200 text-rose-800 px-4 py-2 text-xs font-medium flex items-center justify-between z-[999] animate-fade-in shrink-0">
          <div className="flex items-center gap-2">
            <span className="p-1 bg-rose-500 text-white rounded-full text-[8px] font-bold">!</span>
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <div className="flex flex-1 relative overflow-hidden">
        
        {/* SIDEBAR PANEL (Floating drawer overlay on both Desktop and Mobile to maximize map space) */}
        <aside className={`
          absolute top-0 bottom-0 left-0 w-80 md:w-96 bg-white border-r border-slate-200 flex flex-col h-full z-[1010] shadow-2xl transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          {/* SIDEBAR HEADER with Dropdown Menu and Close Button */}
          {activeSidebarTab !== null ? (
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-200 bg-slate-50 shrink-0 gap-2">
              <button
                onClick={() => setActiveSidebarTab(null)}
                className="flex items-center gap-1 text-xs font-bold text-red-800 hover:text-red-950 px-2 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-all"
                title="Quay lại Menu chính"
              >
                <ChevronLeft className="w-4 h-4 shrink-0" />
                <span>Quay lại</span>
              </button>

              <div className="relative flex-1">
                <button
                  onClick={() => setIsMenuDropdownOpen(!isMenuDropdownOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-red-800 uppercase tracking-wider hover:bg-slate-50 transition-all shadow-sm"
                >
                  <span className="flex items-center gap-1.5">
                    {activeSidebarTab === 'settings' && <Settings className="w-4 h-4 text-red-800" />}
                    {activeSidebarTab === 'stats' && <BarChart2 className="w-4 h-4 text-red-800" />}
                    {activeSidebarTab === 'profiles' && <FileText className="w-4 h-4 text-red-800" />}
                    {activeSidebarTab === 'sync' && <Database className="w-4 h-4 text-red-800" />}
                    {activeSidebarTab === 'reset' && <RefreshCw className="w-4 h-4 text-red-800" />}
                    {activeSidebarTab === 'guide' && <HelpCircle className="w-4 h-4 text-red-800" />}
                    {activeSidebarTab === 'directions' && <Navigation className="w-4 h-4 text-red-800 rotate-45" />}
                    {activeSidebarTab === 'settings' && 'CÀI ĐẶT CẤU HÌNH'}
                    {activeSidebarTab === 'stats' && 'THỐNG KÊ TỔNG QUAN'}
                    {activeSidebarTab === 'profiles' && 'DANH SÁCH HỒ SƠ'}
                    {activeSidebarTab === 'sync' && 'ĐỒNG BỘ DỮ LIỆU'}
                    {activeSidebarTab === 'reset' && 'KHÔI PHỤC DỮ LIỆU'}
                    {activeSidebarTab === 'guide' && 'HƯỚNG DẪN KẾT NỐI'}
                    {activeSidebarTab === 'directions' && 'CHỈ ĐƯỜNG ĐỊA LÝ'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>

                {/* Dropdown Options */}
                {isMenuDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-[1011]" 
                      onClick={() => setIsMenuDropdownOpen(false)} 
                    />
                    <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-[1012] py-1 overflow-hidden animate-fade-in">
                      <button
                        onClick={() => {
                          setActiveSidebarTab('profiles');
                          setIsMenuDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors ${activeSidebarTab === 'profiles' ? 'bg-red-50 text-red-800' : 'text-slate-600 hover:bg-slate-50'}`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Danh sách hồ sơ
                      </button>
                      <button
                        onClick={() => {
                          setActiveSidebarTab('stats');
                          setIsMenuDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors ${activeSidebarTab === 'stats' ? 'bg-red-50 text-red-800' : 'text-slate-600 hover:bg-slate-50'}`}
                      >
                        <BarChart2 className="w-3.5 h-3.5" />
                        Thống kê tổng quan
                      </button>
                      <button
                        onClick={() => {
                          setActiveSidebarTab('settings');
                          setIsMenuDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors ${activeSidebarTab === 'settings' ? 'bg-red-50 text-red-800' : 'text-slate-600 hover:bg-slate-50'}`}
                      >
                        <Settings className="w-3.5 h-3.5" />
                        Cài đặt cấu hình
                      </button>
                      <button
                        onClick={() => {
                          setActiveSidebarTab('sync');
                          setIsMenuDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors ${activeSidebarTab === 'sync' ? 'bg-red-50 text-red-800' : 'text-slate-600 hover:bg-slate-50'}`}
                      >
                        <Database className="w-3.5 h-3.5" />
                        Đồng bộ dữ liệu
                      </button>
                      <button
                        onClick={() => {
                          setActiveSidebarTab('reset');
                          setIsMenuDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors ${activeSidebarTab === 'reset' ? 'bg-red-50 text-red-800' : 'text-slate-600 hover:bg-slate-50'}`}
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Khôi phục dữ liệu
                      </button>
                      <button
                        onClick={() => {
                          setActiveSidebarTab('guide');
                          setIsMenuDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors ${activeSidebarTab === 'guide' ? 'bg-red-50 text-red-800' : 'text-slate-600 hover:bg-slate-50'}`}
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        Hướng dẫn kết nối
                      </button>
                      <button
                        onClick={() => {
                          setActiveSidebarTab('directions');
                          setIsMenuDropdownOpen(false);
                          if (selectedPerson) {
                            setDestPersonId(selectedPerson.id);
                          } else if (data?.length > 0) {
                            setDestPersonId(data[0].id);
                          }
                          const other = (data || []).find(p => p.id !== (selectedPerson?.id || (data?.[0]?.id)));
                          if (other) {
                            setStartPersonId(other.id);
                          }
                        }}
                        className={`w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors ${activeSidebarTab === 'directions' ? 'bg-red-50 text-red-800' : 'text-slate-600 hover:bg-slate-50'}`}
                      >
                        <Navigation className="w-3.5 h-3.5 rotate-45" />
                        Chỉ đường địa lý
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Close Sidebar Button */}
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer shrink-0"
                title="Thu gọn Menu"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-red-950 text-amber-200 shrink-0 gap-2">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Menu className="w-4 h-4 text-amber-300" />
                MENU CHỨC NĂNG
              </span>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-1.5 text-amber-300/80 hover:text-amber-200 hover:bg-red-900/60 rounded-lg transition-all cursor-pointer shrink-0"
                title="Đóng Menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          
          {/* Dashboard content wrapper */}
          <div className="flex-1 overflow-y-auto flex flex-col relative">
            
            {/* If no active tab is selected, show the 3 choices list */}
            {activeSidebarTab === null && (
              <div className="p-4 space-y-4 animate-fade-in flex-1 bg-slate-50">
                <div className="text-center py-2 border-b border-slate-200 mb-2">
                  <h3 className="text-xs font-bold text-red-950 uppercase tracking-widest">
                    VUI LÒNG CHỌN CHỨC NĂNG
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Chọn một danh mục để bắt đầu làm việc
                  </p>
                </div>
                
                <div className="flex flex-col gap-3">
                  {/* Option 1: Danh sách hồ sơ (At the top) */}
                  <button
                    onClick={() => setActiveSidebarTab('profiles')}
                    className="flex items-center gap-3 p-3.5 bg-white hover:bg-red-50/50 hover:border-red-200 border border-slate-200 rounded-xl transition-all shadow-sm group text-left cursor-pointer"
                  >
                    <div className="p-2.5 bg-red-50 text-red-800 rounded-lg group-hover:bg-red-100/80 transition-colors shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs text-slate-800 uppercase tracking-wide group-hover:text-red-950 transition-colors">
                        Danh sách hồ sơ
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">
                        Tra cứu, lọc, thêm mới, xem thông tin chi tiết và định vị hồ sơ trên bản đồ số.
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-red-800 transition-colors shrink-0" />
                  </button>

                  {/* Option 2: Thống kê tổng quan (In the middle) */}
                  <button
                    onClick={() => setActiveSidebarTab('stats')}
                    className="flex items-center gap-3 p-3.5 bg-white hover:bg-red-50/50 hover:border-red-200 border border-slate-200 rounded-xl transition-all shadow-sm group text-left cursor-pointer"
                  >
                    <div className="p-2.5 bg-red-50 text-red-800 rounded-lg group-hover:bg-red-100/80 transition-colors shrink-0">
                      <BarChart2 className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs text-slate-800 uppercase tracking-wide group-hover:text-red-950 transition-colors">
                        Thống kê tổng quan
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">
                        Biểu đồ phân bố, thống kê số lượng người có công theo từng năm và trạng thái.
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-red-800 transition-colors shrink-0" />
                  </button>

                  {/* Option 3: Cài đặt cấu hình (At the bottom) */}
                  <button
                    onClick={() => setActiveSidebarTab('settings')}
                    className="flex items-center gap-3 p-3.5 bg-white hover:bg-red-50/50 hover:border-red-200 border border-slate-200 rounded-xl transition-all shadow-sm group text-left cursor-pointer"
                  >
                    <div className="p-2.5 bg-red-50 text-red-800 rounded-lg group-hover:bg-red-100/80 transition-colors shrink-0">
                      <Settings className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs text-slate-800 uppercase tracking-wide group-hover:text-red-950 transition-colors">
                        Cài đặt cấu hình
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">
                        Thiết lập năm mặc định, tọa độ trung tâm bản đồ và quản lý lưu trữ.
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-red-800 transition-colors shrink-0" />
                  </button>

                  {/* Option 4: Đồng bộ dữ liệu */}
                  <button
                    onClick={() => setActiveSidebarTab('sync')}
                    className="flex items-center gap-3 p-3.5 bg-white hover:bg-red-50/50 hover:border-red-200 border border-slate-200 rounded-xl transition-all shadow-sm group text-left cursor-pointer"
                  >
                    <div className="p-2.5 bg-red-50 text-red-800 rounded-lg group-hover:bg-red-100/80 transition-colors shrink-0">
                      <Database className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs text-slate-800 uppercase tracking-wide group-hover:text-red-950 transition-colors">
                        Đồng bộ dữ liệu
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">
                        Đồng bộ dữ liệu trực tuyến từ Google Sheets hoặc tải lên tệp Excel/CSV cục bộ.
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-red-800 transition-colors shrink-0" />
                  </button>

                  {/* Option 5: Khôi phục dữ liệu */}
                  <button
                    onClick={() => setActiveSidebarTab('reset')}
                    className="flex items-center gap-3 p-3.5 bg-white hover:bg-red-50/50 hover:border-red-200 border border-slate-200 rounded-xl transition-all shadow-sm group text-left cursor-pointer"
                  >
                    <div className="p-2.5 bg-red-50 text-red-800 rounded-lg group-hover:bg-red-100/80 transition-colors shrink-0">
                      <RefreshCw className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs text-slate-800 uppercase tracking-wide group-hover:text-red-950 transition-colors">
                        Khôi phục dữ liệu
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">
                        Khôi phục về dữ liệu mẫu mặc định, xóa danh sách hiện tại hoặc khôi phục theo thời gian.
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-red-800 transition-colors shrink-0" />
                  </button>

                  {/* Option 6: Hướng dẫn kết nối */}
                  <button
                    onClick={() => setActiveSidebarTab('guide')}
                    className="flex items-center gap-3 p-3.5 bg-white hover:bg-red-50/50 hover:border-red-200 border border-slate-200 rounded-xl transition-all shadow-sm group text-left cursor-pointer"
                  >
                    <div className="p-2.5 bg-red-50 text-red-800 rounded-lg group-hover:bg-red-100/80 transition-colors shrink-0">
                      <HelpCircle className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs text-slate-800 uppercase tracking-wide group-hover:text-red-950 transition-colors">
                        Hướng dẫn sử dụng
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">
                        Các bước thiết lập liên kết Google Sheets và cách tải hình ảnh chân dung đúng cấu trúc.
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-red-800 transition-colors shrink-0" />
                  </button>

                  {/* Option 7: Chỉ đường địa lý */}
                  <button
                    onClick={() => {
                      setActiveSidebarTab('directions');
                      if (selectedPerson) {
                        setDestPersonId(selectedPerson.id);
                      } else if (data?.length > 0) {
                        setDestPersonId(data[0].id);
                      }
                      const other = (data || []).find(p => p.id !== (selectedPerson?.id || (data?.[0]?.id)));
                      if (other) {
                        setStartPersonId(other.id);
                      }
                    }}
                    className="flex items-center gap-3 p-3.5 bg-white hover:bg-red-50/50 hover:border-red-200 border border-slate-200 rounded-xl transition-all shadow-sm group text-left cursor-pointer"
                  >
                    <div className="p-2.5 bg-red-50 text-red-800 rounded-lg group-hover:bg-red-100/80 transition-colors shrink-0">
                      <Navigation className="w-5 h-5 text-red-800 rotate-45" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs text-slate-800 uppercase tracking-wide group-hover:text-red-950 transition-colors">
                        Chỉ đường địa lý
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">
                        Tìm lộ trình ngắn nhất, vẽ đường đi, bắt đầu chỉ đường trực tuyến hoặc giả lập định vị GPS.
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-red-800 transition-colors shrink-0" />
                  </button>
                </div>
              </div>
            )}
            {activeSidebarTab === 'stats' && (
              <div className="p-4 space-y-4 animate-fade-in">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" /> THỐNG KÊ TỔNG QUAN
                  </h2>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 bg-red-800 rounded-xl p-4 text-white shadow-md relative overflow-hidden flex flex-col items-center justify-center text-center">
                    <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-red-900 to-transparent opacity-50" />
                    <Database className="w-6 h-6 text-red-300 mb-1" />
                    <div className="text-3xl font-display font-bold">{stats.total}</div>
                    <div className="text-xs font-medium text-red-200 uppercase tracking-wide mt-1">Tổng số hồ sơ</div>
                  </div>
                  
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 shadow-sm flex flex-col items-center justify-center text-center">
                    <div className="text-xl font-display font-bold text-emerald-700">{stats.conSong}</div>
                    <div className="text-[10px] font-bold text-emerald-600/80 uppercase tracking-wide mt-1 text-center">Hưu trí (Cựu chiến binh)</div>
                  </div>
                  
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 shadow-sm flex flex-col items-center justify-center text-center">
                    <div className="text-xl font-display font-bold text-amber-700">{stats.dangCongTac}</div>
                    <div className="text-[10px] font-bold text-amber-600/80 uppercase tracking-wide mt-1">Đang công tác</div>
                  </div>
                  
                  <div className="col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-sm flex flex-col items-center justify-center text-center space-y-1">
                    <div className="text-lg font-display font-bold text-slate-700 leading-none">{stats.daMat}</div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Đã mất (Đã chết)</div>
                  </div>
                </div>
              </div>
            )}

            {activeSidebarTab === 'profiles' && (
              <div className="flex flex-col h-full animate-fade-in">
                {/* Filters Area */}
                <div className="p-4 border-b border-slate-100 bg-white space-y-3 shrink-0">
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                      <Search className="w-3.5 h-3.5 text-slate-400" /> TÌM KIẾM HỒ SƠ
                    </h2>
                  </div>

                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Tìm họ tên hoặc địa chỉ..."
                      value={searchQuery}
                      onChange={(e) => { 
                        setSearchQuery(e.target.value); 
                        setGlobalSearchQuery('');
                      }}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-800 focus:bg-white transition-all"
                    />
                    {searchQuery && (
                      <button 
                        onClick={() => { setSearchQuery(''); }}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
                      >
                        Xóa
                      </button>
                    )}
                  </div>

                  {/* Filters grid */}
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Tháng</label>
                        <div className="relative">
                          <Calendar className="absolute left-2 top-2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                          <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="w-full pl-7 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-red-800 appearance-none"
                          >
                            <option value="">Tất cả</option>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                              <option key={m} value={m.toString().padStart(2, '0')}>Tháng {m}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Năm</label>
                        <div className="relative">
                          <Calendar className="absolute left-2 top-2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                          <input
                            type="number"
                            placeholder="Tất cả"
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="w-full pl-7 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-red-800"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Tình trạng</label>
                        <div className="relative">
                          <Eye className="absolute left-2 top-2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                          <select
                            value={selectedTinhTrang}
                            onChange={(e) => setSelectedTinhTrang(e.target.value)}
                            className="w-full pl-7 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-red-800 appearance-none"
                          >
                            <option value="Tất cả">Tất cả</option>
                            <option value="Hưu trí (Cựu chiến binh)">Hưu trí (Cựu chiến binh)</option>
                            <option value="Đang công tác">Đang công tác</option>
                            <option value="Đã mất">Đã mất (Đã chết)</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Diện chính sách</label>
                      <div className="relative">
                        <Award className="absolute left-2 top-2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                        <select
                          value={selectedDienChinhSach}
                          onChange={(e) => setSelectedDienChinhSach(e.target.value)}
                          className="w-full pl-7 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-red-800 appearance-none"
                        >
                          {listDienChinhSach.map(dien => (
                            <option key={dien} value={dien}>{dien}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  </div>

                  {/* Clear Filters Indicator */}
                  {(selectedDienChinhSach !== 'Tất cả' || selectedTinhTrang !== 'Tất cả' || selectedYear !== '' || selectedMonth !== '' || searchQuery) && (
                    <div className="flex justify-between items-center text-[11px] text-red-800 bg-red-50 p-1.5 rounded-md border border-red-100">
                      <span>Đang lọc: {filteredData?.length} kết quả</span>
                      <button 
                        onClick={() => {
                          setSelectedDienChinhSach('Tất cả');
                          setSelectedTinhTrang('Tất cả');
                          setSelectedYear('');
                          setSelectedMonth('');
                          setSearchQuery('');
                          setGlobalSearchQuery('');
                        }}
                        className="font-bold underline uppercase tracking-wider text-[9px] hover:text-red-950"
                      >
                        Đặt lại lọc
                      </button>
                    </div>
                  )}
                </div>

                {/* Results List */}
                <div className="flex-1 overflow-y-auto bg-slate-50 p-3 space-y-2">
                  {filteredData?.length === 0 ? (
                    <div className="py-12 px-4 text-center bg-white rounded-xl border border-slate-200 shadow-sm">
                      <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-slate-500">Không tìm thấy hồ sơ nào</p>
                      <p className="text-[11px] text-slate-400 mt-1">Thử xóa bớt bộ lọc hoặc thay đổi từ khóa</p>
                    </div>
                  ) : (
                    filteredData.map((person) => {
                      const isSelected = selectedPerson?.id === person.id || actionPerson?.id === person.id;
                      
                      let badgeStyle = 'bg-red-50 text-red-800 border-red-200';
                      let indicatorColor = 'bg-red-600';
                      
                      if (person.tinhTrang === 'Đã mất (Đã chết)') {
                        badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
                        indicatorColor = 'bg-slate-500';
                      } else if (person.tinhTrang === 'Đang công tác') {
                        badgeStyle = 'bg-amber-50 text-amber-800 border-amber-200';
                        indicatorColor = 'bg-amber-500';
                      }

                      return (
                        <div
                          key={person.id}
                          onClick={() => handleSelectPerson(person)}
                          className={`
                            p-3 rounded-lg border bg-white transition-all duration-200 cursor-pointer flex gap-3 group hover:shadow-md hover:border-red-800/40 relative overflow-hidden
                            ${isSelected ? 'border-red-800 ring-2 ring-red-800/10 shadow-md bg-red-50/10' : 'border-slate-200'}
                          `}
                        >
                          <div className={`absolute left-0 top-0 bottom-0 w-1 ${indicatorColor}`} />
                          
                          {/* Left Column: Avatar + Action Buttons */}
                          <div className="flex flex-col items-center gap-1.5 shrink-0 w-[60px]" onClick={(e) => e.stopPropagation()}>
                            <div className="w-[60px] h-[60px] rounded-lg bg-slate-100 overflow-hidden border border-slate-200 flex items-center justify-center relative shadow-xs">
                              <img 
                                src={person.hinhAnh || DEFAULT_PORTRAIT_URL} 
                                alt={person.hoTen}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src = DEFAULT_PORTRAIT_URL;
                                }}
                              />
                            </div>
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectPerson(person);
                              }}
                              className="w-full py-1 text-[10px] font-bold rounded bg-red-800 text-amber-50 hover:bg-red-900 transition-colors shadow-xs text-center cursor-pointer"
                              title="Xem chi tiết hồ sơ"
                            >
                              Chi tiết
                            </button>
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFocusOnMap(person);
                              }}
                              className="w-full py-1 text-[10px] font-bold rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs text-center cursor-pointer"
                              title="Định vị vị trí trên bản đồ"
                            >
                              Vị trí
                            </button>
                          </div>

                          {/* Right Column: Information */}
                          <div className="flex-1 min-w-0 flex flex-col justify-center space-y-1">
                            <div className="flex items-start justify-between gap-1">
                              <h3 className="font-bold text-slate-900 group-hover:text-red-950 text-sm leading-tight truncate">
                                {person.hoTen}
                              </h3>
                              {person.namDuLieu && (
                                <span className="text-[9px] font-mono text-slate-400 shrink-0 border border-slate-100 px-1 rounded bg-slate-50">
                                  {person.namDuLieu.match(/\b(20\d{2})\b/)?.[1] || person.namDuLieu}
                                </span>
                              )}
                            </div>
                            
                            <p className="text-[11px] text-slate-500 truncate font-medium">
                              {person.dienChinhSach}
                            </p>
                            
                            <div className="flex items-center justify-between gap-2 mt-1">
                              <span className="text-[10px] text-slate-400 truncate flex items-center gap-0.5">
                                <MapPin className="w-3 h-3 text-red-800/70" /> {person.diaChi.split(',')[0]}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${badgeStyle} shrink-0`}>
                                {person.tinhTrang}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {activeSidebarTab === 'settings' && (
              <div className="flex flex-col h-full overflow-y-auto p-4 space-y-5 animate-fade-in bg-slate-50">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2 shrink-0">
                  <Settings className="w-4 h-4 text-red-800" />
                  <h2 className="text-xs font-bold text-gray-700 uppercase tracking-widest">
                    CÀI ĐẶT CẤU HÌNH HỆ THỐNG
                  </h2>
                </div>

                {/* 1. CONFIG DEFAULT PROFILE YEAR */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-red-800 shrink-0" />
                    <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wide">
                      1. Năm lưu hồ sơ mặc định
                    </h3>
                  </div>
                  
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Thiết lập năm lưu hồ sơ mặc định khi lưu trữ dữ liệu. Cấu hình này chỉ phục vụ mục đích ghi nhận và đồng bộ năm lưu hồ sơ gốc, <span className="font-bold text-red-800">hoàn toàn độc lập, không liên kết</span> và không lọc dữ liệu song song của tab Thống kê.
                  </p>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Năm lưu hồ sơ
                    </label>
                    <input
                      type="number"
                      placeholder="Ví dụ: 2026"
                      value={defaultYearSetting}
                      onChange={(e) => setDefaultYearSetting(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-red-800"
                    />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleSaveDefaultYear(defaultYearSetting)}
                      className="flex-1 py-1.5 px-3 bg-red-800 hover:bg-red-900 text-amber-100 text-xs font-bold rounded-lg transition-all shadow-sm cursor-pointer"
                    >
                      Lưu năm cấu hình
                    </button>
                    <button
                      onClick={() => {
                        setDefaultYearSetting('');
                        handleSaveDefaultYear('');
                      }}
                      className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-all cursor-pointer border border-slate-200"
                    >
                      Đặt lại
                    </button>
                  </div>
                </div>

                {/* 2. CONFIG MAP CENTER */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-red-800 shrink-0" />
                    <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wide">
                      2. Vị trí trung tâm bản đồ
                    </h3>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Thiết lập tọa độ cố định của khu vực trung tâm. Khi người dùng bấm nút <strong className="text-slate-800">Trung Tâm</strong> trên bản đồ, góc nhìn sẽ tự động di chuyển về đúng vị trí đã lưu này.
                  </p>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Tọa độ hoặc Link Google Maps
                    </label>
                    <input
                      type="text"
                      placeholder="Dán link Google Maps hoặc tọa độ Lat, Lng..."
                      value={savedCenterUrl}
                      onChange={(e) => setSavedCenterUrl(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-red-800"
                    />
                  </div>

                  {/* Dynamic coordinate detection feedback */}
                  <div className="p-2.5 rounded-lg text-[10px] bg-slate-50 border border-slate-100 flex flex-col gap-1">
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[9px]">Trạng thái nhận diện:</span>
                    {liveParsedCenter ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        ✓ Vĩ độ: {liveParsedCenter[0].toFixed(5)} • Kinh độ: {liveParsedCenter[1].toFixed(5)}
                      </span>
                    ) : savedCenterUrl.trim() === '' ? (
                      <span className="text-slate-500 italic">Chưa nhập tọa độ</span>
                    ) : (
                      <span className="text-red-600 font-bold flex items-center gap-1">
                        ✗ Định dạng không hợp lệ (Hãy nhập Vĩ độ, Kinh độ)
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 pt-1">
                    <button
                      onClick={handleSaveMapCenter}
                      disabled={!liveParsedCenter}
                      className={`w-full py-2 px-3 text-xs font-bold rounded-lg transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1.5 ${
                        liveParsedCenter 
                          ? 'bg-red-800 hover:bg-red-900 text-amber-100' 
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <span>Lưu vị trí trung tâm cố định</span>
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={handleGetCurrentMapCenter}
                        className="py-1.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 text-[10px] font-bold rounded-lg transition-all border border-blue-200 flex items-center justify-center gap-1"
                        title="Lấy góc nhìn hiện tại đang hiển thị trên bản đồ của bạn làm trung tâm mới"
                      >
                        <Locate className="w-3.5 h-3.5" />
                        <span>Lấy từ bản đồ</span>
                      </button>
                      <button
                        onClick={handleResetMapCenter}
                        className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg transition-all border border-slate-200 flex items-center justify-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Khôi phục mặc định</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3. CONFIG HIDE STATUSES */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
                  <div className="flex items-center gap-2">
                    <EyeOff className="w-4 h-4 text-red-800 shrink-0" />
                    <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wide">
                      3. Ẩn trạng thái hiển thị hồ sơ
                    </h3>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Tích chọn để ẩn các hồ sơ và điểm ghim trên bản đồ theo từng trạng thái tương ứng. Khi tích vào, hệ thống sẽ lọc bỏ trạng thái đó ra khỏi tầm hiển thị.
                  </p>

                  <div className="space-y-2.5 pt-1">
                    <label className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 border border-slate-100 transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hideHuutri}
                        onChange={(e) => {
                          setHideHuutri(e.target.checked);
                          localStorage.setItem('hide_huutri', String(e.target.checked));
                        }}
                        className="w-4 h-4 text-red-800 border-gray-300 rounded focus:ring-red-800 cursor-pointer animate-scale-up"
                      />
                      <div className="flex-1">
                        <span className="text-xs font-semibold text-slate-700 block">Ẩn hồ sơ "Hưu trí / Cựu chiến binh"</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Ẩn toàn bộ người có công đang nghỉ hưu hoặc là cựu chiến binh</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 border border-slate-100 transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hideDaMat}
                        onChange={(e) => {
                          setHideDaMat(e.target.checked);
                          localStorage.setItem('hide_damat', String(e.target.checked));
                        }}
                        className="w-4 h-4 text-red-800 border-gray-300 rounded focus:ring-red-800 cursor-pointer animate-scale-up"
                      />
                      <div className="flex-1">
                        <span className="text-xs font-semibold text-slate-700 block">Ẩn hồ sơ "Đã mất (Đã chết)"</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Ẩn toàn bộ người có công đã qua đời / liệt sĩ</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 border border-slate-100 transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hideDangCongTac}
                        onChange={(e) => {
                          setHideDangCongTac(e.target.checked);
                          localStorage.setItem('hide_dangcongtac', String(e.target.checked));
                        }}
                        className="w-4 h-4 text-red-800 border-gray-300 rounded focus:ring-red-800 cursor-pointer animate-scale-up"
                      />
                      <div className="flex-1">
                        <span className="text-xs font-semibold text-slate-700 block">Ẩn hồ sơ "Đang công tác"</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Ẩn toàn bộ người có công hiện vẫn đang làm việc / công tác</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Settings Note */}
                <div className="bg-amber-50 rounded-xl p-3.5 border border-amber-200/60 flex gap-2">
                  <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div className="text-[10px] text-amber-800 leading-relaxed space-y-1">
                    <p className="font-bold uppercase tracking-wider text-[9px]">Ghi chú lưu trữ:</p>
                    <p>Các cấu hình này được lưu trực tiếp trên thiết bị của bạn (Trình duyệt LocalStorage) và sẽ tự động duy trì khi bạn tải lại trang ứng dụng.</p>
                  </div>
                </div>
              </div>
            )}

            {activeSidebarTab === 'sync' && (
              <div className="flex flex-col h-full overflow-y-auto p-4 space-y-4 bg-slate-50 text-xs">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2 shrink-0">
                  <Database className="w-4 h-4 text-red-800" />
                  <h2 className="text-xs font-bold text-gray-700 uppercase tracking-widest">
                    CẬP NHẬT & ĐỒNG BỘ DỮ LIỆU
                  </h2>
                </div>

                {/* Tab Selection */}
                <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveSyncTab('sheets')}
                    className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      activeSyncTab === 'sheets' 
                        ? 'bg-red-800 text-white font-extrabold shadow-inner' 
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    Google Sheets
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSyncTab('local')}
                    className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      activeSyncTab === 'local' 
                        ? 'bg-red-800 text-white font-extrabold shadow-inner' 
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Tải Excel / CSV
                  </button>
                </div>

                {/* Tab Contents */}
                {activeSyncTab === 'sheets' ? (
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSync(sheetUrl);
                    }} 
                    className="space-y-4"
                  >
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Liên kết CSV của Google Sheets
                      </label>
                      <input
                        type="url"
                        required
                        placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?output=csv"
                        value={sheetUrl}
                        onChange={(e) => setSheetUrl(e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-red-800 transition-all shadow-sm"
                      />
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        Dán đường dẫn xuất bản CSV từ Google Sheets của bạn. Bản đồ và danh sách tìm kiếm sẽ tự động đồng bộ theo nội dung trang tính trực tuyến.
                      </p>
                    </div>

                    {/* Template download section */}
                    <div className="bg-white rounded-xl p-3 border border-slate-200 space-y-2 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="text-[11px] font-bold text-slate-700">Tệp Mẫu Căn Lề Sẵn</span>
                        </div>
                        <span className="text-[8px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">Chuẩn 100%</span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        Để tránh lỗi cấu trúc cột, vui lòng tải và sử dụng tệp chuẩn hóa dưới đây:
                      </p>
                      <div className="flex flex-col gap-1.5">
                        <button
                          type="button"
                          onClick={downloadExcelTemplate}
                          className="flex items-center justify-center gap-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg shadow-sm transition-all cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Tải Excel Mẫu (.xlsx)</span>
                        </button>
                        <a
                          href="https://docs.google.com/spreadsheets/d/1Xp9mXJ50v_2D4b-w4A1Yh-B8R92eF6-I7S56l5Ue7a0/copy"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-1 py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg shadow-sm transition-all cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Dùng Google Sheets Mẫu</span>
                        </a>
                      </div>
                    </div>

                    {/* Guide link button inside Sync tab */}
                    <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveSidebarTab('guide');
                        }}
                        className="text-[10px] text-red-800 font-bold hover:underline cursor-pointer"
                      >
                        Xem hướng dẫn kết nối ➔
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="bg-[#D4AF37] hover:bg-amber-500 text-red-950 text-xs font-bold py-2 px-3.5 rounded-lg shadow border border-yellow-300 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        {isLoading ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Đang tải...</span>
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Đồng bộ ngay</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Chọn tệp dữ liệu từ thiết bị
                      </label>
                      <div className="border-2 border-dashed border-slate-200 hover:border-red-800/60 rounded-xl p-5 transition-all text-center bg-white relative group shadow-sm">
                        <input
                          type="file"
                          accept=".xlsx, .xls, .csv"
                          onChange={handleExcelUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <div className="p-2.5 bg-red-50 text-red-800 rounded-full group-hover:scale-105 transition-all duration-300">
                            <Upload className="w-5 h-5" />
                          </div>
                          <div className="text-[11px] text-slate-700 font-bold">
                            Kéo thả hoặc Click để tải tệp lên
                          </div>
                          <div className="text-[9px] text-slate-400">
                            Excel (.xlsx, .xls) hoặc .csv
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Template download section */}
                    <div className="bg-white rounded-xl p-3 border border-slate-200 space-y-2 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="text-[11px] font-bold text-slate-700">Tệp Mẫu Căn Lề Sẵn</span>
                        </div>
                        <span className="text-[8px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">Chuẩn 100%</span>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <button
                          type="button"
                          onClick={downloadExcelTemplate}
                          className="flex items-center justify-center gap-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg shadow-sm transition-all cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Tải Excel Mẫu (.xlsx)</span>
                        </button>
                      </div>
                    </div>

                    <div className="bg-amber-50 rounded-lg p-2.5 border border-amber-100 flex gap-2">
                      <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="text-[10px] text-amber-800 leading-relaxed">
                        <p className="font-bold uppercase tracking-wider text-[9px] mb-0.5">LƯU Ý:</p>
                        <p>Dòng đầu tiên bắt buộc phải chứa các tiêu đề cột tiếng Việt: Họ tên, Năm sinh, Diện chính sách, Tình trạng, Địa chỉ, Tọa độ Lat, Tọa độ Lng, Thông tin gia đình, Tiểu sử và Thành tích, Hình ảnh.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeSidebarTab === 'reset' && (
              <div className="flex flex-col h-full overflow-y-auto p-4 space-y-4 bg-slate-50 text-xs">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2 shrink-0">
                  <RefreshCw className="w-4 h-4 text-red-800" />
                  <h2 className="text-xs font-bold text-gray-700 uppercase tracking-widest">
                    KHÔI PHỤC DỮ LIỆU GỐC
                  </h2>
                </div>

                <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                  Bạn có thể khôi phục toàn bộ danh sách dữ liệu về trạng thái mẫu ban đầu, hoặc xóa sạch bản đồ để nạp tệp mới, hoặc khôi phục dữ liệu gốc theo một khoảng thời gian cụ thể.
                </p>

                <div className="space-y-2">
                  <label className="flex items-start gap-2.5 p-2.5 bg-white border border-slate-200 rounded-lg cursor-pointer hover:bg-red-50/30 transition-colors shadow-sm">
                    <input 
                      type="radio" 
                      name="resetMode" 
                      checked={resetMode === 'empty'} 
                      onChange={() => setResetMode('empty')}
                      className="text-red-800 focus:ring-red-800 w-4 h-4 mt-0.5 cursor-pointer"
                    />
                    <div>
                      <div className="font-bold text-slate-800 text-[11px]">Xóa sạch dữ liệu bản đồ</div>
                      <div className="text-[10px] text-red-600/80 mt-0.5">Lập tức xóa trắng toàn bộ danh sách hiện tại (kể cả dữ liệu mẫu) để chuẩn bị cho dữ liệu mới.</div>
                    </div>
                  </label>
                  
                  <label className="flex items-start gap-2.5 p-2.5 bg-white border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100/40 transition-colors shadow-sm">
                    <input 
                      type="radio" 
                      name="resetMode" 
                      checked={resetMode === 'all'} 
                      onChange={() => setResetMode('all')}
                      className="text-red-800 focus:ring-red-800 w-4 h-4 mt-0.5 cursor-pointer"
                    />
                    <div>
                      <div className="font-bold text-slate-800 text-[11px]">Khôi phục toàn bộ (Dữ liệu mẫu)</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Ghi đè và nạp lại toàn bộ danh sách 20 người có công mẫu (demo) ban đầu của Hàm Yên.</div>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2.5 bg-white border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100/40 transition-colors shadow-sm">
                    <input 
                      type="radio" 
                      name="resetMode" 
                      checked={resetMode === 'range'} 
                      onChange={() => setResetMode('range')}
                      className="text-red-800 focus:ring-red-800 w-4 h-4 mt-0.5 cursor-pointer"
                    />
                    <div>
                      <div className="font-bold text-slate-800 text-[11px]">Khôi phục gốc theo thời gian</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Chỉ khôi phục hoặc làm mới dữ liệu của người có công trong khoảng thời gian dữ liệu cụ thể.</div>
                    </div>
                  </label>
                </div>

                {resetMode === 'range' && (
                  <div className="grid grid-cols-2 gap-2 p-2.5 bg-white rounded-lg border border-slate-200 shadow-sm animate-scale-up">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Từ ngày</label>
                      <input 
                        type="date" 
                        value={resetFromDate}
                        onChange={(e) => setResetFromDate(e.target.value)}
                        className="w-full text-xs p-1 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:border-red-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Đến ngày</label>
                      <input 
                        type="date" 
                        value={resetToDate}
                        onChange={(e) => setResetToDate(e.target.value)}
                        className="w-full text-xs p-1 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:border-red-800"
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                  <button 
                    type="button"
                    onClick={() => setActiveSidebarTab(null)}
                    className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-200 hover:bg-slate-300 rounded-lg transition-colors cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button 
                    type="button"
                    onClick={executeResetData}
                    disabled={resetMode === 'range' && !resetFromDate && !resetToDate}
                    className="px-3.5 py-1.5 text-xs font-bold text-amber-100 bg-red-800 hover:bg-red-900 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer shadow"
                  >
                    <RefreshCw className="w-3 h-3" /> Xác nhận
                  </button>
                </div>
              </div>
            )}

            {activeSidebarTab === 'guide' && (
              <div className="flex flex-col h-full overflow-y-auto p-4 space-y-4 bg-slate-50 text-xs animate-fade-in">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2 shrink-0">
                  <HelpCircle className="w-4 h-4 text-red-800" />
                  <h2 className="text-xs font-bold text-gray-700 uppercase tracking-widest">
                    HƯỚNG DẪN ĐỒNG BỘ & KẾT NỐI
                  </h2>
                </div>

                <div className="space-y-4 text-slate-600 leading-relaxed">
                  {/* Google sheets guide */}
                  <div className="space-y-1.5">
                    <p className="font-bold text-red-950 text-[11px] uppercase tracking-wide">1. Lấy liên kết Google Sheets (CSV):</p>
                    <ol className="list-decimal list-inside space-y-1 pl-1 bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm text-[10px]">
                      <li>Mở tệp Google Sheets chứa danh sách người có công.</li>
                      <li>Vào menu <strong className="text-slate-800">Tệp (File)</strong> ở góc trái.</li>
                      <li>Chọn <strong className="text-slate-800">Chia sẻ</strong> ➔ <strong className="text-slate-800">Xuất bản lên web</strong>.</li>
                      <li>Tại ô lựa chọn, đổi định dạng thành <strong className="text-red-800 font-bold">CSV (.csv)</strong>.</li>
                      <li>Click <strong className="text-slate-800">Xuất bản</strong> và chọn Xác nhận.</li>
                      <li>Sao chép URL được tạo ra, sau đó dán vào ô Đồng bộ.</li>
                    </ol>
                  </div>

                  {/* Header columns guide */}
                  <div className="space-y-1.5">
                    <p className="font-bold text-red-950 text-[11px] uppercase tracking-wide">2. Cấu trúc các cột (Chính xác):</p>
                    <p className="text-[10px] text-slate-500">Yêu cầu tệp dữ liệu phải chứa các cột tiêu đề tiếng Việt chuẩn sau để phân loại tự động:</p>
                    <div className="bg-white border border-slate-200 rounded-lg p-2.5 font-mono text-[9px] text-slate-700 grid grid-cols-1 gap-y-0.5 shadow-sm">
                      <div>• <strong>Họ tên</strong> (Họ và tên người có công)</div>
                      <div>• <strong>Năm sinh</strong> (Năm sinh, ví dụ: 1945)</div>
                      <div>• <strong>Diện chính sách</strong> (Thương binh, Liệt sĩ...)</div>
                      <div>• <strong>Tình trạng</strong> (Hưu trí (Cựu chiến binh) / Đã mất (Đã chết))</div>
                      <div>• <strong>Địa chỉ</strong> (Nơi cư trú hoặc quê quán)</div>
                      <div>• <strong>Tọa độ Lat</strong> (Ví dụ: vĩ độ 21.9863)</div>
                      <div>• <strong>Tọa độ Lng</strong> (Ví dụ: kinh độ 105.0863)</div>
                      <div>• <strong>Thông tin gia đình</strong> (Vợ, con, thân nhân...)</div>
                      <div>• <strong>Tiểu sử và Thành tích</strong> (Huân chương, tóm tắt lý lịch)</div>
                      <div>• <strong>Hình ảnh</strong> (Đường dẫn URL của ảnh chân dung)</div>
                    </div>
                  </div>

                  {/* Color tags */}
                  <div className="space-y-1.5">
                    <p className="font-bold text-red-950 text-[11px] uppercase tracking-wide">3. Chú thích màu sắc bản đồ:</p>
                    <div className="bg-white border border-slate-200 rounded-lg p-2.5 grid grid-cols-1 gap-1.5 shadow-sm text-[10px]">
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-red-600 ring-1 ring-red-200"></span></span>
                        <span className="font-bold text-gray-700">Hưu trí / Cựu chiến binh (Màu đỏ)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500 ring-1 ring-amber-200"></span></span>
                        <span className="font-bold text-gray-700">Đang công tác (Màu vàng)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2"><span className="relative inline-flex rounded-full h-2 w-2 bg-slate-500 ring-1 ring-slate-200"></span></span>
                        <span className="font-bold text-gray-700">Đã mất (Màu xám)</span>
                      </div>
                    </div>
                  </div>

                  {/* Image loading instructions */}
                  <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-200 text-amber-900 text-[10px]">
                    <p className="font-bold mb-1">Cách tải ảnh từ file Excel:</p>
                    <p className="leading-relaxed">Không tải ảnh trực tiếp vào Excel. Hãy tải ảnh lên Google Drive, Imgur, Postimages... rồi lấy link trực tiếp dán vào cột <strong>"Hình ảnh"</strong>.</p>
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-200 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSidebarTab('sync');
                    }}
                    className="bg-red-900 hover:bg-red-950 text-amber-100 text-[11px] font-bold py-1.5 px-3 rounded-lg shadow border border-red-800 transition-all cursor-pointer"
                  >
                    Mở Bảng Đồng Bộ Ngay
                  </button>
                </div>
              </div>
            )}

            {activeSidebarTab === 'directions' && (
              <div className="flex flex-col h-full overflow-y-auto p-4 space-y-4 bg-slate-50 text-xs animate-fade-in text-slate-700">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2 shrink-0">
                  <Navigation className="w-4 h-4 text-red-800 rotate-45" />
                  <h2 className="text-xs font-bold text-gray-700 uppercase tracking-widest">
                    Chỉ Đường Địa Lý
                  </h2>
                </div>

                {/* 0. TRAVEL MODE SELECTOR */}
                <div className="space-y-1.5 shrink-0">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                    PHƯƠNG TIỆN DI CHUYỂN
                  </label>
                  <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/60 shadow-sm">
                    <button
                      type="button"
                      onClick={() => {
                        setTravelMode('driving');
                        clearRouteLine();
                      }}
                      className={`flex-1 flex flex-col items-center gap-1 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                        travelMode === 'driving' 
                          ? 'bg-blue-600 text-white shadow-md transform scale-[1.02]' 
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                      }`}
                    >
                      <Car className="w-4 h-4" />
                      <span>Ô tô</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        setTravelMode('foot');
                        clearRouteLine();
                      }}
                      className={`flex-1 flex flex-col items-center gap-1 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                        travelMode === 'foot' 
                          ? 'bg-amber-600 text-white shadow-md transform scale-[1.02]' 
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                      }`}
                    >
                      <Footprints className="w-4 h-4" />
                      <span>Đi bộ</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setTravelMode('bicycle');
                        clearRouteLine();
                      }}
                      className={`flex-1 flex flex-col items-center gap-1 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                        travelMode === 'bicycle' 
                          ? 'bg-emerald-600 text-white shadow-md transform scale-[1.02]' 
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                      }`}
                    >
                      <Bike className="w-4 h-4" />
                      <span>Xe đạp</span>
                    </button>
                  </div>
                </div>

                {/* 1. START POINT SELECTION */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                    ĐIỂM XUẤT PHÁT
                  </label>
                  
                  {/* Selector Tabs */}
                  <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/50">
                    <button
                      type="button"
                      onClick={() => {
                        setStartType('gps');
                        clearRouteLine();
                      }}
                      className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all cursor-pointer ${startType === 'gps' ? 'bg-white text-slate-800 shadow' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Định vị GPS
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStartType('person');
                        clearRouteLine();
                        if (data?.length > 0 && !startPersonId) {
                          setStartPersonId(data[0].id);
                        }
                      }}
                      className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all cursor-pointer ${startType === 'person' ? 'bg-white text-slate-800 shadow' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Người có công
                    </button>
                  </div>

                  {/* Input form depending on choice */}
                  {startType === 'gps' ? (
                    <div className="space-y-2 pt-1">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={detectGPSLocation}
                          disabled={gpsLoading}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-bold py-2 px-3 rounded-lg transition-all cursor-pointer"
                        >
                          {gpsLoading ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Đang định vị...</span>
                            </>
                          ) : (
                            <>
                              <Locate className="w-3.5 h-3.5 text-blue-600" />
                              <span>Lấy Vị Trí Hiện Tại</span>
                            </>
                          )}
                        </button>
                      </div>
                      {gpsCoords ? (
                        <div className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 border border-emerald-200 rounded p-1.5 flex items-center gap-1.5 animate-fade-in">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                          Đã ghi nhận tọa độ GPS của bạn thành công!
                        </div>
                      ) : (
                        <p className="text-[9px] text-slate-400 italic">
                          Hệ thống sẽ lấy vị trí thực tế của thiết bị thông qua trình duyệt web.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="pt-1">
                      <select
                        value={startPersonId}
                        onChange={(e) => {
                          setStartPersonId(e.target.value);
                          clearRouteLine();
                        }}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-800 transition-all text-slate-800"
                      >
                        {data.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.hoTen} ({p.dienChinhSach})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Arrow indicator */}
                <div className="flex justify-center -my-1">
                  <div className="p-1 bg-slate-100 rounded-full border border-slate-200 text-slate-400">
                    <ArrowLeftRight className="w-3.5 h-3.5 rotate-90" />
                  </div>
                </div>

                {/* 2. DESTINATION SELECTION */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                    ĐIỂM ĐẾN (NGƯỜI CÓ CÔNG)
                  </label>
                  <select
                    value={destPersonId}
                    onChange={(e) => {
                      setDestPersonId(e.target.value);
                      clearRouteLine();
                    }}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-800 transition-all text-slate-800"
                  >
                    <option value="" disabled>--- Chọn người có công ---</option>
                    {data.map((p) => (
                      <option key={p.id} value={p.id} disabled={startType === 'person' && p.id === startPersonId}>
                        {p.hoTen} ({p.dienChinhSach})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. SUBMIT & ACTIONS */}
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={clearRouteLine}
                    disabled={directionsLoading}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 px-3 rounded-lg transition-all cursor-pointer disabled:opacity-50"
                  >
                    Xóa đường
                  </button>
                  <button
                    type="button"
                    onClick={() => drawRouteLine()}
                    disabled={directionsLoading}
                    className="flex-1 bg-[#D4AF37] hover:bg-amber-500 text-red-950 text-xs font-bold py-2.5 px-3 rounded-lg border border-yellow-300 shadow transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    {directionsLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Đang tính...</span>
                      </>
                    ) : (
                      <>
                        <Navigation className="w-3.5 h-3.5 rotate-45" />
                        <span>Vẽ Chỉ Hướng</span>
                      </>
                    )}
                  </button>
                </div>

                {/* 4. DETAILS DIRECTIONS RESULTS */}
                {directionInstructions?.length > 0 && (
                  <div className="border-t border-slate-200 pt-4 space-y-3 animate-fade-in">
                    <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100/70 space-y-1">
                      <div className="text-[9px] font-extrabold text-blue-800 uppercase tracking-wider">KHOẢNG CÁCH DI CHUYỂN</div>
                      <div className="flex justify-between items-baseline">
                        <div className="text-base font-extrabold text-slate-800">
                          {calculatedDistance && calculatedDistance < 1 
                            ? `${Math.round(calculatedDistance * 1000)} Mét` 
                            : `${calculatedDistance?.toFixed(2)} Kilômét`}
                        </div>
                        {routeDuration && (
                          <div className="text-xs font-extrabold text-blue-700 uppercase tracking-wider bg-blue-100/60 px-2 py-0.5 rounded">
                            ~ {formatRouteDuration(routeDuration)}
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 leading-normal">
                        Lộ trình di chuyển chi tiết theo mạng lưới hạ tầng đường bộ thực tế.
                      </p>
                    </div>

                    {/* Navigation control action buttons */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm space-y-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                        ĐIỀU HƯỚNG TRỰC TUYẾN (GPS)
                      </span>
                      <div className="flex gap-2">
                        {!isNavigating ? (
                          <button
                            type="button"
                            onClick={startLiveNavigation}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold py-2 px-2.5 rounded-lg shadow transition-all cursor-pointer animate-pulse"
                          >
                            <Compass className="w-3.5 h-3.5 animate-spin-slow" />
                            <span>Bắt đầu</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={stopLiveNavigation}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold py-2 px-2.5 rounded-lg shadow transition-all cursor-pointer"
                          >
                            <Square className="w-3 h-3" />
                            <span>Dừng định vị</span>
                          </button>
                        )}

                        {!isSimulating ? (
                          <button
                            type="button"
                            onClick={startSimulation}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold py-2 px-2.5 rounded-lg shadow transition-all cursor-pointer"
                            title="Mô phỏng di chuyển dọc theo lộ trình thực tế"
                          >
                            <Play className="w-3 h-3" />
                            <span>Mô phỏng</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={stopSimulation}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold py-2 px-2.5 rounded-lg shadow transition-all cursor-pointer"
                          >
                            <Pause className="w-3 h-3" />
                            <span>Dừng m.phỏng</span>
                          </button>
                        )}
                      </div>

                      {/* Simulation/Navigation active indicator */}
                      {(isNavigating || isSimulating) && (
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 flex flex-col gap-1 text-[10px] animate-fade-in">
                          <div className="flex items-center justify-between text-slate-500 font-medium">
                            <span className="flex items-center gap-1">
                              <span className={`w-1.5 h-1.5 rounded-full ${isNavigating ? 'bg-blue-500' : 'bg-emerald-500'} animate-ping`} />
                              {isNavigating ? 'Đang cập nhật vị trí...' : 'Đang chạy mô phỏng...'}
                            </span>
                            <span className="font-mono font-bold text-slate-700">
                              {isSimulating ? `${currentNavIndex + 1}/${routeGeometry.length} điểm` : 'GPS Hoạt động'}
                            </span>
                          </div>
                          
                          {isSimulating && (
                            <div className="w-full bg-slate-200 rounded-full h-1 mt-1 overflow-hidden">
                              <div 
                                className="bg-emerald-500 h-full transition-all duration-300" 
                                style={{ width: `${((currentNavIndex + 1) / routeGeometry.length) * 100}%` }}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Step instructions list */}
                    <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        HƯỚNG DẪN DI CHUYỂN CHI TIẾT:
                      </p>
                      <ul className="space-y-2 text-[11px] leading-relaxed text-slate-600 max-h-[160px] overflow-y-auto pr-1">
                        {directionInstructions.map((inst, index) => {
                          const isHeader = index === 0;
                          return (
                            <li key={index} className={`flex gap-1.5 items-start ${isHeader ? 'font-bold text-slate-800 border-b border-slate-200 pb-1.5 mb-1.5' : ''}`}>
                              {!isHeader && <span className="text-red-800 font-bold shrink-0">•</span>}
                              <span>{inst}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>

                    {/* Launch external turn-by-turn road driving directions */}
                    <button 
                      onClick={() => {
                        const origin = startType === 'gps' 
                          ? (gpsCoords ? `${gpsCoords[0]},${gpsCoords[1]}` : '') 
                          : (data.find(p => p.id === startPersonId)?.lat + ',' + data.find(p => p.id === startPersonId)?.lng);
                        const dest = data.find(p => p.id === destPersonId)?.lat + ',' + data.find(p => p.id === destPersonId)?.lng;
                        const modeChar = travelMode === 'foot' ? 'w' : travelMode === 'bicycle' ? 'b' : 'd';
                        setGoogleMapsEmbedUrl(`https://maps.google.com/maps?saddr=${origin}&daddr=${dest}&directionsmode=${travelMode === 'foot' ? 'walking' : travelMode === 'bicycle' ? 'bicycling' : 'driving'}&output=embed`);
                      }}
                      className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold py-2.5 px-3 rounded-lg shadow transition-all cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                      <span>Chỉ Đường (Google Maps)</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          {/* Footer info brand */}
          <div className="p-3 bg-red-950 text-center border-t border-red-800 shrink-0">
            <span className="text-[10px] text-amber-200 tracking-wider font-semibold uppercase flex items-center justify-center gap-1">
              <HeartHandshake className="w-3 h-3" /> Đền ơn đáp nghĩa • Uống nước nhớ nguồn
            </span>
          </div>
        </aside>

        {/* MAP CONTAINER (Renders the map) */}
        <div className="flex-1 relative h-full w-full">
          
          {/* Map canvas element */}
          <div ref={mapContainerRef} className="w-full h-full z-10" />

          {/* Google Maps Layer Selector Popover Panel */}
          {showLayerPanel && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-30 w-[340px] max-w-[95vw] bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/80 p-4 animate-scale-up text-slate-800 font-sans">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-red-800" />
                  Thông tin chi tiết trên bản đồ
                </span>
                <button 
                  onClick={() => setShowLayerPanel(false)}
                  className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Section 1: Loại bản đồ (Map Types) */}
              <div className="py-3">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2.5">Loại bản đồ</span>
                <div className="grid grid-cols-3 gap-2">
                  {/* Default Roadmap */}
                  <button
                    onClick={() => setMapType('roadmap')}
                    className="flex flex-col items-center gap-1.5 focus:outline-none group cursor-pointer"
                  >
                    <div className={`w-14 h-14 rounded-xl border-2 overflow-hidden transition-all relative ${
                      mapType === 'roadmap' 
                        ? 'border-blue-600 ring-2 ring-blue-100 shadow-md' 
                        : 'border-slate-200 hover:border-slate-400 shadow-xs'
                    }`}>
                      <div className="absolute inset-0 bg-gradient-to-tr from-sky-100 to-emerald-50 flex flex-col items-center justify-center p-1">
                        <svg viewBox="0 0 24 24" className="w-6 h-6 text-sky-600 mb-0.5" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                      </div>
                      <div className="absolute inset-x-0 bottom-0 bg-slate-900/60 text-white text-[8px] font-bold py-0.5 text-center">Bản đồ</div>
                      {mapType === 'roadmap' && (
                        <div className="absolute top-1 right-1 bg-blue-600 text-white rounded-full p-0.5 shadow-sm">
                          <svg viewBox="0 0 24 24" className="w-2 h-2 fill-none stroke-current stroke-[3]">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <span className={`text-[10px] font-semibold tracking-tight ${mapType === 'roadmap' ? 'text-blue-600 font-bold' : 'text-slate-600'}`}>Mặc định</span>
                  </button>

                  {/* Satellite */}
                  <button
                    onClick={() => setMapType('satellite')}
                    className="flex flex-col items-center gap-1.5 focus:outline-none group cursor-pointer"
                  >
                    <div className={`w-14 h-14 rounded-xl border-2 overflow-hidden transition-all relative ${
                      mapType === 'satellite' 
                        ? 'border-blue-600 ring-2 ring-blue-100 shadow-md' 
                        : 'border-slate-200 hover:border-slate-400 shadow-xs'
                    }`}>
                      <div className="absolute inset-0 bg-gradient-to-tr from-slate-800 to-slate-900 flex flex-col items-center justify-center p-1">
                        <svg viewBox="0 0 24 24" className="w-6 h-6 text-slate-400 mb-0.5" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                          <path d="M2 12h20" />
                        </svg>
                      </div>
                      <div className="absolute inset-x-0 bottom-0 bg-slate-900/60 text-white text-[8px] font-bold py-0.5 text-center">Vệ tinh</div>
                      {mapType === 'satellite' && (
                        <div className="absolute top-1 right-1 bg-blue-600 text-white rounded-full p-0.5 shadow-sm">
                          <svg viewBox="0 0 24 24" className="w-2 h-2 fill-none stroke-current stroke-[3]">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <span className={`text-[10px] font-semibold tracking-tight ${mapType === 'satellite' ? 'text-blue-600 font-bold' : 'text-slate-600'}`}>Vệ tinh</span>
                  </button>

                  {/* Terrain */}
                  <button
                    onClick={() => setMapType('terrain')}
                    className="flex flex-col items-center gap-1.5 focus:outline-none group cursor-pointer"
                  >
                    <div className={`w-14 h-14 rounded-xl border-2 overflow-hidden transition-all relative ${
                      mapType === 'terrain' 
                        ? 'border-blue-600 ring-2 ring-blue-100 shadow-md' 
                        : 'border-slate-200 hover:border-slate-400 shadow-xs'
                    }`}>
                      <div className="absolute inset-0 bg-gradient-to-tr from-amber-100 to-amber-200 flex flex-col items-center justify-center p-1">
                        <svg viewBox="0 0 24 24" className="w-6 h-6 text-amber-700 mb-0.5" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      </div>
                      <div className="absolute inset-x-0 bottom-0 bg-slate-900/60 text-white text-[8px] font-bold py-0.5 text-center">Địa hình</div>
                      {mapType === 'terrain' && (
                        <div className="absolute top-1 right-1 bg-blue-600 text-white rounded-full p-0.5 shadow-sm">
                          <svg viewBox="0 0 24 24" className="w-2 h-2 fill-none stroke-current stroke-[3]">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <span className={`text-[10px] font-semibold tracking-tight ${mapType === 'terrain' ? 'text-blue-600 font-bold' : 'text-slate-600'}`}>Địa hình</span>
                  </button>
                </div>
              </div>

              {/* Section 2: Chi tiết bản đồ (Overlays / Details) */}
              <div className="py-3 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2.5">Thông tin chi tiết</span>
                <div className="grid grid-cols-4 gap-2">
                  {/* Traffic Toggle */}
                  <button
                    onClick={() => setShowTraffic(!showTraffic)}
                    className="flex flex-col items-center gap-1 focus:outline-none group cursor-pointer"
                  >
                    <div className={`w-11 h-11 rounded-lg flex items-center justify-center border transition-all ${
                      showTraffic 
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-600 shadow-inner' 
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}>
                      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current stroke-2">
                        <path d="M13 18H7a2 2 0 01-2-2V6" />
                        <path d="M11 6h6a2 2 0 012 2v8a2 2 0 01-2 2h-1" />
                        <circle cx="13" cy="18" r="1" />
                        <circle cx="17" cy="18" r="1" />
                      </svg>
                    </div>
                    <span className="text-[9px] font-semibold text-slate-500 text-center leading-tight">Giao thông</span>
                  </button>

                  {/* Transit Toggle */}
                  <button
                    onClick={() => setShowTransit(!showTransit)}
                    className="flex flex-col items-center gap-1 focus:outline-none group cursor-pointer"
                  >
                    <div className={`w-11 h-11 rounded-lg flex items-center justify-center border transition-all ${
                      showTransit 
                        ? 'bg-blue-50 border-blue-500 text-blue-600 shadow-inner' 
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}>
                      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current stroke-2">
                        <rect x="5" y="4" width="14" height="13" rx="2" />
                        <circle cx="9" cy="14" r="1" />
                        <circle cx="15" cy="14" r="1" />
                        <path d="M8 17l-1 3M16 17l1 3" />
                      </svg>
                    </div>
                    <span className="text-[9px] font-semibold text-slate-500 text-center leading-tight">Công cộng</span>
                  </button>

                  {/* Biking Toggle */}
                  <button
                    onClick={() => setShowBiking(!showBiking)}
                    className="flex flex-col items-center gap-1 focus:outline-none group cursor-pointer"
                  >
                    <div className={`w-11 h-11 rounded-lg flex items-center justify-center border transition-all ${
                      showBiking 
                        ? 'bg-amber-50 border-amber-500 text-amber-600 shadow-inner' 
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}>
                      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current stroke-2">
                        <circle cx="5.5" cy="17.5" r="2.5" />
                        <circle cx="18.5" cy="17.5" r="2.5" />
                        <path d="M15 17.5L12 12H7.5L10 17.5" />
                        <path d="M12 12l2.5-4H18" />
                      </svg>
                    </div>
                    <span className="text-[9px] font-semibold text-slate-500 text-center leading-tight">Xe đạp</span>
                  </button>

                  {/* Labels Toggle */}
                  <button
                    onClick={() => setShowLabels(!showLabels)}
                    className="flex flex-col items-center gap-1 focus:outline-none group cursor-pointer"
                  >
                    <div className={`w-11 h-11 rounded-lg flex items-center justify-center border transition-all ${
                      showLabels 
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-600 shadow-inner' 
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}>
                      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current stroke-2">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <path d="M7 8h10M7 12h10M7 16h6" />
                      </svg>
                    </div>
                    <span className="text-[9px] font-semibold text-slate-500 text-center leading-tight">Nhãn</span>
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-2 mt-2">
                  {/* Wildfire Toggle */}
                  <button
                    onClick={() => {
                      setShowWildfire(!showWildfire);
                      if (!showWildfire) {
                        setSuccessMsg("Đã kích hoạt Lớp cảnh báo cháy rừng trực tuyến.");
                        setTimeout(() => setSuccessMsg(null), 3000);
                      }
                    }}
                    className="flex flex-col items-center gap-1 focus:outline-none group cursor-pointer"
                  >
                    <div className={`w-11 h-11 rounded-lg flex items-center justify-center border transition-all ${
                      showWildfire 
                        ? 'bg-red-50 border-red-500 text-red-600 shadow-inner ring-2 ring-red-100' 
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}>
                      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current stroke-2">
                        <path d="M12 2c0 1.5-1 3.5-3 5.5s-3 3.5-3 5.5a6 6 0 0012 0c0-2-1-3.5-3-5.5s-3-4-3-5.5z" />
                      </svg>
                    </div>
                    <span className="text-[9px] font-semibold text-slate-500 text-center leading-tight">Cháy rừng</span>
                  </button>

                  {/* Air Quality Toggle */}
                  <button
                    onClick={() => {
                      setShowAirQuality(!showAirQuality);
                      if (!showAirQuality) {
                        setSuccessMsg("Đã kích hoạt Lớp giám sát Chất lượng không khí.");
                        setTimeout(() => setSuccessMsg(null), 3000);
                      }
                    }}
                    className="flex flex-col items-center gap-1 focus:outline-none group cursor-pointer"
                  >
                    <div className={`w-11 h-11 rounded-lg flex items-center justify-center border transition-all ${
                      showAirQuality 
                        ? 'bg-teal-50 border-teal-500 text-teal-600 shadow-inner ring-2 ring-teal-100' 
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}>
                      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current stroke-2">
                        <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0 M12 8v8M8 12h8" />
                      </svg>
                    </div>
                    <span className="text-[9px] font-semibold text-slate-500 text-center leading-tight">Chất lượng</span>
                  </button>

                  {/* Voyager Classic Switch */}
                  <button
                    onClick={() => setMapType(mapType === 'voyager' ? 'roadmap' : 'voyager')}
                    className="flex flex-col items-center gap-1 focus:outline-none group cursor-pointer"
                  >
                    <div className={`w-11 h-11 rounded-lg flex items-center justify-center border transition-all ${
                      mapType === 'voyager' 
                        ? 'bg-purple-50 border-purple-500 text-purple-600 shadow-inner ring-2 ring-purple-100' 
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}>
                      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current stroke-2">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                      </svg>
                    </div>
                    <span className="text-[9px] font-semibold text-slate-500 text-center leading-tight">Cổ điển</span>
                  </button>

                  {/* Measure Distance Tool Toggle */}
                  <button
                    onClick={() => {
                      setIsMeasuring(!isMeasuring);
                      if (!isMeasuring) {
                        setSuccessMsg("Chế độ Đo đạc: Hãy nhấp chuột vào các điểm trên bản đồ để đo khoảng cách tuyến.");
                        setTimeout(() => setSuccessMsg(null), 5000);
                      }
                    }}
                    className="flex flex-col items-center gap-1 focus:outline-none group cursor-pointer"
                  >
                    <div className={`w-11 h-11 rounded-lg flex items-center justify-center border transition-all ${
                      isMeasuring 
                        ? 'bg-blue-600 border-blue-600 text-white shadow-inner animate-pulse' 
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}>
                      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current stroke-2">
                        <path d="M3 12h18M3 8v8M9 10v4M15 10v4M21 8v8" />
                      </svg>
                    </div>
                    <span className="text-[9px] font-semibold text-slate-500 text-center leading-tight">Đo lường</span>
                  </button>
                </div>
              </div>

              {/* Measure Feedback inside Panel if active */}
              {isMeasuring && (
                <div className="mt-1 bg-blue-50 border border-blue-200/50 rounded-xl p-2.5 flex flex-col gap-1 text-[11px] text-blue-800">
                  <div className="flex items-center justify-between">
                    <span className="font-bold uppercase tracking-wider text-[9px] text-blue-600 flex items-center gap-1">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-600"></span>
                      </span>
                      Đo khoảng cách
                    </span>
                    <button 
                      onClick={() => {
                        // Clear measure points but keep tool active
                        measurePointsRef.current = [];
                        setMeasurePoints([]);
                        setMeasuredDistance(null);
                        if (measureMarkersGroupRef.current) {
                          measureMarkersGroupRef.current.clearLayers();
                        }
                        if (measureLineRef.current && mapInstance) {
                          mapInstance.removeLayer(measureLineRef.current);
                          measureLineRef.current = null;
                        }
                      }}
                      className="text-[9px] font-bold text-blue-600 hover:underline cursor-pointer"
                    >
                      Xóa đường đo
                    </button>
                  </div>
                  <div className="flex items-center justify-between font-mono font-bold mt-1">
                    <span className="text-slate-500 text-[10px]">Đã nhấp: {measurePoints.length} điểm</span>
                    <span className="text-xs text-blue-700 bg-white px-1.5 py-0.5 rounded shadow-sm border border-blue-100">
                      {measuredDistance !== null 
                        ? (measuredDistance >= 1 ? `${measuredDistance.toFixed(3)} km` : `${(measuredDistance * 1000).toFixed(0)} m`)
                        : '0 m'
                      }
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Map Controls: Center, Map Type, Directions */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex flex-row gap-1 bg-white/95 backdrop-blur-md p-1.5 rounded-xl border border-slate-200 shadow-2xl">
            <button
              onClick={() => {
                if (mapInstance) {
                  mapInstance.setView(savedCenter, 14);
                  drawCenterMarker(savedCenter);
                }
              }}
              title="Về trung tâm"
              className="px-3 h-9 rounded-lg transition-all flex flex-row items-center justify-center gap-1.5 cursor-pointer text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            >
              <Locate className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase leading-tight">Trung Tâm</span>
            </button>

            <button
              onClick={() => setShowLayerPanel(!showLayerPanel)}
              title="Lớp bản đồ chi tiết"
              className={`px-3 h-9 rounded-lg transition-all flex flex-row items-center justify-center gap-1.5 cursor-pointer ${showLayerPanel ? 'bg-red-800 text-amber-200 shadow-inner' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}
            >
              <Layers className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase leading-tight">Lớp bản đồ</span>
            </button>
            
            <div className="w-px bg-slate-200 my-1.5 mx-0.5"></div> {/* Divider */}
            
            <button
              onClick={() => {
                if (activeSidebarTab === 'directions') {
                  setActiveSidebarTab(null);
                  setIsSidebarOpen(false);
                } else {
                  setActiveSidebarTab('directions');
                  setIsSidebarOpen(true);
                  if (selectedPerson) {
                    setDestPersonId(selectedPerson.id);
                  } else if (data?.length > 0) {
                    setDestPersonId(data[0].id);
                  }
                  
                  const other = (data || []).find(p => p.id !== (selectedPerson?.id || (data?.[0]?.id)));
                  if (other) {
                    setStartPersonId(other.id);
                  }
                }
              }}
              title="Chỉ Đường"
              className={`px-3 h-9 rounded-lg transition-all flex flex-row items-center justify-center gap-1.5 cursor-pointer ${activeSidebarTab === 'directions' ? 'bg-red-800 text-amber-200 shadow-inner' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}
            >
              <Navigation className={`w-4 h-4 ${activeSidebarTab === 'directions' ? '' : 'text-red-800'} rotate-45`} />
              <span className="text-[10px] font-bold uppercase leading-tight">Chỉ đường</span>
            </button>
          </div>

          {/* Persistent directions panel is now integrated directly in the sidebar tabs */}

          {/* DETAILED PERSON INFOMATION MODAL SHEET */}
          {selectedPerson && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
              
              <div className="bg-white rounded-xl shadow-2xl border-t-4 border-red-800 w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col animate-scale-up">
                
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-red-950 to-red-900 p-4 text-white flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400">★</span>
                    <h2 className="font-bold font-display tracking-wide uppercase text-sm md:text-base text-amber-200">
                      Hồ Sơ Chi Tiết Người Có Công
                    </h2>
                  </div>
                  <button 
                    onClick={() => setSelectedPerson(null)}
                    className="p-1.5 rounded-lg bg-red-800/40 text-red-200 hover:text-white hover:bg-red-800 transition-all cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Scrollable Content */}
                <div className="p-4 md:p-6 space-y-6 overflow-y-auto">
                  
                  {/* PART 1: PERSONAL INFOMATION */}
                  <div className="flex flex-col sm:flex-row gap-5 items-start">
                    
                    {/* Portrait Frame */}
                    <div className="w-full sm:w-36 h-44 rounded-xl overflow-hidden border-2 border-red-800/30 shadow-md bg-slate-100 shrink-0 relative flex items-center justify-center">
                      <img 
                        src={selectedPerson.hinhAnh || DEFAULT_PORTRAIT_URL} 
                        alt={selectedPerson.hoTen}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = DEFAULT_PORTRAIT_URL;
                        }}
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-red-950/80 text-amber-200 text-center text-[10px] py-1 font-semibold border-t border-amber-500/30 uppercase tracking-widest">
                        ẢNH CHÂN DUNG
                      </div>
                    </div>

                    {/* Bio Specs */}
                    <div className="flex-1 space-y-3 w-full">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xl md:text-2xl font-extrabold text-red-950 leading-none">
                          {selectedPerson.hoTen}
                        </h3>
                        <span className={`
                          px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border
                          ${selectedPerson.tinhTrang === 'Đã mất (Đã chết)' ? 'bg-slate-100 text-slate-700 border-slate-300' :
                            selectedPerson.tinhTrang === 'Đang công tác' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                            'bg-red-50 text-red-700 border-red-200'}
                        `}>
                          {selectedPerson.tinhTrang}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs md:text-sm">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Calendar className="w-4 h-4 text-red-800 shrink-0" />
                          <span><strong className="text-slate-800">Năm sinh:</strong> {selectedPerson.namSinh}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <MapPin className="w-4 h-4 text-red-800 shrink-0" />
                          <span className="truncate" title={selectedPerson.diaChi}><strong className="text-slate-800">Địa phương:</strong> Xã Hàm Yên</span>
                        </div>
                      </div>

                      <div className="p-3 bg-red-50/60 rounded-xl border border-red-100/70 space-y-1">
                        <div className="text-[10px] font-extrabold text-red-800 uppercase tracking-wider">DIỆN CHÍNH SÁCH THỤ HƯỞNG</div>
                        <div className="text-sm font-bold text-red-950">{selectedPerson.dienChinhSach}</div>
                      </div>

                      {/* Biography and achievements */}
                      <div className="space-y-1.5">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                          <Award className="w-4 h-4 text-amber-500" /> TIỂU SỬ & THÀNH TÍCH VẺ VANG
                        </div>
                        <p className="text-xs md:text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200/60 italic font-medium">
                          &ldquo;{selectedPerson.tieuSuThanhTich}&rdquo;
                        </p>
                      </div>

                    </div>
                  </div>

                  {/* PART 2: FAMILY INFOMATION */}
                  <div className="border-t border-slate-200 pt-4 space-y-2">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-red-800" /> THÔNG TIN GIA ĐÌNH & PHƯƠNG ÁN LIÊN HỆ THĂM HỎI
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="text-xs md:text-sm text-slate-700 flex-1 space-y-1">
                        <p className="font-semibold text-red-950 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-800" /> 
                          {selectedPerson.thongTinGiaDinh}
                        </p>
                        <p className="text-xs text-slate-400">
                          Thông tin liên hệ này được ghi nhận nhằm hỗ trợ chính sách an sinh, thăm hỏi dịp lễ Tết hàng năm.
                        </p>
                      </div>
                      
                      {/* Extract phone numbers if exists */}
                      {selectedPerson.thongTinGiaDinh.match(/\d[\d.\s]{8,12}/) && (
                        <a 
                          href={`tel:${selectedPerson.thongTinGiaDinh.match(/\d[\d.\s]{8,12}/)?.[0].replace(/[\s.]/g, '')}`}
                          className="flex items-center gap-1.5 bg-red-800 hover:bg-red-950 text-amber-100 text-xs font-bold py-2 px-3 rounded-lg shadow border border-red-700 transition-all shrink-0 cursor-pointer"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Gọi Liên Hệ</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* PART 3: GEOGRAPHICAL ADDRESS & NAVIGATION */}
                  <div className="border-t border-slate-200 pt-4 space-y-3">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                      <Navigation className="w-4 h-4 text-red-800" /> ĐỊA CHỈ & DẪN ĐƯỜNG ĐỊA LÝ
                    </div>
                    
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs md:text-sm text-slate-700">
                      <div className="space-y-1">
                        <p><strong className="text-slate-800">Địa chỉ thường trú:</strong> {selectedPerson.diaChi}</p>
                        <p className="font-mono text-slate-400 text-[11px]">
                          Tọa độ GPS: Lat {selectedPerson.lat.toFixed(6)}, Lng {selectedPerson.lng.toFixed(6)}
                        </p>
                      </div>

                      <button 
                        onClick={() => setGoogleMapsEmbedUrl(`https://maps.google.com/maps?daddr=${selectedPerson.lat},${selectedPerson.lng}&output=embed`)}
                        className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold py-2 px-4.5 rounded-lg shadow transition-all shrink-0 cursor-pointer"
                      >
                        <Navigation className="w-3.5 h-3.5 text-amber-400" />
                        <span>Chỉ Đường (Google Maps)</span>
                      </button>
                    </div>
                  </div>

                </div>

                {/* Modal Footer */}
                <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex justify-end shrink-0">
                  <button 
                    onClick={() => setSelectedPerson(null)}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold py-2 px-4 rounded-lg transition-all cursor-pointer"
                  >
                    Đóng cửa sổ
                  </button>
                </div>

              </div>

            </div>
          )}

        </div>

      </div>



      


      {/* HELP / GUIDE MODAL */}
      
      {/* Google Maps Embed Modal */}
      {googleMapsEmbedUrl && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/70 p-4 sm:p-8 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden relative">
            <div className="bg-slate-800 text-white px-4 py-3 flex justify-between items-center shrink-0">
              <h3 className="font-bold flex items-center gap-2 text-sm uppercase tracking-wider">
                <Navigation className="w-4 h-4 text-amber-400" /> Bản đồ Google Maps
              </h3>
              <button 
                onClick={() => setGoogleMapsEmbedUrl(null)}
                className="p-1.5 bg-slate-700 hover:bg-red-600 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 w-full h-full bg-slate-100">
              <iframe 
                src={googleMapsEmbedUrl} 
                className="w-full h-full border-0" 
                allowFullScreen 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>
        </div>
      )}





    </div>
  );
}
