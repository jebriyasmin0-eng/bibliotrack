// =====================================================================
// stockage.js — garde les données dans le navigateur (localStorage),
// pour qu'elles soient toujours là quand on revient sur le site.
// =====================================================================

const CLE_STOCKAGE = "bibliotrack";

// Charge les données enregistrées, ou les données de démo la première fois
function chargerDonnees() {
    try {
        const texte = localStorage.getItem(CLE_STOCKAGE);
        if (texte) return JSON.parse(texte);
    } catch (e) {
        console.warn("Lecture impossible, on repart des données de démo", e);
    }
    return donneesDeDemo();
}

function enregistrerDonnees(donnees) {
    try {
        localStorage.setItem(CLE_STOCKAGE, JSON.stringify(donnees));
    } catch (e) {
        console.warn("Enregistrement impossible (navigation privée ?)", e);
    }
}

function donneesDeDemo() {
    return {
        livres: structuredClone(LIVRES_DEMO),
        eleves: structuredClone(ELEVES_DEMO),
        emprunts: genererEmprunts(aujourdhuiTexte()),
    };
}
