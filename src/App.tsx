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
  Settings
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
  
  // Mobile drawers state
  const [isSidebarOpenOnMobile, setIsSidebarOpenOnMobile] = useState<boolean>(false);
  const [showSyncModal, setShowSyncModal] = useState<boolean>(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState<"stats" | "profiles" | "settings">("settings");
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
    setTimeout(() => {
      fitAllMarkers(finalData);
    }, 400);
  };
  

  // Map settings, layers and directions state
  const [mapType, setMapType] = useState<'voyager' | 'satellite' | 'terrain'>('voyager');
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [googleMapsEmbedUrl, setGoogleMapsEmbedUrl] = useState<string | null>(null);
  const [showDirections, setShowDirections] = useState<boolean>(false);
  const [startType, setStartType] = useState<'gps' | 'person'>('gps');
  const [startPersonId, setStartPersonId] = useState<string>('');
  const [destPersonId, setDestPersonId] = useState<string>('');
  const [calculatedDistance, setCalculatedDistance] = useState<number | null>(null);
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);
  const [gpsCoords, setGpsCoords] = useState<[number, number] | null>(null);
  const [directionInstructions, setDirectionInstructions] = useState<string[]>([]);

  // Map references
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersGroupRef = useRef<L.FeatureGroup | null>(null);
  const markerMapRef = useRef<Map<string, L.Marker>>(new Map());
  const routingLineRef = useRef<L.Polyline | null>(null);
  const gpsMarkerRef = useRef<L.Marker | null>(null);

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

    mapRef.current = map;
    setMapInstance(map);
    markersGroupRef.current = markersGroup;

    // Trigger initial fitBounds if we have data
    if (data?.length > 0) {
      setTimeout(() => {
        fitAllMarkers(data);
      }, 500);
    }

    // Add map click listener to show coordinates and copy button
    map.on('click', (e: L.LeafletMouseEvent) => {
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

  // Manage map layers based on mapType state
  useEffect(() => {
    if (!mapInstance) return;

    if (tileLayerRef.current) {
      mapInstance.removeLayer(tileLayerRef.current);
    }

    let url = '';
    let maxZoom = 19;

    if (mapType === 'voyager') {
      url = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
      maxZoom = 19;
    } else if (mapType === 'satellite') {
      url = 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'; // Google Satellite Hybrid (imagery + labels)
      maxZoom = 21;
    } else if (mapType === 'terrain') {
      url = 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}'; // Google Terrain
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
  }, [mapInstance, mapType]);

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

  // Draw the route line and update instructions
  const drawRouteLine = () => {
    if (!mapInstance) return;

    // Clear existing routing line
    if (routingLineRef.current) {
      mapInstance.removeLayer(routingLineRef.current);
      routingLineRef.current = null;
    }

    let startLat = 0;
    let startLng = 0;
    let startName = '';

    if (startType === 'gps') {
      if (!gpsCoords) {
        alert('Vui lòng bật định vị GPS trước bằng cách bấm vào biểu tượng Vị trí của tôi.');
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

    // Calculate straight line distance (Haversine)
    const dist = getHaversineDistance(startLat, startLng, destLat, destLng);
    setCalculatedDistance(dist);

    // Draw route line (dashed, glowing, modern look)
    const latlngs: [number, number][] = [
      [startLat, startLng],
      [destLat, destLng]
    ];

    const polyline = L.polyline(latlngs, {
      color: '#2563eb', // Blue-600
      weight: 4,
      dashArray: '8, 8',
      opacity: 0.85
    }).addTo(mapInstance);

    routingLineRef.current = polyline;

    // Fit map bounds to show the entire route
    mapInstance.fitBounds(polyline.getBounds(), { padding: [60, 60] });

    // Generate smart instructions text
    const distText = dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist.toFixed(2)} km`;
    const heading = getBearingText(startLat, startLng, destLat, destLng);

    const instructions = [
      `Điểm xuất phát: ${startName}`,
      `Điểm đến: ${destName} (${destP.dienChinhSach})`,
      `Khoảng cách đường thẳng ước tính: ${distText}`,
      `Hướng di chuyển chính: Hướng ${heading}`,
      `Hành trình đi qua địa bàn xã Hàm Yên, huyện Hàm Yên, tỉnh Tuyên Quang.`,
      `Gợi ý: Nhấp vào nút "Mở Google Maps" bên dưới để nhận chỉ đường giao thông chi tiết (ô tô, xe máy, đi bộ).`
    ];
    setDirectionInstructions(instructions);
  };

  // Clear directions and route line
  const clearRouteLine = () => {
    if (routingLineRef.current && mapInstance) {
      mapInstance.removeLayer(routingLineRef.current);
      routingLineRef.current = null;
    }
    if (gpsMarkerRef.current && mapInstance) {
      mapInstance.removeLayer(gpsMarkerRef.current);
      gpsMarkerRef.current = null;
    }
    setCalculatedDistance(null);
    setGpsCoords(null);
    setDirectionInstructions([]);
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
              setIsSidebarOpenOnMobile(false);
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
  }, [filteredData]);

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
      setIsSidebarOpenOnMobile(false);
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
    }
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-50 overflow-hidden font-sans text-gray-800">
      
      {/* GLOBAL HEADER */}
      <header className="bg-gradient-to-r from-red-950 via-red-900 to-red-950 border-b-2 border-[#D4AF37] shadow-xl text-white py-3 px-4 md:px-6 z-[1000] shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 flex items-center justify-center shrink-0">
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
          <div className="w-full md:w-auto md:flex-1 max-w-md mx-0 md:mx-4 z-[1000] bg-transparent">
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
              onClick={() => setShowGuideModal(true)}
              className="flex items-center gap-1 bg-red-800/60 hover:bg-red-800 text-amber-200 text-xs font-semibold py-1.5 px-3 rounded-lg border border-red-700/50 transition-all cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Hướng dẫn</span>
            </button>
            <button
              onClick={() => setShowSyncModal(true)}
              className="flex items-center gap-1 bg-[#D4AF37] hover:bg-amber-500 text-red-950 text-xs font-bold py-1.5 px-3 rounded-lg border border-yellow-300 shadow-md transition-all cursor-pointer"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Đồng bộ dữ liệu</span>
            </button>
            
            
            <button 
              onClick={() => setShowResetModal(true)}
              title="Khôi phục dữ liệu gốc"
              className="p-1.5 bg-red-800/40 hover:bg-red-800 text-red-100 rounded-lg border border-red-700/50 transition-all flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-xs font-semibold">Khôi phục</span>
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
        
        {/* SIDEBAR PANEL (Desktop fixed left, Mobile sliding drawer) */}
        <aside className={`
          absolute md:static top-0 bottom-0 left-0 w-80 md:w-96 bg-white border-r border-slate-200 flex flex-col h-full z-[1010] shadow-2xl md:shadow-none transition-transform duration-300 ease-in-out
          ${isSidebarOpenOnMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          {/* TAB HEADER */}
          <div className="flex border-b border-slate-200 bg-slate-50 shrink-0">
            <button
              onClick={() => setActiveSidebarTab('settings')}
              className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-wider transition-colors ${activeSidebarTab === 'settings' ? 'text-red-800 border-b-2 border-red-800 bg-white' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
            >
              Cài đặt
            </button>
            <button
              onClick={() => setActiveSidebarTab('stats')}
              className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-wider transition-colors ${activeSidebarTab === 'stats' ? 'text-red-800 border-b-2 border-red-800 bg-white' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
            >
              Thống kê
            </button>
            <button
              onClick={() => setActiveSidebarTab('profiles')}
              className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-wider transition-colors ${activeSidebarTab === 'profiles' ? 'text-red-800 border-b-2 border-red-800 bg-white' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
            >
              Hồ sơ
            </button>
          </div>

          
          {/* Dashboard mini-widgets */}
                    <div className="flex-1 overflow-y-auto flex flex-col relative">
            {activeSidebarTab === 'stats' && (
              <div className="p-4 space-y-4 animate-fade-in">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" /> THỐNG KÊ TỔNG QUAN
                  </h2>
                  {isSidebarOpenOnMobile && (
                    <button 
                      onClick={() => setIsSidebarOpenOnMobile(false)}
                      className="md:hidden p-1 text-gray-400 hover:text-gray-600 bg-white rounded border border-slate-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
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
                  <div className="flex items-center justify-between mb-1 md:hidden">
                    <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                      <Search className="w-3.5 h-3.5 text-slate-400" /> TÌM KIẾM
                    </h2>
                    <button 
                      onClick={() => setIsSidebarOpenOnMobile(false)}
                      className="p-1 text-gray-400 hover:text-gray-600 bg-white rounded border border-slate-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
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

                    {/* Floating toggle sidebar button for mobile */}
          <button
            onClick={() => setIsSidebarOpenOnMobile(!isSidebarOpenOnMobile)}
            className="md:hidden absolute top-4 left-4 p-3 bg-red-950 text-amber-200 rounded-full border border-[#D4AF37] shadow-xl z-20 hover:bg-red-900 transition-all cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Map Controls: Center, Map Type, Directions */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex flex-row gap-1 bg-white/95 backdrop-blur-md p-1.5 rounded-xl border border-slate-200 shadow-2xl">
            <button
              onClick={() => {
                if (mapInstance) {
                  mapInstance.setView(savedCenter, 14);
                }
              }}
              title="Về trung tâm"
              className="px-3 h-9 rounded-lg transition-all flex flex-row items-center justify-center gap-1.5 cursor-pointer text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            >
              <Locate className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase leading-tight">Trung Tâm</span>
            </button>
            <button
              onClick={() => setMapType('voyager')}
              title="Bản đồ đường"
              className={`px-3 h-9 rounded-lg transition-all flex flex-row items-center justify-center gap-1.5 cursor-pointer ${mapType === 'voyager' ? 'bg-red-800 text-amber-200 shadow-inner' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}
            >
              <MapIcon className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase leading-tight">Bản đồ</span>
            </button>
            <button
              onClick={() => setMapType('terrain')}
              title="Bản đồ địa hình"
              className={`px-3 h-9 rounded-lg transition-all flex flex-row items-center justify-center gap-1.5 cursor-pointer ${mapType === 'terrain' ? 'bg-red-800 text-amber-200 shadow-inner' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}
            >
              <Layers className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase leading-tight">Địa hình</span>
            </button>
            
            <div className="w-px bg-slate-200 my-1.5 mx-0.5"></div> {/* Divider */}
            
            <button
              onClick={() => {
                setShowDirections(!showDirections);
                if (!showDirections) {
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
              className={`px-3 h-9 rounded-lg transition-all flex flex-row items-center justify-center gap-1.5 cursor-pointer ${showDirections ? 'bg-red-800 text-amber-200 shadow-inner' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}
            >
              <Navigation className={`w-4 h-4 ${showDirections ? '' : 'text-red-800'} rotate-45`} />
              <span className="text-[10px] font-bold uppercase leading-tight">Chỉ đường</span>
            </button>
          </div>

          {/* Interactive Directions / Routing Panel Overlay */}

          {showDirections && (
            <div className="absolute top-16 md:top-16 left-4 right-4 md:right-auto md:w-85 max-h-[82%] bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-slate-200 z-30 overflow-hidden flex flex-col animate-scale-up">
              {/* Panel Header */}
              <div className="bg-gradient-to-r from-red-950 to-red-900 p-3.5 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Navigation className="w-4.5 h-4.5 text-amber-400 rotate-45 animate-pulse" />
                  <h3 className="font-bold font-display uppercase text-xs md:text-sm text-amber-200 tracking-wider">
                    Chỉ Đường Địa Lý
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setShowDirections(false);
                    clearRouteLine();
                  }}
                  className="p-1 rounded bg-red-800/40 text-red-200 hover:text-white hover:bg-red-800 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Panel Inputs and Output Scroll Box */}
              <div className="p-4 space-y-4 overflow-y-auto flex-1 text-slate-700">
                
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
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-800 transition-all"
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
                  <div className="p-1 bg-slate-50 rounded-full border border-slate-200 text-slate-400">
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
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-800 transition-all"
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
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 px-3 rounded-lg transition-all cursor-pointer"
                  >
                    Xóa đường
                  </button>
                  <button
                    type="button"
                    onClick={drawRouteLine}
                    className="flex-1 bg-[#D4AF37] hover:bg-amber-500 text-red-950 text-xs font-bold py-2.5 px-3 rounded-lg border border-yellow-300 shadow transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Navigation className="w-3.5 h-3.5 rotate-45" />
                    Vẽ Chỉ Hướng
                  </button>
                </div>

                {/* 4. DETAILS DIRECTIONS RESULTS */}
                {directionInstructions?.length > 0 && (
                  <div className="border-t border-slate-100 pt-4 space-y-3 animate-fade-in">
                    <div className="p-3 bg-red-50/60 rounded-xl border border-red-100/70 space-y-1">
                      <div className="text-[9px] font-extrabold text-red-800 uppercase tracking-wider">KHOẢNG CÁCH THỰC ĐỊA</div>
                      <div className="text-base font-extrabold text-red-950">
                        {calculatedDistance && calculatedDistance < 1 
                          ? `${Math.round(calculatedDistance * 1000)} Mét` 
                          : `${calculatedDistance?.toFixed(2)} Kilômét`}
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Tính toán theo đường chim bay từ tọa độ xuất phát tới đích đến.
                      </p>
                    </div>

                    {/* Step instructions list */}
                    <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        TÓM TẮT DI CHUYỂN:
                      </p>
                      <ul className="space-y-1.5 text-[11px] leading-relaxed text-slate-600">
                        {directionInstructions.map((inst, index) => (
                          <li key={index} className="flex gap-1.5 items-start">
                            <span className="text-red-800 font-bold shrink-0">•</span>
                            <span>{inst}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Launch external turn-by-turn road driving directions */}
                    <button 
                      onClick={() => {
                        const origin = startType === 'gps' 
                          ? (gpsCoords ? `${gpsCoords[0]},${gpsCoords[1]}` : '') 
                          : (data.find(p => p.id === startPersonId)?.lat + ',' + data.find(p => p.id === startPersonId)?.lng);
                        const dest = data.find(p => p.id === destPersonId)?.lat + ',' + data.find(p => p.id === destPersonId)?.lng;
                        setGoogleMapsEmbedUrl(`https://maps.google.com/maps?saddr=${origin}&daddr=${dest}&output=embed`);
                      }}
                      className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold py-2.5 px-3 rounded-lg shadow transition-all cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                      <span>Chỉ Đường (Google Maps)</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* DETAILED PERSON INFOMATION MODAL SHEET */}
          {selectedPerson && (
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
              
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

      {/* SYNC DATABASE FROM GOOGLE SHEETS / EXCEL MODAL */}
      {showSyncModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[2500] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border-t-4 border-[#D4AF37] w-full max-w-lg overflow-hidden animate-scale-up">
            
            <div className="bg-gradient-to-r from-red-950 to-red-900 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold font-display uppercase text-sm md:text-base text-amber-200">
                  Cập Nhật & Đồng Bộ Dữ Liệu
                </h3>
              </div>
              <button 
                onClick={() => setShowSyncModal(false)}
                className="text-red-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab Selection */}
            <div className="flex border-b border-slate-200 bg-slate-50">
              <button
                type="button"
                onClick={() => setActiveSyncTab('sheets')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center justify-center gap-2 ${
                  activeSyncTab === 'sheets' 
                    ? 'border-red-800 text-red-800 bg-white font-extrabold' 
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100 font-bold'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 text-[#D4AF37]" />
                Google Sheets (Mây)
              </button>
              <button
                type="button"
                onClick={() => setActiveSyncTab('local')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center justify-center gap-2 ${
                  activeSyncTab === 'local' 
                    ? 'border-red-800 text-red-800 bg-white font-extrabold' 
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100 font-bold'
                }`}
              >
                <Upload className="w-4 h-4 text-[#D4AF37]" />
                Tải Excel / CSV
              </button>
            </div>

            <div className="p-5 space-y-4">
              {activeSyncTab === 'sheets' ? (
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSync(sheetUrl);
                  }} 
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                      Liên kết CSV của Google Sheets
                    </label>
                    <input
                      type="url"
                      required
                      placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?output=csv"
                      value={sheetUrl}
                      onChange={(e) => setSheetUrl(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-red-800 transition-all"
                    />
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      Dán đường dẫn xuất bản CSV từ Google Sheets của bạn. Bản đồ và danh sách tìm kiếm sẽ tự động đồng bộ theo nội dung trang tính trực tuyến.
                    </p>
                  </div>

                  {/* Template download section */}
                  <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 space-y-2.5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="text-xs font-bold text-slate-700">Tệp Mẫu Căn Lề & Kẻ Khung Sẵn</span>
                      </div>
                      <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Chuẩn 100%</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      Để nhập liệu dễ dàng và không bị lỗi cột, hãy tải xuống tệp mẫu đã được <strong>in đậm tiêu đề</strong>, <strong>căn độ rộng tối ưu</strong> và <strong>kẻ khung bảng sẵn</strong> dưới đây:
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={downloadExcelTemplate}
                        className="flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg shadow-sm hover:shadow transition-all group"
                      >
                        <Download className="w-3.5 h-3.5 transition-transform group-hover:translate-y-0.5" />
                        <span>Tải Excel Mẫu (.xlsx)</span>
                      </button>
                      <a
                        href="https://docs.google.com/spreadsheets/d/1Xp9mXJ50v_2D4b-w4A1Yh-B8R92eF6-I7S56l5Ue7a0/copy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg shadow-sm hover:shadow transition-all group"
                      >
                        <ExternalLink className="w-3.5 h-3.5 transition-transform group-hover:scale-105" />
                        <span>Dùng Google Sheets</span>
                      </a>
                    </div>
                  </div>

                  {/* Guide prompt */}
                  <div className="bg-amber-50 rounded-lg p-3 border border-amber-100 flex gap-2.5">
                    <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-[10px] text-amber-800 leading-relaxed space-y-1">
                      <p className="font-bold uppercase tracking-wider text-[9px]">LƯU Ý CẤU TRÚC TRANG TÍNH:</p>
                      <p>Tệp Google Sheets hoặc Excel cần có tiêu đề các cột tiếng Việt chính xác như: <strong>Họ tên</strong>, <strong>Năm sinh</strong>, <strong>Diện chính sách</strong>, <strong>Tình trạng</strong>, <strong>Địa chỉ</strong>, <strong>Tọa độ Lat</strong>, <strong>Tọa độ Lng</strong>, <strong>Thông tin gia đình</strong>, <strong>Tiểu sử và Thành tích</strong>, <strong>Hình ảnh</strong>.</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setShowSyncModal(false);
                        setShowGuideModal(true);
                      }}
                      className="text-[11px] text-red-800 font-bold hover:underline"
                    >
                      Xem hướng dẫn kết nối ➔
                    </button>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowSyncModal(false)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 px-4 rounded-lg transition-all"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="bg-[#D4AF37] hover:bg-amber-500 text-red-950 text-xs font-bold py-2 px-4 rounded-lg shadow border border-yellow-300 transition-all flex items-center gap-1.5"
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
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                      Chọn tệp dữ liệu từ máy tính của bạn
                    </label>
                    <div className="border-2 border-dashed border-slate-200 hover:border-red-800/60 rounded-xl p-6 transition-all text-center bg-slate-50 relative group">
                      <input
                        type="file"
                        accept=".xlsx, .xls, .csv"
                        onChange={handleExcelUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="p-3 bg-red-50 rounded-full text-red-800 group-hover:scale-110 transition-all duration-300">
                          <Upload className="w-6 h-6" />
                        </div>
                        <div className="text-xs text-slate-700 font-semibold">
                          Kéo thả hoặc Click để tải tệp lên
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Hỗ trợ định dạng Excel (.xlsx, .xls) hoặc tệp văn bản (.csv)
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Template download section */}
                  <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 space-y-2.5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="text-xs font-bold text-slate-700">Tệp Mẫu Căn Lề & Kẻ Khung Sẵn</span>
                      </div>
                      <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Chuẩn 100%</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      Để nhập liệu dễ dàng và không bị lỗi cột, hãy tải xuống tệp mẫu đã được <strong>in đậm tiêu đề</strong>, <strong>căn độ rộng tối ưu</strong> và <strong>kẻ khung bảng sẵn</strong> dưới đây:
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={downloadExcelTemplate}
                        className="flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg shadow-sm hover:shadow transition-all group"
                      >
                        <Download className="w-3.5 h-3.5 transition-transform group-hover:translate-y-0.5" />
                        <span>Tải Excel Mẫu (.xlsx)</span>
                      </button>
                      <a
                        href="https://docs.google.com/spreadsheets/d/1Xp9mXJ50v_2D4b-w4A1Yh-B8R92eF6-I7S56l5Ue7a0/copy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg shadow-sm hover:shadow transition-all group"
                      >
                        <ExternalLink className="w-3.5 h-3.5 transition-transform group-hover:scale-105" />
                        <span>Dùng Google Sheets</span>
                      </a>
                    </div>
                  </div>

                  <div className="bg-amber-50 rounded-lg p-3 border border-amber-100 flex gap-2.5">
                    <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-[10px] text-amber-800 leading-relaxed space-y-1">
                      <p className="font-bold uppercase tracking-wider text-[9px]">LƯU Ý CẤU TRÚC TỆP:</p>
                      <p>Dòng đầu tiên của tệp Excel/CSV bắt buộc phải chứa các tiêu đề cột tiếng Việt: <strong>Họ tên</strong>, <strong>Năm sinh</strong>, <strong>Diện chính sách</strong>, <strong>Tình trạng</strong>, <strong>Địa chỉ</strong>, <strong>Tọa độ Lat</strong>, <strong>Tọa độ Lng</strong>, <strong>Thông tin gia đình</strong>, <strong>Tiểu sử và Thành tích</strong>, <strong>Hình ảnh</strong>.</p>
                    </div>
                  </div>

                  <div className="flex justify-end pt-3 border-t border-slate-100 gap-2">
                    <button
                      type="button"
                      onClick={() => setShowSyncModal(false)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 px-4 rounded-lg transition-all"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      
      {/* RESET MODAL */}
      {showResetModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[2500] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border-t-4 border-red-800 w-full max-w-md overflow-hidden animate-scale-up">
            <div className="bg-gradient-to-r from-red-950 to-red-900 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <RefreshCw className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold font-display uppercase text-sm md:text-base text-amber-200">
                  Khôi Phục Dữ Liệu
                </h3>
              </div>
              <button 
                onClick={() => setShowResetModal(false)}
                className="text-red-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Bạn có thể khôi phục toàn bộ dữ liệu về trạng thái mẫu ban đầu, hoặc chỉ khôi phục các dữ liệu nằm trong một khoảng thời gian cụ thể (những khoảng thời gian khác sẽ được giữ nguyên).
              </p>

              <div className="space-y-3">
                <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-red-50 border-red-200 transition-colors">
                  <input 
                    type="radio" 
                    name="resetMode" 
                    checked={resetMode === 'empty'} 
                    onChange={() => setResetMode('empty')}
                    className="text-red-800 focus:ring-red-800 w-4 h-4"
                  />
                  <div>
                    <div className="font-bold text-sm text-red-800">Xóa sạch dữ liệu</div>
                    <div className="text-[11px] text-red-600/80">Xóa toàn bộ danh sách hiện tại để có bản đồ trống (kể cả dữ liệu mẫu).</div>
                  </div>
                </label>
                
                <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                  <input 
                    type="radio" 
                    name="resetMode" 
                    checked={resetMode === 'all'} 
                    onChange={() => setResetMode('all')}
                    className="text-red-800 focus:ring-red-800 w-4 h-4"
                  />
                  <div>
                    <div className="font-bold text-sm text-slate-800">Khôi phục toàn bộ (Dữ liệu mẫu)</div>
                    <div className="text-[11px] text-slate-500">Tải lại dữ liệu mẫu (demo) ban đầu.</div>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                  <input 
                    type="radio" 
                    name="resetMode" 
                    checked={resetMode === 'range'} 
                    onChange={() => setResetMode('range')}
                    className="text-red-800 focus:ring-red-800 w-4 h-4"
                  />
                  <div>
                    <div className="font-bold text-sm text-slate-800">Khôi phục theo thời gian</div>
                    <div className="text-[11px] text-slate-500">Chỉ khôi phục dữ liệu gốc trong khoảng thời gian đã chọn.</div>
                  </div>
                </label>
              </div>

              {resetMode === 'range' && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Từ ngày</label>
                    <input 
                      type="date" 
                      value={resetFromDate}
                      onChange={(e) => setResetFromDate(e.target.value)}
                      className="w-full text-xs p-1.5 border border-slate-300 rounded focus:outline-none focus:border-red-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Đến ngày</label>
                    <input 
                      type="date" 
                      value={resetToDate}
                      onChange={(e) => setResetToDate(e.target.value)}
                      className="w-full text-xs p-1.5 border border-slate-300 rounded focus:outline-none focus:border-red-800"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-200 hover:bg-slate-300 rounded-lg transition-colors"
                >
                  Hủy
                </button>
                <button 
                  onClick={executeResetData}
                  disabled={resetMode === 'range' && !resetFromDate && !resetToDate}
                  className="px-4 py-2 text-xs font-bold text-amber-100 bg-red-800 hover:bg-red-900 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Xác Nhận Khôi Phục
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

      {showGuideModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[2500] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border-t-4 border-red-800 w-full max-w-lg overflow-hidden animate-scale-up">
            
            <div className="bg-gradient-to-r from-red-950 to-red-900 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <HelpCircle className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold font-display uppercase text-sm md:text-base text-amber-200">
                  Hướng Dẫn Kết Nối Google Sheets
                </h3>
              </div>
              <button 
                onClick={() => setShowGuideModal(false)}
                className="text-red-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto text-xs text-slate-600 leading-relaxed">
              
              <div className="space-y-2">
                <p className="font-bold text-red-950 text-sm">Các Bước Lấy Link CSV Để Đồng Bộ Bản Đồ:</p>
                <ol className="list-decimal list-inside space-y-2 pl-1 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <li>Mở tệp Google Sheets chứa thông tin danh sách của bạn lên.</li>
                  <li>Click vào menu <strong className="text-slate-800">Tệp (File)</strong> ở góc trên bên trái.</li>
                  <li>Chọn <strong className="text-slate-800">Chia sẻ (Share)</strong> ➔ <strong className="text-slate-800">Xuất bản lên web (Publish to web)</strong>.</li>
                  <li>Tại bảng hiện ra, chuyển ô chọn đầu tiên thành <strong className="text-red-800 font-bold">Giá trị phân tách bằng dấu phẩy (.csv)</strong>.</li>
                  <li>Click vào nút <strong className="text-slate-800">Xuất bản (Publish)</strong> màu xanh và chọn Xác nhận.</li>
                  <li>Sao chép đường liên kết (URL) được sinh ra và dán vào ô đồng bộ của ứng dụng.</li>
                </ol>
              </div>

              <div className="space-y-2">
                <p className="font-bold text-red-950 text-sm">Cấu Trúc Các Cột Yêu Cầu (Chính Xác):</p>
                <p>Google Sheets cần có tiêu đề các cột chuẩn tiếng Việt sau để ứng dụng phân loại tự động:</p>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono text-[10px] text-slate-700 grid grid-cols-2 gap-y-1 gap-x-2">
                  <div>1. <strong>Họ tên</strong></div>
                  <div>6. <strong>Tọa độ Lat</strong> (vĩ độ v.d: 21.9863)</div>
                  <div>2. <strong>Năm sinh</strong></div>
                  <div>7. <strong>Tọa độ Lng</strong> (kinh độ v.d: 105.0863)</div>
                  <div>3. <strong>Diện chính sách</strong></div>
                  <div>8. <strong>Thông tin gia đình</strong></div>
                  <div>4. <strong>Tình trạng</strong> (Hưu trí (Cựu chiến binh)/Đã mất (Đã chết))</div>
                  <div>9. <strong>Tiểu sử và Thành tích</strong></div>
                  <div>5. <strong>Địa chỉ</strong></div>
                  <div>10. <strong>Hình ảnh</strong> (URL ảnh chân dung)</div>
                </div>
              </div>
                            
              <div className="space-y-2">
                <p className="font-bold text-red-950 text-sm">Chú Thích Bản Đồ:</p>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-600 ring-2 ring-red-200"></span></span>
                    <span className="font-medium text-gray-700 text-[11px]">Hưu trí / Cựu chiến binh (Đỏ)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500 ring-2 ring-amber-200"></span></span>
                    <span className="font-medium text-gray-700 text-[11px]">Đang công tác (Vàng)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3"><span className="relative inline-flex rounded-full h-3 w-3 bg-slate-500 ring-2 ring-slate-200"></span></span>
                    <span className="font-medium text-gray-700 text-[11px]">Đã mất (Xám)</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <p className="font-bold text-red-950 text-sm">Hướng dẫn tải hình ảnh từ file Excel:</p>
                <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-amber-900">
                  <p className="mb-2">Vì ứng dụng hiện tại chạy trên nền web tĩnh và đồng bộ qua Google Sheets / Excel, bạn không thể tải trực tiếp file ảnh vào Excel. Thay vào đó, bạn làm theo cách sau:</p>
                  <ol className="list-decimal list-inside space-y-1 pl-1">
                    <li>Trong file Excel/Google Sheets của bạn, hãy chắc chắn có một cột tên là <strong>"Hình ảnh"</strong>.</li>
                    <li>Sử dụng link (URL) ảnh trực tiếp: Tải hình ảnh của người có công lên các dịch vụ lưu trữ (ví dụ: Google Drive, Imgur, Postimages, Facebook...).</li>
                    <li>Sao chép link ảnh trực tiếp (thường có đuôi .jpg hoặc .png) và dán vào cột <strong>"Hình ảnh"</strong> tương ứng với người đó.</li>
                    <li>Khi bạn đồng bộ file vào ứng dụng, hệ thống sẽ tự động đọc link URL này và tải hình ảnh lên cả Bản đồ và Avatar chi tiết.</li>
                  </ol>
                  <p className="mt-2 text-[10px] italic">Bạn có thể tải lại trang ứng dụng để kiểm tra các thay đổi nhé! Hãy cho tôi biết nếu bạn cần hỗ trợ thêm về cách lấy link ảnh trực tiếp từ Google Drive.</p>
                </div>
              </div>
              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  onClick={() => {
                    setShowGuideModal(false);
                    setShowSyncModal(true);
                  }}
                  className="bg-red-900 hover:bg-red-950 text-amber-100 text-xs font-bold py-2 px-4 rounded-lg shadow border border-red-800 transition-all cursor-pointer"
                >
                  Mở Bảng Đồng Bộ Ngay
                </button>
              </div>

            </div>
          </div>
        </div>
      )}



    </div>
  );
}
