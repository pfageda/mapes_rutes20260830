<?php
if (!defined('ABSPATH'))
    exit;

// Obtenir monuments de la ruta seleccionada
global $wpdb;
$db = new WP_Mapes_Database();
$route_points = $db->get_route_points($selected_route->id);

// ⭐ DEBUG TEMPORAL
error_log("🔍 ROUTE POINTS DEBUG:");
error_log("Route ID: " . $selected_route->id);
error_log("Route points count: " . count($route_points));
error_log("Route points data: " . print_r($route_points, true));
?>

<div class="mapes-activity-form-page">
    <div class="form-header">
        <h2>📋 Crear Nova Activitat</h2>
        <div class="selected-route-info">
            <strong>Ruta escollida:</strong>
            <span class="route-badge" style="background: <?php echo $selected_route->color; ?>">
                <?php echo $selected_route->code; ?> - <?php echo $selected_route->name; ?>
            </span>
        </div>
    </div>

    <form class="mapes-activity-form-full" onsubmit="submitActivityForm(event)">
        <input type="hidden" name="route_id" value="<?php echo $selected_route->id; ?>">

        <div class="form-section">
            <div class="form-grid">
                <div class="form-group">
                    <label>Indicatiu de l'activitat: *</label>
                    <input type="text" name="indicatiu" placeholder="Ex: EA4RCH/P, EA4RCH/1" required>
                    <small>Múltiples indicatius separats per comes</small>
                </div>

                <div class="form-group">
                    <label>Correu electrònic: *</label>
                    <input type="email" name="email" required>
                </div>

                <div class="form-group">
                    <label>Data de l'activitat: *</label>
                    <input type="date" name="data_activitat" required min="<?php echo date('Y-m-d'); ?>">
                    <small>La data no pot ser anterior a avui</small>
                </div>

                <div class="form-group">
                    <label>Horari de l'activitat:</label>
                    <select name="horari">
                        <option value="mati">Matí</option>
                        <option value="tarda">Tarda</option>
                        <option value="nit">Nit</option>
                        <option value="tot_dia">Tot el dia</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Modes d'operació: *</label>
                    <div class="checkbox-group">
                        <label><input type="checkbox" name="modes[]" value="SSB"> SSB</label>
                        <label><input type="checkbox" name="modes[]" value="CW"> CW</label>
                        <label><input type="checkbox" name="modes[]" value="Digitals"> Digitals</label>
                    </div>
                </div>
            </div>

            <!-- SELECTOR DE MONUMENT ÚNIC -->
            <div class="form-group full-width">
                <label>Monument per activar: *</label>
                <select name="selected_monument" id="monument-selector" required class="form-control">
                    <option value="">-- Seleccioneu un monument --</option>
                    <?php if (!empty($route_points)): ?>
                        <?php foreach ($route_points as $index => $point): ?>
                            <option value="<?php echo intval($point->id); ?>" data-order="<?php echo ($index + 1); ?>"
                                data-name="<?php echo esc_attr($point->title); ?>"
                                data-poblacio="<?php echo esc_attr($point->Poblacio ?? ''); ?>">

                                <?php echo esc_html($point->title); ?>
                                <?php if (!empty($point->Poblacio)): ?>
                                    (<?php echo esc_html($point->Poblacio); ?>)
                                <?php endif; ?>
                            </option>
                        <?php endforeach; ?>
                    <?php else: ?>
                        <option value="">No hi ha monuments disponibles per aquesta ruta</option>
                    <?php endif; ?>
                </select>
                <!-- CAMP DRMC AUTOCOMPLETAT -->
                <div class="form-group full-width">
                    <label>DRMC: *</label>
                    <input type="text" id="drmc-field" name="drmc" readonly required
                        placeholder="Seleccioneu primer un monument"
                        style="background-color: #f5f5f5; cursor: not-allowed;">
                    <small>S'autocompletarà segons el monument seleccionat (Format:
                        <?php echo $selected_route->code; ?>0X)</small>
                </div>

                <div id="availability-warning" class="warning-message" style="display: none;"></div>
            </div>
            <div class="form-group full-width">
                <label>Comentaris:</label>
                <textarea name="comentaris" rows="4" placeholder="Comentaris opcionals sobre l'activitat..."></textarea>
            </div>
        </div>

        <div class="form-actions">
            <button type="submit" class="mapes-btn primary large">📤 Crear Activitat</button>
            <a href="javascript:history.back()" class="mapes-btn secondary large">← Tornar a Rutes</a>
        </div>
    </form>
</div>

<script>
    function submitActivityForm(event) {
        event.preventDefault();

        // ✅ VALIDAR QUE S'HA SELECCIONAT UN MONUMENT
        const selectedMonument = event.target.querySelector('select[name="selected_monument"]');
        if (!selectedMonument.value) {
            alert('❌ Has de seleccionar un monument per activar');
            return;
        }

        // Validar data abans d'enviar
        const dataInput = event.target.querySelector('input[name="data_activitat"]');
        const dataSeleccionada = new Date(dataInput.value);
        const avui = new Date();
        avui.setHours(0, 0, 0, 0);

        if (dataSeleccionada < avui) {
            alert('❌ La data d\'activitat no pot ser anterior a avui');
            return;
        }

        // ✅ VALIDAR MODES D'OPERACIÓ
        const selectedModes = event.target.querySelectorAll('input[name="modes[]"]:checked');
        if (selectedModes.length === 0) {
            alert('❌ Has de seleccionar almenys un mode d\'operació');
            return;
        }

        const formData = new FormData(event.target);
        formData.append('action', 'mapes_create_activitat');
        formData.append('nonce', '<?php echo wp_create_nonce("mapes_nonce"); ?>');

        // ⭐ DEBUG: Mostrar dades enviades
        console.log('📤 DADES ENVIADES:');
        for (let pair of formData.entries()) {
            console.log(pair[0], pair[1]);
        }

        fetch('<?php echo admin_url("admin-ajax.php"); ?>', {
            method: 'POST',
            body: formData
        })
            .then(response => response.json())
            .then(data => {
                console.log('📥 RESPOSTA REBUDA:', data);

                if (data.success) {
                    alert(`✅ Activitat creada correctament!\nCodi d'activació: ${data.data.activation_code}\n\nReviseu el vostre correu electrònic per obtenir més detalls.`);
                    window.location.href = '/usuari-mapes/';
                } else {
                    alert('❌ Error: ' + data.data);
                }
            })
            .catch(error => {
                console.error('💥 ERROR DE CONNEXIÓ:', error);
                alert('Error de connexió: ' + error.message);
            });
    }

    document.addEventListener('DOMContentLoaded', function () {
        const monumentSelect = document.getElementById('monument-selector');
        const dataInput = document.querySelector('input[name="data_activitat"]');
        const horariSelect = document.querySelector('select[name="horari"]');
        const submitBtn = document.querySelector('button[type="submit"]');
        const drmcField = document.getElementById('drmc-field');
        const routeCode = '<?php echo esc_js($selected_route->code); ?>'; // Ex: EA-4

        console.log('DRMC field:', drmcField);
        console.log('Route code:', routeCode);


        // ⭐ DEBUG: Verificar elements
        console.log('🔍 ELEMENTS TROBATS:');
        console.log('Monument select:', monumentSelect);
        console.log('Data input:', dataInput);
        console.log('Horari select:', horariSelect);
        console.log('Submit button:', submitBtn);

        function checkAvailability() {
            console.log('🕐 VERIFICANT DISPONIBILITAT...');

            if (monumentSelect.value && dataInput.value && horariSelect.value) {
                console.log('✅ Tots els camps omplerts, fent petició AJAX...');

                const formData = new FormData();
                formData.append('action', 'mapes_check_availability');
                formData.append('nonce', '<?php echo wp_create_nonce('mapes_nonce'); ?>');
                formData.append('point_id', monumentSelect.value);
                formData.append('data', dataInput.value);
                formData.append('horari', horariSelect.value);

                fetch('<?php echo admin_url('admin-ajax.php'); ?>', {
                    method: 'POST',
                    body: formData
                })
                    .then(response => response.json())
                    .then(data => {
                        console.log('📥 RESPOSTA DISPONIBILITAT:', data);

                        const warningDiv = document.getElementById('availability-warning');

                        if (!data.success) {
                            // Mostrar advertència
                            warningDiv.innerHTML = '⚠️ ' + data.data;
                            warningDiv.style.display = 'block';
                            warningDiv.style.cssText = 'background: #ffebee; border: 1px solid #f44336; padding: 10px; margin: 10px 0; border-radius: 5px; color: #c62828; display: block;';

                            submitBtn.disabled = true;
                            submitBtn.style.opacity = '0.5';
                            console.log('❌ Monument ocupat - botó deshabilitat');
                        } else {
                            // Amagar advertència
                            warningDiv.style.display = 'none';
                            submitBtn.disabled = false;
                            submitBtn.style.opacity = '1';
                            console.log('✅ Monument disponible - botó habilitat');
                        }
                    })
                    .catch(error => {
                        console.error('💥 ERROR VERIFICANT DISPONIBILITAT:', error);
                    });
            } else {
                console.log('⚠️ Falten camps per omplir');
            }
        }

        // Afegir event listeners
        if (monumentSelect) {
            monumentSelect.addEventListener('change', function () {
                console.log('Monument seleccionat:', this.value);
                // 🎯 AUTOCOMPLETAR DRMC
                const selectedOption = this.options[this.selectedIndex];
                const order = selectedOption.getAttribute('data-order');

                if (this.value && order) {
                    const drmc = `${routeCode}0${order}`;
                    drmcField.value = drmc;
                    console.log('✅ DRMC generat:', drmc);
                } else {
                    drmcField.value = '';
                }
                checkAvailability();
            });
        }

        if (dataInput) {
            dataInput.addEventListener('change', function () {
                console.log('Data seleccionada:', this.value);
                checkAvailability();
            });
        }

        if (horariSelect) {
            horariSelect.addEventListener('change', function () {
                console.log('Horari seleccionat:', this.value);
                checkAvailability();
            });
        }
    });
</script>