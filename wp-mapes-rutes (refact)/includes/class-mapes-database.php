<?php
/**
 * Gestió de base de dades per Mapes i Rutes
 */

if (!defined('ABSPATH')) {
    exit;
}

class WP_Mapes_Database
{
    private static $tables_created = false;

    public static function create_tables()
    {
        // Debug per saber que la funció s'executa
        error_log('Executant create_tables()');
        global $wpdb;
        $tables = $wpdb->get_results("SHOW TABLES LIKE '{$wpdb->prefix}mapes_%'");

        // Debug per veure les taules existents abans de crear de noves
        error_log("TAULES EXISTENTS: " . print_r($tables, true));

        global $wpdb;
        $charset_collate = $wpdb->get_charset_collate();

        // CREAR TAULA DE RUTES MANUALMENT (per evitar error dbDelta)
        $routes_table = $wpdb->prefix . 'mapes_routes';
        $table_exists_routes = $wpdb->get_var("SHOW TABLES LIKE '$routes_table'");

        if ($table_exists_routes != $routes_table) {
            $routes_sql = "CREATE TABLE $routes_table (
                id int(11) NOT NULL AUTO_INCREMENT,
                code varchar(50) NOT NULL,
                name varchar(255) NOT NULL,
                color varchar(7) DEFAULT '#000000',
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                UNIQUE KEY code_unique (code)
            ) $charset_collate";

            $result = $wpdb->query($routes_sql);
            if ($result === false) {
                error_log('ERROR CREANT TAULA ROUTES: ' . $wpdb->last_error);
            } else {
                error_log('TAULA ROUTES CREADA CORRECTAMENT');
            }
        } else {
            error_log('TAULA ROUTES JA EXISTEIX');
        }

        // Taula de monuments (funciona amb dbDelta)
        $points_table = $wpdb->prefix . 'mapes_points';
        $points_sql = "CREATE TABLE $points_table (
            id int(11) NOT NULL AUTO_INCREMENT,
            title varchar(255) NOT NULL,
            description text,
            lat decimal(10, 6) NOT NULL,
            lng decimal(10, 6) NOT NULL,
            DME int(11) NOT NULL,
            Poblacio varchar(280) NOT NULL,
            Provincia varchar(140) NOT NULL,
            Fitxa_Monument varchar(500) NOT NULL,
            Vegades_activat int(11) NOT NULL DEFAULT 0,
            Darrera_Activacio datetime NULL,
            Indicatiu_activacio varchar(300) NOT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY lat_lng (lat, lng),
            KEY DME (DME)
        ) $charset_collate;";

        // Taula de relació ruta-monuments (funciona amb dbDelta)
        $route_points_table = $wpdb->prefix . 'mapes_route_points';
        $route_points_sql = "CREATE TABLE $route_points_table (
            id int(11) NOT NULL AUTO_INCREMENT,
            route_id int(11) NOT NULL,
            point_id int(11) NOT NULL,
            order_num int(11) NOT NULL DEFAULT 1,
            weight decimal(5, 2) DEFAULT 1.00,
            PRIMARY KEY (id),
            KEY route_id (route_id),
            KEY point_id (point_id),
            KEY route_order (route_id, order_num)
        ) $charset_collate;";

        // Crear amb dbDelta (només monuments i relacions)
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($points_sql);
        dbDelta($route_points_sql);

        // CREAR TAULA D'ACTIVITATS MANUALMENT (dbDelta falla amb aquesta)
        $activitats_table = $wpdb->prefix . 'mapes_activitats';
        $table_exists = $wpdb->get_var("SHOW TABLES LIKE '$activitats_table'");

        if ($table_exists != $activitats_table) {
            $activitats_sql = "CREATE TABLE {$activitats_table} (
    id int(11) NOT NULL AUTO_INCREMENT,
    route_id int(11) NOT NULL,
    user_id int(11) DEFAULT NULL,
    activation_code varchar(10) NOT NULL,
    indicatiu varchar(300) NOT NULL,
    email varchar(255) NOT NULL,
    data_activitat date NOT NULL,
    drmc varchar(100) NOT NULL,
    modes_operacio text NOT NULL,
    horari varchar(20) NOT NULL DEFAULT 'mati',
    comentaris text DEFAULT NULL,
    status varchar(20) NOT NULL DEFAULT 'creada',
    fitxer_adi varchar(255) DEFAULT NULL,
    imatges text DEFAULT NULL,
    fitxer_pdf varchar(255) DEFAULT NULL,
    confirmed_at datetime DEFAULT NULL,
    confirmed_by int(11) DEFAULT NULL,
    rejected_at datetime DEFAULT NULL,
    rejected_by int(11) DEFAULT NULL,
    rejection_reason text DEFAULT NULL,
    deleted_at datetime DEFAULT NULL,
    deleted_by int(11) DEFAULT NULL,
    created_at datetime DEFAULT CURRENT_TIMESTAMP,
    updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY activation_code (activation_code),
    KEY route_id (route_id),
    KEY email_code (email, activation_code),
    KEY status_date (status, data_activitat),
    KEY user_id (user_id)
) {$charset_collate}";

            $result = $wpdb->query($activitats_sql);
            if ($result === false) {
                error_log('ERROR CREANT TAULA ACTIVITATS: ' . $wpdb->last_error);
                error_log('SQL EXECUTADA: ' . $activitats_sql);
            } else {
                error_log('TAULA ACTIVITATS CREADA CORRECTAMENT');
            }
        } else {
            // ⭐ AFEGIR AQUESTA PART TAMBÉ!
            error_log('TAULA ACTIVITATS JA EXISTEIX');
        }

        $activitat_points_table = $wpdb->prefix . 'mapes_activitat_points';
        $table_exists = $wpdb->get_var("SHOW TABLES LIKE '$activitat_points_table'");

        if ($table_exists != $activitat_points_table) {
            $activitat_points_sql = "CREATE TABLE $activitat_points_table (
        id int(11) NOT NULL AUTO_INCREMENT,
        activitat_id int(11) NOT NULL,
        point_id int(11) NOT NULL,
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY activitat_id (activitat_id),
        KEY point_id (point_id),
        UNIQUE KEY activitat_point (activitat_id, point_id)
    ) $charset_collate";

            $result = $wpdb->query($activitat_points_sql);

            if ($result === false) {
                error_log('ERROR CREANT TAULA ACTIVITAT_POINTS: ' . $wpdb->last_error);
                error_log('SQL EXECUTADA: ' . $activitat_points_sql);
            } else {
                error_log('TAULA ACTIVITAT_POINTS CREADA CORRECTAMENT');
            }
        } else {
            error_log('TAULA ACTIVITAT_POINTS JA EXISTEIX');
        }

        // AFEGIR AQUESTES NOVES SECCIONS AQUÍ:

        // Abans de crear la taula activacions, NO la crearem automàticament: la gestió es centralitza
        // Si existeix la taula antiga (mapes_activacions) la tractarem posteriorment (veure remove_orphan_activacions_if_empty)

        // CREAR TAULA DE DOCUMENTS D'ACTIVACIONS
        $documents_table = $wpdb->prefix . 'mapes_activitat_documents';
        $table_exists = $wpdb->get_var("SHOW TABLES LIKE '$documents_table'");

        if ($table_exists != $documents_table) {
            $documents_sql = "CREATE TABLE $documents_table (
            id int(11) NOT NULL AUTO_INCREMENT,
            activitat_id int(11) NOT NULL,
            file_name varchar(255) NOT NULL,
            file_path varchar(500) NOT NULL,
            file_url varchar(500) NOT NULL,
            file_type varchar(50) NOT NULL,
            file_size int(11) NOT NULL,
            uploaded_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY activitat_id (activitat_id)
        ) $charset_collate";

            $result = $wpdb->query($documents_sql);
            if ($result === false) {
                error_log('ERROR CREANT TAULA DOCUMENTS: ' . $wpdb->last_error);
            } else {
                error_log('TAULA DOCUMENTS CREADA CORRECTAMENT');
            }
        } else {
            error_log('TAULA DOCUMENTS JA EXISTEIX');
        }

        // ⭐ MIGRACIÓ DE DADES (si cal) - comprovar possibles taules orfes i columnes faltants
        self::ensure_table_columns();
        self::migrate_activitats_to_activacions();
        self::remove_orphan_activacions_if_empty();

        self::$tables_created = true;
    }

    /**
     * Assegura columnes essencials existeixen a taules clau. Idempotent.
     */
    public static function ensure_table_columns()
    {
        global $wpdb;
        $prefix = $wpdb->prefix;
        $charset_collate = $wpdb->get_charset_collate();

        $checks = array(
            $prefix . 'mapes_points' => array(
                'Poblacio' => "VARCHAR(280) NOT NULL DEFAULT 'No especificada'",
                'Provincia' => "VARCHAR(140) NOT NULL DEFAULT ''",
                'Fitxa_Monument' => "VARCHAR(500) NOT NULL DEFAULT ''",
                'Vegades_activat' => "INT(11) NOT NULL DEFAULT 0",
                'Darrera_Activacio' => "DATETIME NULL",
                'Indicatiu_activacio' => "VARCHAR(300) NOT NULL DEFAULT ''"
            ),
            $prefix . 'mapes_activitats' => array(
                'fitxer_adi' => "VARCHAR(255) DEFAULT NULL",
                'imatges' => "TEXT DEFAULT NULL",
                'fitxer_pdf' => "VARCHAR(255) DEFAULT NULL"
            )
        );

        foreach ($checks as $table => $columns) {
            $exists = $wpdb->get_var("SHOW TABLES LIKE '{$table}'");
            if (!$exists) {
                error_log("ensure_table_columns: taula {$table} no existeix, saltant.");
                continue;
            }
            $existing_cols = $wpdb->get_col("DESCRIBE `{$table}`", 0);
            foreach ($columns as $col => $def) {
                if (!in_array($col, $existing_cols, true)) {
                    $sql = "ALTER TABLE `{$table}` ADD COLUMN `{$col}` {$def}";
                    $res = $wpdb->query($sql);
                    if ($res === false) {
                        error_log("Mapes: ERROR afegint columna {$col} a {$table}: " . $wpdb->last_error);
                    } else {
                        error_log("Mapes: Columna {$col} afegida a {$table}.");
                    }
                }
            }
        }
    }

    /**
     * Si existeix una taula "mapes_activacions" orfe i està buida, l'eliminem.
     * Si té dades, només loguem i no toquem res per evitar pèrdua.
     */
    private static function remove_orphan_activacions_if_empty()
    {
        global $wpdb;
        $activacions_table = $wpdb->prefix . 'mapes_activacions';

        $exists = $wpdb->get_var("SHOW TABLES LIKE '{$activacions_table}'");
        if (!$exists) {
            error_log("Mapes: No existeix {$activacions_table} (res a esborrar).");
            return;
        }

        $count = $wpdb->get_var("SELECT COUNT(*) FROM `{$activacions_table}`");
        if ($count === null) {
            error_log("Mapes: Error comptant files de {$activacions_table}: " . $wpdb->last_error);
            return;
        }

        if (intval($count) === 0) {
            $res = $wpdb->query("DROP TABLE `{$activacions_table}`");
            if ($res === false) {
                error_log("Mapes: Error esborrant {$activacions_table}: " . $wpdb->last_error);
            } else {
                error_log("Mapes: Taula {$activacions_table} buida eliminada correctament.");
            }
            return;
        }

        error_log("Mapes: Taula {$activacions_table} existeix i té {$count} files; no s'elimina automàticament. Revisa manualment si cal fusionar dades.");
    }

    /**
     * Migració buida (placeholder) - es manté per compatibilitat.
     */
    private static function migrate_activitats_to_activacions()
    {
        // Aquesta funció es manté per compatibilitat amb versions anteriors.
        // Ara la logística de migració específic es fa manualment o amb funcions dedicades si cal.
        error_log('MIGRACIÓ: Funció migrate_activitats_to_activacions() cridada (placeholder)');
    }

    // FUNCIÓ MODIFICADA: get_points sense dependencies de routes
    public static function get_points($limit = null)
    {
        global $wpdb;
        $points_table = $wpdb->prefix . 'mapes_points';
        $route_points_table = $wpdb->prefix . 'mapes_route_points';
        $routes_table = $wpdb->prefix . 'mapes_routes';

        $sql = "SELECT p.*, GROUP_CONCAT(r.code ORDER BY r.code SEPARATOR ', ') as route_codes
            FROM $points_table p
            LEFT JOIN $route_points_table rp ON p.id = rp.point_id
            LEFT JOIN $routes_table r ON rp.route_id = r.id
            GROUP BY p.id
            ORDER BY p.created_at DESC";

        if ($limit) {
            $sql .= $wpdb->prepare(" LIMIT %d", $limit);
        }

        $points = $wpdb->get_results($sql);

        // Afegir camp calculat
        foreach ($points as $point) {
            $point->pertany_ruta = !empty($point->route_codes) ? $point->route_codes : 'Sense ruta';
        }

        // ⚡ DEBUG MANUAL - AFEGIR ACTIVATION_STATUS DIRECTAMENT AQUÍ
        error_log("🔍 ADDING activation_status MANUAL...");
        foreach ($points as $point) {
            $vegades_activat = intval($point->Vegades_activat ?? 0);

            if ($vegades_activat === 0) {
                $point->activation_status = 'never_activated';
            } else {
                $point->activation_status = 'confirmed';
            }

            error_log("🎨 Monument '{$point->title}': Vegades={$vegades_activat}, Status={$point->activation_status}");
        }

        return $points;
    }

    // RESTA DEL FITXER SENSE CANVIS FUNCIONALS
    // (Es conserven la majoria de funcions existents: get_point, insert_point, update_point, delete_point, routes, activitats, etc.)

