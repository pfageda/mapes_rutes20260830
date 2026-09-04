/**
 * Gestió d'Activacions per Administradors
 */
class MapesActivations {
  constructor() {
    this.appId = null;
  }

  setAppData(appId) {
    this.appId = appId;
    console.log("Activations manager initialized:", appId);
  }

  showActivationDetails(activationId) {
    console.log("🔍 Obrint detalls per ID:", activationId);

    // Crear modal amb z-index molt alt
    const modal = document.createElement("div");
    modal.className = "mapes-modal-backdrop";
    modal.style.cssText = `
        position: fixed !important; 
        top: 0 !important; 
        left: 0 !important; 
        width: 100% !important; 
        height: 100% !important; 
        background: rgba(0,0,0,0.8) !important; 
        z-index: 999999 !important; 
        display: flex !important; 
        align-items: center !important; 
        justify-content: center !important;
        overflow-y: auto !important;
    `;

    // Modal content amb estils inline més forts
    const modalContent = document.createElement("div");
    modalContent.className = "mapes-modal-content";
    modalContent.style.cssText = `
        background: #ffffff !important; 
        border-radius: 10px !important; 
        max-width: 700px !important; 
        width: 90% !important; 
        max-height: 90vh !important; 
        overflow-y: auto !important; 
        box-shadow: 0 10px 30px rgba(0,0,0,0.5) !important;
        margin: 20px !important;
        position: relative !important;
        z-index: 1000000 !important;
    `;

    modalContent.innerHTML = `
        <div style="
            padding: 20px !important; 
            border-bottom: 1px solid #e0e0e0 !important; 
            display: flex !important; 
            justify-content: space-between !important; 
            align-items: center !important;
            background: #f8f9fa !important; 
            border-radius: 10px 10px 0 0 !important;
            position: sticky !important;
            top: 0 !important;
            z-index: 1000001 !important;
        ">
            <h3 style="margin: 0 !important; color: #333 !important; font-size: 18px !important;">
                📋 Detalls de l'Activació #${activationId}
            </h3>
            <button class="modal-close-btn" style="
                background: #dc3545 !important; 
                color: white !important; 
                border: none !important; 
                width: 35px !important; 
                height: 35px !important; 
                border-radius: 50% !important; 
                cursor: pointer !important; 
                font-size: 18px !important; 
                font-weight: bold !important;
                display: flex !important;
                align-items: center !important; 
                justify-content: center !important;
                z-index: 1000002 !important;
            ">✕</button>
        </div>
        <div class="modal-body" style="
            padding: 25px !important; 
            background: white !important;
            min-height: 200px !important;
        " id="modal-body-${activationId}">
            <div style="
                text-align: center !important; 
                padding: 50px 20px !important; 
                color: #666 !important;
            ">
                <div style="
                    font-size: 30px !important; 
                    margin-bottom: 15px !important;
                    animation: spin 1s linear infinite !important;
                ">🔄</div>
                <p style="font-size: 16px !important; margin: 0 !important;">
                    Carregant detalls de l'activació...
                </p>
            </div>
        </div>
    `;

    modal.appendChild(modalContent);

    // Event listeners més robustos
    const closeBtn = modalContent.querySelector(".modal-close-btn");
    closeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      modal.remove();
    });

    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });

    // Tecla ESC per tancar
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        modal.remove();
        document.removeEventListener("keydown", handleEsc);
      }
    };
    document.addEventListener("keydown", handleEsc);

    document.body.appendChild(modal);

    // Forçar scroll al top i bloquejar scroll del body
    document.body.style.overflow = "hidden";
    modal.scrollTop = 0;

    // Restaurar scroll quan es tanqui
    const originalRemove = modal.remove;
    modal.remove = function () {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleEsc);
      originalRemove.call(this);
    };

    // Carregar dades
    this.loadActivationDetails(activationId, `modal-body-${activationId}`);
  }

  loadActivationDetails(activationId, targetElementId) {
    console.log("📡 Carregant dades per:", activationId);

    this.sendAjaxRequest("get_activation_details", { id: activationId })
      .then((response) => {
        console.log("📨 Response rebuda:", response);

        const modalBody = document.getElementById(targetElementId);
        if (!modalBody) {
          console.error("❌ Modal body no trobat");
          return;
        }

        if (response.success && response.data) {
          // ⭐ COMBINAR TOTES LES DADES EN UN SOL OBJECTE
          const combinedData = {
            ...response.data.activation,
            activated_points: response.data.activated_points || [],
            documents: response.data.documents || [],
            stats: response.data.stats || {},
          };

          modalBody.innerHTML = this.formatActivationDetails(combinedData);
        } else {
          modalBody.innerHTML = `
                    <div style="padding: 20px; text-align: center; color: #dc3545;">
                        <div style="font-size: 48px; margin-bottom: 15px;">❌</div>
                        <h3>Error</h3>
                        <p>${
                          response.data || "No s'han pogut carregar els detalls"
                        }</p>
                    </div>`;
        }
      })
      .catch((error) => {
        console.error("❌ Error AJAX:", error);
        const modalBody = document.getElementById(targetElementId);
        if (modalBody) {
          modalBody.innerHTML = `
                    <div style="padding: 20px; text-align: center; color: #dc3545;">
                        <div style="font-size: 48px; margin-bottom: 15px;">⚠️</div>
                        <h3>Error de Connexió</h3>
                        <p>${error.message}</p>
                    </div>`;
        }
      });
  }

  formatActivationDetails(data) {
    console.log("📝 Formatejant dades:", data);

    if (!data) {
      return '<p style="color: #dc3545 !important;">❌ No hi ha dades disponibles</p>';
    }

    // ⭐ PROCESSAR PUNTS ACTIVATS
    let pointsHtml = "";
    if (data.activated_points && data.activated_points.length > 0) {
      pointsHtml = `
            <div style="
                background: #e8f4f8 !important; 
                border-radius: 8px !important; 
                padding: 20px !important;
                margin: 20px 0 !important;
                border: 1px solid #b3e5fc !important;
            ">
                <div style="
                    display: flex !important; 
                    justify-content: space-between !important; 
                    align-items: center !important; 
                    margin-bottom: 15px !important;
                ">
                    <h4 style="
                        margin: 0 !important; 
                        color: #1e81b0 !important; 
                        font-size: 16px !important;
                    "> Monuments Activats</h4>
                    <div style="
                        display: flex !important; 
                        gap: 15px !important; 
                        font-weight: bold !important; 
                        font-size: 14px !important;
                    ">
                        <span style="color: #1e81b0 !important;">
                            ${
                              data.stats?.points_activated ||
                              data.activated_points.length
                            }/${data.stats?.total_route_points || "?"} monuments
                            ${
                              data.stats?.completion_percentage
                                ? ` (${data.stats.completion_percentage}%)`
                                : ""
                            }
                        </span>
                        <span style="color: #28a745 !important;">
                            ${
                              data.stats
                                ? `${parseFloat(
                                    data.stats.weight_obtained || 0,
                                  ).toFixed(1)}/${parseFloat(
                                    data.stats.total_route_weight || 0,
                                  ).toFixed(1)} % pes`
                                : ""
                            }
                        </span>
                    </div>
                </div>
                
                <div style="
                    display: grid !important; 
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)) !important; 
                    gap: 12px !important;
                ">
                    ${data.activated_points
                      .map(
                        (point) => `
                        <div style="
                            background: white !important; 
                            border: 1px solid #dee2e6 !important; 
                            border-radius: 6px !important; 
                            padding: 12px !important;
                            box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
                        ">
                            <div style="
                                display: flex !important; 
                                justify-content: space-between !important; 
                                align-items: center !important; 
                                margin-bottom: 8px !important;
                            ">
                                <h5 style="
                                    margin: 0 !important; 
                                    color: #1e81b0 !important; 
                                    font-size: 14px !important;
                                    font-weight: bold !important;
                                ">📍 ${point.title || "Sense nom"}</h5>
                                ${
                                  point.weight && parseFloat(point.weight) > 0
                                    ? `
                                    <span style="
                                        background: #28a745 !important; 
                                        color: white !important; 
                                        padding: 2px 6px !important; 
                                        border-radius: 12px !important; 
                                        font-size: 11px !important; 
                                        font-weight: bold !important;
                                    ">${parseFloat(point.weight).toFixed(
                                      1,
                                    )} % pes</span>
                                `
                                    : ""
                                }
                            </div>
                            
                            ${
                              point.description
                                ? `
                                <p style="
                                    margin: 8px 0 !important; 
                                    color: #666 !important; 
                                    font-size: 12px !important; 
                                    line-height: 1.3 !important;
                                ">${point.description}</p>
                            `
                                : ""
                            }
                            
                            <div style="
                                display: flex !important; 
                                flex-wrap: wrap !important; 
                                gap: 8px !important; 
                                margin: 8px 0 !important; 
                                font-size: 11px !important; 
                                color: #666 !important;
                            ">
                                ${
                                  point.poblacio
                                    ? `
                                    <span style="
                                        background: #f0f0f0 !important; 
                                        padding: 2px 6px !important; 
                                        border-radius: 4px !important;
                                    ">🏘️ ${point.poblacio}</span>
                                `
                                    : ""
                                }
                                
                                <span style="
                                    background: #e3f2fd !important; 
                                    padding: 2px 6px !important; 
                                    border-radius: 4px !important;
                                ">⏰ ${new Date(
                                  point.activation_date || point.created_at,
                                ).toLocaleDateString("ca-ES")} ${new Date(
                                  point.activation_date || point.created_at,
                                ).toLocaleTimeString("ca-ES", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}</span>
                            </div>
                            
                            ${
                              point.lat && point.lng
                                ? `
                                <div style="
                                    font-family: monospace !important; 
                                    font-size: 10px !important; 
                                    color: #999 !important; 
                                    margin-top: 6px !important; 
                                    background: #f8f9fa !important; 
                                    padding: 4px 6px !important; 
                                    border-radius: 3px !important;
                                ">📍 ${parseFloat(point.lat).toFixed(
                                  6,
                                )}, ${parseFloat(point.lng).toFixed(6)}</div>
                            `
                                : ""
                            }
                        </div>
                    `,
                      )
                      .join("")}
                </div>
            </div>
        `;
    } else {
      pointsHtml = `
            <div style="
                background: #fff3e0 !important; 
                border-radius: 8px !important; 
                padding: 20px !important;
                margin: 20px 0 !important;
                text-align: center !important;
                border: 1px solid #ffcc80 !important;
            ">
                <div style="font-size: 24px !important; margin-bottom: 8px !important;">📍</div>
                <p style="margin: 0 !important; color: #666 !important; font-style: italic !important;">
                    No s'han activat monuments encara
                </p>
            </div>
        `;
    }

    // ⭐ PROCESSAR DOCUMENTS
    let documentsHtml = "";
    if (data.documents && data.documents.length > 0) {
      documentsHtml = `
            <div style="
                background: #f8f9fa !important; 
                border-radius: 8px !important; 
                padding: 20px !important;
                margin: 20px 0 !important;
                border: 1px solid #e0e0e0 !important;
            ">
                <h4 style="
                    margin: 0 0 15px 0 !important; 
                    color: #1e81b0 !important; 
                    font-size: 16px !important;
                ">📄 Documents Pujats</h4>
                
                <div style="
                    display: flex !important; 
                    flex-wrap: wrap !important; 
                    gap: 10px !important;
                ">
                    ${data.documents
                      .map(
                        (doc) => `
                        <a href="${doc.file_url}" target="_blank" style="
                            display: inline-flex !important; 
                            align-items: center !important; 
                            gap: 8px !important; 
                            padding: 8px 12px !important; 
                            background: #e9ecef !important; 
                            border-radius: 6px !important; 
                            text-decoration: none !important; 
                            color: #495057 !important; 
                            font-size: 13px !important;
                            transition: background-color 0.2s !important;
                        " onmouseover="this.style.backgroundColor='#dee2e6'" onmouseout="this.style.backgroundColor='#e9ecef'">
                            ${doc.type === "pdf" ? "📄" : "🖼️"} ${doc.file_name}
                        </a>
                    `,
                      )
                      .join("")}
                </div>
            </div>
        `;
    } else {
      documentsHtml = `
            <div style="
                background: #f8f9fa !important; 
                border-radius: 8px !important; 
                padding: 20px !important;
                margin: 20px 0 !important;
                text-align: center !important;
                border: 1px solid #e0e0e0 !important;
            ">
                <h4 style="
                    margin: 0 0 10px 0 !important; 
                    color: #1e81b0 !important; 
                    font-size: 16px !important;
                ">📄 Documents Pujats</h4>
                <p style="margin: 0 !important; color: #666 !important; font-style: italic !important;">
                    No s'han pujat documents
                </p>
            </div>
        `;
    }

    return `
        <div style="
            background: #f8f9fa !important; 
            border-radius: 8px !important; 
            padding: 25px !important;
            border: 1px solid #e0e0e0 !important;
        ">
            <h4 style="
                margin: 0 0 20px 0 !important; 
                color: #1e81b0 !important; 
                border-bottom: 2px solid #1e81b0 !important; 
                padding-bottom: 8px !important;
                font-size: 16px !important;
            ">📋 Informació de l'Activació</h4>
            
            <div style="display: grid !important; gap: 15px !important; font-size: 14px !important;">
                <div style="display: flex !important; justify-content: space-between !important; padding: 10px 0 !important; border-bottom: 1px solid #e0e0e0 !important;">
                    <strong style="color: #555 !important;">🔢 Codi:</strong>
                    <span style="font-family: monospace !important; background: #e3f2fd !important; padding: 4px 8px !important; border-radius: 4px !important; font-weight: bold !important;">${
                      data.activation_code || "N/A"
                    }</span>
                </div>
                
                <div style="display: flex !important; justify-content: space-between !important; padding: 10px 0 !important; border-bottom: 1px solid #e0e0e0 !important;">
                    <strong style="color: #555 !important;">📻 Indicatiu:</strong>
                    <span>${data.indicatiu || "N/A"}</span>
                </div>
                
                <div style="display: flex !important; justify-content: space-between !important; padding: 10px 0 !important; border-bottom: 1px solid #e0e0e0 !important;">
                    <strong style="color: #555 !important;">📧 Email:</strong>
                    <span><a href="mailto:${
                      data.email
                    }" style="color: #1e81b0 !important;">${
                      data.email || "N/A"
                    }</a></span>
                </div>
                
                <div style="display: flex !important; justify-content: space-between !important; padding: 10px 0 !important; border-bottom: 1px solid #e0e0e0 !important;">
                    <strong style="color: #555 !important;">📅 Data:</strong>
                    <span>${data.data_activitat || "N/A"}</span>
                </div>
                
                <div style="display: flex !important; justify-content: space-between !important; padding: 10px 0 !important; border-bottom: 1px solid #e0e0e0 !important;">
                    <strong style="color: #555 !important;">📡 Modes:</strong>
                    <span>${data.modes_operacio || "N/A"}</span>
                </div>
                
                <div style="display: flex !important; justify-content: space-between !important; padding: 10px 0 !important; border-bottom: 1px solid #e0e0e0 !important;">
                    <strong style="color: #555 !important;">⚡ Estat:</strong>
                    <span style="background: #e8f5e8 !important; color: #2e7d2e !important; padding: 4px 12px !important; border-radius: 15px !important; font-size: 0.9em !important;">${
                      data.status || "N/A"
                    }</span>
                </div>
                
                <div style="display: flex !important; justify-content: space-between !important; padding: 10px 0 !important;">
                    <strong style="color: #555 !important;">🕒 Creat:</strong>
                    <span style="font-size: 0.9em !important; color: #666 !important;">${
                      new Date(data.created_at).toLocaleString("ca-ES") || "N/A"
                    }</span>
                </div>
            </div>
            
            ${
              data.comentaris
                ? `
                <div style="background: #fff3e0 !important; border-left: 4px solid #ff9800 !important; padding: 15px !important; margin-top: 20px !important; border-radius: 0 8px 8px 0 !important;">
                    <h5 style="margin: 0 0 10px 0 !important; color: #e65100 !important;">💬 Comentaris</h5>
                    <p style="margin: 0 !important; font-style: italic !important;">${data.comentaris}</p>
                </div>
            `
                : ""
            }
        </div>
        
        ${pointsHtml}
        ${documentsHtml}
    `;
  }

  // Altres funcions existents...
  confirmActivation(activationId) {
    console.log("✅ Confirmant activació:", activationId);

    if (!confirm("Estàs segur que vols confirmar aquesta activació?")) {
      return;
    }

    // Mostrar indicador de càrrega
    const confirmBtn = document.querySelector(
      `button[onclick="confirmActivation(${activationId})"]`,
    );
    if (confirmBtn) {
      const originalText = confirmBtn.innerHTML;
      confirmBtn.innerHTML = "⏳ Confirmant...";
      confirmBtn.disabled = true;

      // Restaurar botó després d'un temps si hi ha error
      const restoreBtn = () => {
        confirmBtn.innerHTML = originalText;
        confirmBtn.disabled = false;
      };

      // Fer petició AJAX
      this.sendAjaxRequest("confirm_activation", { id: activationId })
        .then((response) => {
          console.log("📨 Response confirm:", response);

          if (response.success) {
            alert("✅ Activació confirmada correctament!");
            // Recarregar la pàgina per actualitzar les dades
            location.reload();
          } else {
            alert(
              "❌ Error confirmant l'activació: " +
                (response.data || "Error desconegut"),
            );
            restoreBtn();
          }
        })
        .catch((error) => {
          console.error("❌ Error AJAX confirm:", error);
          alert("❌ Error de connexió: " + error.message);
          restoreBtn();
        });
    }
  }

  rejectActivation(activationId) {
    console.log("❌ Rebutjant activació:", activationId);

    const reason = prompt("Motiu del rebuig (opcional):");
    if (reason === null) return; // Cancel·lat

    if (!confirm("Estàs segur que vols rebutjar aquesta activació?")) {
      return;
    }

    // Mostrar indicador de càrrega
    const rejectBtn = document.querySelector(
      `button[onclick="rejectActivation(${activationId})"]`,
    );
    if (rejectBtn) {
      const originalText = rejectBtn.innerHTML;
      rejectBtn.innerHTML = "⏳ Rebutjant...";
      rejectBtn.disabled = true;

      // Restaurar botó després d'un temps si hi ha error
      const restoreBtn = () => {
        rejectBtn.innerHTML = originalText;
        rejectBtn.disabled = false;
      };

      // Fer petició AJAX
      this.sendAjaxRequest("reject_activation", {
        id: activationId,
        reason: reason || "",
      })
        .then((response) => {
          console.log("📨 Response reject:", response);

          if (response.success) {
            alert("❌ Activació rebutjada correctament!");
            // Recarregar la pàgina per actualitzar les dades
            location.reload();
          } else {
            alert(
              "❌ Error rebutjant l'activació: " +
                (response.data || "Error desconegut"),
            );
            restoreBtn();
          }
        })
        .catch((error) => {
          console.error("❌ Error AJAX reject:", error);
          alert("❌ Error de connexió: " + error.message);
          restoreBtn();
        });
    }
  }

  deleteActivation(activationId) {
    console.log("🗑️ Esborrant activació:", activationId);

    if (
      !confirm(
        "Estàs segur que vols esborrar aquesta activació? Aquesta acció no es pot desfer.",
      )
    ) {
      return;
    }

    // Mostrar indicador de càrrega
    const deleteBtn = document.querySelector(
      `button[onclick="deleteActivation(${activationId})"]`,
    );
    if (deleteBtn) {
      const originalText = deleteBtn.innerHTML;
      deleteBtn.innerHTML = "⏳ Esborrant...";
      deleteBtn.disabled = true;

      // Restaurar botó després d'un temps si hi ha error
      const restoreBtn = () => {
        deleteBtn.innerHTML = originalText;
        deleteBtn.disabled = false;
      };

      // Fer petició AJAX
      this.sendAjaxRequest("delete_activation", { id: activationId })
        .then((response) => {
          console.log("📨 Response delete:", response);

          if (response.success) {
            alert("🗑️ Activació esborrada correctament!");
            // Recarregar la pàgina per actualitzar les dades
            location.reload();
          } else {
            alert(
              "❌ Error esborrant l'activació: " +
                (response.data || "Error desconegut"),
            );
            restoreBtn();
          }
        })
        .catch((error) => {
          console.error("❌ Error AJAX delete:", error);
          alert("❌ Error de connexió: " + error.message);
          restoreBtn();
        });
    }
  }

  editActivation(activationId) {
    console.log("✏️ Editant activació:", activationId);
    alert(
      "⚠️ Funció d'editar activació encara no implementada. ID: " +
        activationId,
    );
  }

  sendAjaxRequest(action, data) {
    const formData = new FormData();
    formData.append("action", "mapes_" + action);
    formData.append("nonce", mapesConfig.nonce);

    Object.keys(data).forEach((key) => {
      formData.append(key, data[key]);
    });

    return fetch(mapesConfig.ajaxUrl, {
      method: "POST",
      body: formData,
    }).then((response) => response.json());
  }
}

// Instància global
window.mapesActivations = new MapesActivations();

// ⭐ FUNCIONS GLOBALS CORRECTES
function confirmActivation(id) {
  window.mapesActivations.confirmActivation(id);
}
function rejectActivation(id) {
  window.mapesActivations.rejectActivation(id);
}
function showActivationDetails(id) {
  window.mapesActivations.showActivationDetails(id);
}
function viewActivationDetails(id) {
  window.mapesActivations.showActivationDetails(id);
}
function editActivation(id) {
  window.mapesActivations.editActivation(id);
}
function deleteActivation(id) {
  window.mapesActivations.deleteActivation(id);
}

console.log("✅ Funcions globals configurades correctament");
