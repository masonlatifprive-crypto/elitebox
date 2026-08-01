<?php
/**
 * Elitebox — same-origin Cinemeta proxy (catalog + meta only).
 *
 * Why this exists: some visitor networks (slow links, rotating-IP mobile
 * carriers) cannot complete the direct browser → v3-cinemeta.strem.io
 * TLS/redirect chain inside the client timeout. This endpoint lets the
 * frontend retry the exact same request same-origin, where the server's
 * network path is stable. Ships inside dist/ via Vite's public/ copy and
 * runs on the stock Apache/PHP host — no framework, PHP 7.4 compatible.
 *
 * Security model:
 * - ONLY a strict whitelist of Cinemeta resource paths is proxied:
 *   (catalog|meta)/(movie|series|channel)/<id>.json
 *   The upstream host is hardcoded — arbitrary URLs can never be requested.
 * - Responses are validated (HTTP 200, JSON content type, decodable JSON)
 *   before being cached or served.
 * - File cache (20 min TTL) keyed by sha1(path); stale cache is served on
 *   upstream failure so a Cinemeta hiccup never blanks the catalog.
 * - Same-origin by design: no CORS headers are emitted.
 */

declare(strict_types=1);

/* ── configuration ─────────────────────────────────────────────────────── */
define('CINE_UPSTREAM', 'https://v3-cinemeta.strem.io/'); // hardcoded host
define('CINE_CACHE_DIR', __DIR__ . '/cache');
define('CINE_CACHE_TTL', 20 * 60); // 20 minutes
define('CINE_TIMEOUT', 8);         // seconds, whole transfer
define('CINE_CONNECT_TIMEOUT', 5); // seconds, connect phase

/* ── helpers ───────────────────────────────────────────────────────────── */

/** Emit a JSON response with the standard headers and stop. */
function cine_send($body, $cacheState, $statusCode = 200)
{
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: public, max-age=600');
    header('X-Cine-Cache: ' . $cacheState);
    echo $body;
    exit;
}

/* ── 1. strict path whitelist — nothing else is ever proxied ──────────── */
$path = isset($_GET['p']) ? (string) $_GET['p'] : '';
if (!preg_match('#^(catalog|meta)/(movie|series|channel)/[A-Za-z0-9_.-]+\.json$#', $path)) {
    cine_send('{"error":"invalid or disallowed path"}', 'none', 400);
}

/* ── 2. cache bootstrap ────────────────────────────────────────────────── */
if (!is_dir(CINE_CACHE_DIR)) {
    @mkdir(CINE_CACHE_DIR, 0775, true);
}
$cacheFile = CINE_CACHE_DIR . '/' . sha1($path) . '.json';

/* Fresh cache → serve instantly. */
if (is_file($cacheFile) && (time() - (int) @filemtime($cacheFile)) < CINE_CACHE_TTL) {
    $cached = @file_get_contents($cacheFile);
    if (is_string($cached) && $cached !== '') {
        cine_send($cached, 'hit');
    }
}

/* ── 3. upstream fetch (server-side cURL, redirects followed) ─────────── */
$fresh = false;
if (function_exists('curl_init')) {
    $ch = curl_init(CINE_UPSTREAM . $path);
    curl_setopt_array($ch, array(
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_MAXREDIRS      => 3,
        CURLOPT_TIMEOUT        => CINE_TIMEOUT,
        CURLOPT_CONNECTTIMEOUT => CINE_CONNECT_TIMEOUT,
        CURLOPT_HTTPHEADER     => array('Accept: application/json'),
        CURLOPT_USERAGENT      => 'EliteboxCineProxy/1.0 (same-origin catalog proxy)',
    ));
    $result = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    $ctype  = (string) curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
    curl_close($ch);

    /* Accept only a real 200 with a JSON-ish content type AND a body that
       actually decodes as JSON — never cache or relay garbage. */
    if (
        $status === 200 &&
        is_string($result) && $result !== '' &&
        stripos($ctype, 'json') !== false
    ) {
        json_decode($result);
        if (json_last_error() === JSON_ERROR_NONE) {
            $fresh = $result;
        }
    }
}

if ($fresh !== false) {
    @file_put_contents($cacheFile, $fresh, LOCK_EX);
    cine_send($fresh, 'miss');
}

/* ── 4. upstream failed → stale cache beats an error page ──────────────── */
if (is_file($cacheFile)) {
    $stale = @file_get_contents($cacheFile);
    if (is_string($stale) && $stale !== '') {
        cine_send($stale, 'stale');
    }
}

/* ── 5. nothing cached, upstream down — honest 502 ─────────────────────── */
cine_send('{"error":"upstream unavailable"}', 'none', 502);
