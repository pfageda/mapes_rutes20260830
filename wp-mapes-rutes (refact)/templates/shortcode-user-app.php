<?php
/**
 * Template per l'aplicació d'usuari de mapes amb selector de zones
 * 
 * @package WP_Mapes_Rutes
 */

if (!defined('ABSPATH'))
    exit;
?>

<div id="<?php echo $app_id; ?>" class="mapes-user-app">
    <!-- Panell lateral -->
    <div class="mapes-sidebar">
        <!-- Selector de zones -->
        <div class="mapes-zone-selector">
            <label for="zone-select-<?php echo $app_id; ?>" class="zone-label">
                Zona d'activació
            </label>
            <select id="zone-select-<?php echo $app_id; ?>" class="zone-dropdown">
                <option value="catalunya" selected>Catalunya</option>
                <option value="new_york">New York, USA</option>
            </select>
        </div>
        <!-- Estadístiques -->
        <div class="mapes-stats">
            <div class="mapes-stat-card">
                <div class="mapes-stat-label">MONUMENTS</div>
                <div id="stat-points-<?php echo $app_id; ?>" class="mapes-stat-number">
                    <?php echo count($points); ?>
                </div>
            </div>
            <div class="mapes-stat-card">
                <div class="mapes-stat-label">RUTES</div>
                <div id="stat-routes-<?php echo $app_id; ?>" class="mapes-stat-number">
                    <?php echo count($routes); ?>
                </div>
            </div>
        </div>
        <!-- Panell d'accions -->
        <div id="route-actions-panel-<?php echo $app_id; ?>" class="mapes-route-actions-panel">
            <div class="route-actions-header">
                <h4>Accions d'Activitat</h4>
                <small>Selecciona una ruta per crear activitat</small>
            </div>
            <div class="route-actions-buttons">
                <!-- FINALITZAR PRIMER (sempre visible) -->
                <button id="finalitzar-activitat-btn-<?php echo $app_id; ?>" class="mapes-btn secondary action-btn"
                    onclick="finalitzarActivitat('<?php echo $app_id; ?>')">
                    ✅ Finalitzar Activitat
                </button>
                <!-- CREAR SEGON (només visible amb ruta seleccionada) -->
                <button id="crear-activitat-btn-<?php echo $app_id; ?>" class="mapes-btn primary action-btn"
                    onclick="crearActivitat('<?php echo $app_id; ?>')" style="display: none;">
                    📋 Crear Activitat
                </button>
            </div>
            <div id="selected-route-info"
                style="display: none; margin-top: 10px; padding: 8px; background: #e3f2fd; border-radius: 4px; font-size: 13px;">
                Ruta seleccionada: <span id="selected-route-name-<?php echo $app_id; ?>"></span>
            </div>
        </div>

        <!-- Llista de rutes -->
        <div class="mapes-routes-list-user">
            <div class="mapes-list-header">
                Rutes Disponibles (<span
                    id="routes-count-user-<?php echo $app_id; ?>"><?php echo count($routes); ?></span>)
            </div>
            <div class="mapes-list-content">
                <?php if (empty($routes)): ?>
                    <div class="mapes-empty">No hi ha rutes creades</div>
                <?php else: ?>
                    <?php foreach ($routes as $route): ?>
                        <div class="mapes-route-item-user"
                            onclick="selectUserRoute('<?php echo $app_id; ?>', <?php echo $route->id; ?>)">
                            <div class="mapes-route-info">
                                <div class="mapes-route-color" style="background: <?php echo esc_attr($route->color); ?>"></div>
                                <span class="mapes-route-code"><?php echo esc_html($route->code); ?></span>
                                <span class="mapes-route-name"> - <?php echo esc_html($route->name); ?></span>
                            </div>
                            <div class="mapes-route-count">
                                <?php echo count($route->points); ?> monuments
                            </div>
                        </div>
                    <?php endforeach; ?>
                <?php endif; ?>
            </div>
        </div>

        <!-- Selector de punts -->
        <div class="mapes-points-selector" style="margin-top: 20px;">
            <button class="mapes-points-toggle" onclick="toggleUserPoints('<?php echo $app_id; ?>')">
                Monuments Disponibles (<span id="points-count-user-<?php echo $app_id; ?>">0</span>)
            </button>

            <!-- Cercador de punts -->
            <div id="points-search-container-<?php echo $app_id; ?>" class="points-search-container"
                style="display: none; margin-top: 10px;">
                <input type="text" id="points-search-input-<?php echo $app_id; ?>" class="points-search-input"
                    placeholder="🔍 Buscar monument per nom o població..."
                    oninput="filterUserPoints('<?php echo $app_id; ?>', this.value)">
            </div>

            <!-- Llista de punts -->
            <div id="points-list-container-<?php echo $app_id; ?>" class="mapes-points-list" style="display: none;">
                <div id="points-list-<?php echo $app_id; ?>" class="points-list">
                    <!-- Els monuments es carregaran dinàmicament -->
                </div>
            </div>
        </div>
    </div> <!-- TANCAR SIDEBAR -->

    <!-- Àrea principal (mapa + detalls) -->
    <div class="mapes-main-area">
        <!-- Mapa -->
        <div class="mapes-map-container">
            <div id="map-<?php echo $app_id; ?>" class="mapes-map"
                style="height: <?php echo esc_attr($attrs['height']); ?>;">
                <div class="mapes-map-loading">Carregant mapa...</div>
            </div>
        </div>

        <!-- Llegenda de colors -->
        <?php
        $legend_path = plugin_dir_path(__FILE__) . '../templates/legend-colors.php';
        if (file_exists($legend_path)) {
            include $legend_path;
        }
        ?>

        <!-- DETALLS DE LA RUTA -->
        <div id="route-details-panel-<?php echo $app_id; ?>" class="mapes-route-details-panel" style="display: none;">
            <div class="route-details-header">
                <div class="route-details-title">
                    <div id="route-details-color-<?php echo $app_id; ?>" class="route-color-indicator"></div>
                    <h3 id="route-details-name-<?php echo $app_id; ?>">Detalls de la Ruta</h3>
                </div>
                <div class="route-details-stats">
                    <span id="route-details-points-count-<?php echo $app_id; ?>" class="route-stat">0 monuments</span>
                    <span id="route-details-total-weight-<?php echo $app_id; ?>" class="route-stat">Pes: 0</span>
                </div>
            </div>

            <div class="route-details-content">
                <div class="route-details-description">
                    <p id="route-details-desc-<?php echo $app_id; ?>">
                        Selecciona una ruta per veure els seus detalls.
                    </p>
                </div>

                <!-- Llista de monuments de la ruta -->
                <div class="route-points-list">
                    <h4>Monuments de la Ruta:</h4>
                    <div id="route-points-container-<?php echo $app_id; ?>" class="route-points-container">
                        <!-- Els monuments es carregaran dinàmicament aquí -->
                    </div>
                </div>
            </div>
        </div>

        <!-- DETALLS DEL PUNT -->
        <div id="point-details-panel-<?php echo $app_id; ?>" class="mapes-route-details-panel" style="display: none;">
            <div class="route-details-header">
                <div class="route-details-title">
                    <h3 id="point-details-name-<?php echo $app_id; ?>">Detalls del Monument</h3>
                </div>
                <div class="route-details-stats">
                    <span id="point-details-activity-<?php echo $app_id; ?>" class="route-stat">Activitat: --</span>
                    <span id="point-details-weight-<?php echo $app_id; ?>" class="route-stat">Pes: --</span>
                </div>
            </div>

            <div class="route-details-content">
                <!-- DESCRIPCIÓ DEL PUNT -->
                <div class="route-details-description">
                    <p id="point-details-desc-<?php echo $app_id; ?>">
                        Selecciona un monument per veure els seus detalls.
                    </p>
                </div>

                <!-- INFORMACIÓ DETALLADA DEL PUNT -->
                <div class="route-points-list">
                    <h4>Informació del Monument:</h4>
                    <div id="point-details-info-<?php echo $app_id; ?>" class="route-points-container">
                        <!-- La informació del monument es carregarà dinàmicament aquí -->
                    </div>
                </div>

                <!-- BOTÓ DE TANCAR A BAIX -->
                <div style="text-align: center; margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee;">
                    <button class="mapes-btn secondary" onclick="closeUserPointDetails('<?php echo $app_id; ?>')">
                        ✕ Tancar Detalls
                    </button>
                </div>
            </div>
        </div>
    </div> <!-- TANCAR MAIN-AREA -->
</div> <!-- TANCAR USER-APP -->

<?php
// Incloure modal de finalitzar activitat
$modal_path = plugin_dir_path(__FILE__) . './partials/modal-finalize-activity.php';
if (file_exists($modal_path)) {
    include $modal_path;
}

// Incloure modal ADI
$modal_adi_path = plugin_dir_path(__FILE__) . './partials/modal-adi-validation.php';
if (file_exists($modal_adi_path)) {
    include $modal_adi_path;
}
?>

<script>
    // Passar configuració PHP a JavaScript
    window.mapesAjaxConfig = {
        ajaxUrl: '<?php echo admin_url('admin-ajax.php'); ?>',
        nonce: '<?php echo wp_create_nonce('mapes_nonce'); ?>'
    };

    // Assegurar que les funcions modals estan disponibles
    if (typeof openModal === 'undefined') {
        console.error('openModal no està definit! mapes-ui.js no s\'ha carregat.');

        // Definir funcions modals com a fallback
        window.openModal = function (modalId) {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.style.display = 'flex';
            } else {
                console.error('Modal no trobat:', modalId);
            }
        };

        window.closeModal = function (modalId) {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.style.display = 'none';
            }
        };
    }
</script>