/**
 * Mapes Points - Gestió de monuments
 */
class MapesPoints {
  constructor() {
    // Variables editMaps i editMarkers eliminades - ja no es necessiten
  }

  selectPoint(pointId) {
    console.log("Seleccionar monument:", pointId);
    const point = window.mapesCore.points.find((p) => p.id == pointId);
    if (!point) return;

    // AFEGIR: Ocultar panell d'edició si està obert
    const appId = window.mapesCore.currentAppId;
    const editPanel = document.getElementById(`edit-panel-${appId}`);
    if (editPanel && editPanel.style.display === "block") {
      editPanel.style.display = "none";
    }

    // Netejar markers existents
    window.mapesCore.clearMarkers();

    // Crear marker arrossegable
    const marker = new google.maps.Marker({
      position: { lat: parseFloat(point.lat), lng: parseFloat(point.lng) },
      map: window.mapesCore.map,
      title: point.title,
      draggable: true,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: window.getPointActivationColor
          ? window.getPointActivationColor(point)
          : "#FF0000",
        fillOpacity: 0.9,
        strokeColor: "#FFFFFF",
        strokeWeight: 3,
        scale: 12,
      },
    });

    // Event listener per quan es mou el marcador
    marker.addListener("dragend", () => {
      const newPos = marker.getPosition();
      const newLat = newPos.lat().toFixed(6);
      const newLng = newPos.lng().toFixed(6);

      // Actualitzar coordenades automàticament
      this.updatePointCoordinates(pointId, newLat, newLng);
    });

    // Centrar mapa en el monument
    window.mapesCore.map.setCenter({
      lat: parseFloat(point.lat),
      lng: parseFloat(point.lng),
    });
    window.mapesCore.map.setZoom(15);
  }

  updatePointCoordinates(pointId, lat, lng) {
    const point = window.mapesCore.points.find((p) => p.id == pointId);
    if (!point) {
      console.error("Monument no trobat per actualitzar coordenades");
      window.mapesUI.showAlert("Error: Monument no trobat");
      return;
    }

    const data = {
      id: pointId,
      title: point.title || "",
      description: point.description || "",
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      // CAMPS OBLIGATORIS PELS VALIDACIONS DEL SERVIDOR
      dme: parseInt(point.DME) || 0, // ⭐ CONVERTIR A NUMBER
      poblacio: (point.poblacio || "No especificada").trim(),
      provincia: point.provincia || "Barcelona",
      fitxa_monument: point.fitxa_monument || "",
      vegades_activat: parseInt(point.vegades_activat) || 0, // ⭐ CONVERTIR A NUMBER
      indicatiu_activacio: point.indicatiu_activacio || "",
    };

    if (point.darrera_activacio) {
      data.darrera_activacio = point.darrera_activacio;
    }

    console.log("Dades enviades per drag:", data);

    window.mapesCore
      .sendAjaxRequest("mapes_edit_point", data)
      .then(() => {
        console.log(`✅ Coordenades actualitzades via drag: ${lat}, ${lng}`);

        // ⭐ AFEGIR RECARREGA DE PÀGINA (com fa submitInlineEdit)
        setTimeout(() => {
          location.reload();
        }, 1500); // Donar temps per veure la notificació

        // MOSTRAR NOTIFICACIÓ D'ÈXIT
        const notification = document.createElement("div");
        notification.innerHTML = `✅ Coordenades actualitzades: ${lat}, ${lng}<br><small>Recarregant pàgina...</small>`;
        notification.style.cssText =
          "position:fixed; top:20px; right:20px; background:#00a32a; color:white; padding:10px 15px; border-radius:4px; z-index:9999; font-size:13px; text-align:center;";
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
      })
      .catch((error) => {
        console.error("Error actualitzant coordenades:", error);
        window.mapesUI.showAlert("Error actualitzant coordenades: " + error);
      });
  }

  editPoint(pointId) {
    console.log("Editar monument inline:", pointId);

    const point = window.mapesCore.points.find((p) => p.id == pointId);
    if (!point) {
      window.mapesUI.showAlert("Monument no trobat");
      return;
    }

    // Primer, centrar el monument al mapa
    this.selectPoint(pointId);

    // Mostrar panell d'edició
    const appId = window.mapesCore.currentAppId;
    const editPanel = document.getElementById(`edit-panel-${appId}`);
    const editContent = document.getElementById(`edit-content-${appId}`);
    const editTitle = document.getElementById(`edit-title-${appId}`);

    if (!editPanel || !editContent) return;

    // Actualitzar nom
    editTitle.textContent = `Editar: ${point.title}`;

    // Abans d'assignar editContent.innerHTML, calcula valors normalitzats:
    const poblacioValue =
      (point.poblacio || point.poblacio || "").trim() || "No especificada";
    const provinciaValue =
      (point.provincia || point.Provincia || "").trim() || "";

    // Ara crea l'HTML utilitzant aquestes variables
    editContent.innerHTML = `
<form class="mapes-edit-form" onsubmit="mapesPoints.submitInlineEdit('${pointId}', event)">
  <div class="mapes-edit-form-left">
    <div class="mapes-form-group">
      <label>Nom *</label>
      <input type="text" name="title" value="${(point.title || "").replace(/"/g, "&quot;")}" required>
    </div>

    <div class="mapes-form-group">
      <label>Descripció</label>
      <textarea name="description" rows="3" placeholder="Descripció del monument">${point.description || ""}</textarea>
    </div>

    <div class="mapes-form-group">
      <label>DME</label>
      <input type="number" name="dme" value="${point.DME || 0}">
    </div>

    <div class="mapes-coordinates-grid">
      <div>
        <label>Població *</label>
        <input type="text" name="poblacio" value="${poblacioValue.replace(/"/g, "&quot;")}" required>
      </div>
      <div>
        <label>Província *</label>
        <select name="provincia" required>
          <option value="Barcelona" ${provinciaValue === "Barcelona" ? "selected" : ""}>Barcelona</option>
          <option value="Girona" ${provinciaValue === "Girona" ? "selected" : ""}>Girona</option>
          <option value="Lleida" ${provinciaValue === "Lleida" ? "selected" : ""}>Lleida</option>
          <option value="Tarragona" ${provinciaValue === "Tarragona" ? "selected" : ""}>Tarragona</option>
          <option value="New York" ${provinciaValue === "New York" ? "selected" : ""}>New York</option>
        </select>
      </div>
    </div>

    <div class="mapes-form-group">
      <label>Indicatiu Activació</label>
      <input type="text" name="indicatiu_activacio" value="${point.indicatiu_activacio || ""}">
    </div>
  </div>

  <div class="mapes-edit-form-right">
    <div class="mapes-form-group">
      <label>Coordenades</label>
      <div class="mapes-coordinates-grid">
        <div>
          <label>Latitud</label>
          <input type="number" step="any" name="lat" value="${parseFloat(point.lat || 0).toFixed(6)}">
        </div>
        <div>
          <label>Longitud</label>
          <input type="number" step="any" name="lng" value="${parseFloat(point.lng || 0).toFixed(6)}">
        </div>
      </div>
    </div>

    <div class="mapes-form-group">
      <label>Fitxa Monument</label>
      <input type="url" name="fitxa_monument" value="${point.fitxa_monument || ""}">
    </div>

    <div class="mapes-coordinates-grid">
      <div>
        <label>Vegades Activat</label>
        <input type="number" name="vegades_activat" value="${point.vegades_activat || 0}" min="0">
      </div>
      <div>
        <label>Darrera Activació</label>
        <input type="datetime-local" name="darrera_activacio" value="${point.darrera_activacio ? point.darrera_activacio.replace(" ", "T") : ""}">
      </div>
    </div>
  </div>

  <div class="form-actions">
    <button type="submit" class="btn btn-primary">Actualitzar</button>
    <button type="button" class="btn btn-secondary" onclick="cancelEdit('${appId}')">Cancel·lar</button>
  </div>
</form>
`;

    // Mostrar el panell
    editPanel.style.display = "block";

    // Scroll suau cap al panell d'edició
    setTimeout(() => {
      editPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 100);
  }

  saveEditPoint(appId) {
    console.log("=== GUARDANT EDICIÓ Monument ===");

    const editPanel = document.getElementById(`edit-panel-${appId}`);
    const pointId = editPanel.dataset.editingPointId;

    if (!pointId) {
      window.mapesUI.showAlert("No hi ha cap monument seleccionat per editar");
      return;
    }

    // Obtenir dades del formulari
    const title = document.getElementById(`edit-point-title-${appId}`).value;
    const description = document.getElementById(
      `edit-point-description-${appId}`,
    ).value;
    const lat = document.getElementById(`edit-point-lat-${appId}`).value;
    const lng = document.getElementById(`edit-point-lng-${appId}`).value;

    // Validar dades
    if (!title.trim()) {
      window.mapesUI.showAlert("El nom és obligatori");
      return;
    }

    if (!lat || !lng) {
      window.mapesUI.showAlert("Les coordenades són obligatòries");
      return;
    }

    // Enviar dades
    const data = {
      id: pointId,
      title: title.trim(),
      description: description.trim(),
      lat: parseFloat(lat),
      lng: parseFloat(lng),
    };

    window.mapesCore
      .sendAjaxRequest("mapes_edit_point", data)
      .then(() => {
        window.mapesUI.showAlert("Monument actualitzat correctament");
        editPanel.style.display = "none";
        location.reload();
      })
      .catch((error) => {
        console.error("Error actualitzant monument:", error);
        window.mapesUI.showAlert("Error actualitzant monument: " + error);
      });
  }

  cancelEditPoint(appId) {
    const editPanel = document.getElementById(`edit-panel-${appId}`);
    if (editPanel) {
      editPanel.style.display = "none";
    }
  }

  deletePoint(pointId) {
    if (!confirm("Estàs segur que vols eliminar aquest monument?")) {
      return;
    }

    console.log("=== ELIMINANT Monument ===", pointId);

    window.mapesCore
      .sendAjaxRequest("mapes_delete_point", { id: pointId })
      .then(() => {
        window.mapesUI.showAlert("Monument eliminat correctament");
        location.reload();
      })
      .catch((error) => {
        console.error("Error eliminant monument:", error);
        window.mapesUI.showAlert("Error eliminant monument: " + error);
      });
  }

  // FUNCIÓ PRINCIPAL MODIFICADA
  submitAddPoint(appId, event) {
    console.log("=== AFEGINT NOU Monument ===");
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // Validar nom
    if (!data.title || data.title.trim() === "") {
      window.mapesUI.showAlert("El nom és obligatori");
      return;
    }

    // Detectar mode (coordenades vs ubicació)
    const coordButton = document.querySelector(
      `#modal-add-point-${appId} .mapes-input-toggle button:nth-child(2)`,
    );
    const isCoordinatesMode =
      coordButton && coordButton.classList.contains("active");

    if (isCoordinatesMode) {
      this.processCoordinatesMode(data, appId);
    } else {
      this.processLocationMode(data, appId);
    }
  }

  submitInlineEdit(pointId, event) {
    console.log("=== SUBMIT INLINE EDIT Monument ===", pointId);
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // Validar dades obligatòries
    if (!data.title || data.title.trim() === "") {
      window.mapesUI.showAlert("El nom és obligatori");
      return;
    }

    if (!data.lat || !data.lng) {
      window.mapesUI.showAlert("Les coordenades són obligatòries");
      return;
    }

    // Preparar dades completes per enviar
    const pointData = {
      id: pointId,
      title: data.title.trim(),
      description: data.description ? data.description.trim() : "",
      lat: parseFloat(data.lat),
      lng: parseFloat(data.lng),
      dme: data.dme ? parseInt(data.dme) : 0,
      poblacio: data.poblacio ? data.poblacio.trim() : "No especificada",
      provincia: data.provincia,
      fitxa_monument: data.fitxa_monument ? data.fitxa_monument.trim() : "",
      vegades_activat: data.vegades_activat
        ? parseInt(data.vegades_activat)
        : 0,
      indicatiu_activacio: data.indicatiu_activacio
        ? data.indicatiu_activacio.trim()
        : "",
    };

    if (data.darrera_activacio && data.darrera_activacio.trim()) {
      pointData.darrera_activacio = data.darrera_activacio.trim();
    }

    console.log("Dades a enviar:", pointData);

    // Enviar petició AJAX
    window.mapesCore
      .sendAjaxRequest("mapes_edit_point", pointData)
      .then(() => {
        window.mapesUI.showAlert("Monument actualitzat correctament!");

        // Ocultar panell d'edició
        const appId = window.mapesCore.currentAppId;
        const editPanel = document.getElementById(`edit-panel-${appId}`);
        if (editPanel) {
          editPanel.style.display = "none";
        }

        // Recarregar la pàgina per mostrar els canvis
        location.reload();
      })
      .catch((error) => {
        console.error("Error actualitzant monument:", error);
        window.mapesUI.showAlert("Error actualitzant monument: " + error);
      });
  }

  // --- AFEGIR A LA CLASSE MapesPoints: reverseGeocodeLatLng (enganxa just abans de sendPointData) ---
  reverseGeocodeLatLng(lat, lng, placeName = "") {
    return new Promise((resolve, reject) => {
      if (
        !window.google ||
        !window.google.maps ||
        !window.google.maps.Geocoder
      ) {
        return reject(new Error("Google Maps API no disponible"));
      }

      const geocoder = new google.maps.Geocoder();
      const latlng = { lat: parseFloat(lat), lng: parseFloat(lng) };

      geocoder.geocode({ location: latlng }, (results, status) => {
        if (status !== "OK" || !results || results.length === 0) {
          return reject(
            new Error(
              "No s'han obtingut resultats de geocodificació: " + status,
            ),
          );
        }

        // Preferim un resultat que coincideixi amb el nom donat per l'usuari (si existeix)
        let best = results[0];
        if (placeName) {
          const q = placeName.toLowerCase();
          for (const r of results) {
            if (
              (r.formatted_address || "").toLowerCase().includes(q) ||
              (r.address_components || []).some((ac) =>
                (ac.long_name || "").toLowerCase().includes(q),
              )
            ) {
              best = r;
              break;
            }
          }
        }

        const comps = best.address_components || [];
        const getComp = (types) => {
          for (const t of types) {
            const found = comps.find(
              (c) => c.types && c.types.indexOf(t) !== -1,
            );
            if (found) return found.long_name;
          }
          return null;
        };

        // Heurístiques per a població i província
        const poblacio =
          getComp([
            "locality",
            "postal_town",
            "sublocality",
            "neighborhood",
            "administrative_area_level_3",
          ]) || "";
        let provincia =
          getComp([
            "administrative_area_level_2",
            "administrative_area_level_1",
          ]) || "";
        provincia = (provincia || "").replace(/^provincia\s+de\s+/i, "").trim();

        resolve({
          poblacio,
          provincia,
          formatted_address: best.formatted_address || "",
        });
      });
    });
  }
  // --- FI reverseGeocodeLatLng ---

  // NOVA FUNCIÓ: MODE COORDENADES
  /* --- SUBSTITUEIX L'ANTIGA processCoordinatesMode AMB AQUESTA VERSIÓ (enganyar tota la funció existent) --- */
  processCoordinatesMode(data, appId) {
    console.log("=== MODE COORDENADES ===");

    // Validació de coordenades
    if (
      data.lat === undefined ||
      data.lng === undefined ||
      data.lat === "" ||
      data.lng === ""
    ) {
      window.mapesUI.showAlert(
        "Les coordenades són obligatòries en mode coordenades",
      );
      return;
    }

    const lat = parseFloat(data.lat);
    const lng = parseFloat(data.lng);

    // Validar format numèric
    if (isNaN(lat) || isNaN(lng)) {
      window.mapesUI.showAlert("Coordenades no vàlides");
      return;
    }

    // Validar rang de coordenades
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      window.mapesUI.showAlert("Coordenades fora del rang vàlid");
      return;
    }

    // Assignar coordenades validades (numèriques)
    data.lat = lat;
    data.lng = lng;

    // Si hi ha Google Maps disponible, fem reverse geocoding per omplir poblacio/provincia
    const placeName = (data.title || "").trim();

    if (typeof google !== "undefined" && google.maps && google.maps.Geocoder) {
      // Opcional: mostrar un missatge curt a l'usuari
      // window.mapesUI.showAlert('Obtenint població/província des de Google Maps...');

      this.reverseGeocodeLatLng(lat, lng, placeName)
        .then(({ poblacio, provincia, formatted_address }) => {
          if (poblacio) data.poblacio = poblacio;
          if (provincia) data.provincia = provincia;
          // Opcional per debug: data._gm_formatted_address = formatted_address;
          console.log("Reverse geocode OK:", {
            lat,
            lng,
            poblacio,
            provincia,
            formatted_address,
          });

          // Enviar dades del monument amb la població/província obtingudes
          this.sendPointData(data, appId);
        })
        .catch((err) => {
          console.warn("Reverse geocode fallida:", err);
          // fallback: enviar igualment (el servidor posarà valors per defecte)
          this.sendPointData(data, appId);
        });
    } else {
      // Si no hi ha Google disponible, fallback d'abans
      console.warn(
        "⚠️ Google Maps no disponible, enviant dades sense reverse geocode",
      );
      this.sendPointData(data, appId);
    }
  }
  /* --- FI processCoordinatesMode --- */

  // NOVA FUNCIÓ: MODE UBICACIÓ
  processLocationMode(data, appId) {
    console.log("=== MODE UBICACIÓ (STRICT: REQUEREIX NOM + POBLACIÓ) ===");

    const locationName = (data.title || "").trim();
    const poblacioInput = (data.poblacio || "").trim();

    // REGLA: l'usuari HA d'introduir AMB DOS camps: nom lloc i població
    if (!locationName || !poblacioInput) {
      window.mapesUI.showAlert(
        "Cal indicar tant l'Ubicació com la Població per crear el punt amb el mètode 'Nom lloc'.",
      );
      return;
    }

    // Determinar context segons provincia (igual que abans)
    let geocodeContext = "";
    if (data.provincia) {
      const provinciaLower = data.provincia.toLowerCase().trim();
      switch (provinciaLower) {
        case "new york":
        case "new_york":
          geocodeContext = ", New York, USA";
          break;
        case "tokyo":
          geocodeContext = ", Tokyo, Japan";
          break;
        case "barcelona":
        case "girona":
        case "lleida":
        case "tarragona":
          geocodeContext = ", Catalunya, Espanya";
          break;
        default:
          geocodeContext = ", Catalunya, Espanya";
      }
    } else {
      geocodeContext = ", Catalunya, Espanya";
    }

    // Construir adreça amb AMB DOS valors per a més precisió
    const fullAddress = locationName + ", " + poblacioInput + geocodeContext;
    console.log("🔍 Geocodificant (strict):", fullAddress);

    // Geocodificació amb Google Maps (OPCIÓ: REQUIRIM AMBDUES COINCIDÈNCIES)
    if (typeof google !== "undefined" && google.maps && google.maps.Geocoder) {
      const geocoder = new google.maps.Geocoder();

      geocoder.geocode({ address: fullAddress }, (results, status) => {
        console.log("📍 STATUS:", status);
        console.log("📍 RESULTS:", results);

        if (status === "OK" && results && results.length > 0) {
          const best = results[0];
          const location = best.geometry && best.geometry.location;
          if (!location) {
            window.mapesUI.showAlert(
              "No s'ha obtingut una geometria vàlida per aquesta adreça. Revisa la ubicació.",
            );
            return;
          }

          // Extreure components
          const comps = best.address_components || [];
          const getComp = (types) => {
            for (const t of types) {
              const found = comps.find(
                (c) => c.types && c.types.indexOf(t) !== -1,
              );
              if (found) return found.long_name;
            }
            return null;
          };
          const poblacioFromGM =
            getComp([
              "locality",
              "postal_town",
              "sublocality",
              "neighborhood",
              "administrative_area_level_3",
            ]) || "";
          const provinciaFromGM = (
            getComp([
              "administrative_area_level_2",
              "administrative_area_level_1",
            ]) || ""
          )
            .replace(/^provincia\s+de\s+/i, "")
            .trim();

          // COMPROVACIÓ ESTRICTA: AMB TOTES DUES introduïdes, AMBDUES han de coincidir
          let matchName = false;
          let matchPoblacio = false;

          // Comprovar nom lloc: ha d'aparèixer al formatted_address o en algun component
          const qName = locationName.toLowerCase();
          const formatted = (best.formatted_address || "").toLowerCase();
          if (formatted.includes(qName)) {
            matchName = true;
          } else {
            for (const c of comps) {
              if (
                (c.long_name || "").toLowerCase().includes(qName) ||
                (c.short_name || "").toLowerCase().includes(qName)
              ) {
                matchName = true;
                break;
              }
            }
          }

          // Comprovar població: exactitud parcial acceptable (contains)
          if (
            poblacioFromGM &&
            poblacioFromGM.toLowerCase().includes(poblacioInput.toLowerCase())
          ) {
            matchPoblacio = true;
          } else {
            matchPoblacio = false;
          }

          // DECISIÓ: si qualsevol de les dues NO coincideix, NO crear
          if (!(matchName && matchPoblacio)) {
            window.mapesUI.showAlert(
              "No s'ha pogut verificar tant el nom del lloc com la població amb Google Maps. Revisa els valors introduïts o prova el mode Coordenades.",
            );
            console.warn("Geocoding strict fail:", {
              locationName,
              poblacioInput,
              formatted_address: best.formatted_address,
              poblacioFromGM,
              provinciaFromGM,
              matchName,
              matchPoblacio,
            });
            return;
          }

          // Tot OK: assignar lat/lng i dades de Google i enviar
          data.lat = location.lat();
          data.lng = location.lng();
          data.poblacio = poblacioFromGM || data.poblacio;
          data.provincia = provinciaFromGM || data.provincia;

          console.log(
            `✅ Geocodificat i validat (strict): ${fullAddress} -> ${data.lat}, ${data.lng} (${data.poblacio}, ${data.provincia})`,
          );
          this.sendPointData(data, appId);
        } else {
          console.warn(
            "⚠️ Geocodificació fallida. Status:",
            status,
            "Results:",
            results,
          );
          window.mapesUI.showAlert(
            "No s'ha pogut trobar aquesta ubicació (" +
              (status || "error") +
              "). Revisa el nom del lloc i la població o utilitza el mode Coordenades.",
          );
          return;
        }
      });
    } else {
      window.mapesUI.showAlert(
        "Google Maps no està disponible. Utilitza el mode Coordenades.",
      );
      return;
    }
  }

  // Inicia el preview de coordenades: attach input listeners i mostra poblacio/provincia
  initCoordinatesPreview(appId) {
    try {
      const modal = document.getElementById(`modal-add-point-${appId}`);
      if (!modal) return;

      const latInput = modal.querySelector('input[name="lat"]');
      const lngInput = modal.querySelector('input[name="lng"]');
      const locationNameInput = modal.querySelector(
        'input[name="location_name"]',
      );
      const preview = modal.querySelector(`#coords-preview-${appId}`);
      const poblacioSpan = preview
        ? preview.querySelector(".preview-poblacio")
        : null;
      const provinciaSpan = preview
        ? preview.querySelector(".preview-provincia")
        : null;

      if (!latInput || !lngInput || !preview || !poblacioSpan || !provinciaSpan)
        return;

      let debounceTimer = null;
      const debounce = (fn, ms = 600) => {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(fn, ms);
      };

      const doPreview = () => {
        const latRaw = latInput.value ? latInput.value.trim() : "";
        const lngRaw = lngInput.value ? lngInput.value.trim() : "";

        if (!latRaw || !lngRaw) {
          preview.style.display = "none";
          return;
        }

        const lat = parseFloat(latRaw);
        const lng = parseFloat(lngRaw);
        if (isNaN(lat) || isNaN(lng)) {
          preview.style.display = "none";
          return;
        }

        const placeName = locationNameInput
          ? locationNameInput.value.trim()
          : "";

        // Cridar reverseGeocodeLatLng (ja existent a la classe)
        this.reverseGeocodeLatLng(lat, lng, placeName)
          .then(({ poblacio, provincia }) => {
            poblacioSpan.textContent = poblacio || "—";
            provinciaSpan.textContent = provincia || "—";
            preview.style.display = "block";
          })
          .catch((err) => {
            // Mostrem fallback amb guions i el preview visible per indicar que no s'ha obtingut més info
            poblacioSpan.textContent = "—";
            provinciaSpan.textContent = "—";
            preview.style.display = "block";
            console.warn("Reverse geocode preview fallida:", err);
          });
      };

      // Afegir listeners (input) amb debounce
      latInput.addEventListener("input", () => debounce(doPreview));
      lngInput.addEventListener("input", () => debounce(doPreview));
      if (locationNameInput)
        locationNameInput.addEventListener("input", () => debounce(doPreview));

      // També actualitzar si hi ha valors ja posats quan s'obre (llegeix-los ara)
      debounce(doPreview, 250);
    } catch (e) {
      console.error("initCoordinatesPreview error:", e);
    }
  }

  // NOVA FUNCIÓ: ENVIAR DADES DEL Monument
  sendPointData(data, appId) {
    console.log("=== ENVIANT DADES DEL Monument ===", data);

    // Només enviar els 4 camps essencials
    const pointData = {
      title: data.title.trim(),
      description: (data.description || "").trim(),
      lat: parseFloat(data.lat),
      lng: parseFloat(data.lng),
      poblacio: (data.poblacio || "").trim(),
      provincia: data.provincia || "",
    };

    //DEBUG PER VEURE QUÈ S'ENVIA
    console.log("Dades enviades al servidor:", pointData);

    window.mapesCore
      .sendAjaxRequest("mapes_add_point", pointData)
      .then(() => {
        window.mapesUI.showAlert(
          `Monument "${pointData.title}" afegit correctament!`,
        );
        closeModal(`modal-add-point-${appId}`);
        location.reload();
      })
      .catch((error) => {
        console.error("Error afegint monument:", error);
        window.mapesUI.showAlert("Error afegint monument: " + error);
      });
  }
}

// Instanciar globalment
window.mapesPoints = new MapesPoints();

// FUNCIONS GLOBALS per cridar des del HTML
function selectPoint(pointId) {
  window.mapesPoints.selectPoint(pointId);
}

function editPoint(pointId) {
  window.mapesPoints.editPoint(pointId);
}

function deletePoint(pointId) {
  window.mapesPoints.deletePoint(pointId);
}

function submitAddPoint(appId, event) {
  window.mapesPoints.submitAddPoint(appId, event);
}
function submitInlineEdit(pointId, event) {
  window.mapesPoints.submitInlineEdit(pointId, event);
}

function saveEditPoint(appId) {
  window.mapesPoints.saveEditPoint(appId);
}

function cancelEditPoint(appId) {
  window.mapesPoints.cancelEditPoint(appId);
}
