// Tests des règles de la bibliothèque.
// Lancer avec :  node --test tests/
const test = require("node:test");
const assert = require("node:assert");
const c = require("../js/calculs.js");

const AUJ = "2026-11-18";
// Petite fonction pour fabriquer un emprunt de test
const emprunt = (id, livreId, eleveId, dateEmprunt, dateRetour = null) =>
    ({ id, livreId, eleveId, dateEmprunt, dateRetour });

test("ajouterJours passe correctement d'un mois à l'autre", () => {
    assert.strictEqual(c.ajouterJours("2026-01-25", 14), "2026-02-08");
    assert.strictEqual(c.ajouterJours("2026-03-01", -1), "2026-02-28");
});

test("un livre se rend 14 jours après l'emprunt", () => {
    assert.strictEqual(c.dateRetourPrevue(emprunt(1, 1, 1, "2026-11-01")), "2026-11-15");
});

test("calcul des jours de retard", () => {
    assert.strictEqual(c.joursDeRetard(emprunt(1, 1, 1, "2026-11-10"), AUJ), 0);   // pas encore en retard
    assert.strictEqual(c.joursDeRetard(emprunt(1, 1, 1, "2026-11-01"), AUJ), 3);   // devait rendre le 15
    assert.strictEqual(c.joursDeRetard(emprunt(1, 1, 1, "2026-10-01", "2026-10-20"), AUJ), 5); // rendu en retard
});

test("un livre rendu n'est plus en retard, même s'il a été rendu tard", () => {
    assert.strictEqual(c.estEnRetard(emprunt(1, 1, 1, "2026-10-01", "2026-10-20"), AUJ), false);
});

test("les retards sont triés du plus long au plus court", () => {
    const liste = [emprunt(1, 1, 1, "2026-11-01"), emprunt(2, 2, 2, "2026-10-20"), emprunt(3, 3, 3, "2026-11-15")];
    assert.deepStrictEqual(c.retards(liste, AUJ).map(e => e.id), [2, 1]);
});

test("on ne peut pas emprunter un livre déjà emprunté", () => {
    const liste = [emprunt(1, 7, 1, "2026-11-10")];
    assert.match(c.verifierEmprunt(2, 7, liste, AUJ), /déjà emprunté/);
});

test("un élève avec un retard ne peut pas emprunter", () => {
    const liste = [emprunt(1, 7, 1, "2026-10-01")];
    assert.match(c.verifierEmprunt(1, 8, liste, AUJ), /retard/);
});

test("un élève ne peut pas avoir plus de 3 livres", () => {
    const liste = [emprunt(1, 1, 1, "2026-11-10"), emprunt(2, 2, 1, "2026-11-11"), emprunt(3, 3, 1, "2026-11-12")];
    assert.match(c.verifierEmprunt(1, 4, liste, AUJ), /3 livres/);
    assert.strictEqual(c.verifierEmprunt(2, 4, liste, AUJ), null);   // un autre élève peut
});

test("taux de retour à l'heure", () => {
    const liste = [
        emprunt(1, 1, 1, "2026-10-01", "2026-10-10"),   // à l'heure
        emprunt(2, 2, 1, "2026-10-01", "2026-10-30"),   // en retard
        emprunt(3, 3, 1, "2026-11-10"),                 // pas encore rendu : ne compte pas
    ];
    assert.strictEqual(c.tauxRetourALHeure(liste), 0.5);
});

test("emprunts par mois : 12 mois, le dernier est le mois actuel", () => {
    const liste = [emprunt(1, 1, 1, "2026-11-02"), emprunt(2, 2, 1, "2026-11-05"), emprunt(3, 3, 1, "2025-12-20")];
    const parMois = c.empruntsParMois(liste, AUJ);
    assert.strictEqual(parMois.length, 12);
    assert.deepStrictEqual(parMois[0], { mois: "2025-12", nombre: 1 });
    assert.deepStrictEqual(parMois[11], { mois: "2026-11", nombre: 2 });
});

test("livres populaires et catégories", () => {
    const livres = [
        { id: 1, titre: "A", auteur: "x", categorie: "Roman" },
        { id: 2, titre: "B", auteur: "y", categorie: "Poésie" },
    ];
    const liste = [emprunt(1, 2, 1, "2026-01-01", "2026-01-05"), emprunt(2, 2, 1, "2026-02-01", "2026-02-05"),
                   emprunt(3, 1, 1, "2026-03-01", "2026-03-05")];
    assert.deepStrictEqual(c.livresPopulaires(livres, liste, 1).map(x => x.livre.titre), ["B"]);
    assert.deepStrictEqual(c.empruntsParCategorie(livres, liste), [
        { categorie: "Poésie", nombre: 2 }, { categorie: "Roman", nombre: 1 }]);
});

test("recherche par titre ou auteur, sans tenir compte des majuscules", () => {
    const livres = [
        { id: 1, titre: "Le Petit Prince", auteur: "Saint-Exupéry", categorie: "Roman" },
        { id: 2, titre: "Cosmos", auteur: "Carl Sagan", categorie: "Sciences" },
    ];
    assert.strictEqual(c.rechercherLivres(livres, "prince", "").length, 1);
    assert.strictEqual(c.rechercherLivres(livres, "SAGAN", "").length, 1);
    assert.strictEqual(c.rechercherLivres(livres, "", "Sciences")[0].titre, "Cosmos");
});
