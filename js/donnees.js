// =====================================================================
// donnees.js — les données de démonstration (fictives).
// Les livres et les élèves sont écrits à la main ; l'historique des
// emprunts est fabriqué par la fonction genererEmprunts(), par rapport
// à la date du jour, pour que la démo soit toujours à jour.
// =====================================================================

const LIVRES_DEMO = [
    { id: 1,  titre: "Le Petit Prince", auteur: "Antoine de Saint-Exupéry", categorie: "Roman" },
    { id: 2,  titre: "L'Étranger", auteur: "Albert Camus", categorie: "Roman" },
    { id: 3,  titre: "Les Misérables", auteur: "Victor Hugo", categorie: "Roman" },
    { id: 4,  titre: "Madame Bovary", auteur: "Gustave Flaubert", categorie: "Roman" },
    { id: 5,  titre: "Germinal", auteur: "Émile Zola", categorie: "Roman" },
    { id: 6,  titre: "Le Rouge et le Noir", auteur: "Stendhal", categorie: "Roman" },
    { id: 7,  titre: "1984", auteur: "George Orwell", categorie: "Roman" },
    { id: 8,  titre: "Saison de la migration vers le nord", auteur: "Tayeb Salih", categorie: "Roman" },
    { id: 9,  titre: "Les Fleurs du mal", auteur: "Charles Baudelaire", categorie: "Poésie" },
    { id: 10, titre: "Alcools", auteur: "Guillaume Apollinaire", categorie: "Poésie" },
    { id: 11, titre: "Les Chants de la vie", auteur: "Abou el Kacem Chebbi", categorie: "Poésie" },
    { id: 12, titre: "Le Cid", auteur: "Pierre Corneille", categorie: "Théâtre" },
    { id: 13, titre: "Le Malade imaginaire", auteur: "Molière", categorie: "Théâtre" },
    { id: 14, titre: "Antigone", auteur: "Jean Anouilh", categorie: "Théâtre" },
    { id: 15, titre: "Rhinocéros", auteur: "Eugène Ionesco", categorie: "Théâtre" },
    { id: 16, titre: "Une brève histoire du temps", auteur: "Stephen Hawking", categorie: "Sciences" },
    { id: 17, titre: "L'Origine des espèces", auteur: "Charles Darwin", categorie: "Sciences" },
    { id: 18, titre: "Le Théorème du perroquet", auteur: "Denis Guedj", categorie: "Sciences" },
    { id: 19, titre: "Cosmos", auteur: "Carl Sagan", categorie: "Sciences" },
    { id: 20, titre: "Analyse MP", auteur: "Collectif", categorie: "Manuel" },
    { id: 21, titre: "Algèbre MP", auteur: "Collectif", categorie: "Manuel" },
    { id: 22, titre: "Physique MP", auteur: "Collectif", categorie: "Manuel" },
    { id: 23, titre: "Informatique pour tous", auteur: "Collectif", categorie: "Manuel" },
    { id: 24, titre: "Histoire de la Tunisie", auteur: "Collectif", categorie: "Histoire" },
    { id: 25, titre: "Le Journal d'Anne Frank", auteur: "Anne Frank", categorie: "Histoire" },
    { id: 26, titre: "Les Croisades vues par les Arabes", auteur: "Amin Maalouf", categorie: "Histoire" },
    { id: 27, titre: "Sapiens", auteur: "Yuval Noah Harari", categorie: "Histoire" },
    { id: 28, titre: "Astérix le Gaulois", auteur: "Goscinny et Uderzo", categorie: "Bande dessinée" },
    { id: 29, titre: "Persepolis", auteur: "Marjane Satrapi", categorie: "Bande dessinée" },
    { id: 30, titre: "Tintin au Tibet", auteur: "Hergé", categorie: "Bande dessinée" },
];

const ELEVES_DEMO = [
    { id: 1,  nom: "Amel Trabelsi", classe: "1re S" },
    { id: 2,  nom: "Youssef Ben Salem", classe: "1re S" },
    { id: 3,  nom: "Ines Haddad", classe: "2nde" },
    { id: 4,  nom: "Karim Mansour", classe: "2nde" },
    { id: 5,  nom: "Salma Gharbi", classe: "Terminale" },
    { id: 6,  nom: "Mehdi Chaabane", classe: "Terminale" },
    { id: 7,  nom: "Rania Jaziri", classe: "1re S" },
    { id: 8,  nom: "Nour Ayari", classe: "2nde" },
    { id: 9,  nom: "Omar Ferchichi", classe: "Terminale" },
    { id: 10, nom: "Lina Ben Ammar", classe: "1re S" },
    { id: 11, nom: "Hedi Bouaziz", classe: "2nde" },
    { id: 12, nom: "Sarra Mejri", classe: "Terminale" },
];

// Petit générateur de nombres "aléatoires" reproductible :
// avec la même graine, il donne toujours la même suite de nombres.
function generateurAleatoire(graine) {
    let x = graine;
    return () => {
        x = (x * 1103515245 + 12345) % 2147483648;
        return x / 2147483648;
    };
}

// Fabrique l'historique : environ un an d'emprunts, dont certains en cours
// et quelques-uns en retard.
function genererEmprunts(aujourdhui) {
    const hasard = generateurAleatoire(2026);
    const entier = (min, max) => min + Math.floor(hasard() * (max - min + 1));
    const emprunts = [];
    let id = 1;

    // Livres empruntés en ce moment : [livreId, eleveId, emprunté il y a N jours]
    // (3 d'entre eux dépassent les 14 jours : ce sont les retards de la démo)
    const enCours = [[3, 1, 2], [7, 2, 5], [16, 3, 9], [29, 5, 12], [2, 6, 18],
                     [12, 8, 8], [20, 9, 4], [25, 10, 11], [18, 11, 20], [1, 12, 25]];

    // Date à partir de laquelle chaque livre est libre (un livre ne peut pas
    // être prêté deux fois en même temps)
    const libreLe = {};
    // Date de début de l'emprunt actuel, pour les livres pris en ce moment
    const prisLe = {};
    for (const [livreId, , ilYa] of enCours) {
        prisLe[livreId] = ajouterJours(aujourdhui, -ilYa);
    }

    // 1) Emprunts terminés, du plus ancien au plus récent, sur un an
    for (let jour = 365; jour > 26; jour -= entier(1, 3)) {
        // Math.pow(..., 1.6) favorise les premiers livres : certains sont plus demandés
        const livre = LIVRES_DEMO[Math.floor(Math.pow(hasard(), 1.6) * LIVRES_DEMO.length)];
        const dateEmprunt = ajouterJours(aujourdhui, -jour);
        const duree = hasard() < 0.85 ? entier(3, DUREE_EMPRUNT) : entier(15, 25); // 15 % rendus en retard
        const dateRetour = ajouterJours(dateEmprunt, duree);

        const dejaPris = libreLe[livre.id] !== undefined && dateEmprunt <= libreLe[livre.id];
        const chevaucheEmpruntActuel = prisLe[livre.id] !== undefined && dateRetour >= prisLe[livre.id];
        if (dejaPris || chevaucheEmpruntActuel) continue;   // livre pas disponible : on passe ce jour

        libreLe[livre.id] = dateRetour;
        emprunts.push({
            id: id++, livreId: livre.id, eleveId: entier(1, ELEVES_DEMO.length),
            dateEmprunt, dateRetour,
        });
    }

    // 2) Emprunts en cours (livres pas encore rendus)
    for (const [livreId, eleveId, ilYa] of enCours) {
        emprunts.push({
            id: id++, livreId, eleveId,
            dateEmprunt: ajouterJours(aujourdhui, -ilYa), dateRetour: null,
        });
    }
    return emprunts;
}

if (typeof module !== "undefined") {
    module.exports = { LIVRES_DEMO, ELEVES_DEMO, genererEmprunts };
}
