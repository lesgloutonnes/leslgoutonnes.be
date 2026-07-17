<?php
/**
 * check-tracking-data.php - Vérifier les données de tracking de la campagne existante
 * À placer à la racine et visiter dans le navigateur
 */

require_once __DIR__ . '/config.php';

echo "<h1>🔍 Vérification données tracking campagne existante</h1>";

try {
    $pdo = getDBConnection();
    
    // 1. Vérifier la campagne "Annonce du nouveau site" 
    echo "<h2>📊 Informations campagne</h2>";
    $stmt = $pdo->query("
        SELECT nc.*, ncs.* 
        FROM newsletter_campaigns nc 
        LEFT JOIN newsletter_campaign_stats ncs ON nc.id = ncs.campaign_id 
        WHERE nc.campaign_name LIKE '%Annonce du nouveau site%'
    ");
    $campaign = $stmt->fetch();
    
    if ($campaign) {
        echo "<div style='background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 10px 0;'>";
        echo "<strong>✅ Campagne trouvée :</strong><br>";
        echo "- ID : {$campaign['id']}<br>";
        echo "- Nom : {$campaign['campaign_name']}<br>";
        echo "- Envoyés : {$campaign['total_sent']}<br>";
        echo "- Ouvertures uniques : {$campaign['unique_opens']}<br>";
        echo "- Ouvertures totales : {$campaign['total_opens']}<br>";
        echo "- Taux : {$campaign['open_rate']}%<br>";
        echo "</div>";
        
        $campaign_id = $campaign['id'];
        
        // 2. Vérifier s'il y a des données individuelles d'ouverture
        echo "<h2>👥 Ouvertures individuelles enregistrées</h2>";
        $stmt = $pdo->prepare("
            SELECT * FROM newsletter_opens 
            WHERE campaign_id = ? 
            ORDER BY opened_at DESC
        ");
        $stmt->execute([$campaign_id]);
        $opens = $stmt->fetchAll();
        
        if (count($opens) > 0) {
            echo "<div style='background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 10px 0;'>";
            echo "<strong>✅ Données individuelles disponibles !</strong><br>";
            echo "Nombre d'enregistrements : " . count($opens) . "<br><br>";
            
            echo "<table border='1' cellpadding='8' style='border-collapse: collapse; width: 100%;'>";
            echo "<tr style='background: #5b0092; color: white;'>";
            echo "<th>Email</th><th>Date ouverture</th><th>IP</th><th>Méthode</th></tr>";
            
            foreach (array_slice($opens, 0, 10) as $open) {
                $method = $open['tracking_method'] ?? 'N/A';
                echo "<tr>";
                echo "<td><strong>{$open['email_address']}</strong></td>";
                echo "<td>{$open['opened_at']}</td>";
                echo "<td>{$open['ip_address']}</td>";
                echo "<td>{$method}</td>";
                echo "</tr>";
            }
            echo "</table>";
            
            if (count($opens) > 10) {
                echo "<p><em>... et " . (count($opens) - 10) . " autres ouvertures</em></p>";
            }
            echo "</div>";
            
            // 3. Analyse des champions potentiels
            echo "<h2>🏆 Analyse des champions (déjà identifiables)</h2>";
            $stmt = $pdo->prepare("
                SELECT 
                    email_address,
                    COUNT(*) as open_count,
                    MIN(opened_at) as first_open,
                    MAX(opened_at) as last_open,
                    GROUP_CONCAT(DISTINCT tracking_method) as methods
                FROM newsletter_opens 
                WHERE campaign_id = ?
                GROUP BY email_address
                HAVING open_count > 1
                ORDER BY open_count DESC
            ");
            $stmt->execute([$campaign_id]);
            $champions = $stmt->fetchAll();
            
            if (count($champions) > 0) {
                echo "<div style='background: #fff3cd; padding: 15px; border-radius: 8px; margin: 10px 0;'>";
                echo "<strong>🏆 Champions identifiés (" . count($champions) . ") :</strong><br><br>";
                
                foreach ($champions as $champion) {
                    echo "📧 <strong>{$champion['email_address']}</strong><br>";
                    echo "   └ {$champion['open_count']} ouvertures<br>";
                    echo "   └ Première : " . date('d/m/Y H:i', strtotime($champion['first_open'])) . "<br>";
                    echo "   └ Dernière : " . date('d/m/Y H:i', strtotime($champion['last_open'])) . "<br>";
                    echo "   └ Méthodes : {$champion['methods']}<br><br>";
                }
                echo "</div>";
            } else {
                echo "<p style='color: #666;'>Aucun champion (ouvertures multiples) détecté pour cette campagne.</p>";
            }
            
            // 4. Liste des zombies (abonnés qui n'ont pas ouvert)
            echo "<h2>🧟 Abonnés zombies (n'ont pas ouvert cette campagne)</h2>";
            $stmt = $pdo->prepare("
                SELECT ns.email, ns.date_inscription
                FROM newsletter_subscribers ns
                LEFT JOIN newsletter_opens no ON ns.email = no.email_address AND no.campaign_id = ?
                WHERE no.email_address IS NULL
                ORDER BY ns.date_inscription DESC
                LIMIT 20
            ");
            $stmt->execute([$campaign_id]);
            $zombies = $stmt->fetchAll();
            
            if (count($zombies) > 0) {
                $stmt = $pdo->prepare("
                    SELECT COUNT(*) as total_zombies
                    FROM newsletter_subscribers ns
                    LEFT JOIN newsletter_opens no ON ns.email = no.email_address AND no.campaign_id = ?
                    WHERE no.email_address IS NULL
                ");
                $stmt->execute([$campaign_id]);
                $total_zombies = $stmt->fetch()['total_zombies'];
                
                echo "<div style='background: #f8d7da; padding: 15px; border-radius: 8px; margin: 10px 0;'>";
                echo "<strong>🧟 Zombies détectés : {$total_zombies} abonnés</strong><br><br>";
                echo "Aperçu des 20 premiers :<br>";
                
                foreach (array_slice($zombies, 0, 10) as $zombie) {
                    echo "❌ {$zombie['email']} (inscrit le " . date('d/m/Y', strtotime($zombie['date_inscription'])) . ")<br>";
                }
                
                if (count($zombies) > 10) {
                    echo "<br><em>... et " . ($total_zombies - 10) . " autres zombies</em>";
                }
                echo "</div>";
            }
            
        } else {
            echo "<div style='background: #f8d7da; padding: 15px; border-radius: 8px; margin: 10px 0;'>";
            echo "<strong>❌ Aucune donnée individuelle trouvée</strong><br>";
            echo "La campagne a été envoyée AVANT l'implémentation du tracking individuel.<br><br>";
            echo "<strong>Ce qu'on sait quand même :</strong><br>";
            echo "- {$campaign['unique_opens']} personnes ont ouvert (mais on ne sait pas qui)<br>";
            echo "- {$campaign['total_opens']} ouvertures au total<br>";
            echo "- " . ($campaign['total_sent'] - $campaign['unique_opens']) . " personnes n'ont jamais ouvert<br><br>";
            echo "<strong>🎯 Recommandation :</strong><br>";
            echo "- Le système d'engagement ne pourra PAS identifier les individus pour cette campagne<br>";
            echo "- Mais il pourra quand même identifier les {$campaign['total_sent']} abonnés comme 'non-segmentés'<br>";
            echo "- Envoyez une 2ème campagne AVEC le nouveau tracking pour avoir les détails !";
            echo "</div>";
        }
        
        // 5. Recommandations
        echo "<h2>💡 Recommandations</h2>";
        
        if (count($opens) > 0) {
            echo "<div style='background: #d4edda; padding: 15px; border-radius: 8px; margin: 10px 0;'>";
            echo "<strong>✅ Excellente nouvelle !</strong><br>";
            echo "Vos données de tracking individuel sont déjà disponibles !<br>";
            echo "Le système d'engagement fonctionnera parfaitement dès maintenant.<br><br>";
            echo "<strong>Actions possibles :</strong><br>";
            echo "1. Activez le module d'engagement dans l'onglet Stats<br>";
            echo "2. Identifiez vos " . count($champions) . " champions<br>";
            echo "3. Nettoyez les " . ($total_zombies ?? 0) . " zombies<br>";
            echo "4. Envoyez la prochaine campagne aux " . count($opens) . " personnes engagées";
            echo "</div>";
        } else {
            echo "<div style='background: #fff3cd; padding: 15px; border-radius: 8px; margin: 10px 0;'>";
            echo "<strong>⚠️ Tracking partiel</strong><br>";
            echo "Cette campagne n'a pas de données individuelles.<br><br>";
            echo "<strong>Solutions :</strong><br>";
            echo "1. Envoyez une nouvelle campagne AVEC le tracking → identification précise<br>";
            echo "2. Ou considérez TOUS les non-ouvreurs comme zombies à nettoyer<br>";
            echo "3. Les {$campaign['unique_opens']} qui ont ouvert = à garder absolument";
            echo "</div>";
        }
        
    } else {
        echo "<div style='background: #f8d7da; padding: 15px; border-radius: 8px; margin: 10px 0;'>";
        echo "<strong>❌ Campagne 'Annonce du nouveau site' non trouvée</strong><br>";
        echo "Vérifiez le nom exact dans votre base de données.";
        echo "</div>";
    }
    
} catch (Exception $e) {
    echo "<p>❌ Erreur : " . $e->getMessage() . "</p>";
}

echo "<hr>";
echo "<p><small>Diagnostic terminé - " . date('Y-m-d H:i:s') . "</small></p>";
?>

<style>
body { 
    font-family: Arial, sans-serif; 
    margin: 20px; 
    line-height: 1.6; 
    background: #f8f9fa;
}
h1, h2 { 
    color: #5b0092; 
}
table { 
    margin: 15px 0; 
    background: white;
}
th { 
    padding: 12px 8px; 
}
td { 
    padding: 8px; 
}
</style>