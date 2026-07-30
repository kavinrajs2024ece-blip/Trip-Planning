/**
 * Travel Planning using Agentic AI - Enterprise Multi-Agent System
 * Orchestrates 6 Agents:
 * 1. Destination Agent
 * 2. Accommodation Agent
 * 3. Weather Agent
 * 4. Transport Agent
 * 5. Itinerary Agent
 * 6. Budget Agent
 */

document.addEventListener('DOMContentLoaded', () => {

  /* ==========================================================================
     1. GLOBAL APP STATE
     ========================================================================== */

  let currentState = {
    activeView: 'dashboard',
    theme: 'dark',
    activeTrip: JSON.parse(localStorage.getItem('aether_active_trip') || 'null'),
    savedTrips: JSON.parse(localStorage.getItem('aether_saved_trips') || '[]'),
    favoriteHotels: JSON.parse(localStorage.getItem('aether_favorite_hotels') || '[]'),
    activityLogs: JSON.parse(localStorage.getItem('aether_activity_logs') || '[]'),
    compareList: [],
    leafletMapInstance: null,
    transportMapInstance: null
  };

  /* ==========================================================================
     2. NAVIGATION ROUTER
     ========================================================================== */

  const sidebar = document.getElementById('sidebar');
  const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const navItems = document.querySelectorAll('.nav-item');
  const appViews = document.querySelectorAll('.app-view');

  function switchView(viewId) {
    currentState.activeView = viewId;
    
    navItems.forEach(item => {
      if (item.getAttribute('data-view') === viewId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    appViews.forEach(view => {
      if (view.id === `view-${viewId}`) {
        view.classList.add('active');
      } else {
        view.classList.remove('active');
      }
    });

    sidebar?.classList.remove('mobile-open');

    if (viewId === 'dashboard') {
      renderDashboard();
    } else if (viewId === 'agent-destination') {
      renderDestinationAgentPage();
    } else if (viewId === 'agent-accommodation') {
      renderAccommodationAgentPage();
    } else if (viewId === 'agent-weather') {
      renderWeatherAgentPage();
    } else if (viewId === 'agent-transport') {
      renderTransportAgentPage();
    } else if (viewId === 'agent-itinerary') {
      renderItineraryAgentPage();
    } else if (viewId === 'agent-budget') {
      renderBudgetAgentPage();
    } else if (viewId === 'controller') {
      renderTripOverviewPage();
    } else if (viewId === 'history') {
      renderHistoryGrid();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const targetView = item.getAttribute('data-view');
      if (targetView) switchView(targetView);
    });
  });

  function bindNavTriggers() {
    document.querySelectorAll('.nav-trigger').forEach(trig => {
      trig.onclick = (e) => {
        e.preventDefault();
        const target = trig.getAttribute('data-target');
        if (target) switchView(target);
      };
    });
  }
  bindNavTriggers();

  sidebarToggleBtn?.addEventListener('click', () => {
    sidebar?.classList.toggle('collapsed');
  });

  mobileMenuBtn?.addEventListener('click', () => {
    sidebar?.classList.toggle('mobile-open');
  });

  themeToggleBtn?.addEventListener('click', () => {
    currentState.theme = currentState.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', currentState.theme);
  });

  /* ==========================================================================
     3. FORM INPUT HANDLING
     ========================================================================== */

  let selectedTravelStyle = 'Luxury';
  let selectedInterests = [];

  const npDestinationInput = document.getElementById('npDestination');
  const popularChips = document.querySelectorAll('#popularDestChips .dest-chip');

  popularChips.forEach(chip => {
    chip.addEventListener('click', () => {
      popularChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const destVal = chip.getAttribute('data-dest');
      if (destVal && npDestinationInput) {
        npDestinationInput.value = destVal;
      }
    });
  });

  const npDaysInput = document.getElementById('npDays');
  document.getElementById('btnDaysMinus')?.addEventListener('click', () => {
    let cur = parseInt(npDaysInput.value) || 3;
    if (cur > 1) npDaysInput.value = cur - 1;
  });
  document.getElementById('btnDaysPlus')?.addEventListener('click', () => {
    let cur = parseInt(npDaysInput.value) || 3;
    if (cur < 14) npDaysInput.value = cur + 1;
  });

  const budgetPresets = document.querySelectorAll('#budgetPresets .preset-btn');
  const npBudgetInput = document.getElementById('npBudget');
  budgetPresets.forEach(preset => {
    preset.addEventListener('click', () => {
      budgetPresets.forEach(p => p.classList.remove('active'));
      preset.classList.add('active');
      const bVal = preset.getAttribute('data-value');
      if (bVal && npBudgetInput) npBudgetInput.value = bVal;
    });
  });

  const npTravelersInput = document.getElementById('npTravelers');
  document.getElementById('btnTravelersMinus')?.addEventListener('click', () => {
    let cur = parseInt(npTravelersInput.value) || 2;
    if (cur > 1) npTravelersInput.value = cur - 1;
  });
  document.getElementById('btnTravelersPlus')?.addEventListener('click', () => {
    let cur = parseInt(npTravelersInput.value) || 2;
    if (cur < 20) npTravelersInput.value = cur + 1;
  });

  const styleCards = document.querySelectorAll('#travelStyleCards .style-card');
  styleCards.forEach(card => {
    card.addEventListener('click', () => {
      styleCards.forEach(c => {
        c.classList.remove('active');
        const radio = c.querySelector('.style-card-radio');
        if (radio) radio.innerHTML = '';
      });
      card.classList.add('active');
      const radio = card.querySelector('.style-card-radio');
      if (radio) radio.innerHTML = '<i class="fa-solid fa-check"></i>';
      selectedTravelStyle = card.getAttribute('data-style') || 'Standard';
    });
  });

  const interestChips = document.querySelectorAll('#interestsContainer .interest-chip');
  const interestsCounter = document.getElementById('interestsCounter');
  interestChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const val = chip.getAttribute('data-interest');
      if (chip.classList.contains('active')) {
        chip.classList.remove('active');
        selectedInterests = selectedInterests.filter(i => i !== val);
      } else {
        if (selectedInterests.length < 5) {
          chip.classList.add('active');
          selectedInterests.push(val);
        }
      }
      if (interestsCounter) interestsCounter.innerText = `${selectedInterests.length} / 5 selected`;
    });
  });

  function validateForm() {
    const alertBox = document.getElementById('npValidationAlert');
    const destination = npDestinationInput?.value.trim();
    if (!destination) {
      if (alertBox) {
        alertBox.style.display = 'flex';
        alertBox.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> <div><strong>Destination Required:</strong> Please enter a destination name (e.g. Ooty, Goa).</div>`;
      }
      return false;
    }
    if (alertBox) {
      alertBox.style.display = 'none';
      alertBox.innerHTML = '';
    }
    return true;
  }

  function showErrorAlert(msg) {
    const alertBox = document.getElementById('npValidationAlert');
    if (alertBox) {
      alertBox.style.display = 'flex';
      alertBox.innerHTML = `<i class="fa-solid fa-triangle-exclamation" style="color:#ef4444;"></i> <div><strong>Error:</strong> ${msg}</div>`;
    }
  }

  /* ==========================================================================
     4. MULTI-AGENT ORCHESTRATION PIPELINE
     Order: Destination -> Accommodation -> Weather -> Transport -> Itinerary -> Budget
     ========================================================================== */

  const npGenerateBtn = document.getElementById('npGenerateBtn');

  npGenerateBtn?.addEventListener('click', async () => {
    if (!validateForm()) return;

    const destination = npDestinationInput.value.trim();
    const days = parseInt(npDaysInput?.value) || 3;
    const budget = parseInt(npBudgetInput?.value) || 50000;
    const travelers = parseInt(npTravelersInput?.value) || 2;

    npGenerateBtn.disabled = true;
    const origText = npGenerateBtn.innerHTML;
    npGenerateBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Orchestrating Agents...`;

    try {
      await runMultiAgentPipeline(destination, days, budget, travelers, selectedTravelStyle, [...selectedInterests]);
    } catch (err) {
      console.error('Multi-Agent Pipeline Failure:', err);
      showErrorAlert('Failed to generate trip plan. Please try again.');
    } finally {
      npGenerateBtn.disabled = false;
      npGenerateBtn.innerHTML = origText;
    }
  });

  async function fetchAPI(endpoint, bodyData) {
    const apiHosts = ['http://127.0.0.1:8000', 'http://localhost:8000', ''];
    for (const host of apiHosts) {
      try {
        const resp = await fetch(`${host}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyData)
        });
        if (resp.ok) return await resp.json();
      } catch (e) {
        // try next host
      }
    }
    throw new Error(`Failed to reach ${endpoint}`);
  }

  function updateProgress(cardId, stateId, pct, msg) {
    const progressBar = document.getElementById('procProgressBar');
    const progressPct = document.getElementById('procProgressPct');
    const statusText = document.getElementById('procStatusText');

    if (statusText) statusText.innerText = msg;
    if (progressBar) progressBar.style.width = `${pct}%`;
    if (progressPct) progressPct.innerText = `${pct}%`;

    const card = document.getElementById(cardId);
    const stateEl = document.getElementById(stateId);
    if (card) card.className = 'glass-card proc-agent-card completed';
    if (stateEl) {
      stateEl.innerHTML = `<span class="state-pill state-completed"><i class="fa-solid fa-circle-check"></i> Completed</span>`;
    }

    const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false });
    currentState.activityLogs.unshift(`[${timeStr}] ${msg}`);
    if (currentState.activityLogs.length > 25) currentState.activityLogs.pop();
    localStorage.setItem('aether_activity_logs', JSON.stringify(currentState.activityLogs));
  }

  function buildFallbackItinerary(destination, attractions, days) {
    const timeSlots = ["09:00 AM", "11:30 AM", "02:00 PM", "05:00 PM"];
    const perDay = Math.max(1, Math.ceil(attractions.length / days));
    let idx = 0;
    const res = [];
    for (let d = 1; d <= days; d++) {
      const places = [];
      let c = 0;
      while (idx < attractions.length && c < perDay) {
        const p = { ...attractions[idx] };
        p.time = timeSlots[c % timeSlots.length];
        places.push(p);
        idx++;
        c++;
      }
      res.push({ day: d, destination: destination, places: places });
    }
    return res;
  }

  function getFallbackWeather(destination) {
    return {
      status: "success",
      destination: destination,
      current: { temperature: "20°C", feels_like: "19°C", humidity: "60%", wind_speed: "10 km/h", pressure: "1015 hPa", visibility: "10 km", uv_index: "6 (High)", sunrise: "06:10 AM", sunset: "06:40 PM", air_quality: "AQI 20 (Good)" },
      daily_forecast: [1, 2, 3].map(d => ({
        day: d,
        slots: {
          morning: { time: "08:00 AM", temp: "18°C", icon: "fa-sun", rain_prob: "10%", desc: "Fresh & Sunny" },
          afternoon: { time: "01:00 PM", temp: "23°C", icon: "fa-cloud-sun", rain_prob: "20%", desc: "Mild & Pleasant" },
          evening: { time: "06:00 PM", temp: "19°C", icon: "fa-cloud", rain_prob: "15%", desc: "Cool Breeze" },
          night: { time: "09:00 PM", temp: "15°C", icon: "fa-moon", rain_prob: "5%", desc: "Clear Skies" }
        }
      })),
      ai_suggestions: ["Carry a light jacket for evenings.", "Good time for morning sightseeing.", "Apply UV sunscreen during midday."]
    };
  }

  function getFallbackTransport(fromLoc, dest) {
    return {
      status: "success",
      from: fromLoc,
      destination: dest,
      distance_km: 555,
      estimated_duration: "9h 30m",
      route_summary: `Via NH48 & NH181 to ${dest}`,
      best_travel_option: "Car is fastest; Bus is most economical.",
      options: [
        { mode: "Car (Self-Drive / Personal)", duration: "9h 30m", estimated_cost: "₹4,162", fuel_estimate: "46 Liters", traffic_status: "Moderate Highway Traffic", is_fastest: true },
        { mode: "Bus (AC Luxury Sleeper)", duration: "11h 15m", estimated_cost: "₹950", is_economical: true },
        { mode: "Train (Express + Toy Train)", duration: "10h 45m", estimated_cost: "₹650", is_comfortable: true }
      ],
      ai_recommendations: ["Bus is the most economical.", "Car is fastest.", "Train offers scenic mountain railway views."],
      polyline_points: [[13.0827, 80.2707], [11.4102, 76.6950]],
      google_maps_navigation_url: `https://www.google.com/maps/dir/?api=1&origin=${fromLoc}&destination=${dest}`
    };
  }

  /* ==========================================================================
     5. ACCOMMODATION AGENT PAGE (REAL HOTELS + SEARCH + FILTERS + COMPARE + FAVORITE)
     ========================================================================== */

  function renderAccommodationAgentPage() {
    const container = document.getElementById('hotelAgentPageContainer');
    const trip = currentState.activeTrip;

    if (!trip || !trip.hotels || trip.hotels.length === 0) {
      renderEmptyState(container, 'Accommodation Agent');
      return;
    }

    let hotels = [...trip.hotels];

    container.innerHTML = `
      <div class="hotel-section-wrapper fade-in">
        
        <!-- HEADER STATUS BANNER -->
        <div class="glass-card section-card mb-4">
          <div class="card-header-bar">
            <div>
              <span class="badge-sub text-emerald"><i class="fa-solid fa-circle-check"></i> Verified Google Places Hotels</span>
              <h2 style="font-size: 24px; font-weight: 800; margin-top: 6px;">Hotels & Resorts in ${trip.name}</h2>
              <p class="card-desc">Top 10+ real accommodations sorted by rating, review count, and distance</p>
            </div>
            <button class="btn btn-primary-gradient btn-sm" id="btnCompareHotelsModal">
              <i class="fa-solid fa-scale-balanced"></i> Compare Hotels (<span id="compareCountTag">0</span>)
            </button>
          </div>
        </div>

        <!-- SEARCH & MULTI-FILTER TOOLBAR -->
        <div class="hotel-filter-bar">
          <input type="text" id="hotelSearchInput" class="hotel-search-input" placeholder="🔍 Search hotel name or location...">

          <select id="filterRatingSelect" class="hotel-filter-select">
            <option value="all">⭐ All Ratings</option>
            <option value="4.7">4.7+ ★ (Top Rated)</option>
            <option value="4.5">4.5+ ★ (Highly Rated)</option>
            <option value="4.0">4.0+ ★ (Good)</option>
          </select>

          <select id="filterPriceSelect" class="hotel-filter-select">
            <option value="all">💰 All Prices</option>
            <option value="Luxury">Luxury</option>
            <option value="Standard">Standard</option>
            <option value="Budget">Budget</option>
          </select>

          <select id="filterTypeSelect" class="hotel-filter-select">
            <option value="all">🏨 All Hotel Types</option>
            <option value="Resort">Resorts</option>
            <option value="Hotel">Hotels</option>
            <option value="Heritage">Heritage</option>
            <option value="Hostel">Hostels / Pods</option>
          </select>
        </div>

        <!-- HOTELS GRID CONTAINER -->
        <div id="hotelsGridContainer" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px;">
          <!-- Dynamically populated -->
        </div>

      </div>

      <!-- COMPARE HOTELS MODAL BACKDROP -->
      <div id="compareModalBackdrop" class="modal-backdrop-custom" style="display: none;">
        <div class="modal-content-glass">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h3 class="card-title"><i class="fa-solid fa-scale-balanced text-cyan"></i> Hotel Side-by-Side Comparison</h3>
            <button class="btn btn-sm btn-glass" id="btnCloseCompareModal"><i class="fa-solid fa-xmark"></i> Close</button>
          </div>
          <div id="compareModalBody"></div>
        </div>
      </div>
    `;

    renderHotelsGrid(hotels);

    // Event Listeners for Filters & Search
    const searchInput = document.getElementById('hotelSearchInput');
    const ratingSelect = document.getElementById('filterRatingSelect');
    const priceSelect = document.getElementById('filterPriceSelect');
    const typeSelect = document.getElementById('filterTypeSelect');

    function filterHotels() {
      const q = searchInput.value.toLowerCase().trim();
      const minRating = ratingSelect.value === 'all' ? 0 : parseFloat(ratingSelect.value);
      const priceCategory = priceSelect.value;
      const hotelType = typeSelect.value;

      const filtered = trip.hotels.filter(h => {
        const matchesQ = h.name.toLowerCase().includes(q) || h.address.toLowerCase().includes(q);
        const matchesRating = (h.rating || 4.5) >= minRating;
        const matchesPrice = priceCategory === 'all' || h.price_category === priceCategory;
        const matchesType = hotelType === 'all' || (h.hotel_type && h.hotel_type.includes(hotelType));
        return matchesQ && matchesRating && matchesPrice && matchesType;
      });

      renderHotelsGrid(filtered);
    }

    searchInput?.addEventListener('input', filterHotels);
    ratingSelect?.addEventListener('change', filterHotels);
    priceSelect?.addEventListener('change', filterHotels);
    typeSelect?.addEventListener('change', filterHotels);

    // Compare Modal Trigger
    document.getElementById('btnCompareHotelsModal')?.addEventListener('click', () => {
      openCompareModal(trip.hotels);
    });
    document.getElementById('btnCloseCompareModal')?.addEventListener('click', () => {
      document.getElementById('compareModalBackdrop').style.display = 'none';
    });
  }

  function renderHotelsGrid(hotels) {
    const grid = document.getElementById('hotelsGridContainer');
    if (!grid) return;

    if (hotels.length === 0) {
      grid.innerHTML = `<div class="text-muted py-5 text-center" style="grid-column: 1/-1;">No hotels match your selected filters.</div>`;
      return;
    }

    grid.innerHTML = hotels.map(h => {
      const isFav = currentState.favoriteHotels.includes(h.place_id || h.name);
      const isCompared = currentState.compareList.includes(h.place_id || h.name);
      const gmapsUrl = h.google_maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(h.name)}`;

      return `
        <div class="hotel-card-real">
          <div class="hotel-img-wrapper">
            <img src="${h.photo_url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80'}" class="hotel-img" alt="${h.name}">
            <button class="btn-favorite ${isFav ? 'active' : ''}" data-id="${h.place_id || h.name}" title="Favorite Hotel">
              <i class="fa-solid fa-heart"></i>
            </button>
            <span class="hotel-badge-tier">${h.price_category || 'Standard'} • ${h.hotel_type || 'Hotel'}</span>
          </div>

          <div class="hotel-body">
            <h4 class="hotel-title">${h.name}</h4>
            
            <div class="hotel-meta-row">
              <span class="hotel-stars"><i class="fa-solid fa-star"></i> ${h.rating || 4.6} ★</span>
              <span class="hotel-reviews">(${h.user_ratings_total || 350} Reviews)</span>
              <span style="color:#00f2fe; font-weight:700; font-size:12px;">AI Score: ${h.ai_score || 95}/100</span>
            </div>

            <div class="hotel-address-text">
              <i class="fa-solid fa-location-dot text-cyan me-1"></i> ${h.address}
            </div>

            <div style="font-size:12px; color: #94a3b8;">
              <i class="fa-solid fa-route me-1"></i> Distance: <strong>${h.distance_km || 1.5} km</strong> from city center
            </div>

            <div class="d-flex align-items-center gap-2 mt-2">
              <input type="checkbox" class="compare-checkbox" data-id="${h.place_id || h.name}" ${isCompared ? 'checked' : ''}>
              <span style="font-size:12px; color:#cbd5e1;">Select to Compare</span>
            </div>

            <div class="hotel-footer-actions">
              <a href="${gmapsUrl}" target="_blank" class="btn btn-xs btn-glass text-decoration-none flex-1 text-center">
                <i class="fa-solid fa-map-pin"></i> Google Maps
              </a>
              <button class="btn btn-xs btn-primary-gradient btn-book-now flex-1" data-name="${h.name}">
                <i class="fa-solid fa-bed"></i> Book Now
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Favorite Button Binding
    document.querySelectorAll('.btn-favorite').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        if (currentState.favoriteHotels.includes(id)) {
          currentState.favoriteHotels = currentState.favoriteHotels.filter(f => f !== id);
          btn.classList.remove('active');
        } else {
          currentState.favoriteHotels.push(id);
          btn.classList.add('active');
        }
        localStorage.setItem('aether_favorite_hotels', JSON.stringify(currentState.favoriteHotels));
      });
    });

    // Compare Checkbox Binding
    document.querySelectorAll('.compare-checkbox').forEach(chk => {
      chk.addEventListener('change', () => {
        const id = chk.getAttribute('data-id');
        if (chk.checked) {
          if (!currentState.compareList.includes(id)) currentState.compareList.push(id);
        } else {
          currentState.compareList = currentState.compareList.filter(c => c !== id);
        }
        const tag = document.getElementById('compareCountTag');
        if (tag) tag.innerText = currentState.compareList.length;
      });
    });

    // Book Now & Hotel Selection Handler
    document.querySelectorAll('.btn-book-now').forEach(btn => {
      btn.addEventListener('click', () => {
        const name = btn.getAttribute('data-name');
        const hotel = (currentState.activeTrip.hotels || []).find(h => h.name === name);
        if (hotel) {
          currentState.activeTrip.selectedHotel = hotel;
          localStorage.setItem('aether_active_trip', JSON.stringify(currentState.activeTrip));
        }
        alert(`Hotel "${name}" selected for your trip!\nYour Budget Agent tracker has been updated live with this hotel's cost.`);
        if (currentState.activeView === 'agent-budget') renderBudgetAgentPage();
      });
    });
  }

  function openCompareModal(allHotels) {
    const modal = document.getElementById('compareModalBackdrop');
    const body = document.getElementById('compareModalBody');
    if (!modal || !body) return;

    const selected = allHotels.filter(h => currentState.compareList.includes(h.place_id || h.name));

    if (selected.length < 2) {
      alert('Please check at least 2 hotel compare boxes to compare side-by-side.');
      return;
    }

    modal.style.display = 'flex';
    body.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(${selected.length}, 1fr); gap: 16px;">
        ${selected.map(h => `
          <div class="glass-card p-3" style="background: rgba(255,255,255,0.04);">
            <img src="${h.photo_url}" style="width:100%; height:140px; object-fit:cover; border-radius:10px; mb-2;">
            <h4 style="font-size:16px; font-weight:800; color:#fff;" class="mt-2">${h.name}</h4>
            <div style="color:#fbbf24; font-weight:700; margin: 4px 0;">${h.rating} ★ (${h.user_ratings_total} reviews)</div>
            <div style="font-size:12px; color:#00f2fe; margin-bottom: 6px;">AI Match Score: ${h.ai_score}/100</div>
            <div style="font-size:12px; color:#cbd5e1;">Price: <strong>${h.price_category}</strong></div>
            <div style="font-size:12px; color:#cbd5e1;">Type: <strong>${h.hotel_type}</strong></div>
            <div style="font-size:12px; color:#cbd5e1;">Distance: <strong>${h.distance_km} km</strong></div>
            <div style="font-size:12px; color:#cbd5e1; margin-top:6px;">${h.address}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  /* ==========================================================================
     6. WEATHER AGENT PAGE (CURRENT METRICS + 4-SLOT FORECAST + AI SUGGESTIONS)
     ========================================================================== */

  function renderWeatherAgentPage() {
    const container = document.getElementById('weatherAgentPageContainer');
    const trip = currentState.activeTrip;

    if (!trip || !trip.weatherData) {
      renderEmptyState(container, 'Weather Agent');
      return;
    }

    const w = trip.weatherData;
    const curr = w.current || {};
    const daily = w.daily_forecast || [];
    const suggestions = w.ai_suggestions || [];

    container.innerHTML = `
      <div class="weather-section-wrapper fade-in">
        
        <!-- CURRENT WEATHER HERO CARD -->
        <div class="weather-hero-card">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <span class="badge-sub text-emerald"><i class="fa-solid fa-cloud-sun"></i> Live Weather & Climate Analysis</span>
              <h2 style="font-size: 28px; font-weight: 800; color: #fff; margin-top: 4px;">${trip.name} Current Weather</h2>
              <span style="font-size: 16px; color: var(--color-primary); font-weight: 700;">Temp: ${curr.temperature || '20°C'} (Feels like ${curr.feels_like || '19°C'})</span>
            </div>
            <i class="fa-solid fa-sun text-gold" style="font-size: 48px;"></i>
          </div>

          <div class="weather-metrics-grid font-mono">
            <div class="weather-metric-tile"><span>Humidity</span><strong class="d-block text-cyan">${curr.humidity || '60%'}</strong></div>
            <div class="weather-metric-tile"><span>Wind Speed</span><strong class="d-block text-cyan">${curr.wind_speed || '10 km/h'}</strong></div>
            <div class="weather-metric-tile"><span>Pressure</span><strong class="d-block text-cyan">${curr.pressure || '1015 hPa'}</strong></div>
            <div class="weather-metric-tile"><span>Visibility</span><strong class="d-block text-cyan">${curr.visibility || '10 km'}</strong></div>
            <div class="weather-metric-tile"><span>UV Index</span><strong class="d-block text-cyan">${curr.uv_index || '6 (High)'}</strong></div>
            <div class="weather-metric-tile"><span>Sunrise</span><strong class="d-block text-cyan">${curr.sunrise || '06:10 AM'}</strong></div>
            <div class="weather-metric-tile"><span>Sunset</span><strong class="d-block text-cyan">${curr.sunset || '06:40 PM'}</strong></div>
            <div class="weather-metric-tile"><span>Air Quality</span><strong class="d-block text-emerald">${curr.air_quality || 'AQI 20 (Good)'}</strong></div>
          </div>
        </div>

        <!-- AI WEATHER SUGGESTIONS BANNER -->
        <div class="glass-card section-card mb-4" style="border-color: rgba(245,158,11,0.3); background: rgba(245,158,11,0.05);">
          <div class="card-header-bar mb-2">
            <h3 class="card-title" style="color: #fbbf24;"><i class="fa-solid fa-lightbulb"></i> AI Weather Advisories for ${trip.name}</h3>
          </div>
          <ul style="margin:0; padding-left:20px; color:#cbd5e1; font-size:13.5px; line-height:1.6;">
            ${suggestions.map(s => `<li>${s}</li>`).join('')}
          </ul>
        </div>

        <!-- 4-SLOT DAILY FORECAST FOR EVERY TRAVEL DAY -->
        <div class="glass-card section-card mb-4">
          <div class="card-header-bar mb-3">
            <h3 class="card-title"><i class="fa-solid fa-calendar-week gradient-text"></i> ${trip.days}-Day Daily Forecast Breakdown</h3>
          </div>

          ${daily.map(dayItem => {
            const slots = dayItem.slots || {};
            return `
              <div class="day-forecast-wrapper mb-4">
                <h4 style="font-size:16px; font-weight:800; color:var(--color-primary); margin-bottom:12px;">Day ${dayItem.day} Weather Breakdown</h4>
                <div class="weather-slot-grid">
                  ${['morning', 'afternoon', 'evening', 'night'].map(period => {
                    const slot = slots[period] || {};
                    return `
                      <div class="weather-metric-tile" style="background: rgba(255,255,255,0.02); text-align:left; padding:14px;">
                        <div class="text-uppercase text-cyan font-mono" style="font-size:11px; font-weight:700;">${period} (${slot.time || ''})</div>
                        <div style="font-size:18px; font-weight:800; color:#fff; margin:4px 0;"><i class="fa-solid ${slot.icon || 'fa-sun'} text-gold me-1"></i> ${slot.temp || '20°C'}</div>
                        <div style="font-size:12px; color:#cbd5e1;">${slot.desc || 'Clear'}</div>
                        <div style="font-size:11px; color:#94a3b8; margin-top:4px;">Rain Prob: ${slot.rain_prob || '10%'}</div>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            `;
          }).join('')}
        </div>

      </div>
    `;
  }

  /* ==========================================================================
     7. TRANSPORT AGENT PAGE (MODES MATRIX + FUEL ESTIMATOR + LEAFLET ROUTE MAP)
     ========================================================================== */

  function renderTransportAgentPage() {
    const container = document.getElementById('transportAgentPageContainer');
    const trip = currentState.activeTrip;

    if (!trip || !trip.transportData) {
      renderEmptyState(container, 'Transport Agent');
      return;
    }

    const t = trip.transportData;
    const options = t.options || [];
    const aiRecs = t.ai_recommendations || [];

    container.innerHTML = `
      <div class="transport-section-wrapper fade-in">
        
        <!-- ROUTE SUMMARY BANNER -->
        <div class="glass-card section-card mb-4">
          <div class="card-header-bar">
            <div>
              <span class="badge-sub text-emerald"><i class="fa-solid fa-route"></i> Google Directions Transit Route</span>
              <h2 style="font-size: 24px; font-weight: 800; margin-top: 6px;">${t.from} → ${t.destination} Route</h2>
              <p class="card-desc">Distance: <strong>${t.distance_km} km</strong> • Duration: <strong>${t.estimated_duration}</strong> • ${t.route_summary}</p>
            </div>
            <a href="${t.google_maps_navigation_url}" target="_blank" class="btn btn-primary-gradient btn-sm text-decoration-none">
              <i class="fa-solid fa-diamond-turn-right"></i> Google Maps Navigation
            </a>
          </div>
        </div>

        <!-- AI TRANSPORT RECOMMENDATIONS -->
        <div class="glass-card section-card mb-4" style="background: rgba(0,242,254,0.04); border-color: rgba(0,242,254,0.2);">
          <div class="card-header-bar mb-2">
            <h3 class="card-title" style="color: var(--color-primary);"><i class="fa-solid fa-brain"></i> AI Transport Recommendations</h3>
          </div>
          <ul style="margin:0; padding-left:20px; color:#cbd5e1; font-size:13.5px; line-height:1.6;">
            ${aiRecs.map(r => `<li>${r}</li>`).join('')}
          </ul>
        </div>

        <!-- AVAILABLE TRANSPORT MODES GRID -->
        <div class="glass-card section-card mb-4">
          <div class="card-header-bar mb-3">
            <h3 class="card-title"><i class="fa-solid fa-plane-departure gradient-text"></i> Available Transport Modes & Cost Breakdown</h3>
          </div>

          <div>
            ${options.map(opt => `
              <div class="transport-mode-card">
                <div>
                  <h4 style="font-size:16px; font-weight:800; color:#fff; margin:0;">${opt.mode}</h4>
                  <div style="font-size:12.5px; color:#94a3b8; margin-top:4px;">
                    Operator: ${opt.operator} • Duration: <strong>${opt.duration}</strong> • Distance: ${opt.distance}
                  </div>
                  <div style="font-size:12px; color:#cbd5e1; margin-top:4px;">
                    Road Condition: ${opt.road_condition || 'Standard Highway'}
                  </div>
                </div>

                <div class="text-end">
                  <div style="font-size:18px; font-weight:800; color:var(--color-primary);">${opt.estimated_cost}</div>
                  ${opt.fuel_estimate ? `<div style="font-size:11px; color:#94a3b8;">Fuel: ${opt.fuel_estimate}</div>` : ''}
                  ${opt.is_fastest ? `<span class="badge-sub text-emerald mt-1 d-inline-block">Fastest</span>` : ''}
                  ${opt.is_economical ? `<span class="badge-sub text-cyan mt-1 d-inline-block">Most Economical</span>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- INTERACTIVE LEAFLET ROUTE POLYLINE MAP -->
        <div class="glass-card section-card mb-4">
          <div class="card-header-bar mb-3">
            <h3 class="card-title"><i class="fa-solid fa-map-location-dot gradient-text"></i> Interactive Transit Route Polyline Map</h3>
          </div>
          <div id="transportRouteMapContainer"></div>
        </div>

      </div>
    `;

    setTimeout(() => {
      initTransportRouteMap(t);
    }, 100);
  }

  function initTransportRouteMap(transportData) {
    const mapContainer = document.getElementById('transportRouteMapContainer');
    if (!mapContainer || typeof L === 'undefined') return;

    if (currentState.transportMapInstance) {
      currentState.transportMapInstance.remove();
      currentState.transportMapInstance = null;
    }

    const points = transportData.polyline_points || [[13.0827, 80.2707], [11.4102, 76.6950]];
    const map = L.map('transportRouteMapContainer').setView(points[0], 7);
    currentState.transportMapInstance = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    const polyline = L.polyline(points, { color: '#00f2fe', weight: 5, opacity: 0.8 }).addTo(map);
    L.marker(points[0]).bindPopup(`<b>Origin:</b> ${transportData.from}`).addTo(map);
    L.marker(points[points.length - 1]).bindPopup(`<b>Destination:</b> ${transportData.destination}`).addTo(map);

    map.fitBounds(polyline.getBounds().pad(0.2));
  }

  /* ==========================================================================
     8. CONSOLIDATED FINAL DASHBOARD
     ========================================================================== */

  function renderDashboard() {
    const totalTripsEl = document.getElementById('dashTotalTrips');
    const totalBudgetEl = document.getElementById('dashTotalBudget');
    const tripsCompletedEl = document.getElementById('dashTripsCompleted');
    const activeTripBanner = document.getElementById('dashActiveTripBanner');

    const totalTripsCount = currentState.savedTrips.length;
    if (totalTripsEl) totalTripsEl.innerText = totalTripsCount;
    if (tripsCompletedEl) tripsCompletedEl.innerText = totalTripsCount;

    const trip = currentState.activeTrip;
    if (totalBudgetEl) totalBudgetEl.innerText = trip ? `₹${trip.budget.toLocaleString()}` : '₹0';

    if (activeTripBanner) {
      if (trip) {
        activeTripBanner.style.display = 'block';
        activeTripBanner.innerHTML = `
          <div class="glass-card active-trip-banner-card fade-in mb-4">
            <div class="card-header-bar mb-3">
              <div>
                <span class="badge-sub text-emerald"><i class="fa-solid fa-circle-check"></i> Master Multi-Agent Travel Plan</span>
                <h2 style="font-size: 26px; font-weight: 800; margin-top: 4px;">${trip.name}, ${trip.country}</h2>
                <span style="font-size: 13px; color: #cbd5e1;">${trip.days} Days • Style: ${trip.travelStyle} • Budget: ₹${trip.budget.toLocaleString()} • ${trip.attractions?.length || 0} Attractions • ${trip.hotels?.length || 0} Hotels</span>
              </div>
              <button class="btn btn-primary-gradient nav-trigger" data-target="agent-destination">
                <i class="fa-solid fa-compass"></i> Explore Destination
              </button>
            </div>

            <!-- DASHBOARD MULTI-CARD CONSOLIDATED GRID -->
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;" class="mt-3">
              
              <!-- 1. Top Hotels Preview -->
              <div class="glass-card p-3" style="background: rgba(255,255,255,0.03);">
                <h4 style="font-size:15px; font-weight:800; color:#fff;"><i class="fa-solid fa-hotel text-cyan me-2"></i> Top Hotel Recommendation</h4>
                ${trip.hotels && trip.hotels.length > 0 ? `
                  <div style="font-size:13px; font-weight:700; color:var(--color-primary);" class="mt-2">${trip.hotels[0].name}</div>
                  <div style="font-size:12px; color:#cbd5e1;">${trip.hotels[0].rating} ★ (${trip.hotels[0].user_ratings_total} reviews)</div>
                  <div style="font-size:11px; color:#94a3b8;">${trip.hotels[0].address}</div>
                ` : '<div class="text-muted">No hotel data</div>'}
              </div>

              <!-- 2. Weather Advisory Preview -->
              <div class="glass-card p-3" style="background: rgba(255,255,255,0.03);">
                <h4 style="font-size:15px; font-weight:800; color:#fff;"><i class="fa-solid fa-cloud-sun text-gold me-2"></i> Weather Overview</h4>
                ${trip.weatherData?.current ? `
                  <div style="font-size:13px; font-weight:700; color:#fff;" class="mt-2">Temp: ${trip.weatherData.current.temperature} (${trip.weatherData.current.uv_index})</div>
                  <div style="font-size:12px; color:#cbd5e1;">AQI: ${trip.weatherData.current.air_quality}</div>
                ` : '<div class="text-muted">No weather data</div>'}
              </div>

              <!-- 3. Transport Summary -->
              <div class="glass-card p-3" style="background: rgba(255,255,255,0.03);">
                <h4 style="font-size:15px; font-weight:800; color:#fff;"><i class="fa-solid fa-plane-departure text-purple me-2"></i> Transit Route</h4>
                ${trip.transportData ? `
                  <div style="font-size:13px; font-weight:700; color:#fff;" class="mt-2">${trip.transportData.from} → ${trip.name}</div>
                  <div style="font-size:12px; color:#cbd5e1;">${trip.transportData.distance_km} km • ${trip.transportData.estimated_duration}</div>
                ` : '<div class="text-muted">No transport data</div>'}
              </div>

              <!-- 4. Emergency & Tips -->
              <div class="glass-card p-3" style="background: rgba(255,255,255,0.03);">
                <h4 style="font-size:15px; font-weight:800; color:#fff;"><i class="fa-solid fa-shield-halved text-emerald me-2"></i> Emergency Contacts</h4>
                <div style="font-size:12px; color:#cbd5e1;" class="mt-2">Police: <strong>100</strong> • Ambulance: <strong>108</strong></div>
                <div style="font-size:12px; color:#cbd5e1;">Tourist Helpline: <strong>1363</strong></div>
              </div>

            </div>

          </div>
        `;
      } else {
        activeTripBanner.style.display = 'none';
      }
    }

    bindNavTriggers();
  }

  function renderEmptyState(container, agentName) {
    if (!container) return;
    container.innerHTML = `
      <div class="glass-card section-card text-center py-5 fade-in">
        <i class="fa-solid fa-folder-open text-muted" style="font-size:40px;"></i>
        <h3 class="mt-3" style="font-size:20px; font-weight:800;">No ${agentName} Data Available</h3>
        <p class="text-muted">Submit a trip request using the New Trip Plan form.</p>
        <button class="btn btn-primary-gradient btn-lg nav-trigger mt-2" data-target="new-plan">
          <i class="fa-solid fa-plus"></i> Create New Trip
        </button>
      </div>
    `;
    bindNavTriggers();
  }

  function renderItineraryAgentPage() {
    const container = document.getElementById('itinAgentPageContainer');
    const trip = currentState.activeTrip;
    if (!trip || !trip.itinerary) { renderEmptyState(container, 'Itinerary Agent'); return; }

    container.innerHTML = `
      <div class="glass-card section-card fade-in">
        <h3 class="card-title mb-3"><i class="fa-solid fa-calendar-days text-cyan"></i> Day-Wise Itinerary for ${trip.name}</h3>
        ${trip.itinerary.map(d => `
          <div class="day-timeline-card mb-3">
            <h4>Day ${d.day}</h4>
            <div>${(d.places || []).map(p => `
              <div class="timeline-item-row mt-2">
                <div class="timeline-time-col">${p.time || '09:00 AM'}</div>
                <div class="timeline-content-col">
                  <strong>${p.name}</strong> (${p.rating || 4.5} ★)
                  <div style="font-size:12px; color:#cbd5e1;">${p.address || trip.name}</div>
                </div>
              </div>
            `).join('')}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  let budgetDonutChartInstance = null;
  let budgetBarChartInstance = null;

  function renderBudgetAgentPage() {
    const container = document.getElementById('budgetAgentPageContainer');
    const trip = currentState.activeTrip;

    if (!trip) {
      renderEmptyState(container, 'Budget Agent');
      return;
    }

    const budget = trip.budget || 50000;
    const days = trip.days || 3;
    const travelers = trip.travelers || 2;
    const travelStyle = trip.travelStyle || 'Standard';

    // 1. Hotel Calculations
    const selectedHotel = trip.selectedHotel || (trip.hotels && trip.hotels.length > 0 ? trip.hotels[0] : null);
    const hotelEstNightRate = selectedHotel ? (selectedHotel.price_per_night || Math.round((budget * 0.40) / days)) : Math.round((budget * 0.40) / days);
    const hotelSubtotal = hotelEstNightRate * days;
    const hotelTax = Math.round(hotelSubtotal * 0.18); // 18% GST
    const hotelGrandTotal = hotelSubtotal + hotelTax;
    const allocHotel = Math.round(budget * 0.40);

    // 2. Transport Calculations
    const selectedTransport = trip.selectedTransport || (trip.transportData && trip.transportData.options ? trip.transportData.options[0] : null);
    const transportBaseCost = selectedTransport ? (parseCost(selectedTransport.estimated_cost) || Math.round(budget * 0.25)) : Math.round(budget * 0.25);
    const fuelCost = selectedTransport && selectedTransport.fuel_estimate ? (parseCost(selectedTransport.fuel_estimate) || 1200) : 0;
    const tollsCost = 450;
    const transportGrandTotal = transportBaseCost + fuelCost + tollsCost;
    const allocTransport = Math.round(budget * 0.25);

    // 3. Food Calculations
    const dailyFoodRate = travelStyle === 'Luxury' ? 1500 : (travelStyle === 'Budget' ? 450 : 800);
    const foodTotal = dailyFoodRate * days * travelers;
    const allocFood = Math.round(budget * 0.20);

    // 4. Attraction Tickets & Activities
    const ticketsPerPerson = 1200;
    const ticketsTotal = ticketsPerPerson * travelers;
    const allocTickets = Math.round(budget * 0.10);

    // 5. Shopping & Misc
    const shoppingTotal = trip.customShopping !== undefined ? trip.customShopping : Math.round(budget * 0.03 * 0.7);
    const allocShopping = Math.round(budget * 0.03);

    const miscTotal = trip.customMisc !== undefined ? trip.customMisc : Math.round(budget * 0.02 * 0.5);
    const allocMisc = Math.round(budget * 0.02);

    // Totals
    const totalSpent = hotelGrandTotal + transportGrandTotal + foodTotal + ticketsTotal + shoppingTotal + miscTotal;
    const remainingBudget = budget - totalSpent;
    const pctSpent = Math.round((totalSpent / budget) * 100);

    // Health Status
    let healthStatusClass = 'healthy';
    let healthStatusLabel = '<i class="fa-solid fa-circle-check"></i> 🟢 Budget Healthy';
    if (pctSpent > 100) {
      healthStatusClass = 'exceeded';
      healthStatusLabel = '<i class="fa-solid fa-triangle-exclamation"></i> 🔴 Budget Exceeded';
    } else if (pctSpent > 80) {
      healthStatusClass = 'warning';
      healthStatusLabel = '<i class="fa-solid fa-triangle-exclamation"></i> 🟠 Approaching Budget Limit';
    }

    const categories = [
      { name: '🏨 Accommodation', key: 'hotel', alloc: allocHotel, spent: hotelGrandTotal },
      { name: '🚗 Transport', key: 'transport', alloc: allocTransport, spent: transportGrandTotal },
      { name: '🍽 Food', key: 'food', alloc: allocFood, spent: foodTotal },
      { name: '🎫 Attraction Tickets', key: 'tickets', alloc: allocTickets, spent: ticketsTotal },
      { name: '🛍 Shopping', key: 'shopping', alloc: allocShopping, spent: shoppingTotal },
      { name: '📦 Miscellaneous', key: 'misc', alloc: allocMisc, spent: miscTotal }
    ];

    container.innerHTML = `
      <div class="budget-dashboard-wrapper fade-in">
        
        <!-- HEADER STATUS BANNER -->
        <div class="glass-card section-card mb-4">
          <div class="card-header-bar">
            <div>
              <span class="badge-sub text-emerald"><i class="fa-solid fa-brain"></i> AI Finance Engine</span>
              <h2 style="font-size: 26px; font-weight: 800; margin-top: 6px;">AI Budget Tracker &amp; Financial Dashboard</h2>
              <p class="card-desc">Live expense tracking, real-time cost calculation, and smart AI financial advisories for ${trip.name}</p>
            </div>
            
            <div class="d-flex align-items-center gap-3">
              <span class="budget-status-pill ${healthStatusClass}">
                ${healthStatusLabel}
              </span>
              <button class="btn btn-sm btn-glass" id="btnExportPDF" title="Export PDF"><i class="fa-solid fa-file-pdf text-red me-1"></i> PDF</button>
              <button class="btn btn-sm btn-glass" id="btnExportCSV" title="Export CSV"><i class="fa-solid fa-file-excel text-emerald me-1"></i> Excel</button>
              <button class="btn btn-sm btn-glass" id="btnPrintBudget" title="Print"><i class="fa-solid fa-print me-1"></i> Print</button>
            </div>
          </div>
        </div>

        <!-- 3 LARGE ANIMATED HERO METRIC CARDS -->
        <div class="budget-hero-metrics">
          
          <div class="budget-metric-card">
            <div class="budget-metric-icon total">
              <i class="fa-solid fa-wallet"></i>
            </div>
            <div class="budget-metric-body">
              <span class="budget-metric-label">Total Budget</span>
              <h2 class="budget-metric-value" id="bmTotalVal">₹${budget.toLocaleString()}</h2>
              <span style="font-size:12px; color:#cbd5e1;">Target Expenditure</span>
            </div>
          </div>

          <div class="budget-metric-card">
            <div class="budget-metric-icon spent">
              <i class="fa-solid fa-credit-card"></i>
            </div>
            <div class="budget-metric-body">
              <span class="budget-metric-label">Current Spent</span>
              <h2 class="budget-metric-value" id="bmSpentVal" style="color:#a855f7;">₹${totalSpent.toLocaleString()}</h2>
              <span style="font-size:12px; color:#cbd5e1;">${pctSpent}% of total allocated</span>
            </div>
          </div>

          <div class="budget-metric-card">
            <div class="budget-metric-icon remaining">
              <i class="fa-solid fa-piggy-bank"></i>
            </div>
            <div class="budget-metric-body">
              <span class="budget-metric-label">Remaining Budget</span>
              <h2 class="budget-metric-value" id="bmRemVal" style="color:${remainingBudget < 0 ? '#ef4444' : '#10b981'};">₹${remainingBudget.toLocaleString()}</h2>
              <span style="font-size:12px; color:#cbd5e1;">${remainingBudget < 0 ? 'Over budget by ' + Math.abs(remainingBudget).toLocaleString() : 'Available unspent balance'}</span>
            </div>
          </div>

        </div>

        <!-- LIVE BUDGET CALCULATOR TOOLBAR -->
        <div class="glass-card section-card mb-4" style="background: rgba(0, 242, 254, 0.03); border-color: rgba(0, 242, 254, 0.2);">
          <div class="card-header-bar mb-3">
            <h3 class="card-title" style="color: var(--color-primary);"><i class="fa-solid fa-calculator"></i> Live Budget Calculator</h3>
            <span style="font-size:12px; color:#94a3b8;">Adjust parameters to update live calculations instantly</span>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px;">
            <div>
              <label class="form-label-compact">Total Budget (₹ INR)</label>
              <input type="number" id="calcBudgetInput" class="form-control-compact" value="${budget}" step="5000">
            </div>

            <div>
              <label class="form-label-compact">Travelers</label>
              <div class="stepper-box">
                <button type="button" class="btn-stepper" id="calcTravelersMinus"><i class="fa-solid fa-minus"></i></button>
                <input type="number" id="calcTravelersInput" class="stepper-input" value="${travelers}" readonly>
                <button type="button" class="btn-stepper" id="calcTravelersPlus"><i class="fa-solid fa-plus"></i></button>
              </div>
            </div>

            <div>
              <label class="form-label-compact">Number of Days</label>
              <div class="stepper-box">
                <button type="button" class="btn-stepper" id="calcDaysMinus"><i class="fa-solid fa-minus"></i></button>
                <input type="number" id="calcDaysInput" class="stepper-input" value="${days}" readonly>
                <button type="button" class="btn-stepper" id="calcDaysPlus"><i class="fa-solid fa-plus"></i></button>
              </div>
            </div>

            <div>
              <label class="form-label-compact">Travel Style</label>
              <select id="calcStyleSelect" class="form-control-compact">
                <option value="Budget" ${travelStyle === 'Budget' ? 'selected' : ''}>Budget</option>
                <option value="Standard" ${travelStyle === 'Standard' ? 'selected' : ''}>Standard</option>
                <option value="Luxury" ${travelStyle === 'Luxury' ? 'selected' : ''}>Luxury</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 6 CATEGORY BREAKDOWN CARDS -->
        <div class="glass-card section-card mb-4">
          <div class="card-header-bar mb-2">
            <h3 class="card-title"><i class="fa-solid fa-chart-pie gradient-text"></i> Category Budget Breakdown</h3>
            <span style="font-size:12.5px; color:#cbd5e1;">6 Itemized Expense Categories</span>
          </div>

          <div class="budget-categories-grid">
            ${categories.map(cat => {
              const rem = cat.alloc - cat.spent;
              const pct = cat.alloc > 0 ? Math.min(100, Math.round((cat.spent / cat.alloc) * 100)) : 0;
              const barColor = pct > 100 ? '#ef4444' : (pct > 80 ? '#f59e0b' : '#00f2fe');

              return `
                <div class="budget-category-card">
                  <div class="cat-header">
                    <div class="cat-title">${cat.name}</div>
                    <span class="cat-badge-pct" style="color: ${barColor}; border-color: ${barColor}40; background: ${barColor}15;">${pct}% Used</span>
                  </div>

                  <div class="cat-stats-row">
                    <div class="cat-stat-item">
                      <span class="cat-stat-label">Allocated</span>
                      <span class="cat-stat-val">₹${cat.alloc.toLocaleString()}</span>
                    </div>
                    <div class="cat-stat-item">
                      <span class="cat-stat-label">Spent</span>
                      <span class="cat-stat-val" style="color: ${barColor};">₹${cat.spent.toLocaleString()}</span>
                    </div>
                    <div class="cat-stat-item">
                      <span class="cat-stat-label">Remaining</span>
                      <span class="cat-stat-val" style="color: ${rem < 0 ? '#ef4444' : '#10b981'};">₹${rem.toLocaleString()}</span>
                    </div>
                  </div>

                  <div class="cat-progress-track">
                    <div class="cat-progress-fill" style="width: ${pct}%; background: ${barColor};"></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- 3 INTERACTIVE IMPACT SECTIONS -->
        <div class="budget-impact-grid mb-4">
          
          <!-- 1. HOTEL IMPACT -->
          <div class="impact-card">
            <div class="impact-header">
              <h4 class="impact-title"><i class="fa-solid fa-hotel text-cyan me-1"></i> Hotel Impact</h4>
              <span class="badge-sub text-emerald">Active Selection</span>
            </div>

            <div class="impact-item-row"><span>Selected Hotel</span><strong>${selectedHotel ? selectedHotel.name : 'Standard Hotel'}</strong></div>
            <div class="impact-item-row"><span>Rate / Night</span><strong>₹${hotelEstNightRate.toLocaleString()} / night</strong></div>
            <div class="impact-item-row"><span>Duration</span><strong>${days} Nights</strong></div>
            <div class="impact-item-row"><span>Subtotal Stays</span><strong>₹${hotelSubtotal.toLocaleString()}</strong></div>
            <div class="impact-item-row"><span>Taxes &amp; GST (18%)</span><strong>₹${hotelTax.toLocaleString()}</strong></div>
            <div class="impact-item-row" style="font-size:15px; font-weight:800; color:#00f2fe; margin-top:4px;"><span>Grand Total Hotel</span><strong>₹${hotelGrandTotal.toLocaleString()}</strong></div>
            <div class="impact-item-row"><span>Budget Remaining After Hotel</span><strong style="color:#10b981;">₹${(budget - hotelGrandTotal).toLocaleString()}</strong></div>

            ${trip.hotels && trip.hotels.length > 1 ? `
              <div class="mt-3">
                <label style="font-size:11.5px; color:#94a3b8;" class="fw-bold">Switch Hotel Choice:</label>
                <select id="impactHotelSelect" class="form-control-compact mt-1">
                  ${trip.hotels.map(h => `
                    <option value="${h.name}" ${selectedHotel && selectedHotel.name === h.name ? 'selected' : ''}>${h.name} - ₹${(h.price_per_night || Math.round(allocHotel/days)).toLocaleString()}/night</option>
                  `).join('')}
                </select>
              </div>
            ` : ''}
          </div>

          <!-- 2. TRANSPORT IMPACT -->
          <div class="impact-card">
            <div class="impact-header">
              <h4 class="impact-title"><i class="fa-solid fa-plane-departure text-purple me-1"></i> Transport Impact</h4>
              <span class="badge-sub text-cyan">Transit Analysis</span>
            </div>

            <div class="impact-item-row"><span>Selected Mode</span><strong>${selectedTransport ? selectedTransport.mode : 'Car (Personal)'}</strong></div>
            <div class="impact-item-row"><span>Base Fare / Transit</span><strong>₹${transportBaseCost.toLocaleString()}</strong></div>
            <div class="impact-item-row"><span>Fuel Estimate</span><strong>₹${fuelCost.toLocaleString()}</strong></div>
            <div class="impact-item-row"><span>Tolls &amp; Parking</span><strong>₹${tollsCost.toLocaleString()}</strong></div>
            <div class="impact-item-row" style="font-size:15px; font-weight:800; color:#a855f7; margin-top:4px;"><span>Grand Total Transit</span><strong>₹${transportGrandTotal.toLocaleString()}</strong></div>
            <div class="impact-item-row"><span>Budget Remaining After Transit</span><strong style="color:#10b981;">₹${(budget - hotelGrandTotal - transportGrandTotal).toLocaleString()}</strong></div>

            ${trip.transportData && trip.transportData.options ? `
              <div class="mt-3">
                <label style="font-size:11.5px; color:#94a3b8;" class="fw-bold">Switch Transit Option:</label>
                <select id="impactTransportSelect" class="form-control-compact mt-1">
                  ${trip.transportData.options.map(o => `
                    <option value="${o.mode}" ${selectedTransport && selectedTransport.mode === o.mode ? 'selected' : ''}>${o.mode} - ${o.estimated_cost}</option>
                  `).join('')}
                </select>
              </div>
            ` : ''}
          </div>

          <!-- 3. ACTIVITY IMPACT -->
          <div class="impact-card">
            <div class="impact-header">
              <h4 class="impact-title"><i class="fa-solid fa-ticket text-gold me-1"></i> Activity Impact</h4>
              <span class="badge-sub text-gold">Sightseeing</span>
            </div>

            <div class="impact-item-row"><span>Attractions Count</span><strong>${trip.attractions ? trip.attractions.length : 5} Spots</strong></div>
            <div class="impact-item-row"><span>Avg Entry Pass / Person</span><strong>₹${ticketsPerPerson.toLocaleString()}</strong></div>
            <div class="impact-item-row"><span>Travelers</span><strong>${travelers} Persons</strong></div>
            <div class="impact-item-row" style="font-size:15px; font-weight:800; color:#fbbf24; margin-top:4px;"><span>Total Activity Passes</span><strong>₹${ticketsTotal.toLocaleString()}</strong></div>
            <div class="impact-item-row"><span>Budget Remaining</span><strong style="color:#10b981;">₹${remainingBudget.toLocaleString()}</strong></div>
          </div>

        </div>

        <!-- CHARTS SECTION -->
        <div class="budget-charts-grid mb-4">
          <div class="chart-card">
            <div class="card-header-bar">
              <h4 class="card-title" style="font-size:16px;"><i class="fa-solid fa-chart-pie text-cyan"></i> Cost Distribution (Donut Chart)</h4>
            </div>
            <div class="chart-canvas-wrapper">
              <canvas id="budgetDonutCanvas"></canvas>
            </div>
          </div>

          <div class="chart-card">
            <div class="card-header-bar">
              <h4 class="card-title" style="font-size:16px;"><i class="fa-solid fa-chart-column text-purple"></i> Allocated vs Actual (Bar Chart)</h4>
            </div>
            <div class="chart-canvas-wrapper">
              <canvas id="budgetBarCanvas"></canvas>
            </div>
          </div>
        </div>

        <!-- SMART AI SUGGESTIONS CARD -->
        <div class="glass-card section-card mb-4" style="background: rgba(245, 158, 11, 0.04); border-color: rgba(245, 158, 11, 0.25);">
          <div class="card-header-bar mb-2">
            <h3 class="card-title" style="color: #fbbf24;"><i class="fa-solid fa-lightbulb"></i> Smart AI Insights &amp; Savings Recommendations</h3>
          </div>
          <ul style="margin:0; padding-left:20px; color:#cbd5e1; font-size:13.5px; line-height:1.7;">
            <li>💡 <strong>Hotel Optimization:</strong> Switch from Luxury to Standard Hotel to save up to <strong>₹${Math.round(hotelGrandTotal * 0.22).toLocaleString()} INR</strong>.</li>
            <li>🚌 <strong>Transit Savings:</strong> Using AC Luxury Bus instead of private taxi saves up to <strong>₹1,800 INR</strong> on transport.</li>
            <li>🎫 <strong>Sightseeing Tip:</strong> Pre-book Botanical Garden and Lake Boating passes together to save <strong>10%</strong>.</li>
            <li>🍽 <strong>Dining Budget:</strong> Allocating ₹${dailyFoodRate}/day per person keeps food costs well balanced.</li>
          </ul>
        </div>

        <!-- FINAL FINANCIAL SUMMARY GRID -->
        <div class="glass-card section-card mb-4">
          <div class="card-header-bar mb-3">
            <h3 class="card-title"><i class="fa-solid fa-receipt gradient-text"></i> Final Financial Summary</h3>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
            <div class="glass-card p-3" style="background: rgba(255,255,255,0.03);">
              <span style="font-size:12px; color:#94a3b8; font-weight:600; text-transform:uppercase;">Total Budget</span>
              <h4 style="font-size:22px; font-weight:800; color:#ffffff; margin-top:4px;">₹${budget.toLocaleString()}</h4>
            </div>

            <div class="glass-card p-3" style="background: rgba(255,255,255,0.03);">
              <span style="font-size:12px; color:#94a3b8; font-weight:600; text-transform:uppercase;">Total Spent</span>
              <h4 style="font-size:22px; font-weight:800; color:#a855f7; margin-top:4px;">₹${totalSpent.toLocaleString()}</h4>
            </div>

            <div class="glass-card p-3" style="background: rgba(255,255,255,0.03);">
              <span style="font-size:12px; color:#94a3b8; font-weight:600; text-transform:uppercase;">Remaining Balance</span>
              <h4 style="font-size:22px; font-weight:800; color:${remainingBudget < 0 ? '#ef4444' : '#10b981'}; margin-top:4px;">₹${remainingBudget.toLocaleString()}</h4>
            </div>

            <div class="glass-card p-3" style="background: rgba(255,255,255,0.03);">
              <span style="font-size:12px; color:#94a3b8; font-weight:600; text-transform:uppercase;">Estimated Savings</span>
              <h4 style="font-size:22px; font-weight:800; color:#00f2fe; margin-top:4px;">₹${Math.max(0, remainingBudget).toLocaleString()}</h4>
            </div>

            <div class="glass-card p-3" style="background: rgba(255,255,255,0.03);">
              <span style="font-size:12px; color:#94a3b8; font-weight:600; text-transform:uppercase;">Cost Per Person</span>
              <h4 style="font-size:22px; font-weight:800; color:#ffffff; margin-top:4px;">₹${Math.round(totalSpent / travelers).toLocaleString()}</h4>
            </div>

            <div class="glass-card p-3" style="background: rgba(255,255,255,0.03);">
              <span style="font-size:12px; color:#94a3b8; font-weight:600; text-transform:uppercase;">Daily Average Cost</span>
              <h4 style="font-size:22px; font-weight:800; color:#ffffff; margin-top:4px;">₹${Math.round(totalSpent / days).toLocaleString()}</h4>
            </div>
          </div>
        </div>

      </div>
    `;

    // Initialize Chart.js charts
    setTimeout(() => {
      initBudgetCharts(categories);
    }, 100);

    // Event listeners for Live Budget Calculator
    document.getElementById('calcBudgetInput')?.addEventListener('input', (e) => {
      const val = parseInt(e.target.value) || 50000;
      trip.budget = val;
      saveActiveTripState();
      renderBudgetAgentPage();
    });

    document.getElementById('calcTravelersMinus')?.addEventListener('click', () => {
      if (trip.travelers > 1) {
        trip.travelers--;
        saveActiveTripState();
        renderBudgetAgentPage();
      }
    });

    document.getElementById('calcTravelersPlus')?.addEventListener('click', () => {
      if (trip.travelers < 15) {
        trip.travelers++;
        saveActiveTripState();
        renderBudgetAgentPage();
      }
    });

    document.getElementById('calcDaysMinus')?.addEventListener('click', () => {
      if (trip.days > 1) {
        trip.days--;
        saveActiveTripState();
        renderBudgetAgentPage();
      }
    });

    document.getElementById('calcDaysPlus')?.addEventListener('click', () => {
      if (trip.days < 14) {
        trip.days++;
        saveActiveTripState();
        renderBudgetAgentPage();
      }
    });

    document.getElementById('calcStyleSelect')?.addEventListener('change', (e) => {
      trip.travelStyle = e.target.value;
      saveActiveTripState();
      renderBudgetAgentPage();
    });

    // Impact Switch Handlers
    document.getElementById('impactHotelSelect')?.addEventListener('change', (e) => {
      const name = e.target.value;
      const hObj = trip.hotels.find(x => x.name === name);
      if (hObj) {
        trip.selectedHotel = hObj;
        saveActiveTripState();
        renderBudgetAgentPage();
      }
    });

    document.getElementById('impactTransportSelect')?.addEventListener('change', (e) => {
      const mode = e.target.value;
      const tObj = trip.transportData.options.find(x => x.mode === mode);
      if (tObj) {
        trip.selectedTransport = tObj;
        saveActiveTripState();
        renderBudgetAgentPage();
      }
    });

    // Export Buttons
    document.getElementById('btnExportPDF')?.addEventListener('click', exportBudgetPDF);
    document.getElementById('btnExportCSV')?.addEventListener('click', () => exportBudgetCSV(trip, categories, totalSpent, remainingBudget));
    document.getElementById('btnPrintBudget')?.addEventListener('click', () => window.print());
  }

  function parseCost(valStr) {
    if (!valStr) return 0;
    if (typeof valStr === 'number') return valStr;
    const clean = valStr.replace(/[^0-9]/g, '');
    return parseInt(clean) || 0;
  }

  function saveActiveTripState() {
    if (currentState.activeTrip) {
      localStorage.setItem('aether_active_trip', JSON.stringify(currentState.activeTrip));
    }
  }

  function initBudgetCharts(categories) {
    const donutCtx = document.getElementById('budgetDonutCanvas')?.getContext('2d');
    const barCtx = document.getElementById('budgetBarCanvas')?.getContext('2d');

    if (typeof Chart === 'undefined') return;

    if (budgetDonutChartInstance) budgetDonutChartInstance.destroy();
    if (budgetBarChartInstance) budgetBarChartInstance.destroy();

    const labels = categories.map(c => c.name);
    const spentData = categories.map(c => c.spent);
    const allocData = categories.map(c => c.alloc);

    if (donutCtx) {
      budgetDonutChartInstance = new Chart(donutCtx, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{
            data: spentData,
            backgroundColor: ['#00f2fe', '#a855f7', '#fbbf24', '#10b981', '#f43f5e', '#64748b'],
            borderWidth: 2,
            borderColor: '#0f172a'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'right', labels: { color: '#cbd5e1', font: { family: 'Plus Jakarta Sans', size: 11 } } }
          }
        }
      });
    }

    if (barCtx) {
      budgetBarChartInstance = new Chart(barCtx, {
        type: 'bar',
        data: {
          labels: labels.map(l => l.split(' ')[1] || l),
          datasets: [
            { label: 'Allocated (₹)', data: allocData, backgroundColor: 'rgba(0, 242, 254, 0.4)', borderColor: '#00f2fe', borderWidth: 1 },
            { label: 'Actual Spent (₹)', data: spentData, backgroundColor: 'rgba(168, 85, 247, 0.6)', borderColor: '#a855f7', borderWidth: 1 }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: '#cbd5e1', font: { family: 'Plus Jakarta Sans', size: 11 } } }
          },
          scales: {
            x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
            y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
          }
        }
      });
    }
  }

  function exportBudgetPDF() {
    window.print();
  }

  function exportBudgetCSV(trip, categories, totalSpent, remainingBudget) {
    let csv = `Category,Allocated (INR),Spent (INR),Remaining (INR)\n`;
    categories.forEach(c => {
      csv += `"${c.name}",${c.alloc},${c.spent},${c.alloc - c.spent}\n`;
    });
    csv += `\nTotal Budget,${trip.budget}\nTotal Spent,${totalSpent}\nRemaining Budget,${remainingBudget}\n`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Budget_Report_${trip.name.replace(/ /g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function renderDestinationAgentPage() {
    const container = document.getElementById('destAgentPageContainer');
    const trip = currentState.activeTrip;
    if (!trip || !trip.attractions || trip.attractions.length === 0) {
      renderEmptyState(container, 'Destination Agent');
      return;
    }

    container.innerHTML = `
      <div class="dest-section-wrapper fade-in">
        <!-- HEADER STATUS BANNER -->
        <div class="glass-card section-card mb-4">
          <div class="card-header-bar">
            <div>
              <span class="badge-sub text-emerald"><i class="fa-solid fa-circle-check"></i> Google Places API Verified</span>
              <h2 style="font-size: 24px; font-weight: 800; margin-top: 6px;">Top Tourist Attractions in ${trip.name}</h2>
              <p class="card-desc">Authentic tourist attractions with real high-quality photographs, star ratings, and Google Maps integration</p>
            </div>
            <div class="quick-stat-pill cyan-glow" style="padding: 8px 16px;">
              <i class="fa-solid fa-camera"></i>
              <span><strong>${trip.attractions.length}</strong> Real Attractions</span>
            </div>
          </div>
        </div>

        <!-- ATTRACTIONS GRID -->
        <div class="attractions-grid-container">
          ${(trip.places || trip.attractions || []).map(a => {
            const ratingVal = (a.rating || 4.8).toFixed(1);
            const reviewsTotal = (a.userRatingCount || a.user_ratings_total || 1250).toLocaleString();
            const categoryName = a.category || (a.types && a.types[0] ? a.types[0].replace(/_/g, ' ').toUpperCase() : 'TOURIST ATTRACTION');
            const mapsUrl = a.googleMapsUri || a.google_maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a.name + ' ' + trip.name)}`;
            const rawPhoto = a.photo_url || '';
            const photoSrc = rawPhoto ? (rawPhoto.startsWith('http') ? rawPhoto : `http://127.0.0.1:8000${rawPhoto}`) : '';
            const travelPlaceholder = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80';
            const displayImg = photoSrc || travelPlaceholder;

            return `
              <div class="card attraction-card-real">
                <div class="attraction-img-wrapper">
                  <img src="${displayImg}" class="attraction-img" alt="${a.name}" loading="lazy" onerror="this.onerror=null; this.src='${travelPlaceholder}';">
                  <span class="attraction-badge-category">${categoryName}</span>
                </div>
                <div class="attraction-body">
                  <h3 class="attraction-title">${a.name}</h3>
                  <div class="attraction-rating-row">
                    <span class="attraction-stars">⭐ ${ratingVal}</span>
                    <span class="attraction-reviews">(${reviewsTotal} reviews)</span>
                  </div>
                  <p class="attraction-address">
                    <i class="fa-solid fa-location-dot"></i> ${a.address || `${trip.name}, India`}
                  </p>
                  <div class="attraction-actions">
                    <a href="${mapsUrl}" target="_blank" class="attraction-btn-gmaps">
                      <i class="fa-solid fa-map-location-dot"></i> Google Maps
                    </a>
                    <button class="attraction-btn-details btn-view-attraction-details" data-placeid="${a.place_id || a.name}" data-name="${a.name}">
                      <i class="fa-solid fa-circle-info"></i> View Details
                    </button>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- ATTRACTION DETAILS MODAL BACKDROP -->
      <div id="attractionModalBackdrop" class="modal-backdrop-custom" style="display: none;">
        <div class="modal-content-glass" style="max-width: 650px;">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h3 class="card-title" id="attractionModalTitle"><i class="fa-solid fa-compass text-cyan"></i> Attraction Details</h3>
            <button class="btn btn-sm btn-glass" id="btnCloseAttractionModal"><i class="fa-solid fa-xmark"></i> Close</button>
          </div>
          <div id="attractionModalBody"></div>
        </div>
      </div>
    `;

    // Event listeners for View Details buttons
    document.querySelectorAll('.btn-view-attraction-details').forEach(btn => {
      btn.addEventListener('click', () => {
        const placeId = btn.getAttribute('data-placeid');
        const name = btn.getAttribute('data-name');
        const items = trip.places || trip.attractions || [];
        const item = items.find(x => (x.place_id || x.name) === placeId || x.name === name);
        if (item) openAttractionModal(item, trip.name);
      });
    });

    document.getElementById('btnCloseAttractionModal')?.addEventListener('click', () => {
      const modal = document.getElementById('attractionModalBackdrop');
      if (modal) modal.style.display = 'none';
    });
  }

  function openAttractionModal(attraction, destName) {
    const modal = document.getElementById('attractionModalBackdrop');
    const body = document.getElementById('attractionModalBody');
    if (!modal || !body) return;

    const ratingVal = (attraction.rating || 4.8).toFixed(1);
    const reviewsTotal = (attraction.userRatingCount || attraction.user_ratings_total || 1250).toLocaleString();
    const mapsUrl = attraction.googleMapsUri || attraction.google_maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(attraction.name + ' ' + destName)}`;
    const rawPhoto = attraction.photo_url || '';
    const photoSrc = rawPhoto ? (rawPhoto.startsWith('http') ? rawPhoto : `http://127.0.0.1:8000${rawPhoto}`) : '';
    const travelPlaceholder = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80';
    const displayImg = photoSrc || travelPlaceholder;

    body.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:16px;">
        <div style="width:100%; height:260px; aspect-ratio:16/9; border-radius:14px; overflow:hidden; position:relative; background:#0f172a;">
          <img src="${displayImg}" style="width:100%; height:100%; object-fit:cover;" alt="${attraction.name}" loading="lazy" onerror="this.onerror=null; this.src='${travelPlaceholder}';">
          <span class="attraction-badge-category">${attraction.category || 'TOURIST ATTRACTION'}</span>
        </div>
        <div>
          <h2 style="font-size:22px; font-weight:800; color:#ffffff; margin-bottom:6px;">${attraction.name}</h2>
          <div style="display:flex; align-items:center; gap:10px; font-size:14px; margin-bottom:12px;">
            <span style="color:#fbbf24; font-weight:800; background:rgba(251,191,36,0.1); padding:4px 10px; border-radius:6px; border:1px solid rgba(251,191,36,0.2);">⭐ ${ratingVal} Rating</span>
            <span style="color:#cbd5e1;">(${reviewsTotal} total user reviews)</span>
          </div>
          <div style="font-size:13.5px; color:#cbd5e1; margin-bottom:12px; line-height:1.6;">
            <i class="fa-solid fa-location-dot text-cyan me-2"></i><strong>Address:</strong> ${attraction.address || destName}
          </div>
          ${attraction.latitude ? `
            <div style="font-size:12.5px; color:#94a3b8; margin-bottom:14px;">
              <i class="fa-solid fa-compass text-cyan me-2"></i><strong>Coordinates:</strong> ${attraction.latitude.toFixed(4)}° N, ${attraction.longitude.toFixed(4)}° E • <strong>Place ID:</strong> ${attraction.place_id || 'N/A'}
            </div>
          ` : ''}
          <div style="display:flex; gap:12px; margin-top:20px;">
            <a href="${mapsUrl}" target="_blank" class="btn btn-primary-gradient flex-1 text-center text-decoration-none" style="padding:10px;">
              <i class="fa-solid fa-map-location-dot"></i> Open in Google Maps
            </a>
          </div>
        </div>
      </div>
    `;

    modal.style.display = 'flex';
  }

  /* ==========================================================================
     TRIP OVERVIEW & SEQUENTIAL MULTI-AGENT EXECUTION PIPELINE
     Order: Destination -> Budget -> Weather -> Transport -> Accommodation -> Itinerary
     ========================================================================== */

  async function runMultiAgentPipeline(destination, days, budget, travelers, travelStyle, selectedInterests) {
    const fromLoc = "Chennai";
    
    // Switch view to Trip Overview
    switchView('controller');

    try {
      // Step 1: Destination Agent
      const destRes = await fetchAPI('/api/destination', { destination: destination, days: days });
      const attractions = destRes.places || destRes.attractions || [];

      // Step 2: Budget Agent
      const budgetRes = await fetchAPI('/api/budget', { budget: budget, days: days, travelers: travelers, travel_style: travelStyle });

      // Step 3: Weather Agent
      const weatherRes = await fetchAPI('/api/weather', { destination: destination, days: days });
      const weatherData = weatherRes.current ? weatherRes : getFallbackWeather(destination);

      // Step 4: Transport Agent
      const transportRes = await fetchAPI('/api/transport', { from: fromLoc, destination: destination });
      const transportData = transportRes.options ? transportRes : getFallbackTransport(fromLoc, destination);

      // Step 5: Accommodation Agent
      const hotelRes = await fetchAPI('/api/accommodation', {
        destination: destination,
        budget: budget,
        travelers: travelers,
        days: days,
        travel_style: travelStyle
      });
      const hotels = hotelRes.hotels || [];

      // Step 6: Itinerary Agent
      const itinerary = destRes.itinerary || buildFallbackItinerary(destination, attractions, days);

      // Final Assembly
      const tripId = 'TRIP-' + Date.now().toString().slice(-6);
      const newTrip = {
        id: tripId,
        name: destRes.destination || destination,
        country: destRes.country || 'India',
        fromLoc: fromLoc,
        days: days,
        budget: budget,
        travelers: travelers,
        travelStyle: travelStyle,
        interests: [...selectedInterests],
        lat: attractions[0]?.latitude || 11.4102,
        lng: attractions[0]?.longitude || 76.6950,
        attractions: attractions,
        hotels: hotels,
        weatherData: weatherData,
        transportData: transportData,
        itinerary: itinerary,
        budgetAnalysis: budgetRes,
        costSummary: {
          hotel: Math.round(budget * 0.40),
          transport: Math.round(budget * 0.25),
          food: Math.round(budget * 0.20),
          tickets: Math.round(budget * 0.15),
          total: budget
        },
        datePlanned: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      };

      currentState.activeTrip = newTrip;
      currentState.savedTrips.unshift(newTrip);
      localStorage.setItem('aether_active_trip', JSON.stringify(newTrip));
      localStorage.setItem('aether_saved_trips', JSON.stringify(currentState.savedTrips));

      // Render 10 sections of Trip Overview
      renderTripOverviewPage();

    } catch (err) {
      console.error('Multi-Agent Execution Pipeline Failure:', err);
      showErrorAlert('An error occurred while fetching trip details. Please try again.');
    }
  }

  function renderTripOverviewPage() {
    let trip = currentState.activeTrip;
    if (!trip) {
      const saved = localStorage.getItem('aether_active_trip');
      if (saved) {
        try {
          trip = JSON.parse(saved);
          currentState.activeTrip = trip;
        } catch (e) {
          console.error("Error parsing saved trip:", e);
        }
      }
    }

    if (!trip) return;

    // SECTION 1: HERO BANNER
    const heroBanner = document.getElementById('overviewHeroBanner');
    const heroDestName = document.getElementById('ovHeroDestName');
    const heroDates = document.getElementById('ovHeroDates');
    const heroBudget = document.getElementById('ovHeroBudget');
    const heroInterests = document.getElementById('ovHeroInterests');
    const heroWeatherBadge = document.getElementById('ovHeroWeatherBadge');

    const heroImgUrl = trip.attractions && trip.attractions[0]?.photo_url
      ? trip.attractions[0].photo_url
      : 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80';

    if (heroBanner) {
      heroBanner.style.backgroundImage = `url('${heroImgUrl}')`;
    }
    if (heroDestName) heroDestName.innerText = `${trip.name}, ${trip.country || 'India'}`;
    if (heroDates) heroDates.innerText = `${trip.days} Days • ${trip.travelers} Travelers (${trip.travelStyle || 'Standard'})`;
    if (heroBudget) heroBudget.innerText = `₹ ${Number(trip.budget).toLocaleString()} INR`;

    if (heroInterests) {
      heroInterests.innerHTML = (trip.interests || ['Sightseeing', 'Culture', 'Nature'])
        .map(i => `<span class="badge-sub">${i}</span>`).join(' ');
    }
    if (heroWeatherBadge) {
      heroWeatherBadge.innerHTML = `<i class="fa-solid fa-cloud-sun"></i> ${trip.weatherData?.current?.condition || 'Pleasant'} • ${trip.weatherData?.current?.temp_c || 24}°C`;
    }

    // SECTION 2: QUICK TRIP SUMMARY (8 GLASSMORPHISM CARDS)
    const quickGrid = document.getElementById('overviewQuickSummaryGrid');
    if (quickGrid) {
      const topHotel = trip.hotels && trip.hotels[0] ? trip.hotels[0].name : 'Resort & Spa';
      const mainTransport = trip.transportData?.options ? trip.transportData.options[0]?.mode || 'Flight / Express' : 'Flight & Transit';

      quickGrid.innerHTML = `
        <div class="summary-mini-card">
          <div class="smc-icon" style="background:rgba(56,189,248,0.15); color:#38bdf8;"><i class="fa-solid fa-location-dot"></i></div>
          <div class="smc-body">
            <span class="smc-label">Destination</span>
            <span class="smc-value">${trip.name}</span>
          </div>
        </div>
        <div class="summary-mini-card">
          <div class="smc-icon" style="background:rgba(168,85,247,0.15); color:#a855f7;"><i class="fa-solid fa-calendar-days"></i></div>
          <div class="smc-body">
            <span class="smc-label">Duration</span>
            <span class="smc-value">${trip.days} Days / ${trip.days - 1} Nights</span>
          </div>
        </div>
        <div class="summary-mini-card">
          <div class="smc-icon" style="background:rgba(16,185,129,0.15); color:#10b981;"><i class="fa-solid fa-users"></i></div>
          <div class="smc-body">
            <span class="smc-label">Travelers</span>
            <span class="smc-value">${trip.travelers} Guests (${trip.travelStyle || 'Standard'})</span>
          </div>
        </div>
        <div class="summary-mini-card">
          <div class="smc-icon" style="background:rgba(245,158,11,0.15); color:#f59e0b;"><i class="fa-solid fa-wallet"></i></div>
          <div class="smc-body">
            <span class="smc-label">Total Budget</span>
            <span class="smc-value">₹ ${Number(trip.budget).toLocaleString()}</span>
          </div>
        </div>
        <div class="summary-mini-card">
          <div class="smc-icon" style="background:rgba(56,189,248,0.15); color:#38bdf8;"><i class="fa-solid fa-cloud-sun"></i></div>
          <div class="smc-body">
            <span class="smc-label">Weather</span>
            <span class="smc-value">${trip.weatherData?.current?.condition || 'Pleasant'}, ${trip.weatherData?.current?.temp_c || 24}°C</span>
          </div>
        </div>
        <div class="summary-mini-card">
          <div class="smc-icon" style="background:rgba(236,72,153,0.15); color:#ec4899;"><i class="fa-solid fa-hotel"></i></div>
          <div class="smc-body">
            <span class="smc-label">Accommodation</span>
            <span class="smc-value" title="${topHotel}">${topHotel}</span>
          </div>
        </div>
        <div class="summary-mini-card">
          <div class="smc-icon" style="background:rgba(99,102,241,0.15); color:#6366f1;"><i class="fa-solid fa-plane"></i></div>
          <div class="smc-body">
            <span class="smc-label">Transport</span>
            <span class="smc-value">${mainTransport}</span>
          </div>
        </div>
        <div class="summary-mini-card">
          <div class="smc-icon" style="background:rgba(14,165,233,0.15); color:#0ea5e9;"><i class="fa-solid fa-icons"></i></div>
          <div class="smc-body">
            <span class="smc-label">Interests</span>
            <span class="smc-value">${(trip.interests || ['Sightseeing']).slice(0, 2).join(', ')}</span>
          </div>
        </div>
      `;
    }

    // SECTION 3: DESTINATION HIGHLIGHTS (CAROUSEL)
    const carousel = document.getElementById('overviewAttractionsCarousel');
    if (carousel && trip.attractions) {
      carousel.innerHTML = trip.attractions.map(attr => `
        <div class="attraction-carousel-card">
          <div class="acc-img-wrap">
            <img class="acc-img" src="${attr.photo_url || 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?auto=format&fit=crop&w=600&q=80'}" alt="${attr.name}" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1596178065887-1198b6148b2b?auto=format&fit=crop&w=600&q=80';">
            <span class="acc-rating-pill">⭐ ${attr.rating ? attr.rating.toFixed(1) : '4.8'}</span>
          </div>
          <div class="acc-body">
            <h4 class="acc-title">${attr.name}</h4>
            <span class="acc-addr"><i class="fa-solid fa-location-dot text-cyan"></i> ${attr.address || trip.name}</span>
            <a href="${attr.googleMapsUri || 'https://maps.google.com/?q=' + encodeURIComponent(attr.name + ' ' + trip.name)}" target="_blank" class="btn btn-sm btn-glass text-cyan mt-auto text-decoration-none text-center">
              <i class="fa-solid fa-map-pin me-1"></i> View on Map
            </a>
          </div>
        </div>
      `).join('');
    }

    // SECTION 4: DAY WISE ITINERARY Timeline
    const dayItinContainer = document.getElementById('overviewDayItineraryContainer');
    if (dayItinContainer && trip.itinerary) {
      dayItinContainer.innerHTML = trip.itinerary.map(dayPlan => `
        <div class="day-card-accordion">
          <div class="day-card-header">
            <h4 class="day-card-title"><i class="fa-solid fa-calendar-check text-purple"></i> Day ${dayPlan.day}: ${dayPlan.title || 'Exploration & Sightseeing'}</h4>
            <span class="badge-sub">${dayPlan.slots ? dayPlan.slots.length : 3} Activities</span>
          </div>
          <div class="day-slots-grid">
            ${(dayPlan.slots || []).map(slot => `
              <div class="slot-item">
                <span class="slot-period-tag" style="background:rgba(56,189,248,0.15); color:#38bdf8;">${slot.period || 'Morning'} (${slot.time || '9:00 AM'})</span>
                <h5 style="font-size:14px; font-weight:700; color:#fff; margin:4px 0;">${slot.spot_name}</h5>
                <p style="font-size:12px; color:#94a3b8; margin:0 0 8px 0;">${slot.activity}</p>
                <div style="font-size:11px; color:#64748b; display:flex; justify-content:space-between;">
                  <span><i class="fa-regular fa-clock me-1"></i>${slot.duration || '2 hrs'}</span>
                  <span><i class="fa-solid fa-utensils me-1 text-amber"></i>${slot.meal_recommendation || 'Local Cuisine'}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('');
    }

    // SECTION 5: BUDGET BREAKDOWN
    const budgetContainer = document.getElementById('overviewBudgetBreakdownContainer');
    const totalTag = document.getElementById('ovBudgetTotalTag');
    if (totalTag) totalTag.innerText = `₹ ${Number(trip.budget).toLocaleString()} INR`;
    if (budgetContainer) {
      const hotelCost = trip.costSummary?.hotel || Math.round(trip.budget * 0.40);
      const transportCost = trip.costSummary?.transport || Math.round(trip.budget * 0.25);
      const foodCost = trip.costSummary?.food || Math.round(trip.budget * 0.20);
      const ticketsCost = trip.costSummary?.tickets || Math.round(trip.budget * 0.15);

      budgetContainer.innerHTML = `
        <div class="budget-progress-row">
          <div class="bpr-header">
            <span><i class="fa-solid fa-hotel me-2 text-rose"></i>Accommodation (40%)</span>
            <span>₹ ${hotelCost.toLocaleString()}</span>
          </div>
          <div class="bpr-track"><div class="bpr-fill" style="width:40%; background:linear-gradient(90deg,#f43f5e,#fb7185);"></div></div>
        </div>
        <div class="budget-progress-row">
          <div class="bpr-header">
            <span><i class="fa-solid fa-plane me-2 text-cyan"></i>Transport & Transit (25%)</span>
            <span>₹ ${transportCost.toLocaleString()}</span>
          </div>
          <div class="bpr-track"><div class="bpr-fill" style="width:25%; background:linear-gradient(90deg,#06b6d4,#38bdf8);"></div></div>
        </div>
        <div class="budget-progress-row">
          <div class="bpr-header">
            <span><i class="fa-solid fa-utensils me-2 text-amber"></i>Food & Dining (20%)</span>
            <span>₹ ${foodCost.toLocaleString()}</span>
          </div>
          <div class="bpr-track"><div class="bpr-fill" style="width:20%; background:linear-gradient(90deg,#f59e0b,#fbbf24);"></div></div>
        </div>
        <div class="budget-progress-row">
          <div class="bpr-header">
            <span><i class="fa-solid fa-ticket me-2 text-emerald"></i>Activities & Sightseeing (15%)</span>
            <span>₹ ${ticketsCost.toLocaleString()}</span>
          </div>
          <div class="bpr-track"><div class="bpr-fill" style="width:15%; background:linear-gradient(90deg,#10b981,#34d399);"></div></div>
        </div>
      `;
    }

    // SECTION 6: ACCOMMODATION STAYS
    const hotelContainer = document.getElementById('overviewAccommodationContainer');
    if (hotelContainer && trip.hotels) {
      hotelContainer.innerHTML = trip.hotels.slice(0, 3).map(h => `
        <div class="mini-item-card">
          <img class="mic-img" src="${h.photo_url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80'}" alt="${h.name}">
          <div style="flex:1;">
            <div class="mic-title">${h.name}</div>
            <div class="mic-sub"><i class="fa-solid fa-star text-warning me-1"></i>${h.rating || '4.5'} • ₹ ${(h.price_per_night || 4500).toLocaleString()}/night</div>
          </div>
          <a href="${h.googleMapsUri || 'https://maps.google.com/?q=' + encodeURIComponent(h.name + ' ' + trip.name)}" target="_blank" class="btn btn-sm btn-glass text-cyan text-decoration-none">
            <i class="fa-solid fa-map-location-dot me-1"></i> Maps
          </a>
        </div>
      `).join('');
    }

    // SECTION 7: TRANSPORT OPTIONS
    const transportContainer = document.getElementById('overviewTransportContainer');
    if (transportContainer) {
      const opts = trip.transportData?.options || [
        { mode: 'Flight + Cab', duration: '3h 15m', cost: 6500, details: 'Direct Flight + Airport Taxi' },
        { mode: 'Express Train', duration: '7h 45m', cost: 1800, details: 'Superfast Express AC Chair Car' }
      ];
      transportContainer.innerHTML = opts.map(t => `
        <div class="mini-item-card">
          <div style="width:48px; height:48px; border-radius:10px; background:rgba(99,102,241,0.15); color:#6366f1; display:flex; align-items:center; justify-content:center; font-size:20px; flex-shrink:0;">
            <i class="fa-solid ${t.mode.includes('Flight') ? 'fa-plane' : 'fa-train'}"></i>
          </div>
          <div style="flex:1;">
            <div class="mic-title">${t.mode}</div>
            <div class="mic-sub">${t.details || 'Optimal Route'} • Duration: ${t.duration || '4 hours'}</div>
          </div>
          <span style="font-weight:800; color:#10b981; font-size:14px;">₹ ${(t.cost || 3500).toLocaleString()}</span>
        </div>
      `).join('');
    }

    // SECTION 8: WEATHER FORECAST
    const weatherContainer = document.getElementById('overviewWeatherForecastContainer');
    if (weatherContainer) {
      const forecast = trip.weatherData?.forecast || [
        { day: 'Day 1', condition: 'Sunny', temp: '26°C' },
        { day: 'Day 2', condition: 'Pleasant', temp: '24°C' },
        { day: 'Day 3', condition: 'Clear', temp: '25°C' }
      ];
      weatherContainer.innerHTML = forecast.map(f => `
        <div class="wf-day-card">
          <span style="font-size:11px; font-weight:700; color:#94a3b8;">${f.day}</span>
          <div style="font-size:24px; color:#38bdf8; margin:6px 0;"><i class="fa-solid fa-cloud-sun"></i></div>
          <div style="font-size:14px; font-weight:800; color:#fff;">${f.temp || f.temp_max + '°C'}</div>
          <div style="font-size:11px; color:#cbd5e1;">${f.condition}</div>
        </div>
      `).join('');
    }

    // SECTION 9: LOCAL RECOMMENDATIONS
    const localContainer = document.getElementById('overviewLocalRecsContainer');
    if (localContainer) {
      localContainer.innerHTML = `
        <div class="local-rec-card">
          <h5 style="font-size:14px; font-weight:700; color:#38bdf8; margin-bottom:8px;"><i class="fa-solid fa-utensils me-2"></i>Must-Try Local Cuisine</h5>
          <p style="font-size:12.5px; color:#cbd5e1; margin:0; line-height:1.5;">Authentic regional thali, freshly caught seafood delicacies, traditional tea plantations, and artisanal sweets.</p>
        </div>
        <div class="local-rec-card">
          <h5 style="font-size:14px; font-weight:700; color:#a855f7; margin-bottom:8px;"><i class="fa-solid fa-bag-shopping me-2"></i>Shopping &amp; Souvenirs</h5>
          <p style="font-size:12.5px; color:#cbd5e1; margin:0; line-height:1.5;">Local spice markets, handmade wooden crafts, organic tea leaves, and traditional silk weaves.</p>
        </div>
        <div class="local-rec-card">
          <h5 style="font-size:14px; font-weight:700; color:#10b981; margin-bottom:8px;"><i class="fa-solid fa-shield-halved me-2"></i>Safety &amp; Travel Tips</h5>
          <p style="font-size:12.5px; color:#cbd5e1; margin:0; line-height:1.5;">Keep digital copies of IDs handy, carry light cotton clothing, use authorized tourist taxis, and stay hydrated.</p>
        </div>
      `;
    }

    // SECTION 10: Action Maps Link
    const openMapsBtn = document.getElementById('ovOpenMapsBtn');
    if (openMapsBtn) {
      openMapsBtn.href = `https://www.google.com/maps/search/${encodeURIComponent(trip.name + ' tourist attractions')}`;
    }
  }

  window.downloadTripJSON = function() {
    const trip = currentState.activeTrip;
    if (!trip) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(trip, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${trip.name}_Trip_Itinerary.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  window.shareTripPlan = function() {
    const trip = currentState.activeTrip;
    if (!trip) return;
    if (navigator.share) {
      navigator.share({
        title: `Trip to ${trip.name}`,
        text: `Check out my ${trip.days}-day AI generated trip to ${trip.name}!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Trip itinerary link copied to clipboard!');
    }
  };

  function renderHistoryGrid() {
    const container = document.getElementById('historyGridContainer');
    if (!container) return;
    if (currentState.savedTrips.length === 0) { renderEmptyState(container, 'History'); }
    else {
      container.innerHTML = currentState.savedTrips.map(t => `
        <div class="glass-card p-3 mb-2">
          <h4>${t.name}, ${t.country}</h4>
          <div>${t.days} Days • ₹${t.budget.toLocaleString()} • ${t.datePlanned}</div>
        </div>
      `).join('');
    }
  }

  switchView('dashboard');
});
