<?php
/**
 * process-inquiry.php - Traitement du formulaire de contact rapide (page d'accueil)
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/helpers.php';

$toEmail = "infos@lesgloutonnes.be";

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    sendJsonResponse(false, 'Méthode non autorisée');
}

if (isHoneypotTripped($_POST)) {
    http_response_code(400);
    sendJsonResponse(false, 'Requête non autorisée');
}

if (isSubmissionTooFast($_POST)) {
    http_response_code(429);
    sendJsonResponse(false, 'Merci de patienter quelques secondes avant d\'envoyer le formulaire.');
}

$ipAddress = getClientIp();
if (isRateLimited('inquiry_' . $ipAddress, 5, 1800)) { // 5 demandes / 30 min
    http_response_code(429);
    sendJsonResponse(false, 'Trop de demandes envoyées. Réessaie dans quelques minutes.');
}

$name = sanitizeText($_POST['name'] ?? '');
$email = filter_var(trim($_POST['email'] ?? ''), FILTER_SANITIZE_EMAIL);
$phone = sanitizeText($_POST['phone'] ?? '');
$plant = sanitizeText($_POST['plant'] ?? '');
$message = sanitizeText($_POST['message'] ?? '');

$errors = [];
if ($name === '') {
    $errors[] = 'Le nom est requis';
}

if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Email valide requis';
}

if ($message === '' || mb_strlen($message) < 10) {
    $errors[] = 'Merci d\'ajouter au moins 10 caractères dans ton message';
}

if (!empty($errors)) {
    http_response_code(400);
    sendJsonResponse(false, implode(', ', $errors));
}

$subject = "📨 Nouveau message - Les Gloutonnes";

$bodyLines = [
    "Nouveau message depuis le site Les Gloutonnes :",
    "",
    "=== CONTACT ===",
    "Nom : $name",
    "Email : $email",
];

if ($phone !== '') {
    $bodyLines[] = "Téléphone : $phone";
}

if ($plant !== '') {
    $bodyLines[] = "Plante d'intérêt : $plant";
}

$bodyLines[] = "";
$bodyLines[] = "=== MESSAGE ===";
$bodyLines[] = $message;
$bodyLines[] = "";
$bodyLines[] = "IP visiteur : $ipAddress";
$bodyLines[] = "Envoyé le : " . date('Y-m-d H:i:s');

$body = implode(PHP_EOL, $bodyLines);

$mailSent = sendEmail([
    'to' => $toEmail,
    'subject' => $subject,
    'body' => $body,
    'reply_to_email' => $email,
    'reply_to_name' => $name,
]);

$logEntry = date('Y-m-d H:i:s') . " - Contact rapide: $name ($email) - IP: $ipAddress - " . ($mailSent ? 'OK' : 'ERREUR') . PHP_EOL;
appendLog('contact_logs.txt', $logEntry);

if ($mailSent) {
    sendJsonResponse(true, "Merci $name ! Ton message a bien été envoyé.");
}

http_response_code(500);
sendJsonResponse(false, "Erreur lors de l'envoi. Tu peux me contacter directement via WhatsApp ou par email.");

