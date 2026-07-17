<?php
// process-contact.php - Traitement des demandes de RDV

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/helpers.php';

// Configuration
$to_email = "infos@lesgloutonnes.be";
$site_url = "https://www.lesgloutonnes.be";

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
    sendJsonResponse(false, 'Merci de prendre quelques secondes avant d\'envoyer le formulaire.');
}

$ipAddress = getClientIp();
if (isRateLimited('appointment_' . $ipAddress, 3, 1800)) { // 3 requêtes / 30 min
    http_response_code(429);
    sendJsonResponse(false, 'Trop de demandes depuis cette adresse IP. Réessaie dans quelques minutes.');
}

// Récupérer et nettoyer les données
$name = sanitizeText($_POST['name'] ?? '');
$email = filter_var(trim($_POST['email'] ?? ''), FILTER_SANITIZE_EMAIL);
$phone = sanitizeText($_POST['phone'] ?? '');
$visit_date = $_POST['visit-date'] ?? '';
$visit_time = $_POST['visit-time'] ?? '';
$visitors = (int)($_POST['visitors'] ?? 1);
$message = sanitizeText($_POST['message'] ?? '');

// Plantes d'intérêt
$interested_plants = [];
if (isset($_POST['interested-plants']) && is_array($_POST['interested-plants'])) {
    $interested_plants = array_map('sanitizeText', $_POST['interested-plants']);
    $interested_plants = array_filter($interested_plants);
}

// Validation basique
$errors = [];
if ($name === '') $errors[] = "Le nom est requis";
if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = "Email valide requis";
}
if ($phone === '') $errors[] = "Le téléphone est requis";
if (empty($visit_date) || !isValidDate($visit_date)) $errors[] = "La date est invalide";
if (empty($visit_time) || !isValidTime($visit_time)) $errors[] = "L'heure est invalide";
if ($visitors < 1 || $visitors > 10) $errors[] = "Le nombre de visiteurs doit être compris entre 1 et 10";

if (!empty($errors)) {
    http_response_code(400);
    sendJsonResponse(false, implode(', ', $errors));
}

// Générer un ID unique
$request_id = 'RDV-' . date('Ymd') . '-' . substr(bin2hex(random_bytes(6)), 0, 6);

// Fonction pour formatter la date
function formatDateFr($date) {
    $dateObj = new DateTime($date);
    $days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    $months = ['', 'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
               'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    
    $dayName = $days[$dateObj->format('w')];
    $day = $dateObj->format('j');
    $month = $months[(int)$dateObj->format('n')];
    $year = $dateObj->format('Y');
    
    return "$dayName $day $month $year";
}

// Générer un jeton temporaire (sera renforcé dans les étapes suivantes)
$tokenSeed = defined('APPOINTMENTS_SECRET') && APPOINTMENTS_SECRET ? APPOINTMENTS_SECRET : bin2hex(random_bytes(16));
$token = hash_hmac('sha256', $request_id, $tokenSeed);

// URLs d'action
$confirm_url = $site_url . "/api/confirm-appointment.php?id=" . urlencode($request_id) . "&action=confirm&token=" . urlencode($token);
$decline_url = $site_url . "/api/confirm-appointment.php?id=" . urlencode($request_id) . "&action=decline&token=" . urlencode($token);
$cancel_url = $site_url . "/api/cancel-appointment.php?id=" . urlencode($request_id) . "&action=cancel&token=" . urlencode($token);

// Email pour Charles
$subject_admin = "🌱 Nouvelle demande de visite - " . $name;
$message_admin = "
Nouvelle demande de rendez-vous pour la serre !

=== INFORMATIONS VISITEUR ===
Nom : $name
Email : $email
Téléphone : $phone
Nombre de visiteurs : $visitors

=== RENDEZ-VOUS DEMANDÉ ===
Date souhaitée : " . formatDateFr($visit_date) . "
Heure souhaitée : $visit_time

=== PLANTES D'INTÉRÊT ===
" . (empty($interested_plants) ? "Aucune plante spécifique" : implode(', ', $interested_plants)) . "

=== MESSAGE ===
" . ($message !== '' ? $message : "Aucun message particulier") . "

=== ACTIONS RAPIDES ===
ID de demande : $request_id

✅ CONFIRMER CE CRÉNEAU :
$confirm_url

❌ PROPOSER UNE AUTRE DATE :
$decline_url

🚫 ANNULER UN RDV DÉJÀ CONFIRMÉ :
$cancel_url

Ou réponds directement à cet email pour discuter avec $name.

---
Envoyé depuis le formulaire Les Gloutonnes
";

// Email de confirmation pour le visiteur
$subject_visitor = "✅ Demande de visite reçue - Les Gloutonnes";
$message_visitor = "
Bonjour $name,

Merci pour ta demande de visite de ma serre de plantes carnivores !

=== RÉCAPITULATIF DE TA DEMANDE ===
Date souhaitée : " . formatDateFr($visit_date) . "
Heure souhaitée : $visit_time
Nombre de visiteurs : $visitors
Référence : $request_id

Je vais examiner ma disponibilité et te contacter rapidement pour :
- Confirmer ton créneau OU
- Te proposer une alternative si nécessaire

📅 Si je confirme ce créneau, tu recevras automatiquement une invitation calendrier pour ne pas oublier ton rendez-vous !

=== EN ATTENDANT ===
Tu peux déjà consulter :
🌱 Ma collection : $site_url/pages/collection-dionaea.html
📚 Mes guides : $site_url/pages/guides.html
🎬 Ma chaîne YouTube : https://youtube.com/@lesgloutonnes

=== CONTACT DIRECT ===
📞 Téléphone/SMS : +32 494 81 14 87
💬 WhatsApp : https://wa.me/+32494811487

À très bientôt dans ma serre !

Charles et ses Gloutonnes 🌿
---
Les Gloutonnes - Collection de Plantes Carnivores
Voie des Jardinets 47B, 4537 Verlaine, Belgique
$site_url
";

// Sauvegarder la demande en JSON
$appointment_data = [
    'id' => $request_id,
    'name' => $name,
    'email' => $email,
    'phone' => $phone,
    'date' => $visit_date,
    'time' => $visit_time,
    'visitors' => $visitors,
    'plants' => array_values($interested_plants),
    'message' => $message,
    'status' => 'pending',
    'created_at' => date('Y-m-d H:i:s'),
    'token' => $token
];

// Créer le dossier s'il n'existe pas
try {
    if (!saveAppointment($appointment_data)) {
        throw new RuntimeException('Impossible d\'enregistrer la demande');
    }
} catch (Throwable $e) {
    error_log("Erreur enregistrement RDV: " . $e->getMessage());
    http_response_code(500);
    sendJsonResponse(false, "Erreur interne. Merci de me contacter directement au +32 494 81 14 87.");
}

// Headers email
// Envoyer les emails
$email_sent_admin = sendEmail([
    'to' => $to_email,
    'subject' => $subject_admin,
    'body' => $message_admin,
    'reply_to_email' => $email,
    'reply_to_name' => $name,
]);

$email_sent_visitor = sendEmail([
    'to' => $email,
    'subject' => $subject_visitor,
    'body' => $message_visitor,
]);

// Log
$log_entry = date('Y-m-d H:i:s') . " - Demande RDV: $request_id - $name ($email) - IP: $ipAddress - " .
             ($email_sent_admin ? "OK" : "ERREUR") . PHP_EOL;
appendLog('contact_logs.txt', $log_entry);

// Réponse
if ($email_sent_admin) {
    sendJsonResponse(
        true,
        "Merci $name ! Ta demande a été envoyée. Je te contacterai rapidement pour confirmer ton rendez-vous.",
        ['request_id' => $request_id]
    );
}

http_response_code(500);
sendJsonResponse(false, "Erreur lors de l'envoi. Contacte-moi directement au +32 494 81 14 87");