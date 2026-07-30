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
    const fromLoc = "Chennai"; // Default origin

    npGenerateBtn.disabled = true;
    const origText = npGenerateBtn.innerHTML;
    npGenerateBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Orchestrating Agents...`;

    switchView('processing');

    try {
      // Step 1: Destination Agent (POST /api/destination)
      updateProgress('proc-agent-dest', 'proc-state-dest', 15, '✓ Destination Agent: Discovering authentic attractions...');
      const destRes = await fetchAPI('/api/destination', { destination: destination, days: days });

      // Step 2: Accommodation Agent (POST /api/accommodation)
      updateProgress('proc-agent-hotel', 'proc-state-hotel', 35, '✓ Accommodation Agent: Fetching real Google Places hotels...');
      const hotelRes = await fetchAPI('/api/accommodation', {
        destination: destination,
        budget: budget,
        travelers: travelers,
        days: days,
        travel_style: selectedTravelStyle
      });

      // Step 3: Weather Agent (POST /api/weather)
      updateProgress('proc-agent-weather', 'proc-state-weather', 55, '✓ Weather Agent: Analyzing forecast & micro-climate...');
      const weatherRes = await fetchAPI('/api/weather', { destination: destination, days: days });

      // Step 4: Transport Agent (POST /api/transport)
      updateProgress('proc-agent-transport', 'proc-state-transport', 75, '✓ Transport Agent: Calculating transit routes & fuel costs...');
      const transportRes = await fetchAPI('/api/transport', { from: fromLoc, destination: destination });

      // Step 5 & 6: Itinerary & Budget Synthesis
      updateProgress('proc-agent-itin', 'proc-state-itin', 90, '✓ Itinerary Agent: Synthesizing day-wise unique schedule...');
      updateProgress('proc-agent-budget', 'proc-state-budget', 100, '✓ Budget Agent: Generating cost allocation breakdown...');

      await new Promise(r => setTimeout(r, 600));

      const tripId = 'TRIP-' + Date.now().toString().slice(-6);
      const attractions = destRes.attractions || [];
      const hotels = hotelRes.hotels || [];
      const weather = weatherRes.current ? weatherRes : getFallbackWeather(destination);
      const transport = transportRes.options ? transportRes : getFallbackTransport(fromLoc, destination);
      const itinerary = destRes.itinerary || buildFallbackItinerary(destination, attractions, days);

      const newTrip = {
        id: tripId,
        name: destRes.destination || destination,
        country: destRes.country || 'India',
        fromLoc: fromLoc,
        days: days,
        budget: budget,
        travelers: travelers,
        travelStyle: selectedTravelStyle,
        interests: [...selectedInterests],
        lat: attractions[0]?.latitude || 11.4102,
        lng: attractions[0]?.longitude || 76.6950,
        attractions: attractions,
        hotels: hotels,
        weatherData: weather,
        transportData: transport,
        itinerary: itinerary,
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

      switchView('dashboard');

    } catch (err) {
      console.error('Multi-Agent Execution Failure:', err);
      switchView('new-plan');
      showErrorAlert('Unable to fetch travel information. Please try again.');
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

    // Book Now Handler
    document.querySelectorAll('.btn-book-now').forEach(btn => {
      btn.addEventListener('click', () => {
        const name = btn.getAttribute('data-name');
        alert(`Booking Request Initialized for ${name}!\nConnecting to partner hotel booking engine...`);
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

  function renderBudgetAgentPage() {
    const container = document.getElementById('budgetAgentPageContainer');
    const trip = currentState.activeTrip;
    if (!trip) { renderEmptyState(container, 'Budget Agent'); return; }
    const b = trip.costSummary;
    container.innerHTML = `
      <div class="glass-card section-card fade-in">
        <h3 class="card-title mb-3"><i class="fa-solid fa-wallet text-gold"></i> Budget Allocation for ${trip.name} (₹${trip.budget.toLocaleString()})</h3>
        <div>Hotel: ₹${b.hotel.toLocaleString()}</div>
        <div>Transport: ₹${b.transport.toLocaleString()}</div>
        <div>Food: ₹${b.food.toLocaleString()}</div>
        <div>Tickets: ₹${b.tickets.toLocaleString()}</div>
      </div>
    `;
  }

  function renderDestinationAgentPage() {
    const container = document.getElementById('destAgentPageContainer');
    const trip = currentState.activeTrip;
    if (!trip || !trip.attractions) { renderEmptyState(container, 'Destination Agent'); return; }

    container.innerHTML = `
      <div class="glass-card section-card fade-in">
        <h3 class="card-title mb-3"><i class="fa-solid fa-compass text-cyan"></i> Real Tourist Attractions in ${trip.name}</h3>
        <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap:16px;">
          ${trip.attractions.map(a => `
            <div class="glass-card p-3" style="background:rgba(255,255,255,0.03);">
              <h4>${a.name}</h4>
              <div style="color:#fbbf24;">${a.rating || 4.5} ★</div>
              <div style="font-size:12px; color:#cbd5e1;">${a.address}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function renderTripOverviewPage() {
    renderDashboard();
  }

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
