// ⭐ DEFINICIÓ DE ZONES GEOGRÀFIQUES
const MAPES_ZONES = {
  catalunya: {
    nom: "Catalunya",
    center: { lat: 41.5912, lng: 1.5209 },
    zoom: 8,
    radi_km: 150,
  },
  new_york: {
    nom: "New York, USA",
    center: { lat: 40.7128, lng: -74.006 },
    zoom: 9,
    radi_km: 100,
  },
  tokyo: {
    nom: "Tokyo, Japan",
    center: { lat: 35.6762, lng: 139.6503 },
    zoom: 10,
    radi_km: 100,
  },
  london: {
    nom: "Londres, UK",
    center: { lat: 51.5074, lng: -0.1278 },
    zoom: 9,
    radi_km: 100,
  },
  sydney: {
    nom: "Sydney, Australia",
    center: { lat: -33.8688, lng: 151.2093 },
    zoom: 10,
    radi_km: 100,
  },
};

// ⭐ FUNCIÓ: Calcular distància (Haversine)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radi Terra en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // km
}

// ⭐ FUNCIÓ: Filtrar punts per zona
function filterPointsByZone(points, zoneId) {
  const zone = MAPES_ZONES[zoneId];
  if (!zone) return points;

  return points.filter((point) => {
    const distance = calculateDistance(
      zone.center.lat,
      zone.center.lng,
      parseFloat(point.lat),
      parseFloat(point.lng),
    );
    return distance <= zone.radi_km;
  });
}

/**
 * Mapes User - Interfície d'usuari per activitats
 */
class MapesUser {
  constructor() {
    this.currentRoute = null;
    this.markers = [];
    this.map = null;
    this.allPoints = [];
    this.filteredPoints = [];
    this.selectedPoint = null;
    this.pointsVisible = false;
    this.currentZone = "catalunya"; // ZONA PER DEFECTE
    this.originalPoints = []; // PUNTS ORIGINALS SENSE TOCAR
    this.originalRoutes = []; // RUTES ORIGINALS SENSE TOCAR
  }

  setAppData(appId, points, routes) {
    console.log("=== SETAPPDATA DEBUG ===");
    console.log("AppId:", appId);
    console.log("Points rebuts:", points);
    console.log("Routes rebudes:", routes);

    this.appId = appId;

    // GUARDAR DADES ORIGINALS (TOTES les rutes i punts)
    this.originalPoints = points || [];
    this.originalRoutes = routes || [];

    // FILTRAR PER ZONA ACTUAL (Catalunya per defecte)
    this.points = filterPointsByZone(this.originalPoints, this.currentZone);
    this.routes = this.filterRoutesByZone(
      this.originalRoutes,
      this.currentZone,
    );

    // Assegurar compatibilitat amb codi antic
    this.allPoints = this.points;
    this.filteredPoints = this.points;

    console.log("Punts a la zona", this.currentZone + ":", this.points.length);
    console.log("Rutes a la zona", this.currentZone + ":", this.routes.length);
    console.log("Points processats:", this.points.length);
    console.log("Routes processades:", this.routes.length);

    // ACTUALITZAR COMPTADORS I VISIBILITAT
    this.updatePointsCount();

    // INICIALITZAR RESPONSIVITAT
    this.initResponsiveMap();

    // CARREGAR GOOGLE MAPS
    this.loadGoogleMaps();

    // REGISTRAR L'APP GLOBALMENT
    if (!window.mapesUserApps) {
      window.mapesUserApps = {};
    }
    window.mapesUserApps[appId] = this;
    console.log("✅ App registrada:", appId);
    console.log("Apps disponibles:", Object.keys(window.mapesUserApps));
  }

  loadGoogleMaps() {
    if (typeof google !== "undefined" && google.maps) {
      this.initializeUserMap();
      return;
    }

    const apiKey = mapesUserConfig.apiKey;
    if (!apiKey) {
      console.error("API key no configurada");
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initUserMapCallback`;
    script.async = true;
    script.defer = true;

    window.initUserMapCallback = () => {
      this.initializeUserMap();
    };

    document.head.appendChild(script);
  }

  initializeUserMap() {
    const mapElement = document.getElementById(`map-${this.appId}`);
    if (!mapElement || typeof google === "undefined") return;

    this.map = new google.maps.Map(mapElement, {
      center: { lat: 41.6, lng: 1.5 },
      zoom: 8,
      streetViewControl: false,
      mapTypeId: "roadmap",
    });

    this.markers = [];
    this.showAllRoutes();
  }
  // ✅ SOLUCIÓ - MOSTRAR TOTS ELS PUNTS DE TOTES LES RUTES:
  showAllRoutes() {
    console.log("=== SHOWALLROUTES DEBUG ===");
    console.log("Routes disponibles:", this.routes);
    console.log("Points disponibles:", this.points);
    console.log(
      "Punts totals:",
      this.points ? this.points.length : "UNDEFINED",
    );
    console.log(
      "Rutes totals:",
      this.routes ? this.routes.length : "UNDEFINED",
    );

    this.clearMarkers();

    if (!this.routes || this.routes.length === 0) {
      console.log("❌ NO HI HA RUTES!");
      return;
    }

    this.routes.forEach((route, routeIndex) => {
      console.log(`--- RUTA ${routeIndex}: ${route.code} ---`);
      console.log("Punts de la ruta:", route.points);

      if (!route.points || route.points.length === 0) {
        console.log("❌ Ruta sense punts!");
        return;
      }

      route.points.forEach((rp, index) => {
        console.log(`Processant punt ${index}:`, rp);
        const point = this.points.find((p) => p.id === rp.point_id);

        if (!point) {
          // Normal: el punt no està a la zona actual
          console.log("⚠️ Punt fora de la zona, s'ignora:", rp.title);
          return;
        }

        console.log("✅ Punt trobat a la zona:", point.title);

        // CREAR MARKER amb logs
        const marker = new google.maps.Marker({
          position: { lat: parseFloat(point.lat), lng: parseFloat(point.lng) },
          map: this.map,
          title: `${route.code} - ${point.title}`,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: this.getPointActivationColor
              ? this.getPointActivationColor(point)
              : "#FF0000",
            fillOpacity: 0.9,
            strokeColor: "#FFFFFF",
            strokeWeight: 2,
            scale: 8,
          },
        });

        this.markers.push(marker);
        console.log("✅ Marker creat per:", point.title);
      });
    });

    console.log("=== FI DEBUG - Markers totals:", this.markers.length);
  }

  // Netejar tots els markers del mapa
  clearMarkers() {
    if (this.markers && this.markers.length > 0) {
      this.markers.forEach((marker) => {
        marker.setMap(null);
      });
      this.markers = [];
      console.log("🗑️ Markers netejats");
    }
  }

  // Filtrar rutes que tinguin almenys 1 punt a la zona
  filterRoutesByZone(routes, zoneId) {
    if (!routes || routes.length === 0) return [];

    return routes.filter((route) => {
      if (!route.points || route.points.length === 0) return false;

      // Comprovar si almenys 1 punt de la ruta està a la zona
      return route.points.some((rp) => {
        const point = this.originalPoints.find((p) => p.id === rp.point_id);
        if (!point) return false;

        const zone = MAPES_ZONES[zoneId];
        if (!zone) return true;

        const distance = calculateDistance(
          zone.center.lat,
          zone.center.lng,
          parseFloat(point.lat),
          parseFloat(point.lng),
        );

        return distance <= zone.radi_km;
      });
    });
  }
  // Canviar zona geogràfica
  changeZone(zoneId) {
    const zone = MAPES_ZONES[zoneId];
    if (!zone) {
      console.error("❌ Zona no trobada:", zoneId);
      return;
    }

    console.log("📍 Canviant a zona:", zone.nom);

    // Actualitzar zona actual
    this.currentZone = zoneId;

    // Filtrar dades per nova zona
    this.points = filterPointsByZone(this.originalPoints, zoneId);
    this.routes = this.filterRoutesByZone(this.originalRoutes, zoneId);
    this.allPoints = this.points;
    this.filteredPoints = this.allPoints;

    console.log("✅ Zona canviada:", zone.nom);
    console.log("📊 Punts:", this.points.length);
    console.log("📊 Rutes:", this.routes.length);

    // Centrar mapa
    if (this.map) {
      this.map.setCenter(zone.center);
      this.map.setZoom(zone.zoom);
    }

    // Actualitzar visualització
    this.updatePointsCount();
    this.showAllRoutes();

    // ⭐ EXECUTAR AMB setTimeout per assegurar que l'app està registrada
    const appId = this.appId;
    setTimeout(() => {
      updateRoutesListVisibility(appId);
    }, 300);
  }

  selectRoute(routeId) {
    const route = this.routes.find((r) => r.id == routeId);
    if (!route) return;

    this.currentRoute = route;
    this.displayRouteDetails(route);
    this.showRouteOnMap(route);

    // Actualitzar interfície
    document.querySelectorAll(".mapes-route-item-user").forEach((item) => {
      item.classList.remove("selected");
    });
    event.target.closest(".mapes-route-item-user").classList.add("selected");
  }

  displayRouteDetails(route) {
    // PART 1: ACTUALITZAR PANELL D'ACCIONS (SIDEBAR) - MANTENIR CODI EXISTENT
    const routeNameSpan = document.getElementById(
      `selected-route-name-${this.appId}`,
    );
    if (routeNameSpan) {
      routeNameSpan.textContent = `${route.code} - ${route.name}`;
    }

    // PART 2: NOUS DETALLS SOTA DEL MAPA (SI EXISTEIXEN ELS ELEMENTS NOUS)
    const detailsPanel = document.getElementById(
      `route-details-panel-${this.appId}`,
    );
    if (detailsPanel) {
      // NOVA ESTRUCTURA - Usar els nous elements
      const detailsColor = document.getElementById(
        `route-details-color-${this.appId}`,
      );
      const detailsName = document.getElementById(
        `route-details-name-${this.appId}`,
      );
      const detailsPointsCount = document.getElementById(
        `route-details-points-count-${this.appId}`,
      );
      const detailsTotalWeight = document.getElementById(
        `route-details-total-weight-${this.appId}`,
      );
      const detailsDesc = document.getElementById(
        `route-details-desc-${this.appId}`,
      );
      const pointsContainer = document.getElementById(
        `route-points-container-${this.appId}`,
      );

      // Mostrar el panell
      detailsPanel.style.display = "block";

      // Actualitzar elements si existeixen
      if (detailsColor) detailsColor.style.background = route.color;
      if (detailsName)
        detailsName.textContent = `${route.code} - ${route.name}`;

      const totalPoints = route.points ? route.points.length : 0;
      const totalWeight = route.points
        ? route.points.reduce((sum, rp) => sum + parseFloat(rp.weight || 1), 0)
        : 0;

      if (detailsPointsCount)
        detailsPointsCount.textContent = `${totalPoints} monuments`;
      if (detailsTotalWeight)
        detailsTotalWeight.textContent = `Pes: ${totalWeight}`;

      if (detailsDesc) {
        detailsDesc.innerHTML = `
        <strong>Codi:</strong> ${route.code}<br>
        <strong>Nom:</strong> ${route.name}<br>
        <strong>Color:</strong> <span style="display:inline-block;width:20px;height:15px;background:${route.color};border:1px solid #ccc;margin-left:5px;"></span>
      `;
      }

      // Mostrar llista de monuments (dins de displayRouteDetails())
      if (pointsContainer && route.points) {
        pointsContainer.innerHTML = route.points
          .map((rp, index) => {
            const point = this.points.find((p) => p.id == rp.point_id);
            const esc = (s) =>
              ("" + (s || "")).replace(/'/g, "\\'").replace(/\n/g, " ");
            const titleEsc = esc(point.title);
            const formattedEsc = esc(
              point.formatted_address || point.location_name || "",
            );
            const poblacioEsc = esc(point.Poblacio || point.poblacio || "");
            const provinciaEsc = esc(point.provincia || "");
            if (!point) return "";

            return `
    <div class="route-point-item" onclick="openPointInGoogleMaps('${titleEsc}','${formattedEsc}','${poblacioEsc}','${provinciaEsc}', ${parseFloat(point.lat)}, ${parseFloat(point.lng)})">
    <div class="route-point-name">${index + 1}. ${point.title}</div>
    <div class="route-point-coords">
      ${parseFloat(point.lat).toFixed(4)}, ${parseFloat(point.lng).toFixed(4)}
    </div>
    <div class="route-point-weight">Pes: ${parseFloat(rp.weight || 1).toFixed(2)}</div>
  </div>
    `;
          })
          .join("");
      }
    } else {
      // PART 3: FALLBACK A L'ESTRUCTURA ANTIGA (SI NO EXISTEIXEN ELS NOUS ELEMENTS)
      const sidebarPanel = document.getElementById(
        `route-info-panel-${this.appId}`,
      );
      const sidebarTitle = document.getElementById(
        `route-info-title-${this.appId}`,
      );
      const sidebarContent = document.getElementById(
        `route-info-content-${this.appId}`,
      );

      if (sidebarTitle) {
        sidebarTitle.textContent = `${route.code} - ${route.name}`;
      }

      if (sidebarContent) {
        sidebarContent.innerHTML = `
        <div class="route-sidebar-info">
          <div class="info-compact-grid">
            <div><strong>Codi:</strong> ${route.code}</div>
            <div><strong>Monuments:</strong> ${route.points.length}</div>
            <div><strong>Color:</strong> <span style="display:inline-block;width:16px;height:16px;background:${
              route.color
            };border-radius:50%;"></span></div>
          </div>
          
          <div class="route-points-compact">
            <strong>Monuments:</strong>
            <table class="route-points-table-sidebar">
              <thead>
                <tr><th>#</th><th>Monument</th><th>Pes</th></tr>
              </thead>
              <tbody>
                ${route.points
                  .map((rp, i) => {
                    const point = this.points.find((p) => p.id == rp.point_id);
                    return point
                      ? `
                    <tr>
                      <td>${i + 1}</td>
                      <td>${point.title}</td>
                      <td><span class="weight-badge-small">${
                        rp.weight || "1"
                      }</span></td>
                    </tr>
                  `
                      : "";
                  })
                  .join("")}
              </tbody>
            </table>
          </div>
        </div>
      `;
      }

      if (sidebarPanel) {
        sidebarPanel.style.display = "block";
      }
    }

    // ⭐ MOSTRAR PANELL D'ACCIONS (COMÚ A AMBDUES ESTRUCTURES)
    const actionsPanel = document.getElementById(
      `route-actions-panel-${this.appId}`,
    );
    if (actionsPanel) {
      actionsPanel.style.display = "block";
    }

    // Guardar dades de ruta
    localStorage.setItem("selectedRouteId", route.id);
    localStorage.setItem("selectedRouteCode", route.code);
    localStorage.setItem("selectedRouteName", route.name);
    // Al final de displayRouteDetails(), afegeix:
    const crearBtn = document.getElementById(
      `crear-activitat-btn-${this.appId}`,
    );
    const selectedRouteInfo = document.getElementById("selected-route-info");

    if (crearBtn) {
      crearBtn.style.display = "inline-block"; // Mostrar botó crear quan hi ha ruta
    }

    if (selectedRouteInfo) {
      selectedRouteInfo.style.display = "block"; // Mostrar info de ruta
    }
  }

  showRouteOnMap(route) {
    this.clearMarkers();

    if (!route.points || route.points.length === 0) return;

    // Ordenar monuments per ordre i crear markers numerats
    const routePoints = route.points
      .map((rp) => {
        const point = this.points.find((p) => p.id == rp.point_id);
        return point ? { ...point, order: rp.order_num } : null;
      })
      .filter((p) => p)
      .sort((a, b) => a.order - b.order);

    routePoints.forEach((point, index) => {
      const marker = new google.maps.Marker({
        position: { lat: parseFloat(point.lat), lng: parseFloat(point.lng) },
        map: this.map,
        title: `${index + 1}. ${point.title}`,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: this.getPointActivationColor(point),
          fillOpacity: 0.9,
          strokeColor: "#FFFFFF",
          strokeWeight: 2,
          scale: 10,
        },
        label: {
          text: (index + 1).toString(),
          color: "#FFFFFF",
          fontWeight: "bold",
        },
      });

      marker.addListener("click", () => {
        const title = point.title || "";
        const formatted = point.formatted_address || point.location_name || "";
        const poblacio = point.Poblacio || point.poblacio || "";
        const provincia = point.provincia || "";
        const lat = parseFloat(point.lat);
        const lng = parseFloat(point.lng);

        window.openPointInGoogleMaps(
          title,
          formatted,
          poblacio,
          provincia,
          lat,
          lng,
        );
      });
      this.markers.push(marker);
    });

    // Crear línia de ruta
    if (routePoints.length > 1) {
      const path = routePoints.map((point) => ({
        lat: parseFloat(point.lat),
        lng: parseFloat(point.lng),
      }));

      const routeLine = new google.maps.Polyline({
        path: path,
        geodesic: true,
        strokeColor: route.color,
        strokeOpacity: 0.8,
        strokeWeight: 4,
      });

      routeLine.setMap(this.map);
      this.markers.push(routeLine);
    }

    // Ajustar vista
    const bounds = new google.maps.LatLngBounds();
    routePoints.forEach((point) => {
      bounds.extend({ lat: parseFloat(point.lat), lng: parseFloat(point.lng) });
    });
    this.map.fitBounds(bounds);
  }

  submitActivity(routeId, event) {
    event.preventDefault();
    // Implementar enviament d'activitat via AJAX
    alert("Funcionalitat d'enviament en desenvolupament");
  }

  clearMarkers() {
    if (this.markers && this.markers.length > 0) {
      this.markers.forEach((marker) => {
        marker.setMap(null);
      });
      this.markers = [];
    }
  }

  /**
   * Determina el color d'un monument segons el seu estat d'activació
   */
  getPointActivationColor(point) {
    const colors = {
      never_activated: "#32CD32", // 🟢 VERD - mai activat
      confirmed: "#FF4444", // 🔴 VERMELL - confirmat ⭐ AQUESTA LÍNIA IMPORTANT
      pending: "#808000", // 🔘 GRIS - pendent
      confirmed_recent: "#FF4444", // 🔴 VERMELL - confirmat recent
      confirmed_old: "#FFD700", // 🟡 GROC - confirmat antic
      pending_confirmation: "#CCCCCC", // 🔘 GRIS - pendent confirmació
      default: "#4285F4", // 🔵 BLAU - per defecte
    };

    const status = point.status || point.activation_status || "default";
    const color = colors[status] || colors["default"];

    return color;
  }

  /**
   * Converteix color hex a nom d'icona de Google Maps
   */
  getMarkerIconColor(point) {
    const color = this.getPointActivationColor(point);

    const colorMap = {
      "#32CD32": "green", // Verd -> green
      "#FF4444": "red", // Vermell -> red
      "#808000": "grey", // Gris -> grey
      "#FFD700": "yellow", // Groc -> yellow
      "#4285F4": "blue", // Blau -> blue (defecte)
    };

    return colorMap[color] || "blue";
  }

  /**
   * Actualitza el comptador de monuments
   */
  updatePointsCount() {
    console.log("🔄 Actualitzant comptadors...");

    // 1. Comptadors grans (estadístiques del dashboard)
    const statPoints = document.getElementById(`stat-points-${this.appId}`);
    if (statPoints) {
      statPoints.textContent = this.points.length;
      console.log("✅ stat-points actualitzat:", this.points.length);
    } else {
      console.warn("⚠️ #stat-points-" + this.appId + " no trobat");
    }

    const statRoutes = document.getElementById(`stat-routes-${this.appId}`);
    if (statRoutes) {
      statRoutes.textContent = this.routes.length;
      console.log("✅ stat-routes actualitzat:", this.routes.length);
    } else {
      console.warn("⚠️ #stat-routes-" + this.appId + " no trobat");
    }

    // 2. Comptador "Monuments Disponibles"
    const pointsCount = document.getElementById(
      `points-count-user-${this.appId}`,
    );
    if (pointsCount) {
      pointsCount.textContent = this.points.length;
      console.log("✅ points-count-user actualitzat:", this.points.length);
    }

    // 3. Comptador "Rutes Disponibles"
    const routesCount = document.getElementById(
      `routes-count-user-${this.appId}`,
    );
    if (routesCount) {
      routesCount.textContent = this.routes.length;
      console.log("✅ routes-count-user actualitzat:", this.routes.length);
    }
  }

  /**
   * Alternar visibilitat del selector de monuments
   */
  togglePoints() {
    this.pointsVisible = !this.pointsVisible;
    const searchContainer = document.getElementById(
      `points-search-container-${this.appId}`,
    );
    const listContainer = document.getElementById(
      `points-list-container-${this.appId}`,
    );

    if (this.pointsVisible) {
      searchContainer.style.display = "block";
      listContainer.style.display = "block";
      this.renderPointsList();
    } else {
      searchContainer.style.display = "none";
      listContainer.style.display = "none";
    }
  }

  /**
   * Filtrar monuments per cercador
   */
  filterPoints(searchTerm) {
    const term = searchTerm.toLowerCase().trim();

    if (term === "") {
      this.filteredPoints = this.allPoints;
    } else {
      this.filteredPoints = this.allPoints.filter(
        (point) =>
          point.title.toLowerCase().includes(term) ||
          (point.poblacio && point.poblacio.toLowerCase().includes(term)) ||
          (point.description && point.description.toLowerCase().includes(term)),
      );
    }

    this.renderPointsList();
  }

  /**
   * Renderitzar llista de monuments
   */
  renderPointsList() {
    const container = document.getElementById(`points-list-${this.appId}`);
    if (!container) return;

    if (this.filteredPoints.length === 0) {
      container.innerHTML =
        '<div class="no-points-found">Cap monument trobat</div>';
      return;
    }

    container.innerHTML = this.filteredPoints
      .map((point) => this.createPointItemHTML(point))
      .join("");
  }

  /**
   * Crear HTML d'un element monument
   */
  createPointItemHTML(point) {
    const statusColor = this.getPointActivationColor(point);
    const location = point.poblacio ? ` (${point.poblacio})` : "";

    return `
    <div class="point-item-user" onclick="window.mapesUser.selectPoint(${
      point.id
    })">
      <div class="point-info-user">
        <div class="point-name-user">${this.escapeHtml(point.title)}</div>
        <div class="point-location-user">${this.escapeHtml(location)}</div>
      </div>
      <div class="point-status-indicator-user" style="background-color: ${statusColor}"></div>
    </div>
  `;
  }

  /**
   * Seleccionar monument individual
   */
  selectPoint(pointId) {
    const point = this.allPoints.find((p) => p.id == pointId);
    if (!point) return;

    this.selectedPoint = point;

    // Mostrar monument al mapa
    this.showPointOnMap(point);

    // Mostrar detalls
    this.showPointDetails(point);

    // Tancar llista de monuments
    this.pointsVisible = false;
    document.getElementById(
      `points-search-container-${this.appId}`,
    ).style.display = "none";
    document.getElementById(
      `points-list-container-${this.appId}`,
    ).style.display = "none";
  }

  /**
   * Mostrar monument al mapa
   */
  showPointOnMap(point) {
    this.clearMarkers();

    // Crear marker del monument
    const marker = new google.maps.Marker({
      position: { lat: parseFloat(point.lat), lng: parseFloat(point.lng) },
      map: this.map,
      title: point.title,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: this.getPointActivationColor(point),
        fillOpacity: 1.0,
        strokeColor: "#FFFFFF",
        strokeWeight: 3,
        scale: 15,
      },
    });

    // Centrar mapa
    this.map.setCenter({
      lat: parseFloat(point.lat),
      lng: parseFloat(point.lng),
    });
    this.map.setZoom(15);

    // Afegir event click per obrir Google Maps
    marker.addListener("click", () => {
      const title = point.title || "";
      const formatted = point.formatted_address || point.location_name || "";
      const poblacio = point.Poblacio || point.poblacio || "";
      const provincia = point.provincia || "";
      const lat = parseFloat(point.lat);
      const lng = parseFloat(point.lng);

      window.openPointInGoogleMaps(
        title,
        formatted,
        poblacio,
        provincia,
        lat,
        lng,
      );
    });

    // Guardar marker
    this.markers = [marker];
  }

  /**
   * Mostrar detalls del monument - VERSIÓ DEFINITIVA AMB PANELL D'ACCIONS VISIBLE
   */
  showPointDetails(point) {
    // Amagar detalls de rutes si estan oberts
    const routePanel = document.getElementById(
      `route-details-panel-${this.appId}`,
    );
    if (routePanel) routePanel.style.display = "none";

    const routeInfoPanel = document.getElementById(
      `route-info-panel-${this.appId}`,
    );
    if (routeInfoPanel) routeInfoPanel.style.display = "none";

    // ✅ GESTIÓ INTEL·LIGENT DEL PANELL D'ACCIONS - AQUESTA ÉS LA CLAU!!!
    const routeActionsPanel = document.getElementById(
      `route-actions-panel-${this.appId}`,
    );
    const selectedRouteInfo = document.getElementById("selected-route-info");

    if (routeActionsPanel) {
      // Comprovar si hi ha una ruta seleccionada
      const hasSelectedRoute =
        selectedRouteInfo &&
        (selectedRouteInfo.style.display === "block" ||
          selectedRouteInfo.textContent.trim() !== "");

      if (hasSelectedRoute) {
        routeActionsPanel.style.display = "block"; // ✅ MANTENIR VISIBLE
        console.log(
          "🎯 Mantenint panell d'accions visible - ruta seleccionada",
        );
      } else {
        routeActionsPanel.style.display = "none"; // Amagar si no hi ha ruta
        console.log("🎯 Amagant panell d'accions - cap ruta seleccionada");
      }
    }

    // ✅ ACTUALITZAR TÍTOL AMB INDICADOR DE COLOR
    const titleElement = document.getElementById(
      `point-details-name-${this.appId}`,
    );
    if (titleElement) {
      const pointColor = this.getPointActivationColor(point);
      titleElement.innerHTML = `
      <span class="point-color-indicator" style="display: inline-block; width: 20px; height: 20px; background-color: ${pointColor}; border-radius: 50%; margin-right: 6px; border: 1px solid #fff; vertical-align: middle;"></span>
      ${this.escapeHtml(point.title)}
    `;
    }

    // ✅ ACTUALITZAR DESCRIPCIÓ PRINCIPAL
    const descElement = document.getElementById(
      `point-details-desc-${this.appId}`,
    );
    if (descElement) {
      descElement.textContent =
        point.description || "Sense descripció disponible.";
    }

    // ✅ ACTUALITZAR ESTADÍSTIQUES DEL HEADER
    const activityElement = document.getElementById(
      `point-details-activity-${this.appId}`,
    );
    if (activityElement) {
      activityElement.textContent = `Activitat: ${point.activity || "--"}`;
    }

    const weightElement = document.getElementById(
      `point-details-weight-${this.appId}`,
    );
    if (weightElement) {
      weightElement.textContent = `Pes: ${point.weight || "1"}`;
    }

    // ✅ OMPLIR INFORMACIÓ DETALLADA
    const infoContainer = document.getElementById(
      `point-details-info-${this.appId}`,
    );
    if (infoContainer) {
      infoContainer.innerHTML = this.generateDetailedPointHTML(point);
    }

    // ✅ MOSTRAR EL PANELL DE DETALLS DEL PUNT
    const pointPanel = document.getElementById(
      `point-details-panel-${this.appId}`,
    );
    if (pointPanel) {
      pointPanel.style.display = "block";
      this.adjustMapHeight(true); // Ajustar alçada del mapa
    }

    console.log("🎯 Mostrant detalls del monument:", point.title);
  }

  /**
   * Generar HTML detallat per al monument - PER AL NOU SISTEMA
   */
  generateDetailedPointHTML(point) {
    const statusText = this.getPointStatusText(point);
    const statusColor = this.getPointActivationColor(point);

    return `
    <div class="point-detail-item">
      <strong class="point-detail-label">Estat:</strong>
      <span class="point-detail-value">
        <span style="color: ${statusColor};">●</span> ${statusText}
      </span>
    </div>
    
    <div class="point-detail-item">
      <strong class="point-detail-label">Nom Complet:</strong>
      <span class="point-detail-value">${this.escapeHtml(point.title)}</span>
    </div>
    
    ${
      point.poblacio
        ? `
    <div class="point-detail-item">
      <strong class="point-detail-label">Població:</strong>
      <span class="point-detail-value">${this.escapeHtml(point.poblacio)}</span>
    </div>
    `
        : ""
    }
    
    ${
      point.activity
        ? `
    <div class="point-detail-item">
      <strong class="point-detail-label">Tipus d'Activitat:</strong>
      <span class="point-detail-value">${this.escapeHtml(point.activity)}</span>
    </div>
    `
        : ""
    }
    
    <div class="point-detail-item">
      <strong class="point-detail-label">Coordenades:</strong>
      <span class="point-detail-value">${point.lat}, ${point.lng}</span>
    </div>
    
    <div class="point-detail-item">
      <strong class="point-detail-label">Pes del Monument:</strong>
      <span class="point-detail-value">${point.weight || "1"}</span>
    </div>
    
    <div class="point-detail-item">
      <strong class="point-detail-label">Activacions Total:</strong>
      <span class="point-detail-value">${
        point.vegades_activat || 0
      } vegades</span>
    </div>
    
    ${
      point.darrera_activacio
        ? `
    <div class="point-detail-item">
      <strong class="point-detail-label">Última Activació:</strong>
      <span class="point-detail-value">${this.formatDate(
        point.darrera_activacio,
      )}</span>
    </div>
    `
        : ""
    }
  `;
  }

  /**
   * Sistema antic (manté el codi existent com a fallback)
   */
  showPointDetailsOldSystem(point) {
    // Crear/mostrar panell antic
    let pointPanel = document.getElementById(
      `point-details-panel-${this.appId}`,
    );
    if (!pointPanel) {
      pointPanel = this.createPointDetailsPanel();
      document
        .querySelector(`#map-${this.appId}`)
        .parentNode.appendChild(pointPanel);
    }

    pointPanel.style.display = "block";
    pointPanel.innerHTML = this.generatePointDetailsHTML(point); // Usa la funció original

    // AJUSTAR ALÇADA DEL MAPA
    this.adjustMapHeight(true);
  }

  /**
   * Crear panell de detalls del monument
   */
  createPointDetailsPanel() {
    const panel = document.createElement("div");
    panel.id = `point-details-panel-${this.appId}`;
    panel.className = "point-details-panel";
    panel.style.display = "none";
    return panel;
  }

  /**
   * Generar HTML dels detalls del monument
   */
  generatePointDetailsHTML(point) {
    const statusText = this.getPointStatusText(point);
    const statusColor = this.getPointActivationColor(point);

    return `
    <div class="point-details-title">
      <h3>📍 ${this.escapeHtml(point.title)}</h3>
      <button class="point-close-btn" onclick="window.mapesUser.closePointDetails()">✕</button>
    </div>
    
    <div class="point-details-content">
      <div class="point-detail-item">
        <span class="point-detail-label">Estat:</span>
        <span class="point-detail-value">
          <span style="color: ${statusColor};">●</span> ${statusText}
        </span>
      </div>
      
      ${
        point.poblacio
          ? `
      <div class="point-detail-item">
        <span class="point-detail-label">Població:</span>
        <span class="point-detail-value">${this.escapeHtml(
          point.poblacio,
        )}</span>
      </div>
      `
          : ""
      }
      
      ${
        point.description
          ? `
      <div class="point-detail-item">
        <span class="point-detail-label">Descripció:</span>
        <span class="point-detail-value">${this.escapeHtml(
          point.description,
        )}</span>
      </div>
      `
          : ""
      }
      
      <div class="point-detail-item">
        <span class="point-detail-label">Activacions:</span>
        <span class="point-detail-value">${
          point.vegades_activat || 0
        } vegades</span>
      </div>
      
      ${
        point.darrera_activacio
          ? `
      <div class="point-detail-item">
        <span class="point-detail-label">Última:</span>
        <span class="point-detail-value">${this.formatDate(
          point.darrera_activacio,
        )}</span>
      </div>
      `
          : ""
      }
      
      <div class="point-detail-item">
        <span class="point-detail-label">Coordenades:</span>
        <span class="point-detail-value">${point.lat}, ${point.lng}</span>
      </div>
    </div>
  `;
  }

  /**
   * Tancar detalls del monument - ACTUALITZAT
   */
  closePointDetails() {
    const panel = document.getElementById(`point-details-panel-${this.appId}`);
    if (panel) {
      panel.style.display = "none";
      // ⭐ RESTAURAR ALÇADA DEL MAPA
      this.adjustMapHeight(false);
    }
  }
  /**
   * Obtenir text de l'estat del monument
   */
  getPointStatusText(point) {
    const status = point.activation_status || point.status || "never_activated";
    const statusMap = {
      never_activated: "Mai activat",
      pending: "Pendent confirmació",
      confirmed: "Confirmat",
      confirmed_recent: "Confirmat recent",
      confirmed_old: "Confirmat antic",
    };
    return statusMap[status] || "Desconegut";
  }

  /**
   * Escapar HTML per seguretat
   */
  escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Formatejar data
   */
  formatDate(dateString) {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("ca-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  /**
   * Ajustar alçada del mapa segons pantalla i detalls
   */
  adjustMapHeight(showDetails = false) {
    const mapElement = document.getElementById(`map-${this.appId}`);
    const mapContainer = mapElement?.parentElement;
    const userApp = document.getElementById(this.appId);

    if (!mapContainer || !mapElement || !userApp) return;

    // DETECTAR MIDA DE PANTALLA
    const screenHeight = window.innerHeight;
    const screenWidth = window.innerWidth;
    const isMobile = screenWidth < 768;
    const isTablet = screenWidth >= 768 && screenWidth < 1024;

    let mapHeight;

    if (showDetails) {
      // AMB DETALLS DE PUNT OBERTS
      if (isMobile) {
        mapHeight = Math.min(250, screenHeight * 0.4); // Mòbil: 40% pantalla, màx 250px
      } else if (isTablet) {
        mapHeight = Math.min(300, screenHeight * 0.45); // Tablet: 45% pantalla, màx 300px
      } else {
        mapHeight = Math.min(450, screenHeight * 0.5); // Desktop: 50% pantalla, màx 350px
      }
    } else {
      // SENSE DETALLS (MAPA NORMAL)
      if (isMobile) {
        mapHeight = Math.min(400, screenHeight * 0.5); // Mòbil: 50% pantalla, màx 400px
      } else if (isTablet) {
        mapHeight = Math.min(450, screenHeight * 0.55); // Tablet: 55% pantalla, màx 450px
      } else {
        mapHeight = Math.min(500, screenHeight * 0.6); // Desktop: 60% pantalla, màx 500px
      }
    }

    // APLICAR ALÇADES
    mapContainer.style.height = `${mapHeight}px`;
    mapContainer.style.maxHeight = `${mapHeight}px`;
    mapElement.style.height = `${mapHeight}px`;

    // AJUSTAR CONTENIDOR PRINCIPAL
    if (isMobile && showDetails) {
      // En mòbil amb detalls, assegurar que tot sigui visible
      userApp.style.height = "auto";
      userApp.style.maxHeight = `${screenHeight - 100}px`; // Deixar 100px per header/footer
      userApp.style.overflowY = "auto";
    } else {
      userApp.style.height = "auto";
      userApp.style.maxHeight = "none";
      userApp.style.overflowY = "visible";
    }

    // TRIGGER RESIZE PER GOOGLE MAPS
    if (this.map) {
      setTimeout(() => {
        google.maps.event.trigger(this.map, "resize");
        // Recentrar el mapa si hi ha monument seleccionat
        if (this.selectedPoint) {
          this.map.setCenter({
            lat: parseFloat(this.selectedPoint.lat),
            lng: parseFloat(this.selectedPoint.lng),
          });
        }
      }, 200);
    }

    console.log(
      `🗺️ Mapa ajustat: ${mapHeight}px, pantalla: ${screenWidth}x${screenHeight}, detalls: ${showDetails}`,
    );
  }

  /**
   * Funció per ajustar en canvis de mida de finestra
   */
  initResponsiveMap() {
    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const hasDetails =
          document.getElementById(`point-details-panel-${this.appId}`)?.style
            .display === "block";
        this.adjustMapHeight(hasDetails);
      }, 250);
    });
  }
}

// Instància global
window.mapesUser = new MapesUser();
window.mapesUserCore = window.mapesUser;

// Funcions globals
function selectUserRoute(appId, routeId) {
  window.mapesUser.selectRoute(routeId);
}

function closeRouteInfo(appId) {
  document.getElementById(`route-info-panel-${appId}`).style.display = "none";
}

window.closeActivityForm = function (appId) {
  document.getElementById(`activity-form-panel-${appId}`).style.display =
    "none";
};

window.closeSidebarRouteInfo = function (appId) {
  document.getElementById(`route-info-panel-${appId}`).style.display = "none";
  document.getElementById(`activity-form-panel-${appId}`).style.display =
    "none";
};

window.crearActivitat = function (appId) {
  const routeId = localStorage.getItem("selectedRouteId");
  const routeCode = localStorage.getItem("selectedRouteCode");

  if (routeId) {
    // Navegar a pàgina de formulari d'activitat
    window.location.href = `/formulari-activitat/?route=${routeId}&code=${routeCode}`;
  } else {
    alert("Error: No s'ha seleccionat cap ruta");
  }
};

window.finalitzarActivitat = function (appId) {
  // Obrir modal directament (sense necessitat de ruta)
  openModal("modal-finalize-activity");
};

// Funció per obrir monument a Google Maps (reutilitzant lògica dels markers)
// Nova versió: primer prova per nom; si no troba resultats -> fallback per coordenades
// Nova versió: prova formatted_address → (title + poblacio + provincia) → coords
// openPointInGoogleMaps: prova formatted_address -> (title + poblacio + provincia [+ país]) -> coords
window.openPointInGoogleMaps = function (
  pointTitle,
  pointFormattedAddress,
  pointPoblacio,
  pointProvincia,
  pointLat,
  pointLng,
) {
  // Helpers locals
  const safeContains = (haystack, needle) => {
    if (!haystack || !needle) return false;
    return (
      String(haystack).toLowerCase().indexOf(String(needle).toLowerCase()) !==
      -1
    );
  };

  const getAddressComponentLong = (result, types) => {
    if (!result || !result.address_components) return "";
    for (const t of types) {
      const comp = result.address_components.find(
        (c) => Array.isArray(c.types) && c.types.indexOf(t) !== -1,
      );
      if (comp && comp.long_name) return comp.long_name;
    }
    return "";
  };

  // Normalitzar inputs
  const title = (pointTitle || "").trim();
  const formatted = (pointFormattedAddress || "").trim();
  const poblacio = (pointPoblacio || "").trim();
  const provincia = (pointProvincia || "").trim();
  const lat = isFinite(pointLat) ? parseFloat(pointLat) : NaN;
  const lng = isFinite(pointLng) ? parseFloat(pointLng) : NaN;

  // Validació bàsica
  if (!title && (isNaN(lat) || isNaN(lng)) && !formatted) {
    alert("No hi ha dades suficients per obrir aquest punt a Google Maps.");
    return;
  }

  // Calcular un hint de país per desambiguar (millora per Catalunya/EUA/Japó)
  let countryHint = "";
  const provLower = (provincia || "").toLowerCase();
  if (
    [
      "barcelona",
      "girona",
      "lleida",
      "tarragona",
      "catalunya",
      "catalonia",
    ].includes(provLower)
  ) {
    countryHint = "Spain";
  } else if (
    provLower.includes("new york") ||
    provLower.includes("usa") ||
    provLower.includes("united states")
  ) {
    countryHint = "USA";
  } else if (provLower.includes("tokyo") || provLower.includes("japan")) {
    countryHint = "Japan";
  }

  // Construir candidats locals (nom únic per evitar conflictes globals)
  const geocodeCandidates = [];
  if (formatted) geocodeCandidates.push(formatted);

  if (title) {
    // Prioritat: title + poblacio + provincia + país (si és possible)
    let titleWithPlace = title;
    if (poblacio) titleWithPlace += ", " + poblacio;
    if (provincia) titleWithPlace += ", " + provincia;
    if (countryHint) titleWithPlace += ", " + countryHint;
    geocodeCandidates.push(titleWithPlace);

    // Variants addicionals (més àmplies -> més estretes)
    if (poblacio && countryHint)
      geocodeCandidates.push(`${title}, ${poblacio}, ${countryHint}`);
    if (poblacio) geocodeCandidates.push(`${title}, ${poblacio}`);
    if (provincia && countryHint)
      geocodeCandidates.push(`${title}, ${provincia}, ${countryHint}`);
    if (provincia) geocodeCandidates.push(`${title}, ${provincia}`);

    // Últim recurs textual: el título sol
    geocodeCandidates.push(title);
  }

  // Debug: mostra què provarà (pots eliminar aquests console.logs després)
  console.log("openPointInGoogleMaps inputs:", {
    title,
    formatted,
    poblacio,
    provincia,
    lat,
    lng,
  });
  console.log("Geocode candidates (local):", geocodeCandidates);

  // Funció per obrir per coordenades (fallback)
  const openCoordsUrl = () => {
    if (!isNaN(lat) && !isNaN(lng)) {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lat + "," + lng)}`;
      window.open(url, "_blank");
      if (window.mapesUI && window.mapesUI.showAlert) {
        window.mapesUI.showAlert(
          "S'ha obert el punt per coordenades (fallback).",
        );
      }
    } else if (title) {
      // Només obrir el title com a últim recurs textual
      const url = `https://www.google.com/maps/search/${encodeURIComponent(title)}?hl=ca&gl=ES`;
      window.open(url, "_blank");
    } else {
      alert("No s'ha pogut localitzar el punt.");
    }
  };

  // Si tenim l'API de Google Maps carregada, provar geocoder seqüencialment
  if (typeof google !== "undefined" && google.maps && google.maps.Geocoder) {
    const geocoder = new google.maps.Geocoder();
    let i = 0;

    const tryNext = () => {
      if (i >= geocodeCandidates.length) {
        // Cap candidat vàlid → fallback coordenades
        openCoordsUrl();
        return;
      }

      const q = geocodeCandidates[i++];
      console.log("Geocode try:", q);

      // Prova amb geocoder
      geocoder.geocode({ address: q }, (results, status) => {
        console.log(
          "Geocode response for:",
          q,
          status,
          results && results.length,
        );
        if (status === "OK" && results && results.length > 0) {
          const r = results[0];
          const formatted_addr = r.formatted_address || "";
          console.log("formatted_address:", formatted_addr);
          console.log("address_components:", r.address_components);

          // 1) Si l'usuari va proporcionar formatted_address, acceptar si està contingut al result
          if (formatted && safeContains(formatted_addr, formatted)) {
            window.open(
              `https://www.google.com/maps/search/${encodeURIComponent(formatted_addr)}?hl=ca&gl=ES`,
              "_blank",
            );
            return;
          }

          // 2) Comprovacions toletes acceptables:
          // - Comprovar si el nom està present (substring o en algun component)
          const namePresent =
            (title && safeContains(formatted_addr, title)) ||
            (title &&
              r.address_components &&
              r.address_components.some((c) =>
                safeContains(c.long_name || "", title),
              ));

          // - Extreure components per població i província
          const poblacioComp = getAddressComponentLong(r, [
            "locality",
            "postal_town",
            "administrative_area_level_3",
            "neighborhood",
          ]);
          const provinciaComp = getAddressComponentLong(r, [
            "administrative_area_level_2",
            "administrative_area_level_1",
          ]);

          const poblacioMatch = poblacio
            ? safeContains(poblacioComp || formatted_addr, poblacio) ||
              safeContains(formatted_addr, poblacio)
            : true;
          const provinciaMatch = provincia
            ? safeContains(provinciaComp || formatted_addr, provincia) ||
              safeContains(formatted_addr, provincia)
            : true;

          // Acceptar si el nom està present i (poblacio/provincia coincideixen si s'han subministrat)
          if (namePresent && poblacioMatch && provinciaMatch) {
            window.open(
              `https://www.google.com/maps/search/${encodeURIComponent(formatted_addr)}?hl=ca&gl=ES`,
              "_blank",
            );
            return;
          }

          // Cass especials: el geocoder pot retornar un nom diferent (ex: "Plaça de Santa Maria, 1, Ciutat Vella, 08003 Barcelona, Espanya")
          // Acceptar també si la població/província apareixen al formatted_address i algun component conté parcialment el title
          if (
            (poblacio && safeContains(formatted_addr, poblacio)) ||
            (provincia && safeContains(formatted_addr, provincia))
          ) {
            if (
              title &&
              r.address_components &&
              r.address_components.some((c) =>
                safeContains(c.long_name || "", title),
              )
            ) {
              window.open(
                `https://www.google.com/maps/search/${encodeURIComponent(formatted_addr)}?hl=ca&gl=ES`,
                "_blank",
              );
              return;
            }
          }

          // Si no acceptem aquest resultat, provar següent candidat
          tryNext();
        } else {
          // Error o no resultats → provar següent candidat
          tryNext();
        }
      });
    };

    tryNext();
  } else {
    // Si no hi ha l'API JS disponible: obrir la millor opció textual disponible o coords
    if (geocodeCandidates.length && geocodeCandidates[0]) {
      const url = `https://www.google.com/maps/search/${encodeURIComponent(geocodeCandidates[0])}?hl=ca&gl=ES`;
      window.open(url, "_blank");
    } else {
      openCoordsUrl();
    }
  }
};
window.getPointActivationColor = function (point) {
  return window.mapesUser.getPointActivationColor(point);
};
window.getMarkerIconColor = function (point) {
  return window.mapesUser.getMarkerIconColor(point);
};

/**
 * Alternar selector de monuments - VERSIÓ NETA
 */
window.toggleUserPoints = function (appId) {
  if (window.mapesUser && window.mapesUser.appId === appId) {
    window.mapesUser.togglePoints();
  }
};

/**
 * Filtrar monuments des del cercador
 */
window.filterUserPoints = function (appId, searchTerm) {
  if (window.mapesUser && window.mapesUser.appId === appId) {
    window.mapesUser.filterPoints(searchTerm);
  }
};

/**
 * Seleccionar monument des de la llista
 */
window.selectUserPoint = function (appId, pointId) {
  if (window.mapesUser && window.mapesUser.appId === appId) {
    window.mapesUser.selectPoint(pointId);
  }
};

/**
 * Tancar detalls del monument
 */
window.closeUserPointDetails = function (appId) {
  if (window.mapesUser && window.mapesUser.appId === appId) {
    window.mapesUser.closePointDetails();
  }
};
// AJAX amb jQuery (WordPress estàndard)
function submitFinalizeActivity(event) {
  event.preventDefault();

  const formData = new FormData(event.target);
  const email = formData.get("email");
  const activationCode = formData.get("activationcode");

  // Mostrar loading
  const submitBtn = event.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = "⏳ Validant...";
  submitBtn.disabled = true;

  // AJAX amb jQuery (WordPress estàndard)
  jQuery
    .post(window.mapesAjaxConfig.ajaxUrl, {
      action: "mapes_validate_activitat",
      email: email,
      activation_code: activationCode,
      nonce: window.mapesAjaxConfig.nonce,
    })
    .done(function (data) {
      const resultDiv = document.getElementById("finalize-result");
      const messageDiv = document.getElementById("finalize-message");

      if (data.success) {
        // Èxit - Missatge canviat per ADI
        resultDiv.style.display = "block";
        resultDiv.style.background = "#d4edda";
        resultDiv.style.borderColor = "#c3e6cb";
        resultDiv.style.color = "#155724";
        messageDiv.innerHTML = `
    <strong>✅ Activitat validada correctament!</strong><br>
    <small>Ara pots pujar el fitxer ADI...</small>
  `;

        // ⭐ CANVI CLAU: Obrir modal ADI en comptes de documentació directa
        setTimeout(() => {
          const activitatId = data.data.activitat.id;

          // Tancar modal de validació
          closeModal("modal-finalize-activity");

          // Obrir modal ADI (NOU)
          document.getElementById("modal-adi-validation").style.display =
            "flex";
          document.getElementById("adi-activitat-id").value = activitatId;

          console.log("✅ Modal ADI obert per activitat:", activitatId);
        }, 1500); // Reduït a 1.5s per UX més ràpida
      } else {
        // Error
        resultDiv.style.display = "block";
        resultDiv.style.background = "#f8d7da";
        resultDiv.style.borderColor = "#f5c6cb";
        resultDiv.style.color = "#721c24";
        messageDiv.innerHTML = `
                <strong>❌ Error:</strong> ${
                  data.data || "No s'ha pogut validar l'activitat."
                }
            `;
      }
    })
    .fail(function () {
      const resultDiv = document.getElementById("finalize-result");
      const messageDiv = document.getElementById("finalize-message");
      resultDiv.style.display = "block";
      resultDiv.style.background = "#f8d7da";
      resultDiv.style.borderColor = "#f5c6cb";
      resultDiv.style.color = "#721c24";
      messageDiv.innerHTML =
        "<strong>❌ Error de connexió.</strong> Torneu-ho a provar.";
    })
    .always(function () {
      // Restaurar botó
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    });
}

// ⭐ INICIALITZAR SELECTOR DE ZONES
document.addEventListener("DOMContentLoaded", function () {
  const initZoneSelector = () => {
    if (!window.mapesUser || !window.mapesUser.appId) {
      setTimeout(initZoneSelector, 100);
      return;
    }

    const appId = window.mapesUser.appId;
    const zoneSelect = document.getElementById("zone-select-" + appId);

    if (zoneSelect) {
      zoneSelect.addEventListener("change", function () {
        const selectedZone = this.value;
        console.log("🔄 Canvi de zona:", selectedZone);
        window.mapesUser.changeZone(selectedZone);
      });

      console.log("✅ Selector de zones inicialitzat");
    } else {
      console.warn("⚠️ Selector de zones no trobat al DOM");
    }
  };

  initZoneSelector();
});

// 🔥 FUNCIÓ NOVA: Actualitza visibilitat de rutes segons la zona
function updateRoutesListVisibility(appId) {
  const app = window.mapesUserApps && window.mapesUserApps[appId];
  if (!app) return;

  const routeItems = document.querySelectorAll(
    `#${appId} .mapes-route-item-user`,
  );

  routeItems.forEach((item) => {
    const onclickAttr = item.getAttribute("onclick");
    const routeIdMatch = onclickAttr.match(/selectUserRoute\([^,]+,\s*(\d+)\)/);

    if (routeIdMatch) {
      const routeId = parseInt(routeIdMatch[1]);
      const isInZone = app.routes.some((r) => parseInt(r.id) === routeId);
      item.style.display = isInZone ? "flex" : "none";
    }
  });
}
