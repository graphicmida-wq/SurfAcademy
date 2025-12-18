# Integrazione WordPress SSO + WooCommerce

## Configurazione Completa

### 1. Chiave Segreta JWT

Usa questa chiave segreta nel tuo wp-config.php:

```php
define('SDL_JWT_SECRET', 'yJr1QhF6OIY+8iLaHjS/08FQGl+32yJg2ihp+AnoXKw=');
```

### 2. Plugin JWT Authentication

Assicurati che il plugin "JWT Authentication for WP REST API" sia installato e attivo.

Aggiungi al tuo `.htaccess`:
```
RewriteEngine on
RewriteCond %{HTTP:Authorization} ^(.*)
RewriteRule ^(.*) - [E=HTTP_AUTHORIZATION:%1]
```

Aggiungi al `wp-config.php`:
```php
define('JWT_AUTH_SECRET_KEY', 'yJr1QhF6OIY+8iLaHjS/08FQGl+32yJg2ihp+AnoXKw=');
define('JWT_AUTH_CORS_ENABLE', true);
```

### 3. Codice PHP per SSO (functions.php o plugin personalizzato)

```php
<?php
/**
 * Scuola di Longboard - SSO Integration
 * Aggiungi questo codice al functions.php del tuo tema o crea un plugin
 */

// Definisci la chiave segreta (deve corrispondere a quella su Replit)
if (!defined('SDL_JWT_SECRET')) {
    define('SDL_JWT_SECRET', 'yJr1QhF6OIY+8iLaHjS/08FQGl+32yJg2ihp+AnoXKw=');
}

// URL dell'app Replit (cambia con il tuo dominio di produzione)
if (!defined('SDL_APP_URL')) {
    define('SDL_APP_URL', 'https://app.scuoladilongboard.it');
}

/**
 * Genera un JWT token per l'utente corrente
 */
function sdl_generate_jwt_token($user_id = null) {
    if (!$user_id) {
        $user_id = get_current_user_id();
    }
    
    if (!$user_id) {
        return false;
    }
    
    $user = get_userdata($user_id);
    if (!$user) {
        return false;
    }
    
    $issued_at = time();
    $expiration = $issued_at + (60 * 60); // 1 ora
    
    $payload = array(
        'sub' => (string) $user_id,
        'email' => $user->user_email,
        'firstName' => $user->first_name,
        'lastName' => $user->last_name,
        'displayName' => $user->display_name,
        'avatar' => get_avatar_url($user_id, array('size' => 96)),
        'iat' => $issued_at,
        'exp' => $expiration
    );
    
    return sdl_jwt_encode($payload, SDL_JWT_SECRET);
}

/**
 * Codifica JWT (implementazione semplice senza librerie esterne)
 */
function sdl_jwt_encode($payload, $secret) {
    $header = array(
        'typ' => 'JWT',
        'alg' => 'HS256'
    );
    
    $segments = array();
    $segments[] = sdl_base64url_encode(json_encode($header));
    $segments[] = sdl_base64url_encode(json_encode($payload));
    
    $signing_input = implode('.', $segments);
    $signature = hash_hmac('sha256', $signing_input, $secret, true);
    $segments[] = sdl_base64url_encode($signature);
    
    return implode('.', $segments);
}

function sdl_base64url_encode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

/**
 * Shortcode per il pulsante "Vai ai miei corsi"
 * Uso: [sdl_courses_button text="Vai ai miei corsi"]
 */
function sdl_courses_button_shortcode($atts) {
    $atts = shortcode_atts(array(
        'text' => 'Vai ai miei corsi',
        'class' => 'button sdl-courses-button',
        'redirect' => '/dashboard'
    ), $atts);
    
    if (!is_user_logged_in()) {
        return sprintf(
            '<a href="%s" class="%s">Accedi per vedere i tuoi corsi</a>',
            wp_login_url(get_permalink()),
            esc_attr($atts['class'])
        );
    }
    
    $token = sdl_generate_jwt_token();
    if (!$token) {
        return '<p>Errore nella generazione del token</p>';
    }
    
    $url = SDL_APP_URL . '/sso?token=' . urlencode($token) . '&redirect=' . urlencode($atts['redirect']);
    
    return sprintf(
        '<a href="%s" class="%s">%s</a>',
        esc_url($url),
        esc_attr($atts['class']),
        esc_html($atts['text'])
    );
}
add_shortcode('sdl_courses_button', 'sdl_courses_button_shortcode');

/**
 * Aggiungi link "I miei corsi" al menu utente
 */
function sdl_add_my_courses_menu_item($items, $args) {
    if (is_user_logged_in() && $args->theme_location === 'primary') {
        $token = sdl_generate_jwt_token();
        if ($token) {
            $url = SDL_APP_URL . '/sso?token=' . urlencode($token);
            $items .= '<li class="menu-item"><a href="' . esc_url($url) . '">I miei corsi</a></li>';
        }
    }
    return $items;
}
add_filter('wp_nav_menu_items', 'sdl_add_my_courses_menu_item', 10, 2);

/**
 * Redirect automatico dopo login se c'è un parametro redirect_to_courses
 */
function sdl_login_redirect($redirect_to, $request, $user) {
    if (isset($_GET['redirect_to_courses']) && !is_wp_error($user)) {
        $token = sdl_generate_jwt_token($user->ID);
        if ($token) {
            return SDL_APP_URL . '/sso?token=' . urlencode($token);
        }
    }
    return $redirect_to;
}
add_filter('login_redirect', 'sdl_login_redirect', 10, 3);
```

### 4. Webhook WooCommerce

Vai in WooCommerce > Impostazioni > Avanzate > Webhook e crea un nuovo webhook:

- **Nome**: Sincronizzazione Corsi
- **Stato**: Attivo
- **Argomento**: Ordine completato
- **URL di consegna**: `https://app.scuoladilongboard.it/webhooks/woocommerce`
- **Segreto**: (genera una chiave segreta e salvala anche su Replit come WOOCOMMERCE_WEBHOOK_SECRET)
- **Versione API**: Versione 3

### 5. Mappatura Prodotti → Corsi

Nell'admin di Replit, vai su "Gestione Corsi" e per ogni corso collega l'ID del prodotto WooCommerce corrispondente.

Per trovare l'ID prodotto in WooCommerce:
1. Vai in Prodotti
2. Passa il mouse sul prodotto
3. L'ID appare nell'URL (es. post=123)

### 6. Test del Sistema

1. **Test SSO**: Accedi a WordPress, clicca "I miei corsi" - dovresti essere reindirizzato automaticamente alla dashboard
2. **Test Login diretto**: Vai su app.scuoladilongboard.it/login e inserisci le credenziali WordPress
3. **Test Webhook**: Completa un ordine di test e verifica che l'iscrizione venga creata

### Risoluzione Problemi

**Errore "Credenziali non valide"**:
- Verifica che il plugin JWT sia attivo
- Controlla che le chiavi in wp-config.php siano corrette

**SSO non funziona**:
- Verifica che SDL_JWT_SECRET sia identica su WordPress e Replit
- Controlla che l'URL SDL_APP_URL sia corretto

**Webhook non funziona**:
- Verifica che l'URL del webhook sia raggiungibile
- Controlla i log del webhook in WooCommerce
