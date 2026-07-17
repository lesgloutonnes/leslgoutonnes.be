<?php
/**
 * Page de désabonnement simple - Les Gloutonnes
 * unsubscribe.php
 */

require_once '../api/config.php';

$message = '';
$messageType = '';
$emailFromUrl = '';

// Vérifier si on a un email dans l'URL
if (isset($_GET['email'])) {
    $emailFromUrl = trim($_GET['email']);
    
    // Désabonner automatiquement si l'email est fourni dans l'URL
    if (!empty($emailFromUrl) && isValidEmail($emailFromUrl)) {
        try {
            $pdo = getDBConnection();
            $stmt = $pdo->prepare("DELETE FROM newsletter_subscribers WHERE email = ?");
            $result = $stmt->execute([strtolower($emailFromUrl)]);
            
            if ($stmt->rowCount() > 0) {
                $message = "L'adresse <strong>" . htmlspecialchars($emailFromUrl) . "</strong> a été supprimée avec succès de notre newsletter.";
                $messageType = 'success';
            } else {
                $message = "Cette adresse email n'était pas dans notre liste de newsletter.";
                $messageType = 'info';
            }
        } catch (Exception $e) {
            error_log("Erreur désabonnement: " . $e->getMessage());
            $message = "Une erreur est survenue. Veuillez réessayer ou nous contacter.";
            $messageType = 'error';
        }
    } else {
        $message = "Adresse email invalide.";
        $messageType = 'error';
    }
}

// Traitement du formulaire
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['email'] ?? '');
    
    if (empty($email)) {
        $message = "Veuillez saisir votre adresse email.";
        $messageType = 'error';
    } elseif (!isValidEmail($email)) {
        $message = "Veuillez saisir une adresse email valide.";
        $messageType = 'error';
    } else {
        try {
            $pdo = getDBConnection();
            $stmt = $pdo->prepare("DELETE FROM newsletter_subscribers WHERE email = ?");
            $result = $stmt->execute([strtolower($email)]);
            
            if ($stmt->rowCount() > 0) {
                $message = "Votre adresse <strong>" . htmlspecialchars($email) . "</strong> a été supprimée avec succès de notre newsletter.";
                $messageType = 'success';
            } else {
                $message = "Cette adresse email n'est pas dans notre liste de newsletter.";
                $messageType = 'info';
            }
        } catch (Exception $e) {
            error_log("Erreur désabonnement: " . $e->getMessage());
            $message = "Une erreur est survenue. Veuillez réessayer ou nous contacter.";
            $messageType = 'error';
        }
    }
}
?>

<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Désabonnement Newsletter - Les Gloutonnes</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../css/pages/unsubscribe.css">
</head>
<body class="unsubscribe-body">
    <main id="main-content" class="unsubscribe-page">
        <section class="unsubscribe-card">
            <header class="unsubscribe-card__header">
                <div class="unsubscribe-logo">
                    <h1>Les Gloutonnes</h1>
                    <p>Plantes carnivores</p>
                </div>
            </header>

            <?php if (!empty($message)): ?>
                <?php if ($messageType === 'success'): ?>
                    <div class="unsubscribe-status" aria-live="polite">
                        <span class="unsubscribe-status__icon" aria-hidden="true">✅</span>
                        <h2 class="unsubscribe-status__title">Désabonnement confirmé</h2>
                        <div class="unsubscribe-alert unsubscribe-alert--success">
                            <?php echo $message; ?>
                        </div>
                    </div>

                    <div class="unsubscribe-info">
                        <p>Tu ne recevras plus notre newsletter, mais tu peux continuer à suivre les Gloutonnes sur les réseaux sociaux pour découvrir les nouvelles plantes et les conseils de culture.</p>
                    </div>

                    <div class="unsubscribe-social">
                        <h3>Reste connecté(e)</h3>
                        <div class="unsubscribe-social__links">
                            <a href="https://facebook.com/gloutonnes" target="_blank" rel="noopener noreferrer">📘 Facebook</a>
                            <a href="https://instagram.com/lesgloutonnes.be" target="_blank" rel="noopener noreferrer">📸 Instagram</a>
                            <a href="https://youtube.com/@lesgloutonnes" target="_blank" rel="noopener noreferrer">🎥 YouTube</a>
                        </div>
                    </div>

                    <a href="https://www.lesgloutonnes.be" class="unsubscribe-button unsubscribe-button--secondary">Retour au site</a>

                <?php else: ?>
                    <div class="unsubscribe-status" aria-live="polite">
                        <span class="unsubscribe-status__icon" aria-hidden="true"><?php echo $messageType === 'error' ? '❌' : 'ℹ️'; ?></span>
                        <h2 class="unsubscribe-status__title">Information</h2>
                        <div class="unsubscribe-alert unsubscribe-alert--<?php echo htmlspecialchars($messageType); ?>">
                            <?php echo $message; ?>
                        </div>
                    </div>

                    <?php if ($messageType === 'error' && empty($emailFromUrl)): ?>
                        <div class="unsubscribe-info">
                            <p>Réessaie avec ton adresse email :</p>
                        </div>

                        <form method="POST" class="unsubscribe-form" novalidate>
                            <div class="unsubscribe-field">
                                <label for="email">Ton adresse email</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    required
                                    placeholder="ton.email@exemple.com"
                                    value="<?php echo htmlspecialchars($_POST['email'] ?? ''); ?>"
                                />
                            </div>
                            <button type="submit" class="unsubscribe-button">Me désabonner</button>
                        </form>
                    <?php endif; ?>

                    <a href="https://www.lesgloutonnes.be" class="unsubscribe-button unsubscribe-button--secondary">Retour au site</a>
                <?php endif; ?>

            <?php else: ?>
                <div class="unsubscribe-status">
                    <span class="unsubscribe-status__icon" aria-hidden="true">📧</span>
                    <h2 class="unsubscribe-status__title">Se désabonner de la newsletter</h2>
                </div>

                <div class="unsubscribe-info">
                    <p>Tu souhaites te désabonner de la newsletter des Gloutonnes&nbsp;?</p>
                    <p>Saisis ton adresse email ci-dessous, nous supprimerons immédiatement ton contact de notre liste.</p>
                </div>

                <form method="POST" class="unsubscribe-form" novalidate>
                    <div class="unsubscribe-field">
                        <label for="email">Ton adresse email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            required
                            placeholder="ton.email@exemple.com"
                            value="<?php echo htmlspecialchars($emailFromUrl); ?>"
                        />
                    </div>
                    <button type="submit" class="unsubscribe-button">Me désabonner</button>
                </form>

                <a href="https://www.lesgloutonnes.be" class="unsubscribe-button unsubscribe-button--secondary">Annuler</a>
            <?php endif; ?>

            <footer class="unsubscribe-footer">
                <p>Besoin d'aide ? <a href="mailto:infos@lesgloutonnes.be">infos@lesgloutonnes.be</a> · <a href="tel:+32494881487">+32 494 81 14 87</a></p>
            </footer>
        </section>
    </main>
</html>