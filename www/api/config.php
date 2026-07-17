<?php


declare(strict_types=1);

/**
 * Lecture d'une variable d'environnement avec fallback simple.
 */
function env(string $key, ?string $default = null): ?string
{
    if (array_key_exists($key, $_ENV)) {
        return $_ENV[$key];
    }

    $value = getenv($key);
    if ($value !== false) {
        return $value;
    }

    return $default;
}

$config = [
    'DB_HOST'              => env('LES_GLOUTONNES_DB_HOST'),
    'DB_NAME'              => env('LES_GLOUTONNES_DB_NAME'),
    'DB_USER'              => env('LES_GLOUTONNES_DB_USER'),
    'DB_PASS'              => env('LES_GLOUTONNES_DB_PASS'),
    'APPOINTMENTS_SECRET'  => env('LES_GLOUTONNES_APPOINTMENTS_SECRET'),
    'AUTO_EMAIL_ADMIN_KEY' => env('LES_GLOUTONNES_ADMIN_KEY'),
    'MAIL_FROM_EMAIL'      => env('LES_GLOUTONNES_FROM_EMAIL', 'noreply@lesgloutonnes.be'),
    'MAIL_FROM_NAME'       => env('LES_GLOUTONNES_FROM_NAME', 'Les Gloutonnes'),
    'MAIL_REPLY_TO_EMAIL'  => env('LES_GLOUTONNES_REPLY_TO_EMAIL', 'infos@lesgloutonnes.be'),
    'MAIL_REPLY_TO_NAME'   => env('LES_GLOUTONNES_REPLY_TO_NAME', 'Charles - Les Gloutonnes'),
    'MAIL_SMTP_HOST'       => env('LES_GLOUTONNES_SMTP_HOST'),
    'MAIL_SMTP_PORT'       => env('LES_GLOUTONNES_SMTP_PORT'),
    'MAIL_LOG_FILE'        => env('LES_GLOUTONNES_MAIL_LOG', 'mail.log'),
];

$localConfigPath = __DIR__ . '/config.local.php';
if (file_exists($localConfigPath)) {
    $localOverrides = require $localConfigPath;
    if (is_array($localOverrides)) {
        $config = array_merge($config, $localOverrides);
    }
}

$requiredKeys = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASS'];

foreach ($requiredKeys as $requiredKey) {
    if (empty($config[$requiredKey])) {
        throw new RuntimeException(
            sprintf(
                "Configuration manquante: %s. Définis la variable d'environnement LES_GLOUTONNES_%s ou ajoute-la dans config.local.php.",
                $requiredKey,
                $requiredKey
            )
        );
    }
}

foreach ($config as $key => $value) {
    if (!defined($key) && $value !== null) {
        define($key, $value);
    }
}

if (!defined('STORAGE_BASE_PATH')) {
    define(
        'STORAGE_BASE_PATH',
        dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'storage'
    );
}

if (!defined('APPOINTMENTS_STORAGE_PATH')) {
    define(
        'APPOINTMENTS_STORAGE_PATH',
        STORAGE_BASE_PATH . DIRECTORY_SEPARATOR . 'appointments'
    );
}

if (!defined('LOGS_STORAGE_PATH')) {
    define(
        'LOGS_STORAGE_PATH',
        STORAGE_BASE_PATH . DIRECTORY_SEPARATOR . 'logs'
    );
}

/**
 * Fournit une connexion PDO prête à l'emploi.
 */
function getDBConnection(): PDO
{
    static $pdo = null;

    if ($pdo instanceof PDO) {
        return $pdo;
    }

    try {
        $pdo = new PDO(
            sprintf(
                'mysql:host=%s;dbname=%s;charset=utf8mb4',
                DB_HOST,
                DB_NAME
            ),
            DB_USER,
            DB_PASS,
            [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]
        );
        return $pdo;
    } catch (PDOException $e) {
        error_log("Erreur connexion BDD: " . $e->getMessage());
        throw new RuntimeException("Erreur de connexion à la base de données");
    }
}

/**
 * Validation simple des emails.
 */
function isValidEmail(string $email): bool
{
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

/**
 * Réponse JSON standardisée pour les API publiques.
 */
function sendJsonResponse(bool $success, string $message, $data = null): void
{
    header('Content-Type: application/json');
    $response = [
        'success' => $success,
        'message' => $message,
    ];

    if ($data !== null) {
        $response['data'] = $data;
    }

    echo json_encode($response);
    exit;
}
