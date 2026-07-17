<?php
// /api/confirm-appointment.php - Gestion des confirmations avec génération d'invitations calendrier

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/helpers.php';

$site_url = "https://www.lesgloutonnes.be";

// Récupérer les paramètres
$appointment_id = $_GET['id'] ?? '';
$action = $_GET['action'] ?? '';
$token = $_GET['token'] ?? '';

if (!isValidAppointmentId($appointment_id) || empty($action) || empty($token)) {
    die("Paramètres manquants");
}

$appointment = loadAppointment($appointment_id);
if (!$appointment) {
    die("Demande non trouvée");
}

if (empty($appointment['token']) || !hash_equals($appointment['token'], $token)) {
    die("Token invalide");
}

$allowedActions = ['confirm', 'decline'];
if (!in_array($action, $allowedActions, true)) {
    die("Action non autorisée");
}

$appointment['plants'] = isset($appointment['plants']) && is_array($appointment['plants'])
    ? $appointment['plants']
    : [];

// Fonction pour générer un fichier ICS (invitation calendrier)
function generateICS($appointment, $status = 'confirmed') {
    $name = $appointment['name'];
    $email = $appointment['email'];
    $phone = $appointment['phone'];
    $date = $appointment['date'];
    $time = $appointment['time'];
    $visitors = $appointment['visitors'];
    $plants = implode(', ', $appointment['plants']);
    
    // Créer les timestamps pour le calendrier
    $start_datetime = new DateTime("$date $time", new DateTimeZone('Europe/Brussels'));
    $end_datetime = clone $start_datetime;
    $end_datetime->add(new DateInterval('PT90M')); // Ajouter 1h30
    
    // Format UTC pour ICS
    $start_utc = $start_datetime->setTimezone(new DateTimeZone('UTC'))->format('Ymd\THis\Z');
    $end_utc = $end_datetime->setTimezone(new DateTimeZone('UTC'))->format('Ymd\THis\Z');
    $created = gmdate('Ymd\THis\Z');
    
    // UUID unique pour l'événement
    $uid = $appointment['id'] . '@lesgloutonnes.be';
    
    // Contenu de l'invitation
    $ics_content = "BEGIN:VCALENDAR\r\n";
    $ics_content .= "VERSION:2.0\r\n";
    $ics_content .= "PRODID:-//Les Gloutonnes//Appointment System//FR\r\n";
    $ics_content .= "CALSCALE:GREGORIAN\r\n";
    $ics_content .= "METHOD:REQUEST\r\n";
    $ics_content .= "BEGIN:VEVENT\r\n";
    $ics_content .= "UID:$uid\r\n";
    $ics_content .= "DTSTAMP:$created\r\n";
    $ics_content .= "DTSTART:$start_utc\r\n";
    $ics_content .= "DTEND:$end_utc\r\n";
    $ics_content .= "SUMMARY:Visite serre Les Gloutonnes - $name\r\n";
    $ics_content .= "DESCRIPTION:Visite de la collection de plantes carnivores\\n\\n";
    $ics_content .= "Visiteur: $name\\n";
    $ics_content .= "Email: $email\\n";
    $ics_content .= "Téléphone: $phone\\n";
    $ics_content .= "Nombre de visiteurs: $visitors\\n";
    if (!empty($plants)) {
        $ics_content .= "Plantes d'intérêt: $plants\\n";
    }
    $ics_content .= "\\nAdresse: Voie des Jardinets 47B\\, 4537 Verlaine\\, Belgique\\n";
    $ics_content .= "Contact: +32 494 81 14 87\\n";
    $ics_content .= "Site: https://www.lesgloutonnes.be\r\n";
    $ics_content .= "LOCATION:Voie des Jardinets 47B\\, 4537 Verlaine\\, Belgique\r\n";
    $ics_content .= "ORGANIZER;CN=Charles Bussers:mailto:infos@lesgloutonnes.be\r\n";
    $ics_content .= "ATTENDEE;CN=$name;ROLE=REQ-PARTICIPANT:mailto:$email\r\n";
    $ics_content .= "STATUS:CONFIRMED\r\n";
    $ics_content .= "TRANSP:OPAQUE\r\n";
    
    // Rappels
    $ics_content .= "BEGIN:VALARM\r\n";
    $ics_content .= "TRIGGER:-P1D\r\n"; // 1 jour avant
    $ics_content .= "ACTION:EMAIL\r\n";
    $ics_content .= "DESCRIPTION:Rappel: Visite serre Les Gloutonnes demain\r\n";
    $ics_content .= "SUMMARY:Visite Les Gloutonnes demain\r\n";
    $ics_content .= "END:VALARM\r\n";
    
    $ics_content .= "BEGIN:VALARM\r\n";
    $ics_content .= "TRIGGER:-PT2H\r\n"; // 2 heures avant
    $ics_content .= "ACTION:DISPLAY\r\n";
    $ics_content .= "DESCRIPTION:Visite serre Les Gloutonnes dans 2h\r\n";
    $ics_content .= "END:VALARM\r\n";
    
    $ics_content .= "END:VEVENT\r\n";
    $ics_content .= "END:VCALENDAR\r\n";
    
    return $ics_content;
}

// Fonction pour envoyer un email avec pièce jointe ICS
function sendConfirmationWithCalendar($appointment) {
    $to = sanitizeEmail($appointment['email']);
    if ($to === '') {
        return false;
    }

    $ccEmail = sanitizeEmail(defined('MAIL_REPLY_TO_EMAIL') ? MAIL_REPLY_TO_EMAIL : 'infos@lesgloutonnes.be');
    $name = $appointment['name'];
    $date_fr = formatDateFr($appointment['date']);
    $time = $appointment['time'];
    
    $subject = sanitizeEmailSubject("✅ Rendez-vous confirmé - Les Gloutonnes - $date_fr");
    
    $message = "
Bonjour $name,

Excellent ! Ton rendez-vous est confirmé ! 🎉

=== RENDEZ-VOUS CONFIRMÉ ===
📅 Date : $date_fr
🕒 Heure : $time
👥 Nombre de visiteurs : {$appointment['visitors']}
📍 Lieu : Voie des Jardinets 47B, 4537 Verlaine, Belgique

=== INVITATION CALENDRIER ===
Tu trouveras en pièce jointe une invitation calendrier (.ics) à ajouter à ton agenda (Outlook, Gmail, iPhone, etc.).
Cette invitation contient :
• Tous les détails du rendez-vous
• L'adresse avec GPS
• Des rappels automatiques (1 jour avant + 2h avant)

=== INFORMATIONS PRATIQUES ===
🚗 Parking gratuit sur place
🕒 Durée de visite : environ 1h30
💶 Entrée gratuite
📞 Contact : +32 494 81 14 87

=== CONSEILS POUR TA VISITE ===
• Viens avec des questions sur tes plantes carnivores
• N'hésite pas à prendre des photos
• Possibilité d'acquérir des plantes sur place

J'ai hâte de te faire découvrir ma collection ! 🌱

À très bientôt,
Charles et ses Gloutonnes

---
Les Gloutonnes - Collection de Plantes Carnivores
Voie des Jardinets 47B, 4537 Verlaine, Belgique
https://www.lesgloutonnes.be
";

    // Générer le fichier ICS
    $ics_content = generateICS($appointment);
    $boundary = md5(time());
    
    // Headers pour email avec pièce jointe
    $headers = [];
    $fromEmail = sanitizeEmail(defined('MAIL_REPLY_TO_EMAIL') ? MAIL_REPLY_TO_EMAIL : 'infos@lesgloutonnes.be');
    $fromName = defined('MAIL_REPLY_TO_NAME') ? MAIL_REPLY_TO_NAME : 'Charles - Les Gloutonnes';

    if ($fromEmail !== '') {
        $headers[] = 'From: ' . formatEmailAddress($fromEmail, $fromName);
        $headers[] = 'Reply-To: ' . formatEmailAddress($fromEmail, $fromName);
        ini_set('sendmail_from', $fromEmail);
    }

    if ($ccEmail !== '' && $ccEmail !== $to) {
        $headers[] = 'Cc: ' . formatEmailAddress($ccEmail, defined('MAIL_REPLY_TO_NAME') ? MAIL_REPLY_TO_NAME : null);
    }

    $headers[] = 'MIME-Version: 1.0';
    $headers[] = 'Content-Type: multipart/mixed; boundary="' . $boundary . '"';
    
    // Corps de l'email avec pièce jointe
    $email_body = "--$boundary\r\n";
    $email_body .= "Content-Type: text/plain; charset=UTF-8\r\n";
    $email_body .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
    $email_body .= $message . "\r\n\r\n";
    
    // Pièce jointe ICS
    $email_body .= "--$boundary\r\n";
    $email_body .= "Content-Type: text/calendar; method=REQUEST; name=\"rendez-vous-gloutonnes.ics\"\r\n";
    $email_body .= "Content-Transfer-Encoding: base64\r\n";
    $email_body .= "Content-Disposition: attachment; filename=\"rendez-vous-gloutonnes.ics\"\r\n\r\n";
    $email_body .= chunk_split(base64_encode($ics_content)) . "\r\n";
    $email_body .= "--$boundary--\r\n";
    
    configureMailTransport();
    $headerString = implode("\r\n", $headers);

    $sent = mail($to, $subject, $email_body, $headerString);

    if (defined('MAIL_LOG_FILE') && MAIL_LOG_FILE) {
        $status = $sent ? 'OK' : 'ERREUR';
        appendLog(MAIL_LOG_FILE, sprintf("[%s] %s | To: %s | Subject: %s%s", date('Y-m-d H:i:s'), $status, $to, $subject, PHP_EOL));
    }

    return $sent;
}

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

// Interface HTML simple
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gestion Rendez-vous - Les Gloutonnes</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .card { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .btn { padding: 10px 20px; margin: 10px; text-decoration: none; border-radius: 5px; display: inline-block; }
        .btn-confirm { background: #28a745; color: white; }
        .btn-decline { background: #dc3545; color: white; }
        .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 5px; }
        .error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 15px; border-radius: 5px; }
    </style>
</head>
<body>
    <h1>🌱 Gestion Rendez-vous - Les Gloutonnes</h1>
    
    <div class="card">
        <h2>Demande de rendez-vous : <?= htmlspecialchars($appointment['name']) ?></h2>
        <p><strong>Email :</strong> <?= htmlspecialchars($appointment['email']) ?></p>
        <p><strong>Téléphone :</strong> <?= htmlspecialchars($appointment['phone']) ?></p>
        <p><strong>Date demandée :</strong> <?= formatDateFr($appointment['date']) ?></p>
        <p><strong>Heure :</strong> <?= htmlspecialchars($appointment['time']) ?></p>
        <p><strong>Visiteurs :</strong> <?= htmlspecialchars($appointment['visitors']) ?></p>
        <?php if (!empty($appointment['plants'])): ?>
        <p><strong>Plantes d'intérêt :</strong> <?= implode(', ', $appointment['plants']) ?></p>
        <?php endif; ?>
        <?php if (!empty($appointment['message'])): ?>
        <p><strong>Message :</strong> <?= nl2br(htmlspecialchars($appointment['message'])) ?></p>
        <?php endif; ?>
        <p><strong>Statut :</strong> <?= ucfirst($appointment['status']) ?></p>
    </div>

    <?php
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        if ($action === 'confirm') {
            // Confirmer le rendez-vous et envoyer l'invitation calendrier
            $appointment['status'] = 'confirmed';
            $appointment['confirmed_at'] = date('Y-m-d H:i:s');
            saveAppointment($appointment);
            
            if (sendConfirmationWithCalendar($appointment)) {
                echo '<div class="success">✅ Rendez-vous confirmé ! Email avec invitation calendrier envoyé à ' . htmlspecialchars($appointment['email']) . '</div>';
                
                // Ajouter le lien d'annulation si besoin
                $cancel_url = $site_url . "/api/cancel-appointment.php?id=" . urlencode($appointment_id) . "&action=cancel&token=" . urlencode($token);
                echo '<p><strong>Si tu dois annuler/reporter plus tard :</strong><br>';
                echo '<a href="' . $cancel_url . '" class="btn btn-decline">🚫 Annuler/Reporter ce rendez-vous</a></p>';
            } else {
                echo '<div class="error">❌ Erreur lors de l\'envoi de l\'email</div>';
            }
        } elseif ($action === 'decline') {
            // Proposer une nouvelle date
            $new_message = $_POST['decline_message'] ?? '';
            
            $subject = "📅 Nouveau créneau proposé - Les Gloutonnes";
            $message = "
Bonjour {$appointment['name']},

Merci pour ta demande de visite ! 

Malheureusement, le créneau que tu as demandé ({$appointment['date']} à {$appointment['time']}) n'est pas disponible.

$new_message

Je te propose de me contacter directement pour trouver un nouveau créneau qui nous convient :
📞 +32 494 81 14 87
💬 WhatsApp : https://wa.me/+32494811487
✉️ Email : infos@lesgloutonnes.be

À très bientôt pour découvrir mes plantes carnivores !

Charles - Les Gloutonnes
";
            
            $headers = "From: Charles - Les Gloutonnes <infos@lesgloutonnes.be>\r\n";
            $headers .= "Reply-To: infos@lesgloutonnes.be\r\n";
            
            if (mail($appointment['email'], $subject, $message, $headers)) {
                $appointment['status'] = 'declined';
                $appointment['declined_at'] = date('Y-m-d H:i:s');
                saveAppointment($appointment);
                echo '<div class="success">📧 Proposition de nouveau créneau envoyée à ' . htmlspecialchars($appointment['email']) . '</div>';
            } else {
                echo '<div class="error">❌ Erreur lors de l\'envoi</div>';
            }
        }
    } else {
        // Afficher les actions possibles
        if ($appointment['status'] === 'pending') {
            if ($action === 'confirm') {
                echo '<form method="POST">';
                echo '<h3>Confirmer ce rendez-vous ?</h3>';
                echo '<p>Un email avec invitation calendrier sera automatiquement envoyé au visiteur.</p>';
                echo '<button type="submit" class="btn btn-confirm">✅ Confirmer et envoyer l\'invitation</button>';
                echo '<a href="?" class="btn btn-decline">❌ Annuler</a>';
                echo '</form>';
            } elseif ($action === 'decline') {
                echo '<form method="POST">';
                echo '<h3>Proposer une nouvelle date</h3>';
                echo '<textarea name="decline_message" placeholder="Ex: Je te propose plutôt samedi 15 juin à 14h ou dimanche 16 juin à 10h. Dis-moi ce qui t\'arrange le mieux !" rows="4" style="width: 100%; margin: 10px 0;"></textarea>';
                echo '<button type="submit" class="btn btn-decline">📧 Envoyer la proposition</button>';
                echo '<a href="?" class="btn btn-confirm">❌ Annuler</a>';
                echo '</form>';
            } else {
                echo '<div>';
                echo '<a href="?id=' . urlencode($appointment_id) . '&action=confirm&token=' . urlencode($token) . '" class="btn btn-confirm">✅ Confirmer ce créneau</a>';
                echo '<a href="?id=' . urlencode($appointment_id) . '&action=decline&token=' . urlencode($token) . '" class="btn btn-decline">📅 Proposer autre date</a>';
                echo '</div>';
            }
        } else {
            echo '<div class="success">✅ Cette demande a déjà été traitée.</div>';
        }
    }
    ?>
    
</body>