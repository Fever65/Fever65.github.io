let isTyping = false; 

function displayExcuseWithAnimation(excuse) {
    if (isTyping) return; 
    isTyping = true;

    const display = document.getElementById("excuseDisplay");
    display.textContent = ""; 
    let i = 0;

    function typeWriter() {
        if (i < excuse.length) {
            display.textContent += excuse.charAt(i); 
            i++;
            setTimeout(typeWriter, 15); 
        } else {
            isTyping = false; 
        }
    }

    typeWriter();
}

function generateExcuse(category) {
    const excuses = {
        serieuse: [
            "Je suis resté bloqué dans un embouteillage.",
            "J'ai dû emmener un proche à l'hôpital en urgence.",
            "Mon réveil n'a pas sonné ce matin.",
            "Je n'avais pas d'électricité chez moi à cause d'une panne.",
            "J'ai dû m'occuper d'une urgence familiale.",
            "Je me suis senti mal et ai dû consulter un médecin.",
            "Ma voiture est tombée en panne sur le chemin.",
            "Un rendez-vous médical important a pris plus de temps que prévu.",
            "J'ai été retardé par un problème administratif urgent.",
            "Il y a eu une coupure d'eau chez moi, et j'ai dû gérer ça.",
            "Mon enfant était malade ce matin, je ne pouvais pas le laisser seul.",
            "J'ai glissé et me suis fait mal en sortant de chez moi.",
            "Un arbre est tombé et bloquait la route devant chez moi.",
            "J'ai perdu mes clés et ai dû les chercher partout.",
            "J'avais un entretien téléphonique imprévu et important.",
            "Un incendie dans mon immeuble m'a retardé.",
            "Il y a eu un problème avec les transports en commun.",
            "Ma connexion Internet était coupée.",
            "J'ai eu une grosse migraine ce matin.",
            "J'ai dû gérer un dégât des eaux chez moi.",
            "Mon voisin m'a demandé de l'aide pour une urgence.",
            "Mon téléphone ne s'est pas chargé, je n'ai pas pu me réveiller.",
            "Il y avait un accident sur la route qui a bloqué la circulation.",
            "Mon médecin m'a appelé pour avancer un rendez-vous urgent.",
            "Je devais attendre un technicien pour une réparation importante.",
            "Mon animal de compagnie était malade et avait besoin de soins.",
            "J'ai dû aller chercher un proche à la gare au dernier moment.",
            "Une panne de chauffage m'a retenu à la maison pour la réparer.",
            "Il y avait une alerte météo dans ma région.",
            "J'ai perdu mon portefeuille ce matin, j'ai dû le retrouver.",
            "J'ai eu une crevaison sur le chemin.",
            "J'ai été coincé dans un ascenseur en sortant de chez moi.",
            "J'ai dû aller chercher des médicaments pour un proche.",
            "Un membre de ma famille avait besoin de mon aide immédiate.",
            "J'ai eu une urgence avec mes documents administratifs.",
            "Le bus a été annulé, et je n'avais pas d'autre moyen de transport.",
            "J'ai reçu un appel urgent de mon employeur ou d'un client.",
            "Un problème informatique m'a retardé dans mes tâches.",
            "Il y avait des travaux bloquant ma rue.",
            "J'ai dû faire face à une inondation soudaine chez moi.",
            "J'ai oublié un document important et ai dû retourner chez moi.",
            "Un problème avec mon système de sécurité m'a retenu.",
            "J'ai eu un mal de dos intense ce matin.",
            "Une coupure de gaz m'a obligé à rester chez moi.",
            "J'ai été appelé pour une urgence dans ma résidence.",
            "Un proche a eu besoin d'un accompagnement urgent à l'aéroport.",
            "J'ai dû emmener mon animal de compagnie chez le vétérinaire.",
            "Un colis urgent devait être réceptionné ce matin."
        ],
        drole: [
            "Mon chien a confondu mes clés avec un steak, j'attends qu'il les rende.",
            "J'ai glissé sur une banane, et Mario Kart a pris le contrôle de ma vie.",
            "Un pigeon m'a pris pour un distributeur automatique et a volé mes notes.",
            "Je ne pouvais pas partir, une licorne m'a menacé avec sa corne.",
            "J'étais coincé dans un rêve où j'étais un héros… mais le réveil était mon pire ennemi.",
            "Mon ordinateur m'a dit qu'il était en burn-out et qu'il prenait un congé sabbatique.",
            "Une armée de tortues ninja a bloqué ma route en pleine mission secrète.",
            "Un extraterrestre m'a enlevé pour m'apprendre à danser… je suis mauvais élève.",
            "Mon chat a enterré mes chaussures comme si c'étaient des trésors.",
            "Mon grille-pain a décidé de jouer à 'Qui explosera le plus fort ?'.",
            "Un fantôme m'a volé mes chaussettes, apparemment, elles sont rares dans l'au-delà.",
            "Mon poisson rouge voulait me raconter ses rêves aquatiques… c'était captivant.",
            "Une vache faisait la circulation et m'a dit que je n'étais pas prioritaire.",
            "J'ai reçu une lettre de Poudlard… mais ils m'ont refusé car je suis trop vieux.",
            "Un Rubik's Cube m'a mis au défi et j'ai perdu trois heures de ma vie.",
            "Mon miroir m'a dit : 'Pas aujourd'hui, frère', alors je l'ai écouté.",
            "Un écureuil m'a défié à une bataille de noisettes, je ne pouvais pas refuser.",
            "J'ai essayé de devenir invisible, mais tout ce que j'ai réussi à cacher, c'est ma dignité.",
            "Mon réveil a déclaré une grève générale… je ne savais même pas qu'il avait un syndicat.",
            "Un troupeau de moutons m'a bloqué en criant 'On veut être des nuages !'.",
            "Mes draps m'ont pris en otage, et je suis faible face à leur douceur.",
            "Un oiseau m'a volé ma carte bancaire, il part en vacances à Dubaï.",
            "Un super-héros m'a demandé de l'aider… apparemment, sauver le monde, c'est difficile en solo.",
            "Mon café m'a fait la gueule parce que je l'avais mal dosé.",
            "Mon chargeur a disparu, il a dit qu'il méritait une pause après m'avoir sauvé trop de fois.",
            "Une intelligence artificielle m'a dit : 'Non, pas aujourd'hui.' J'ai obéi.",
            "Un ascenseur m'a téléporté en 1850, et honnêtement, c'était sympa là-bas.",
            "Mon ombre a refusé de me suivre, apparemment, je ne suis pas un bon leader.",
            "Un dinosaure a bloqué mon chemin en cherchant ses œufs… je ne pouvais pas le déranger.",
            "J'ai été pris au piège dans une machine à remonter le temps. J'arrive tout droit de l'âge de pierre.",
            "Une armée de fourmis géantes a envahi ma cuisine. J'ai dû négocier une trêve.",
            "Un magicien a transformé mon bus en citrouille, et je n'avais pas de carrosse de rechange.",
            "Mon frigo a congelé mon petit-déjeuner en me disant : 'Pas de plaisir aujourd'hui'.",
            "Je me suis battu avec ma créativité, et elle a gagné par abandon.",
            "Mon téléphone parlait une langue extraterrestre ce matin, je suis en cours de traduction.",
            "Une pluie de grenouilles m'a bloqué… et une m'a traité d'imposteur.",
            "J'étais en compétition mondiale pour le titre de procrastinateur suprême… j'ai gagné.",
            "Mon tapis m'a dit : 'Reste, je te protégerai du froid.'",
            "Un dragon m'a bloqué le chemin en me demandant mon Wi-Fi.",
            "Mon parapluie a refusé de fonctionner, il a dit qu'il était en congé parental.",
            "J'ai dû négocier avec un chat mafieux pour récupérer mes clés.",
            "Un kangourou m'a embarqué dans sa poche, mais il a oublié la destination.",
            "J'étais en duel avec une araignée géante, et elle voulait partager mon petit-déjeuner.",
            "Un jeu vidéo m'a absorbé, et j'étais trop nul pour m'en échapper.",
            "Un pirate m'a volé ma connexion Internet, apparemment, il préfère les torrents.",
            "Une forêt magique m'a kidnappé et m'a forcé à chanter avec les fées.",
            "Mon vélo a déclaré qu'il voulait devenir une licorne et refuse de rouler.",
            "Mon coussin m'a dit qu'il méritait un câlin de 10 heures, et je n'ai pas pu dire non.",
            "J'étais en train de m'excuser auprès d'une guêpe pour avoir mal fermé ma fenêtre.",
            "Un arbre m'a raconté sa vie, et honnêtement, c'était une super histoire.",
            "Ma connexion Wi-Fi a décidé qu'elle préférait les vacances sans moi.",
            "Je jouais à Saute Connard.",
            "Je regardais un live de Khoti.",
            "Je me suis fais embêter par des vilains sur la banane en direction du site B.",
            "Il y avait trop de monstres à proximité, je n'ai pas pu dormir.",
            "Nick voulait rejouer 🥺.",
            "J'étais en RDV avec Timmy. Je regrette...",
            "Un lama m'a bloqué la route, il voulait négocier pour une selfie.",
            "Ma plante verte m'a supplié de rester, elle voulait parler de ses problèmes d'humidité.",
            "Une sirène m'a appelé pour l'aider à déménager son aquarium.",
            "Un champignon géant est apparu dans ma cuisine, il voulait discuter de biodiversité.",
            "Mon lit m'a défié à un bras de fer, et il a gagné.",
            "J'étais en plein combat de karaté avec une mouche, elle était bien trop rapide.",
            "Un alien m'a offert un café galactique, mais il m'a fallu une heure pour le boire.",
            "Mon frigo m'a emprisonné, il disait que je volais trop de snacks.",
            "Un troupeau de licornes a envahi mon jardin et m'a demandé de les aider à trouver un arc-en-ciel.",
            "Mon horloge s'est rebellée et a décidé de tourner en sens inverse.",
            "Mon tapis a pris vie et m'a fait faire un tour du monde en 80 secondes.",
            "Un trou noir est apparu dans mon salon, j'ai perdu mon temps (et mon canapé).",
            "Une tribu de fourmis m'a élu roi et voulait que je reste pour leur donner des ordres.",
            "J'étais coincé dans une guerre civile entre mes chaussettes et mes chaussures.",
            "Une araignée m'a supplié de lui apprendre à coder.",
            "Un hibou m'a remis une lettre disant que je devais rester chez moi pour une mission secrète.",
            "Un dragon m'a proposé un stage pour apprendre à cracher du feu.",
            "Mon grille-pain voulait organiser une fête avec mon micro-ondes.",
            "J'étais en train d'apprendre à ma télécommande à voler… sans succès.",
            "Un vortex temporel m'a ramené à l'époque des dinosaures, j'ai failli devenir leur dîner.",
            "J'ai reçu un appel de mon double du futur, et il m'a dit de ne pas sortir.",
            "Un pigeon m'a pris en otage et m'a demandé des graines en rançon.",
            "Ma brosse à dents s'est rebellée et m'a déclaré la guerre.",
            "Une invasion de petits robots voulait conquérir ma cuisine.",
            "Mon miroir m'a défié à une partie de pierre-papier-ciseaux.",
            "Un troll sous mon lit voulait que je paie un péage pour sortir de ma chambre.",
            "Mon lave-vaisselle a décidé de se venger en lavant mes chaussettes.",
            "Un gnome de jardin m'a invité à un pique-nique et je ne pouvais pas refuser.",
            "Mon voisin m'a demandé de l'aider à attraper une étoile filante.",
            "J'étais occupé à compter les étoiles dans ma soupe.",
            "Un robot aspirateur m'a demandé des conseils de navigation.",
            "J'étais bloqué dans une conversation philosophique avec mon chat.",
            "Un fantôme voulait que je lui apprenne à faire des grimaces effrayantes.",
            "Mon oreiller m'a raconté des histoires jusqu'à ce que je m'endorme à nouveau.",
            "Un troll m'a défié à un jeu d'échecs… il est vraiment doué.",
            "Mon hamster voulait un coaching en développement personnel.",
            "Un arc-en-ciel s'est effondré dans mon jardin, j'ai dû le réparer.",
            "J'étais occupé à fabriquer un parachute pour ma souris.",
            "Un poulpe m'a appelé pour une interview sur la vie marine.",
            "Mon aspirateur s'est transformé en machine à remonter le temps, et j'ai voyagé par accident.",
            "J'étais coincé dans une réunion avec mes plantes, elles voulaient plus de soleil.",
            "Un chat du voisin m'a pris pour un arbre à chat… et il a refusé de descendre.",
            "Un mini-tremblement de terre a fait tomber mon bol de céréales, j'ai dû tout nettoyer.",
            "Mon vélo a décidé d'apprendre à voler, il a échoué… avec moi dessus.",
            "Un esprit de Noël m'a retenu pour emballer des cadeaux hors saison.",
            "Ma console de jeux m'a demandé une mise à jour émotionnelle avant de fonctionner.",
            "Un magicien m'a fait disparaître et a oublié comment me ramener.",
            "J'étais coincé dans un labyrinthe d'oreillers géants.",
            "J'attendais une réponse de UpSkilling.",    
            "Je fesai un câlin à Jérôme.",
            "J'ai pété.",
            "Sur une échelle de 1 à 10 ? Quelles sont les chances que tu calcules cette excuse ?",
            "Je mangeais mes pâtes préférées avec MON AMIIIIIII 🤌",
            "J'admirais Kubernetis 🥵",
            "Désolé je génère des excuses.",
            "Je donnais un titre à One__IQ",
            "J'installais Brawlhalla."
        ]
    };

    let selectedExcuse;

    if (category === "aleatoire") {
        const combinedExcuses = [...excuses.serieuse, ...excuses.drole];
        const randomIndex = Math.floor(Math.random() * combinedExcuses.length);
        selectedExcuse = combinedExcuses[randomIndex];
    } else if (excuses[category]) {
        const randomIndex = Math.floor(Math.random() * excuses[category].length);
        selectedExcuse = excuses[category][randomIndex];
    } else {
        selectedExcuse = "Catégorie invalide.";
    }

    displayExcuseWithAnimation(selectedExcuse);
}
