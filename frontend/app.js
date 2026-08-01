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

  function resolvePhotoSrc(url, fallbackUrl) {
    const defaultFallback = fallbackUrl || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80';
    if (!url) return defaultFallback;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('/')) return `http://127.0.0.1:8000${url}`;
    return `http://127.0.0.1:8000/${url}`;
  }

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
      if (!currentState.activeTrip || !currentState.activeTrip.itinerary || currentState.activeTrip.itinerary.length === 0) {
        console.warn('Trip Overview blocked: No completed trip plan found. Redirecting to New Trip Plan.');
        switchView('new-plan');
        return;
      }
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

    const params = {
      destination,
      days,
      budget,
      travelers,
      travelStyle: selectedTravelStyle,
      selectedInterests: [...selectedInterests]
    };
    currentState.lastRequestParams = params;

    // Requirement 1: Navigate immediately to AI Processing page. Do NOT navigate to Trip Overview.
    switchView('processing');

    // Requirement 6: Start orchestrator automatically
    await runMultiAgentPipeline(destination, days, budget, travelers, selectedTravelStyle, [...selectedInterests]);
  });

  // Retry Workflow listener on processing page error banner
  document.getElementById('btnProcRetry')?.addEventListener('click', async () => {
    const errorBanner = document.getElementById('procErrorBanner');
    if (errorBanner) errorBanner.style.display = 'none';

    if (currentState.lastRequestParams) {
      const p = currentState.lastRequestParams;
      await runMultiAgentPipeline(p.destination, p.days, p.budget, p.travelers, p.travelStyle, p.selectedInterests);
    } else {
      switchView('new-plan');
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

  function setProgress(pct, msg) {
    const progressBar = document.getElementById('procProgressBar');
    const progressPct = document.getElementById('procProgressPct');
    const statusText = document.getElementById('procStatusText');

    if (statusText) statusText.innerText = msg;
    if (progressBar) progressBar.style.width = `${pct}%`;
    if (progressPct) progressPct.innerText = `${pct}%`;

    const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false });
    if (msg) {
      currentState.activityLogs.unshift(`[${timeStr}] ${msg}`);
      if (currentState.activityLogs.length > 25) currentState.activityLogs.pop();
      localStorage.setItem('aether_activity_logs', JSON.stringify(currentState.activityLogs));
    }
  }

  function setAgentState(cardId, stateId, state, subText) {
    const card = document.getElementById(cardId);
    const stateEl = document.getElementById(stateId);
    if (!card || !stateEl) return;

    if (state === 'running') {
      card.className = 'glass-card proc-agent-card running';
      stateEl.innerHTML = `<span class="state-pill state-running"><i class="fa-solid fa-spinner fa-spin"></i> Running</span>`;
    } else if (state === 'completed') {
      card.className = 'glass-card proc-agent-card completed';
      stateEl.innerHTML = `<span class="state-pill state-completed"><i class="fa-solid fa-circle-check"></i> Completed</span>`;
    } else if (state === 'failed') {
      card.className = 'glass-card proc-agent-card failed';
      stateEl.innerHTML = `<span class="state-pill state-failed"><i class="fa-solid fa-circle-xmark"></i> Failed</span>`;
    } else {
      card.className = 'glass-card proc-agent-card waiting';
      stateEl.innerHTML = `<span class="state-pill state-waiting"><i class="fa-regular fa-clock"></i> Waiting</span>`;
    }
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

        <!-- LEAFLET INTERACTIVE ROUTE MAP -->
        <div class="glass-card section-card mb-4">
          <div class="card-header-bar mb-3">
            <h3 class="card-title"><i class="fa-solid fa-map-location-dot text-cyan"></i> Interactive Transit Route Map</h3>
          </div>
          <div id="transportMapContainer" style="height: 380px; width:100%; border-radius:12px; overflow:hidden;"></div>
        </div>

      </div>
    `;

    // Initialize Leaflet Transport Map
    setTimeout(() => {
      if (currentState.transportMapInstance) {
        currentState.transportMapInstance.remove();
        currentState.transportMapInstance = null;
      }
      const mapContainer = document.getElementById('transportMapContainer');
      if (mapContainer && typeof L !== 'undefined') {
        const fromCoords = [13.0827, 80.2707]; // Chennai
        const destCoords = [trip.lat || 11.4102, trip.lng || 76.6950]; // Destination Coords

        const map = L.map('transportMapContainer').setView(fromCoords, 7);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 18,
          attribution: '© OpenStreetMap'
        }).addTo(map);

        L.marker(fromCoords).addTo(map).bindPopup(`<b>Origin: ${t.from}</b>`).openPopup();
        L.marker(destCoords).addTo(map).bindPopup(`<b>Destination: ${trip.name}</b>`);

        const polyline = L.polyline([fromCoords, destCoords], { color: '#00f2fe', weight: 4, opacity: 0.8, dashArray: '8, 8' }).addTo(map);
        map.fitBounds(polyline.getBounds(), { padding: [40, 40] });

        currentState.transportMapInstance = map;
      }
    }, 150);
  }

  /* ==========================================================================
     8. ITINERARY AGENT PAGE (TIMELINE + ACCORDION + EXPORT TO CALENDAR)
     ========================================================================== */

  function renderItineraryAgentPage() {
    const container = document.getElementById('itinAgentPageContainer');
    const trip = currentState.activeTrip;

    if (!trip || !trip.itinerary || trip.itinerary.length === 0) {
      renderEmptyState(container, 'Itinerary Agent');
      return;
    }

    container.innerHTML = `
      <div class="itinerary-section-wrapper fade-in">
        
        <div class="glass-card section-card mb-4">
          <div class="card-header-bar">
            <div>
              <span class="badge-sub text-emerald"><i class="fa-solid fa-calendar-days"></i> AI Synthesized Day-Wise Schedule</span>
              <h2 style="font-size: 24px; font-weight: 800; margin-top: 6px;">Day-Wise Itinerary for ${trip.name}</h2>
              <p class="card-desc">${trip.days} Days • Complete daily breakdown with morning, afternoon & evening spots</p>
            </div>
            <button class="btn btn-primary-gradient btn-sm" onclick="window.exportCalendarICS()">
              <i class="fa-solid fa-calendar-plus"></i> Export to Calendar (.ics)
            </button>
          </div>
        </div>

        <div id="itinDaysContainer">
          ${trip.itinerary.map(dayPlan => `
            <div class="glass-card section-card mb-4">
              <h3 style="font-size: 18px; font-weight: 800; color: var(--color-primary);" class="mb-3">
                <i class="fa-solid fa-sun text-gold me-2"></i> Day ${dayPlan.day} - ${dayPlan.destination || trip.name}
              </h3>
              
              <div class="timeline-container">
                ${(dayPlan.places || []).map(p => `
                  <div class="timeline-item">
                    <span class="timeline-time">${p.time || '10:00 AM'}</span>
                    <h4 class="timeline-title">${p.name}</h4>
                    <div style="font-size: 12px; color: #94a3b8; margin: 4px 0;">
                      <i class="fa-solid fa-star text-gold"></i> ${p.rating || 4.5} ★ • <i class="fa-solid fa-location-dot text-cyan"></i> ${p.address || p.vicinity || trip.name}
                    </div>
                    <p style="font-size: 13px; color: #cbd5e1; margin-top: 4px;">${p.description || 'Authentic local landmark with breathtaking views and photo spots.'}</p>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>

      </div>
    `;
  }

  /* ==========================================================================
     9. BUDGET AGENT PAGE (COST BREAKDOWN + CHART + CURRENCY CONVERTER + BUDGET TRACKER)
     ========================================================================== */

  function renderBudgetAgentPage() {
    const container = document.getElementById('budgetAgentPageContainer');
    const trip = currentState.activeTrip;

    if (!trip) {
      renderEmptyState(container, 'Budget Agent');
      return;
    }

    const budget = trip.budget || 50000;
    const selectedHotelCost = trip.selectedHotel ? (trip.selectedHotel.price_per_night || 4500) * trip.days : Math.round(budget * 0.40);
    const transportCost = Math.round(budget * 0.25);
    const foodCost = Math.round(budget * 0.20);
    const ticketsCost = Math.round(budget * 0.15);
    const totalEst = selectedHotelCost + transportCost + foodCost + ticketsCost;
    const isOverBudget = totalEst > budget;

    container.innerHTML = `
      <div class="budget-section-wrapper fade-in">
        
        <!-- TOP BUDGET METRICS BANNER -->
        <div class="glass-card section-card mb-4">
          <div class="card-header-bar">
            <div>
              <span class="badge-sub text-emerald"><i class="fa-solid fa-wallet"></i> Live Budget Tracker</span>
              <h2 style="font-size: 24px; font-weight: 800; margin-top: 6px;">Budget Analysis for ${trip.name}</h2>
              <p class="card-desc">Target Budget: <strong>₹${budget.toLocaleString()} INR</strong> • Travelers: <strong>${trip.travelers}</strong></p>
            </div>
            <div class="text-end">
              <span style="font-size:12px; color:#cbd5e1;">Est. Total Spent</span>
              <div style="font-size: 22px; font-weight: 800; color: ${isOverBudget ? '#ef4444' : '#10b981'};">
                ₹${totalEst.toLocaleString()} INR
              </div>
            </div>
          </div>
        </div>

        <!-- BUDGET PROGRESS BAR OVERVIEW -->
        <div class="glass-card section-card mb-4">
          <div class="d-flex justify-content-between font-mono mb-2" style="font-size: 13px;">
            <span>Budget Spent: ₹${totalEst.toLocaleString()} / ₹${budget.toLocaleString()}</span>
            <span style="color: ${isOverBudget ? '#ef4444' : '#00f2fe'};">${Math.round((totalEst / budget) * 100)}% Allocated</span>
          </div>
          <div class="proc-progress-bar-track">
            <div class="proc-progress-bar-fill" style="width: ${Math.min(100, Math.round((totalEst / budget) * 100))}%; background: ${isOverBudget ? '#ef4444' : 'linear-gradient(90deg, #00f2fe, #4facfe)'};"></div>
          </div>
        </div>

        <!-- DUAL COLUMN: BREAKDOWN & CURRENCY CONVERTER -->
        <div class="form-grid-2 mb-4">
          
          <!-- ITEM BREAKDOWN GRID -->
          <div class="glass-card section-card">
            <h3 class="card-title mb-3"><i class="fa-solid fa-chart-pie text-cyan me-2"></i> Category Expenditure Breakdown</h3>
            
            <div class="budget-breakdown-row">
              <span><i class="fa-solid fa-hotel text-pink me-2"></i> Hotel Accommodation ${trip.selectedHotel ? `(${trip.selectedHotel.name})` : ''}</span>
              <strong>₹${selectedHotelCost.toLocaleString()}</strong>
            </div>

            <div class="budget-breakdown-row">
              <span><i class="fa-solid fa-plane-departure text-indigo me-2"></i> Transit & Transport</span>
              <strong>₹${transportCost.toLocaleString()}</strong>
            </div>

            <div class="budget-breakdown-row">
              <span><i class="fa-solid fa-utensils text-amber me-2"></i> Food & Dining</span>
              <strong>₹${foodCost.toLocaleString()}</strong>
            </div>

            <div class="budget-breakdown-row">
              <span><i class="fa-solid fa-ticket text-emerald me-2"></i> Entry Tickets & Sightseeing</span>
              <strong>₹${ticketsCost.toLocaleString()}</strong>
            </div>
          </div>

          <!-- REAL-TIME CURRENCY CONVERTER -->
          <div class="glass-card section-card">
            <h3 class="card-title mb-3"><i class="fa-solid fa-arrow-right-arrow-left text-purple me-2"></i> Live Currency Converter</h3>
            <p class="card-desc mb-3">Convert budget between INR, USD, EUR, and GBP instantly</p>
            
            <div class="form-group mb-3">
              <label class="form-label-compact">Amount in INR (₹)</label>
              <input type="number" id="currencyInrInput" class="form-control-compact" value="${budget}">
            </div>

            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;" class="font-mono text-center">
              <div class="weather-metric-tile">
                <span class="text-cyan">USD ($)</span>
                <strong class="d-block" id="convUsd">$${(budget / 83.5).toFixed(2)}</strong>
              </div>
              <div class="weather-metric-tile">
                <span class="text-cyan">EUR (€)</span>
                <strong class="d-block" id="convEur">€${(budget / 90.2).toFixed(2)}</strong>
              </div>
              <div class="weather-metric-tile">
                <span class="text-cyan">GBP (£)</span>
                <strong class="d-block" id="convGbp">£${(budget / 106.1).toFixed(2)}</strong>
              </div>
            </div>
          </div>

        </div>

      </div>
    `;

    document.getElementById('currencyInrInput')?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value) || 0;
      document.getElementById('convUsd').innerText = `$${(val / 83.5).toFixed(2)}`;
      document.getElementById('convEur').innerText = `€${(val / 90.2).toFixed(2)}`;
      document.getElementById('convGbp').innerText = `£${(val / 106.1).toFixed(2)}`;
    });
  }

  /* ==========================================================================
     10. DESTINATION AGENT PAGE
     ========================================================================== */

  function renderDestinationAgentPage() {
    const container = document.getElementById('destAgentPageContainer');
    const trip = currentState.activeTrip;

    if (!trip || !trip.attractions || trip.attractions.length === 0) {
      renderEmptyState(container, 'Destination Agent');
      return;
    }

    container.innerHTML = `
      <div class="dest-section-wrapper fade-in">
        <div class="glass-card section-card mb-4">
          <div class="card-header-bar">
            <div>
              <span class="badge-sub text-emerald"><i class="fa-solid fa-compass"></i> Authenticated Google Places Landmarks</span>
              <h2 style="font-size: 24px; font-weight: 800; margin-top: 6px;">Top Attractions in ${trip.name}</h2>
              <p class="card-desc">${trip.attractions.length} verified scenic spots, viewpoints, and cultural locations</p>
            </div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;">
          ${trip.attractions.map(spot => `
            <div class="hotel-card-real">
              <div class="hotel-img-wrapper">
                <img src="${spot.photo_url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80'}" class="hotel-img" alt="${spot.name}">
                <span class="hotel-badge-tier">${spot.category || 'Sightseeing'}</span>
              </div>
              <div class="hotel-body">
                <h4 class="hotel-title">${spot.name}</h4>
                <div class="hotel-meta-row">
                  <span class="hotel-stars"><i class="fa-solid fa-star text-gold"></i> ${spot.rating || 4.7} ★</span>
                  <span class="hotel-reviews">(${spot.user_ratings_total || 420} Reviews)</span>
                </div>
                <div class="hotel-address-text mt-2"><i class="fa-solid fa-location-dot text-cyan me-1"></i> ${spot.address || spot.vicinity || trip.name}</div>
                <p style="font-size:12px; color:#cbd5e1; margin-top:8px;">${spot.description || 'Authentic landmark offering stunning natural beauty and local experiences.'}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  /* ==========================================================================
     11. HELPER / SHARED FUNCTIONS
     ========================================================================== */

  function renderEmptyState(container, agentName) {
    if (!container) return;
    container.innerHTML = `
      <div class="empty-state-box py-5 fade-in">
        <i class="fa-solid fa-brain empty-state-icon" style="font-size:48px; color:var(--color-primary);"></i>
        <h3 class="empty-state-title mt-3">${agentName} Pending Activation</h3>
        <p class="empty-state-desc">Generate a trip plan using the New Trip Plan form to view live AI agent insights.</p>
        <button class="btn btn-primary-gradient btn-sm mt-3 nav-trigger" data-target="new-plan">
          <i class="fa-solid fa-plus"></i> Create New Trip
        </button>
      </div>
    `;
    bindNavTriggers();
  }

  function renderDashboard() {
    const totalTrips = document.getElementById('dashTotalTrips');
    const totalBudget = document.getElementById('dashTotalBudget');
    const tripsCompleted = document.getElementById('dashTripsCompleted');
    const banner = document.getElementById('dashActiveTripBanner');

    if (totalTrips) totalTrips.innerText = currentState.savedTrips.length;
    if (tripsCompleted) tripsCompleted.innerText = currentState.savedTrips.length;

    let budgetSum = currentState.savedTrips.reduce((acc, t) => acc + (t.budget || 0), 0);
    if (totalBudget) totalBudget.innerText = `₹${budgetSum.toLocaleString()}`;

    if (currentState.activeTrip && banner) {
      const t = currentState.activeTrip;
      banner.style.display = 'block';
      banner.innerHTML = `
        <div class="glass-card p-4 d-flex justify-content-between align-items-center flex-wrap gap-3" style="background: linear-gradient(135deg, rgba(0,242,254,0.1), rgba(118,75,162,0.1)); border-color: rgba(0,242,254,0.3);">
          <div>
            <span class="badge-sub text-emerald mb-1"><i class="fa-solid fa-circle-check"></i> Active Generated Plan</span>
            <h3 style="font-size: 22px; font-weight: 800; color: #fff;">${t.name} (${t.days} Days)</h3>
            <p style="font-size: 13px; color: #cbd5e1; margin:0;">Budget: ₹${(t.budget || 50000).toLocaleString()} • Travelers: ${t.travelers || 2} • Travel Style: ${t.travelStyle || 'Luxury'}</p>
          </div>
          <button class="btn btn-primary-gradient nav-trigger" data-target="controller">
            <i class="fa-solid fa-eye"></i> View Full Trip Plan
          </button>
        </div>
      `;
      bindNavTriggers();
    }
  }

  function renderHistoryGrid() {
    const container = document.getElementById('historyGridContainer');
    if (!container) return;

    if (currentState.savedTrips.length === 0) {
      container.innerHTML = `<div class="text-muted text-center py-5">No saved trip history found.</div>`;
      return;
    }

    container.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px;">
        ${currentState.savedTrips.map(t => `
          <div class="glass-card p-4">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <h4 style="font-size: 18px; font-weight: 800; color: #fff;">${t.name}</h4>
              <span class="badge-sub text-cyan">${t.days} Days</span>
            </div>
            <div style="font-size: 13px; color: #cbd5e1; margin-bottom: 12px;">
              Budget: <strong>₹${(t.budget || 50000).toLocaleString()}</strong> • Date: ${t.datePlanned || 'Recent'}
            </div>
            <button class="btn btn-sm btn-primary-gradient w-100 btn-load-trip" data-id="${t.id}">
              <i class="fa-solid fa-folder-open me-1"></i> Open Trip
            </button>
          </div>
        `).join('')}
      </div>
    `;

    document.querySelectorAll('.btn-load-trip').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const trip = currentState.savedTrips.find(t => t.id === id);
        if (trip) {
          currentState.activeTrip = trip;
          localStorage.setItem('aether_active_trip', JSON.stringify(trip));
          switchView('controller');
        }
      });
    });
  }

  function renderTripOverviewPage() {
    const trip = currentState.activeTrip;
    if (!trip) return;

    document.getElementById('ovHeroDestName').innerText = `${trip.name}, ${trip.country || 'India'}`;
    document.getElementById('ovHeroDates').innerText = `${trip.days} Days • ${trip.travelers} Travelers (${trip.travelStyle} Style)`;
    document.getElementById('ovHeroBudget').innerText = `₹ ${(trip.budget || 50000).toLocaleString()} INR`;

    const intContainer = document.getElementById('ovHeroInterests');
    if (intContainer) {
      intContainer.innerHTML = (trip.interests || ['Nature', 'Adventure']).map(i => `<span class="interest-badge-pill">${i}</span>`).join('');
    }

    const quickGrid = document.getElementById('overviewQuickSummaryGrid');
    if (quickGrid) {
      quickGrid.innerHTML = `
        <div class="glass-card p-3 font-mono">
          <span style="font-size:11px; color:#94a3b8;">LANDMARKS DISCOVERED</span>
          <h3 style="font-size:20px; color:#00f2fe;" class="mt-1">${(trip.attractions || []).length} Attractions</h3>
        </div>
        <div class="glass-card p-3 font-mono">
          <span style="font-size:11px; color:#94a3b8;">HOTEL MATCHES</span>
          <h3 style="font-size:20px; color:#ec4899;" class="mt-1">${(trip.hotels || []).length} Options</h3>
        </div>
        <div class="glass-card p-3 font-mono">
          <span style="font-size:11px; color:#94a3b8;">FORECAST TEMPERATURE</span>
          <h3 style="font-size:20px; color:#fbbf24;" class="mt-1">${(trip.weatherData?.current?.temperature) || '22°C'}</h3>
        </div>
        <div class="glass-card p-3 font-mono">
          <span style="font-size:11px; color:#94a3b8;">TRANSIT DURATION</span>
          <h3 style="font-size:20px; color:#10b981;" class="mt-1">${(trip.transportData?.estimated_duration) || '8h 30m'}</h3>
        </div>
      `;
    }

    const carousel = document.getElementById('overviewAttractionsCarousel');
    if (carousel) {
      carousel.innerHTML = (trip.attractions || []).slice(0, 6).map(spot => `
        <div class="attraction-card-carousel">
          <img src="${resolvePhotoSrc(spot.photo_url)}" class="attraction-img-thumb" alt="${spot.name}">
          <div class="attraction-meta-body">
            <h4 style="font-size:14px; font-weight:800; color:#fff;">${spot.name}</h4>
            <div style="font-size:11px; color:#fbbf24;">${spot.rating || 4.6} ★ (${spot.user_ratings_total || 250} reviews)</div>
          </div>
        </div>
      `).join('');
    }

    const itinContainer = document.getElementById('overviewDayItineraryContainer');
    if (itinContainer) {
      itinContainer.innerHTML = (trip.itinerary || []).map(dayPlan => `
        <div class="glass-card p-3 mb-3" style="background: rgba(255,255,255,0.02);">
          <h4 style="font-size: 16px; font-weight: 800; color: var(--color-primary);" class="mb-2">Day ${dayPlan.day} - ${dayPlan.destination || trip.name}</h4>
          <div class="timeline-container">
            ${(dayPlan.places || []).map(p => `
              <div class="timeline-item">
                <span class="timeline-time">${p.time || '10:00 AM'}</span>
                <h5 class="timeline-title">${p.name}</h5>
                <p style="font-size:12px; color:#cbd5e1; margin-top:2px;">${p.description || 'Authentic landmark and scenic spot.'}</p>
              </div>
            `).join('')}
          </div>
        </div>
      `).map((item, idx) => idx < 3 ? item : '').join('');
    }
  }

  // Global Export Helpers
  window.exportCalendarICS = () => {
    const trip = currentState.activeTrip;
    if (!trip) return;
    const content = `BEGIN:VCALENDAR\nVERSION:2.0\nSUMMARY:Trip to ${trip.name}\nDESCRIPTION:${trip.days} Days AI Travel Plan\nEND:VCALENDAR`;
    const blob = new Blob([content], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Trip_${trip.name}.ics`;
    a.click();
  };

  window.downloadTripJSON = () => {
    const trip = currentState.activeTrip;
    if (!trip) return;
    const blob = new Blob([JSON.stringify(trip, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AI_Travel_Plan_${trip.name}.json`;
    a.click();
  };

  window.shareTripPlan = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      alert('Trip plan URL copied to clipboard!');
    }
  };

  // Initial Load Trigger
  if (currentState.activeView === 'dashboard') {
    renderDashboard();
  }

});
