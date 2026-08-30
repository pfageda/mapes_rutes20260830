<?php if (!defined('ABSPATH'))
    exit; ?>

<!-- Modal Validació ADI -->
<div id="modal-adi-validation" class="mapes-modal"
    style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1001; justify-content: center; align-items: center;">
    <div class="mapes-modal-content"
        style="background: white; border-radius: 8px; padding: 0; max-width: 600px; width: 90%; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
        <div class="mapes-modal-header"
            style="padding: 20px; border-bottom: 1px solid #ddd; display: flex; justify-content: space-between; align-items: center;">
            <h3 style="margin: 0; color: #333;">📡 Validar Fitxer ADI</h3>
            <button onclick="closeAdiModal()"
                style="background: none; border: none; font-size: 24px; cursor: pointer; color: #666;">&times;</button>
        </div>

        <div style="padding: 20px;">
            <p style="margin-bottom: 20px; color: #666;">
                Pugeu el fitxer ADI amb els contactes de l'activitat per continuar amb la documentació.
            </p>

            <form id="adi-validation-form" enctype="multipart/form-data">
                <input type="hidden" name="activitat_id" id="adi-activitat-id">
                <input type="hidden" name="action" value="mapes_validate_adi_only">
                <?php wp_nonce_field('mapes_nonce', 'nonce'); ?>

                <div class="mapes-form-group" style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">📁 Fitxer ADI</label>
                    <input type="file" name="fitxer_adi" id="adi-file-input" accept=".adi" required
                        style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                    <small style="color: #666;">Format .adi, màxim 5MB</small>
                </div>

                <div class="mapes-form-actions" style="display: flex; gap: 10px; margin-top: 25px;">
                    <button type="button" onclick="closeAdiModal()" class="mapes-btn secondary"
                        style="flex: 1; padding: 12px; background: #f1f1f1; color: #333; border: none; border-radius: 4px; cursor: pointer;">
                        ← Tornar
                    </button>
                    <button type="submit" id="adi-submit-btn" class="mapes-btn primary"
                        style="flex: 1; padding: 12px; background: #007cba; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        📤 Validar i Continuar
                    </button>
                </div>
            </form>

            <div id="adi-result" style="display: none; margin-top: 20px; padding: 15px; border-radius: 6px;">
                <p id="adi-message" style="margin: 0;"></p>
            </div>
        </div>
    </div>
</div>

<script>
    // Funcions Modal ADI
    function closeAdiModal() {
        document.getElementById('modal-adi-validation').style.display = 'none';
        document.getElementById('adi-validation-form').reset();
        document.getElementById('adi-result').style.display = 'none';
    }

    // Submit ADI
    document.getElementById('adi-validation-form').addEventListener('submit', function (e) {
        e.preventDefault();

        const formData = new FormData(this);
        const submitBtn = document.getElementById('adi-submit-btn');

        submitBtn.disabled = true;
        submitBtn.textContent = '🔄 Validant...';

        fetch(window.mapesAjaxConfig.ajaxUrl, {
            method: 'POST',
            body: formData
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const resultDiv = document.getElementById('adi-result');
                    resultDiv.style.display = 'block';
                    resultDiv.style.background = '#d4edda';
                    resultDiv.style.color = '#155724';
                    document.getElementById('adi-message').textContent = '✅ ' + data.data.message;

                    setTimeout(() => {
                        closeAdiModal();
                        // Redirigir a documentació (MODIFICA SEGONS EL TEU SISTEMA)
                        const activitatId = data.data.activitat_id;
                        window.location.href = '/enviar-documentacio/?activitat=' + activitatId;
                    }, 1500);
                } else {
                    const resultDiv = document.getElementById('adi-result');
                    resultDiv.style.display = 'block';
                    resultDiv.style.background = '#fff3e0';
                    resultDiv.style.border = '1px solid #ffb74d';
                    resultDiv.style.borderLeft = '4px solid #f57c00';
                    resultDiv.style.padding = '15px';
                    resultDiv.style.borderRadius = '6px';

                    // RENDERITZAR HTML (no textContent)
                    document.getElementById('adi-message').innerHTML = data.data;

                    submitBtn.disabled = false;
                    submitBtn.textContent = '📤 Validar i Continuar';
                }

            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error de connexió');
                submitBtn.disabled = false;
                submitBtn.textContent = '📤 Validar i Continuar';
            });
    });
</script>