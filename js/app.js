// =====================================================================
// app.js — fait le lien entre les données et la page :
// afficher les tableaux, réagir aux clics et aux formulaires.
// =====================================================================

let donnees = chargerDonnees();
const AUJOURDHUI = aujourdhuiTexte();

// ---------- Petites aides ----------

// Retrouver un livre ou un élève à partir de son numéro
const livreParId = id => donnees.livres.find(l => l.id === id);
const eleveParId = id => donnees.eleves.find(e => e.id === id);

// Afficher une date "2026-11-18" au format "18/11/2026"
const dateFr = texte => texte.split("-").reverse().join("/");

// Créer une ligne de tableau. textContent (et pas innerHTML) affiche le texte
// tel quel : un titre comme "<b>" ne peut pas casser la page.
function ligne(cellules) {
    const tr = document.createElement("tr");
    for (const contenu of cellules) {
        const td = document.createElement("td");
        if (contenu instanceof Node) td.append(contenu);
        else td.textContent = contenu;
        tr.append(td);
    }
    return tr;
}

function badge(texte, classe) {
    const span = document.createElement("span");
    span.className = "badge " + classe;
    span.textContent = texte;
    return span;
}

function sauverEtAfficher() {
    enregistrerDonnees(donnees);
    toutAfficher();
}

// ---------- Tableau de bord ----------

function afficherTableauDeBord() {
    const { livres, emprunts } = donnees;
    const listeRetards = retards(emprunts, AUJOURDHUI);

    document.getElementById("nbLivres").textContent = livres.length;
    document.getElementById("nbEnCours").textContent = empruntsEnCours(emprunts).length;
    document.getElementById("nbRetards").textContent = listeRetards.length;
    document.getElementById("tauxALHeure").textContent =
        Math.round(tauxRetourALHeure(emprunts) * 100) + " %";

    // Graphique en colonnes : la hauteur de chaque colonne est proportionnelle au nombre
    const parMois = empruntsParMois(emprunts, AUJOURDHUI);
    const max = Math.max(1, ...parMois.map(m => m.nombre));
    const nomsMois = ["janv", "févr", "mars", "avr", "mai", "juin",
                      "juil", "août", "sept", "oct", "nov", "déc"];
    const graphe = document.getElementById("grapheMois");
    graphe.replaceChildren();
    for (const { mois, nombre } of parMois) {
        const colonne = document.createElement("div");
        colonne.className = "colonne";
        colonne.innerHTML = `<span class="valeur"></span><div class="barre"></div><span class="mois"></span>`;
        colonne.querySelector(".valeur").textContent = nombre;
        colonne.querySelector(".barre").style.height = (nombre / max * 100) + "%";
        colonne.querySelector(".mois").textContent = nomsMois[Number(mois.slice(5)) - 1];
        graphe.append(colonne);
    }

    afficherListeBarres("populaires",
        livresPopulaires(livres, emprunts, 5).map(x => ({ nom: x.livre.titre, nombre: x.nombre })));
    afficherListeBarres("categories",
        empruntsParCategorie(livres, emprunts).map(x => ({ nom: x.categorie, nombre: x.nombre })));

    const corps = document.getElementById("tableRetards");
    corps.replaceChildren();
    for (const e of listeRetards) {
        const jours = joursDeRetard(e, AUJOURDHUI);
        corps.append(ligne([
            eleveParId(e.eleveId).nom,
            livreParId(e.livreId).titre,
            dateFr(dateRetourPrevue(e)),
            badge(jours + (jours > 1 ? " jours" : " jour"), "rouge"),
        ]));
    }
    document.getElementById("aucunRetard").hidden = listeRetards.length > 0;
}

// Une liste où chaque élément a une barre proportionnelle à son nombre
function afficherListeBarres(idListe, elements) {
    const liste = document.getElementById(idListe);
    liste.replaceChildren();
    const max = Math.max(1, ...elements.map(x => x.nombre));
    for (const { nom, nombre } of elements) {
        const li = document.createElement("li");
        li.innerHTML = `<span class="nom"></span><span class="nombre"></span><div class="fond"><div class="barre"></div></div>`;
        li.querySelector(".nom").textContent = nom;
        li.querySelector(".nombre").textContent = nombre;
        li.querySelector(".barre").style.width = (nombre / max * 100) + "%";
        liste.append(li);
    }
}

// ---------- Livres ----------

function categories() {
    return [...new Set(donnees.livres.map(l => l.categorie))].sort();
}

function afficherLivres() {
    const texte = document.getElementById("recherche").value;
    const categorie = document.getElementById("filtreCategorie").value;
    const corps = document.getElementById("tableLivres");
    corps.replaceChildren();
    for (const livre of rechercherLivres(donnees.livres, texte, categorie)) {
        const dispo = estDisponible(livre.id, donnees.emprunts);
        corps.append(ligne([
            livre.titre, livre.auteur, livre.categorie,
            dispo ? badge("Disponible", "vert") : badge("Emprunté", "gris"),
        ]));
    }
}

function remplirListesCategories() {
    const filtre = document.getElementById("filtreCategorie");
    const choixActuel = filtre.value;
    filtre.replaceChildren(new Option("Toutes les catégories", ""));
    const suggestions = document.getElementById("listeCategories");
    suggestions.replaceChildren();
    for (const c of categories()) {
        filtre.append(new Option(c, c));
        suggestions.append(new Option(c));
    }
    filtre.value = choixActuel;
}

document.getElementById("recherche").addEventListener("input", afficherLivres);
document.getElementById("filtreCategorie").addEventListener("change", afficherLivres);

document.getElementById("formLivre").addEventListener("submit", evenement => {
    evenement.preventDefault();                // empêche la page de se recharger
    const form = evenement.target;
    const nouvelId = Math.max(0, ...donnees.livres.map(l => l.id)) + 1;
    donnees.livres.push({
        id: nouvelId,
        titre: form.titre.value.trim(),
        auteur: form.auteur.value.trim(),
        categorie: form.categorie.value.trim(),
    });
    form.reset();
    sauverEtAfficher();
});

// ---------- Emprunts ----------

function afficherEmprunts() {
    // Listes déroulantes du formulaire
    const choixEleve = document.getElementById("choixEleve");
    const choixLivre = document.getElementById("choixLivre");
    choixEleve.replaceChildren(new Option("Choisir un élève", ""));
    for (const e of donnees.eleves) choixEleve.append(new Option(`${e.nom} (${e.classe})`, e.id));
    choixLivre.replaceChildren(new Option("Choisir un livre disponible", ""));
    for (const l of donnees.livres.filter(l => estDisponible(l.id, donnees.emprunts))) {
        choixLivre.append(new Option(l.titre, l.id));
    }

    // Tableau des emprunts en cours, les plus anciens d'abord
    const corps = document.getElementById("tableEnCours");
    corps.replaceChildren();
    const enCours = empruntsEnCours(donnees.emprunts)
        .sort((a, b) => a.dateEmprunt.localeCompare(b.dateEmprunt));
    for (const e of enCours) {
        const bouton = document.createElement("button");
        bouton.textContent = "Retour";
        bouton.addEventListener("click", () => enregistrerRetour(e.id));
        const tr = ligne([
            eleveParId(e.eleveId).nom,
            livreParId(e.livreId).titre,
            dateFr(e.dateEmprunt),
            estEnRetard(e, AUJOURDHUI)
                ? badge(dateFr(dateRetourPrevue(e)) + " (en retard)", "rouge")
                : dateFr(dateRetourPrevue(e)),
            bouton,
        ]);
        corps.append(tr);
    }
}

function enregistrerRetour(empruntId) {
    const emprunt = donnees.emprunts.find(e => e.id === empruntId);
    emprunt.dateRetour = AUJOURDHUI;
    afficherMessage(`« ${livreParId(emprunt.livreId).titre} » a été rendu.`, "ok");
    sauverEtAfficher();
}

function afficherMessage(texte, type) {
    const message = document.getElementById("message");
    message.textContent = texte;
    message.className = "message " + type;
    message.hidden = false;
}

document.getElementById("formEmprunt").addEventListener("submit", evenement => {
    evenement.preventDefault();
    const eleveId = Number(evenement.target.eleve.value);
    const livreId = Number(evenement.target.livre.value);
    const probleme = verifierEmprunt(eleveId, livreId, donnees.emprunts, AUJOURDHUI);
    if (probleme) {
        afficherMessage(probleme, "erreur");
        return;
    }
    donnees.emprunts.push({
        id: Math.max(0, ...donnees.emprunts.map(e => e.id)) + 1,
        livreId, eleveId, dateEmprunt: AUJOURDHUI, dateRetour: null,
    });
    afficherMessage(`Emprunt enregistré : à rendre le ${dateFr(ajouterJours(AUJOURDHUI, DUREE_EMPRUNT))}.`, "ok");
    sauverEtAfficher();
});

// ---------- Navigation entre les onglets ----------

for (const onglet of document.querySelectorAll(".onglet")) {
    onglet.addEventListener("click", () => {
        document.querySelectorAll(".onglet").forEach(o => o.classList.toggle("actif", o === onglet));
        document.querySelectorAll(".section").forEach(s =>
            s.classList.toggle("visible", s.id === onglet.dataset.section));
    });
}

document.getElementById("reinitialiser").addEventListener("click", () => {
    donnees = donneesDeDemo();
    document.getElementById("message").hidden = true;
    sauverEtAfficher();
});

// ---------- Démarrage ----------

function toutAfficher() {
    remplirListesCategories();
    afficherTableauDeBord();
    afficherLivres();
    afficherEmprunts();
}

toutAfficher();
