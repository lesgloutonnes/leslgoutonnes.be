<?php
/**
 * Fonctions utilitaires partagées entre les endpoints API.
 */

declare(strict_types=1);

/**
 * Retourne le répertoire de stockage principal (et le crée si besoin).
 */
function getStorageBaseDir(): string
{
    $base = defined('STORAGE_BASE_PATH')
        ? STORAGE_BASE_PATH
        : dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'storage';

    if (!is_dir($base)) {
        mkdir($base, 0755, true);
    }

    return $base;
}

function getAppointmentsStorageDir(): string
{
    $dir = defined('APPOINTMENTS_STORAGE_PATH')
        ? APPOINTMENTS_STORAGE_PATH
        : getStorageBaseDir() . DIRECTORY_SEPARATOR . 'appointments';

    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }

    return $dir;
}

function getLogsStorageDir(): string
{
    $dir = defined('LOGS_STORAGE_PATH')
        ? LOGS_STORAGE_PATH
        : getStorageBaseDir() . DIRECTORY_SEPARATOR . 'logs';

    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }

    return $dir;
}

/**
 * Nettoie un champ texte (similaire à strip_tags + trim).
 */
function sanitizeText(?string $value): string
{
    if ($value === null) {
        return '';
    }

    $value = trim($value);
    // Supprimer les caractères de contrôle (sauf tabulations / sauts de ligne)
    $value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $value);
    return strip_tags($value);
}

/**
 * Nettoie une valeur destinée aux en-têtes email.
 */
function sanitizeHeaderValue(string $value): string
{
    $value = sanitizeText($value);
    return str_replace(["\r", "\n"], ' ', $value);
}

function sanitizeEmail(string $email): string
{
    $email = filter_var($email, FILTER_SANITIZE_EMAIL);
    if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return '';
    }

    return $email;
}

function sanitizeEmailSubject(string $subject): string
{
    $subject = trim((string)$subject);
    $subject = preg_replace('/[\r\n]+/', ' ', $subject);

    if ($subject === '') {
        return '(sans objet)';
    }

    return mb_substr($subject, 0, 255);
}

function formatEmailAddress(string $email, ?string $name = null): string
{
    $email = sanitizeEmail($email);
    if ($email === '') {
        return '';
    }

    if ($name === null || trim($name) === '') {
        return $email;
    }

    $encodedName = mb_encode_mimeheader(sanitizeHeaderValue($name), 'UTF-8', 'B', "\r\n");

    return sprintf('%s <%s>', $encodedName, $email);
}

/**
 * Vérifie qu'un champ honeypot est vide.
 */
function isHoneypotTripped(array $data, string $field = 'website'): bool
{
    return !empty(trim($data[$field] ?? ''));
}

/**
 * Vérifie si l'envoi a été trop rapide (bots).
 */
function isSubmissionTooFast(array $data, int $minDelaySeconds = 3): bool
{
    $start = isset($data['form_start']) ? (int)$data['form_start'] : 0;
    if ($start <= 0) {
        return false;
    }

    return (time() - $start) < $minDelaySeconds;
}

/**
 * Renvoie l'adresse IP du client.
 */
function getClientIp(): string
{
    $headers = [
        'HTTP_CF_CONNECTING_IP',
        'HTTP_X_FORWARDED_FOR',
        'HTTP_CLIENT_IP',
        'REMOTE_ADDR',
    ];

    foreach ($headers as $header) {
        if (!empty($_SERVER[$header])) {
            $ip = $_SERVER[$header];
            // X-Forwarded-For peut contenir plusieurs IP
            if (strpos($ip, ',') !== false) {
                $parts = explode(',', $ip);
                $ip = trim($parts[0]);
            }
            return $ip;
        }
    }

    return 'unknown';
}

/**
 * Limitation basique par adresse IP.
 * Retourne true si la limite est atteinte (il faut alors bloquer la requête).
 */
function isRateLimited(string $key, int $maxRequests, int $windowSeconds): bool
{
    $storageDir = getLogsStorageDir() . DIRECTORY_SEPARATOR . 'rate_limits';
    if (!is_dir($storageDir)) {
        mkdir($storageDir, 0755, true);
    }

    $file = $storageDir . '/' . md5($key) . '.json';
    $now = time();
    $requests = [];

    if (file_exists($file)) {
        $raw = file_get_contents($file);
        if ($raw !== false) {
            $decoded = json_decode($raw, true);
            if (is_array($decoded)) {
                $requests = $decoded;
            }
        }
    }

    // Ne garder que les requêtes dans la fenêtre temporelle
    $requests = array_filter(
        $requests,
        static fn($timestamp) => is_int($timestamp) && ($timestamp >= ($now - $windowSeconds))
    );

    if (count($requests) >= $maxRequests) {
        // Réécrire le fichier avec les timestamps nettoyés
        file_put_contents($file, json_encode(array_values($requests), JSON_PRETTY_PRINT));
        return true;
    }

    $requests[] = $now;
    file_put_contents($file, json_encode(array_values($requests), JSON_PRETTY_PRINT));
    return false;
}

/**
 * Valide rapidement une date (format Y-m-d).
 */
function isValidDate(string $date): bool
{
    $dt = DateTime::createFromFormat('Y-m-d', $date);
    return $dt !== false && $dt->format('Y-m-d') === $date;
}

/**
 * Valide rapidement un créneau HH:MM.
 */
function isValidTime(string $time): bool
{
    $dt = DateTime::createFromFormat('H:i', $time);
    return $dt !== false && $dt->format('H:i') === $time;
}

function isValidAppointmentId(string $id): bool
{
    return (bool)preg_match('/^RDV-\d{8}-[a-f0-9]{6}$/i', $id);
}

function getAppointmentFilePath(string $id): string
{
    if (!isValidAppointmentId($id)) {
        throw new InvalidArgumentException('Identifiant de rendez-vous invalide');
    }

    $filename = $id . '.json';
    $primaryDir = getAppointmentsStorageDir();
    $primaryPath = $primaryDir . DIRECTORY_SEPARATOR . $filename;

    if (file_exists($primaryPath)) {
        return $primaryPath;
    }

    // Fallback legacy emplacement (ancienne arborescence publique)
    $legacyDir = __DIR__ . '/../json/appointments';
    $legacyPath = $legacyDir . '/' . $filename;

    if (file_exists($legacyPath)) {
        if (!is_dir($primaryDir)) {
            mkdir($primaryDir, 0755, true);
        }

        // Tenter de migrer le fichier legacy vers le stockage sécurisé
        if (!file_exists($primaryPath) && @rename($legacyPath, $primaryPath)) {
            return $primaryPath;
        }

        // Si la migration échoue, continuer à utiliser le fichier legacy
        return $legacyPath;
    }

    // Par défaut, retourner le chemin sécurisé (sera créé lors de l'enregistrement)
    return $primaryPath;
}

function loadAppointment(string $id): ?array
{
    try {
        $path = getAppointmentFilePath($id);
    } catch (InvalidArgumentException $e) {
        return null;
    }

    if (!file_exists($path)) {
        return null;
    }

    $raw = file_get_contents($path);
    if ($raw === false) {
        return null;
    }

    $data = json_decode($raw, true);
    return is_array($data) ? $data : null;
}

function saveAppointment(array $appointment): bool
{
    if (!isset($appointment['id']) || !isValidAppointmentId((string)$appointment['id'])) {
        throw new InvalidArgumentException('Identifiant de rendez-vous manquant ou invalide');
    }

    $path = getAppointmentsStorageDir() . DIRECTORY_SEPARATOR . $appointment['id'] . '.json';
    $dir = dirname($path);
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }

    return (bool)file_put_contents(
        $path,
        json_encode($appointment, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
    );
}

function appendLog(string $filename, string $message): void
{
    $logDir = getLogsStorageDir();
    $path = $logDir . DIRECTORY_SEPARATOR . $filename;
    file_put_contents($path, $message, FILE_APPEND | LOCK_EX);
}

function configureMailTransport(): void
{
    if (defined('MAIL_SMTP_HOST') && MAIL_SMTP_HOST) {
        ini_set('SMTP', MAIL_SMTP_HOST);
        if (defined('MAIL_SMTP_PORT') && MAIL_SMTP_PORT) {
            ini_set('smtp_port', (string)MAIL_SMTP_PORT);
        }
    }
}

/**
 * Envoi d'email transactionnel avec validation stricte des entêtes.
 *
 * @param array{
 *   to: string|array,
 *   subject: string,
 *   body: string,
 *   from_email?: string,
 *   from_name?: string,
 *   reply_to_email?: string,
 *   reply_to_name?: string,
 *   cc?: string|array,
 *   bcc?: string|array,
 *   headers?: array
 * } $params
 */
function sendEmail(array $params): bool
{
    $recipients = $params['to'] ?? [];
    $recipients = is_array($recipients) ? $recipients : [$recipients];
    $recipients = array_filter(array_map('sanitizeEmail', $recipients));

    if (empty($recipients)) {
        return false;
    }

    $subject = sanitizeEmailSubject($params['subject'] ?? '');
    $body = $params['body'] ?? '';

    $fromEmail = sanitizeEmail($params['from_email'] ?? (defined('MAIL_FROM_EMAIL') ? MAIL_FROM_EMAIL : ''));
    $fromName = $params['from_name'] ?? (defined('MAIL_FROM_NAME') ? MAIL_FROM_NAME : '');

    $replyToEmail = sanitizeEmail($params['reply_to_email'] ?? (defined('MAIL_REPLY_TO_EMAIL') ? MAIL_REPLY_TO_EMAIL : $fromEmail));
    $replyToName = $params['reply_to_name'] ?? (defined('MAIL_REPLY_TO_NAME') ? MAIL_REPLY_TO_NAME : $fromName);

    $headers = [
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
    ];

    if ($fromEmail !== '') {
        $formattedFrom = formatEmailAddress($fromEmail, $fromName);
        if ($formattedFrom !== '') {
            $headers[] = 'From: ' . $formattedFrom;
            ini_set('sendmail_from', $fromEmail);
        }
    }

    if ($replyToEmail !== '') {
        $formattedReply = formatEmailAddress($replyToEmail, $replyToName);
        if ($formattedReply !== '') {
            $headers[] = 'Reply-To: ' . $formattedReply;
        }
    }

    $ccList = $params['cc'] ?? [];
    $ccList = is_array($ccList) ? $ccList : [$ccList];
    $ccList = array_filter(array_map('sanitizeEmail', $ccList));
    if (!empty($ccList)) {
        $headers[] = 'Cc: ' . implode(', ', array_map(fn($email) => formatEmailAddress($email, null), $ccList));
    }

    $bccList = $params['bcc'] ?? [];
    $bccList = is_array($bccList) ? $bccList : [$bccList];
    $bccList = array_filter(array_map('sanitizeEmail', $bccList));
    if (!empty($bccList)) {
        $headers[] = 'Bcc: ' . implode(', ', array_map(fn($email) => formatEmailAddress($email, null), $bccList));
    }

    if (!empty($params['headers']) && is_array($params['headers'])) {
        foreach ($params['headers'] as $headerLine) {
            $headers[] = sanitizeHeaderValue($headerLine);
        }
    }

    configureMailTransport();

    $headerString = implode("\r\n", $headers);
    $toField = implode(', ', $recipients);

    $sent = mail($toField, $subject, $body, $headerString);

    if (defined('MAIL_LOG_FILE') && MAIL_LOG_FILE) {
        $status = $sent ? 'OK' : 'ERREUR';
        $logMessage = sprintf(
            "[%s] %s | To: %s | Subject: %s%s",
            date('Y-m-d H:i:s'),
            $status,
            $toField,
            $subject,
            PHP_EOL
        );
        appendLog(MAIL_LOG_FILE, $logMessage);
    }

    return $sent;
}

