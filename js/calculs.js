// =====================================================================
// calculs.js — toutes les règles de la bibliothèque.
// Ces fonctions ne touchent pas à la page : elles prennent des données
// et renvoient un résultat. C'est ce qui permet de les tester facilement.
// =====================================================================

const DUREE_EMPRUNT = 14;        // un livre se garde 14 jours
const MAX_EMPRUNTS_ELEVE = 3;    // un élève peut avoir 3 livres en même temps

// ---------- Dates (format "AAAA-MM-JJ") ----------

function ajouterJours(dateTexte, jours) {
    const d = new Date(dateTexte + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() + jours);
    return d.toISOString().slice(0, 10);
}

function joursEntre(debut, fin) {
    const ms = new Date(fin + "T00:00:00Z") - new Date(debut + "T00:00:00Z");
    return Math.round(ms / 86400000);
}

function aujourdhuiTexte() {
    return new Date().toISOString().slice(0, 10);
}

// ---------- Emprunts ----------

function dateRetourPrevue(emprunt) {
    return ajouterJours(emprunt.dateEmprunt, DUREE_EMPRUNT);
}

// Un emprunt est "en cours" tant que le livre n'est pas rendu
function estEnCours(emprunt) {
    return emprunt.dateRetour === null;
}

// Nombre de jours de retard (0 si pas en retard)
function joursDeRetard(emprunt, aujourdhui) {
    const fin = emprunt.dateRetour ?? aujourdhui;   // rendu : on compte jusqu'au rendu
    return Math.max(0, joursEntre(dateRetourPrevue(emprunt), fin));
}

function estEnRetard(emprunt, aujourdhui) {
    return estEnCours(emprunt) && joursDeRetard(emprunt, aujourdhui) > 0;
}

function empruntsEnCours(emprunts) {
    return emprunts.filter(estEnCours);
}

// Les retards, du plus long au plus court
function retards(emprunts, aujourdhui) {
    return emprunts
        .filter(e => estEnRetard(e, aujourdhui))
        .sort((a, b) => joursDeRetard(b, aujourdhui) - joursDeRetard(a, aujourdhui));
}

function estDisponible(livreId, emprunts) {
    return !emprunts.some(e => e.livreId === livreId && estEnCours(e));
}

// Vérifie qu'un emprunt est autorisé. Renvoie null si tout va bien,
// sinon un message qui explique pourquoi.
function verifierEmprunt(eleveId, livreId, emprunts, aujourdhui) {
    if (!estDisponible(livreId, emprunts)) {
        return "Ce livre est déjà emprunté.";
    }
    const siens = empruntsEnCours(emprunts).filter(e => e.eleveId === eleveId);
    if (siens.some(e => estEnRetard(e, aujourdhui))) {
        return "Cet élève a un livre en retard : il doit d'abord le rendre.";
    }
    if (siens.length >= MAX_EMPRUNTS_ELEVE) {
        return `Cet élève a déjà ${MAX_EMPRUNTS_ELEVE} livres.`;
    }
    return null;
}

// ---------- Statistiques du tableau de bord ----------

// Part des livres rendus à temps, parmi les livres rendus (entre 0 et 1)
function tauxRetourALHeure(emprunts) {
    const rendus = emprunts.filter(e => !estEnCours(e));
    if (rendus.length === 0) return 1;
    const aLHeure = rendus.filter(e => joursDeRetard(e) === 0);
    return aLHeure.length / rendus.length;
}

// Nombre d'emprunts pour chacun des 12 derniers mois.
// Renvoie [{ mois: "2026-01", nombre: 12 }, ...] du plus ancien au plus récent.
function empruntsParMois(emprunts, aujourdhui) {
    const resultat = [];
    const d = new Date(aujourdhui.slice(0, 7) + "-01T00:00:00Z");
    d.setUTCMonth(d.getUTCMonth() - 11);
    for (let i = 0; i < 12; i++) {
        const mois = d.toISOString().slice(0, 7);
        const nombre = emprunts.filter(e => e.dateEmprunt.startsWith(mois)).length;
        resultat.push({ mois, nombre });
        d.setUTCMonth(d.getUTCMonth() + 1);
    }
    return resultat;
}

// Les n livres les plus empruntés : [{ livre, nombre }, ...]
function livresPopulaires(livres, emprunts, n) {
    return livres
        .map(livre => ({ livre, nombre: emprunts.filter(e => e.livreId === livre.id).length }))
        .filter(x => x.nombre > 0)
        .sort((a, b) => b.nombre - a.nombre || a.livre.titre.localeCompare(b.livre.titre))
        .slice(0, n);
}

// Nombre d'emprunts par catégorie : [{ categorie, nombre }, ...], le plus grand d'abord
function empruntsParCategorie(livres, emprunts) {
    const compte = {};
    for (const e of emprunts) {
        const livre = livres.find(l => l.id === e.livreId);
        if (livre) compte[livre.categorie] = (compte[livre.categorie] ?? 0) + 1;
    }
    return Object.entries(compte)
        .map(([categorie, nombre]) => ({ categorie, nombre }))
        .sort((a, b) => b.nombre - a.nombre);
}

// Recherche dans le titre, l'auteur ; filtre par catégorie ("" = toutes)
function rechercherLivres(livres, texte, categorie) {
    const t = texte.trim().toLowerCase();
    return livres.filter(l =>
        (categorie === "" || l.categorie === categorie) &&
        (t === "" || l.titre.toLowerCase().includes(t) || l.auteur.toLowerCase().includes(t)));
}

// Permet aux tests (Node.js) d'utiliser ces fonctions. Le navigateur ignore cette partie.
if (typeof module !== "undefined") {
    module.exports = {
        DUREE_EMPRUNT, MAX_EMPRUNTS_ELEVE, ajouterJours, joursEntre, dateRetourPrevue,
        estEnCours, joursDeRetard, estEnRetard, empruntsEnCours, retards, estDisponible,
        verifierEmprunt, tauxRetourALHeure, empruntsParMois, livresPopulaires,
        empruntsParCategorie, rechercherLivres,
    };
}
