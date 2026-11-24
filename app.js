/* Mon planning Helios Studio : logique de l'application */
(function () {
  'use strict';

  /* ---------- Libellés ---------- */
  var TYPES = { reel: 'Réel', carrousel: 'Carrousel', story_preparee: 'Story préparée', story_spontanee: 'Story spontanée' };
  var STATUTS = [['a_preparer', 'À préparer'], ['en_cours', 'En cours'], ['prete', 'Prête'], ['programmee', 'Programmée'], ['publiee', 'Publiée']];
  var LIBELLE_STATUT = {};
  STATUTS.forEach(function (s) { LIBELLE_STATUT[s[0]] = s[1]; });
  // Décision de Jodie pour chaque événement
  var DECISIONS = [['a_valider', 'À valider'], ['valide', 'Validé'], ['a_acheter', 'Place à acheter'], ['achetee', 'Place achetée'], ['refuse', 'Je n\'y vais pas']];
  var LIBELLE_DECISION = {};
  DECISIONS.forEach(function (d) { LIBELLE_DECISION[d[0]] = d[1]; });
  var STATUTS_PRETS = ['prete', 'programmee', 'publiee'];
  var JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  var LETTRES = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  var JOURS_COURTS = ['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim'];
  var MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  var MOIS_COURTS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

  /* ---------- Petits logos (dessinés pour l'application) ---------- */
  var ICONES = {
    reel: '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="1.5" y="1.5" width="13" height="13" rx="3.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M6.4 5.1v5.8l4.8-2.9z" fill="currentColor"/></svg>',
    carrousel: '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="1.5" y="4" width="9.5" height="10.5" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M5 1.6h7.4a2 2 0 0 1 2 2v8.2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    story_preparee: '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.3" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="8" cy="8" r="3" fill="currentColor"/></svg>',
    story_spontanee: '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-dasharray="2.4 2.1"/><circle cx="8" cy="8" r="1.8" fill="currentColor"/></svg>'
  };
  function famille(type) {
    if (type === 'reel' || type === 'carrousel') return 'f-post';
    if (type === 'story_preparee' || type === 'story_spontanee') return 'f-story';
    return 'f-' + type;
  }
  function icone(type) { return ICONES[type] ? '<span class="icone ' + famille(type) + '">' + ICONES[type] + '</span>' : ''; }
  function surligne(statut) { return '<span class="surligne sl-' + esc(statut) + '">' + esc(LIBELLE_STATUT[statut] || statut) + '</span>'; }
  function surligneDecision(d) { return '<span class="surligne sl-ev-' + esc(d) + '">' + esc(LIBELLE_DECISION[d]) + '</span>'; }
  function marque(cle) { return ICONES[cle] ? icone(cle) : '<span class="pastille ' + famille(cle) + '"></span>'; }

  var LEGENDE = [
    ['reel', 'Réel'], ['carrousel', 'Carrousel'], ['story_preparee', 'Story préparée'], ['story_spontanee', 'Story spontanée'],
    ['commentaire', 'Commentaire'], ['evenement', 'Événement validé'], ['a-valider', 'Événement à valider'], ['veille', 'Veille Instagram']
  ];

  /* ---------- État ---------- */
  var E = {
    cle: null, planning: null, dossiers: [], luLe: null, horsLigne: false,
    onglet: 'semaine',
    jourSel: null,      // jour choisi dans la semaine
    moisVue: null,      // 1er jour du mois affiché
    jourMois: null,     // jour choisi dans le mois
    enCours: {},
    problemes: []
  };

  /* ---------- Dates (chaînes AAAA-MM-JJ) ---------- */
  function versDate(s) { var p = s.split('-').map(Number); return new Date(Date.UTC(p[0], p[1] - 1, p[2])); }
  function versTexte(d) { return d.toISOString().slice(0, 10); }
  function ajouter(s, n) { var d = versDate(s); d.setUTCDate(d.getUTCDate() + n); return versTexte(d); }
  function ecart(de, a) { return Math.round((versDate(a) - versDate(de)) / 86400000); }
  function jourSemaine(s) { return versDate(s).getUTCDay(); }
  function lundiDe(s) { var j = jourSemaine(s); return ajouter(s, j === 0 ? -6 : 1 - j); }
  function premier(s) { return s.slice(0, 8) + '01'; }
  function moisSuivant(s) { var d = versDate(premier(s)); d.setUTCMonth(d.getUTCMonth() + 1); return versTexte(d); }
  function moisPrecedent(s) { var d = versDate(premier(s)); d.setUTCMonth(d.getUTCMonth() - 1); return versTexte(d); }
  function numJour(s) { var n = versDate(s).getUTCDate(); return n === 1 ? '1er' : String(n); }
  function dateLongue(s) { var d = versDate(s); return JOURS[d.getUTCDay()] + ' ' + numJour(s) + ' ' + MOIS[d.getUTCMonth()]; }
  function dateCourte(s) { var d = versDate(s); return JOURS[d.getUTCDay()].slice(0, 3) + '. ' + numJour(s) + ' ' + MOIS_COURTS[d.getUTCMonth()]; }
  function nomMois(s) { var d = versDate(s); return MOIS[d.getUTCMonth()] + ' ' + d.getUTCFullYear(); }
  function minutes(h) { var p = h.split(':'); return Number(p[0]) * 60 + Number(p[1] || 0); }
  function heure(h) { if (!h) return ''; var p = h.split(':'); return Number(p[0]) + ' h' + (p[1] && p[1] !== '00' ? ' ' + p[1] : ''); }
  function majuscule(t) { return t ? t.charAt(0).toUpperCase() + t.slice(1) : t; }

  function aujourdhui() {
    var force = new URLSearchParams(location.search).get('jour');
    if (force && /^\d{4}-\d{2}-\d{2}$/.test(force)) return force;
    return new Intl.DateTimeFormat('en-CA', { timeZone: CONFIG.fuseau, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  }

  function esc(t) {
    return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---------- Stockage local (confort seulement) ---------- */
  function lireLocal(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function ecrireLocal(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* rien */ } }
  function memoriser() { ecrireLocal('copie', JSON.stringify({ planning: E.planning, dossiers: E.dossiers, luLe: E.luLe.toISOString() })); }

  /* ---------- Clé secrète ---------- */
  function lireCle() {
    var m = location.hash.match(/cle=([A-Za-z0-9]+)/);
    // La clé reste dans l'adresse : l'icône de l'écran d'accueil la garde ainsi à chaque ouverture.
    if (m) { ecrireLocal('cle', m[1]); return m[1]; }
    return lireLocal('cle');
  }

  /* ---------- Échanges avec le messager ---------- */
  function charger() {
    if (!E.cle) { afficherEcranCle(); return Promise.resolve(); }
    document.getElementById('etat-maj').textContent = 'Mise à jour…';
    return fetch(CONFIG.messager + '?cle=' + encodeURIComponent(E.cle) + '&t=' + Date.now())
      .then(function (r) { return r.json(); })
      .then(function (rep) {
        if (!rep.ok) {
          if (rep.erreur === 'cle') { E.cle = null; ecrireLocal('cle', ''); afficherEcranCle('Cette clé ne fonctionne pas.'); return; }
          throw new Error(rep.erreur);
        }
        if (Object.keys(E.enCours).length) return; // un changement est en train de s'enregistrer
        E.planning = rep.planning; E.dossiers = rep.dossiers || []; E.problemes = rep.problemes || []; E.luLe = new Date(); E.horsLigne = false;
        memoriser(); afficher();
      })
      .catch(function () { E.horsLigne = true; afficher(); });
  }

  function envoyer(demande) {
    demande.cle = E.cle;
    return fetch(CONFIG.messager, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(demande) })
      .then(function (r) { return r.json(); })
      .then(function (rep) {
        if (!rep.ok) throw new Error(rep.erreur || 'Erreur');
        E.planning = rep.planning; E.luLe = new Date(); memoriser();
        return rep;
      });
  }

  function changerStatut(id, statut) {
    var el = trouverPublication(id);
    if (!el || el.statut === statut) return;
    var ancien = el.statut;
    el.statut = statut; E.enCours[id] = true; afficher();
    envoyer({ action: 'statut', id: id, statut: statut })
      .catch(function () { el.statut = ancien; alert("Le changement n'a pas pu être enregistré. Vérifie ta connexion et réessaie."); })
      .then(function () { delete E.enCours[id]; afficher(); });
  }

  function deciderEvenement(id, decision) {
    var e = trouverEvenement(id);
    if (!e || decisionDe(e) === decision) return;
    var ancienne = e.decision;
    e.decision = decision; E.enCours[id] = true; afficher();
    envoyer({ action: 'evenement', id: id, decision: decision })
      .catch(function () { e.decision = ancienne; alert("Le changement n'a pas pu être enregistré. Vérifie ta connexion et réessaie."); })
      .then(function () { delete E.enCours[id]; afficher(); });
  }

  function marquerCommentaire(id, fait) {
    var c = commentaires().filter(function (x) { return x.id === id; })[0];
    if (!c) return;
    var ancien = c.fait;
    c.fait = fait; E.enCours[id] = true; afficher();
    envoyer({ action: 'commentaireFait', id: id, fait: fait })
      .catch(function () { c.fait = ancien; alert("Le changement n'a pas pu être enregistré. Vérifie ta connexion et réessaie."); })
      .then(function () { delete E.enCours[id]; afficher(); });
  }

  /* ---------- Lecture des données ---------- */
  function publications() { return (E.planning && E.planning.publications) || []; }
  function tousEvenements() { return (E.planning && E.planning.evenements) || []; }
  function decisionDe(e) { return LIBELLE_DECISION[e.decision] ? e.decision : (e.valide ? 'valide' : 'a_valider'); }
  function estValide(e) { return ['valide', 'a_acheter', 'achetee'].indexOf(decisionDe(e)) >= 0; }
  // Les événements où Jodie ne va pas disparaissent du planning
  function evenements() { return tousEvenements().filter(function (e) { return decisionDe(e) !== 'refuse'; }); }
  function lienSur(u) { return /^https?:\/\//i.test(u || '') ? u : ''; }
  function commentaires() { return (E.planning && E.planning.commentaires) || []; }
  function trouverPublication(id) {
    return publications().concat((E.planning && E.planning.aPlacer) || []).filter(function (p) { return p.id === id; })[0];
  }
  function trouverEvenement(id) { return tousEvenements().filter(function (e) { return e.id === id; })[0]; }

  function motsDe(t) { return String(t).toLowerCase().normalize('NFD').replace(/[^a-z0-9 ]/g, '').split(' ').filter(function (m) { return m.length > 3; }); }
  // Celui retenu lors d'un déplacement, sinon celui du même jour (le plus ressemblant s'il y en a plusieurs)
  function dossierPour(pub) {
    if (pub.dossierId) {
      var retenu = E.dossiers.filter(function (d) { return d.id === pub.dossierId; })[0];
      if (retenu) return retenu;
    }
    var duJour = E.dossiers.filter(function (d) { return d.date === pub.date; });
    if (duJour.length <= 1) return duJour[0] || null;
    var type = pub.type === 'reel' ? 'reel' : pub.type === 'carrousel' ? 'carrousel' : 'story';
    var titre = motsDe(pub.titre);
    function note(d) {
      var nom = motsDe(d.nom);
      return (nom.indexOf(type) >= 0 ? 1 : 0) + 2 * titre.filter(function (m) { return m !== 'story' && nom.indexOf(m) >= 0; }).length;
    }
    return duJour.slice().sort(function (a, b) { return note(b) - note(a); })[0];
  }

  function evenementsDu(jour) { return evenements().filter(function (e) { return e.date <= jour && jour <= (e.dateFin || e.date); }); }
  function commentairesDu(jour) { return commentaires().filter(function (c) { return c.date === jour; }); }
  // Renvoie le lundi d'origine de la veille affichée ce jour-là, sinon null
  function veilleDu(jour) {
    var exceptions = (E.planning && E.planning.veillesDeplacees) || {};
    var deplacee = Object.keys(exceptions).filter(function (lundi) { return exceptions[lundi] === jour; })[0];
    if (deplacee) return deplacee;
    return jourSemaine(jour) === 1 && !exceptions[jour] && jour >= ((E.planning && E.planning.debutPlanning) || '0') ? jour : null;
  }
  function estJourDeVeille(jour) { return veilleDu(jour) !== null; }
  function familleEvenement(e) { return estValide(e) ? 'f-evenement' : 'f-a-valider'; }

  function elementsDu(jour) {
    var liste = [];
    publications().forEach(function (p) { if (p.date === jour) liste.push({ genre: 'pub', heure: p.heure, d: p }); });
    evenementsDu(jour).forEach(function (e) { liste.push({ genre: 'evt', heure: e.heureDebut, d: e }); });
    var coms = commentairesDu(jour);
    if (coms.length) liste.push({ genre: 'com', heure: null, d: coms });
    if (estJourDeVeille(jour)) liste.push({ genre: 'veille', heure: null, d: null });
    liste.sort(function (a, b) {
      if (!a.heure && !b.heure) return 0;
      if (!a.heure) return 1;
      if (!b.heure) return -1;
      return a.heure.localeCompare(b.heure);
    });
    return liste;
  }

  // Marques d'un jour (logos et pastilles), dans un ordre fixe
  function marquesDu(jour) {
    var c = [];
    function ajout(k) { if (c.indexOf(k) < 0) c.push(k); }
    publications().filter(function (p) { return p.date === jour; })
      .sort(function (a, b) { return (a.heure || '99').localeCompare(b.heure || '99'); })
      .forEach(function (p) { ajout(p.type); });
    evenementsDu(jour).forEach(function (e) { ajout(estValide(e) ? 'evenement' : 'a-valider'); });
    if (commentairesDu(jour).length) ajout('commentaire');
    if (estJourDeVeille(jour)) ajout('veille');
    return c.map(marque).join('');
  }

  /* ---------- Rappels ---------- */
  function rappels(jour) {
    var r = E.problemes.map(function (x) { return { titre: 'Une mise à jour n\'a pas pu être ajoutée', texte: x.fichier + ' : ' + x.raison + '. Montre ce message à la conversation Claude qui l\'a déposée.' }; });
    // Les événements eux-mêmes sont visibles dans la semaine : seul le rappel de date limite reste en haut.
    evenements().forEach(function (e) {
      var d = decisionDe(e);
      if ((d === 'a_valider' || d === 'a_acheter') && e.dateLimiteInscription) {
        var m = ecart(jour, e.dateLimiteInscription);
        if (m >= 0 && m <= 2) {
          r.push({ titre: (d === 'a_acheter' ? 'Date limite pour acheter ta place ' : 'Date limite pour valider et t\'inscrire ') + (m === 0 ? "aujourd'hui" : m === 1 ? 'demain' : 'dans 2 jours'),
            texte: e.titre + ' (' + dateLongue(e.date) + ')' });
        }
      }
    });
    publications().forEach(function (p) {
      if (p.type !== 'story_spontanee' || p.statut === 'publiee') return;
      var n = ecart(jour, p.date);
      if (n >= 0 && n <= 2) r.push({ titre: 'Story spontanée à préparer', texte: p.titre + ', ' + (n === 0 ? "aujourd'hui" : dateLongue(p.date)) });
    });
    var b = bilanDu20(jour);
    if (b) r.unshift(b);
    return r;
  }

  function bilanDu20(jour) {
    if (jour < CONFIG.debutRappelDu20 || versDate(jour).getUTCDate() < 20) return null;
    var debut = moisSuivant(jour);
    var fin = ajouter(moisSuivant(debut), -1);
    var pubs = publications().filter(function (p) { return p.date >= debut && p.date <= fin; })
      .sort(function (a, b) { return (a.date + (a.heure || '')).localeCompare(b.date + (b.heure || '')); });
    var prets = [], manques = [];
    pubs.forEach(function (p) {
      var raisons = [];
      if (STATUTS_PRETS.indexOf(p.statut) < 0) raisons.push('statut « ' + LIBELLE_STATUT[p.statut] + ' »');
      if (p.type !== 'story_spontanee' && !dossierPour(p)) raisons.push('pas de dossier dans « À publier »');
      if (raisons.length) manques.push({ p: p, raisons: raisons }); else prets.push(p);
    });
    return {
      bilan: true, titre: 'Il te reste ' + ecart(jour, debut) + ' jours pour finir de préparer ' + nomMois(debut),
      pct: pubs.length ? Math.round(prets.length * 100 / pubs.length) : 0, prets: prets, manques: manques, total: pubs.length
    };
  }

  function htmlRappels(jour) {
    var r = rappels(jour);
    if (!r.length) return '';
    return '<div class="rappels">' + r.map(function (x) {
      if (!x.bilan) return '<div class="rappel"><div class="rappel-titre">' + esc(x.titre) + '</div><div>' + esc(x.texte) + '</div></div>';
      if (!x.total) return '<div class="rappel"><div class="rappel-titre">' + esc(x.titre) + '</div><div>Aucune publication n\'est encore prévue ce mois-là.</div></div>';
      var ligne = function (p) { return esc(dateCourte(p.date)) + ' : ' + esc(TYPES[p.type]) + ' « ' + esc(p.titre) + ' »'; };
      return '<details class="rappel"><summary><div class="rappel-titre">' + esc(x.titre) + '</div>' +
        '<div>Prêt à ' + x.pct + ' % (' + x.prets.length + ' sur ' + x.total + ')' + (x.manques.length ? ', ' + x.manques.length + ' à finir' : '') + '</div>' +
        '<div class="jauge"><span style="width:' + x.pct + '%"></span></div><span class="voir">Voir le détail</span></summary>' +
        (x.prets.length ? '<div style="margin-top:6px">Ce qui est prêt :</div><ul>' + x.prets.map(function (p) { return '<li>' + ligne(p) + '</li>'; }).join('') + '</ul>' : '') +
        (x.manques.length ? '<div style="margin-top:6px">Ce qui manque encore :</div><ul>' + x.manques.map(function (m) { return '<li>' + ligne(m.p) + ' : ' + esc(m.raisons.join(', ')) + '</li>'; }).join('') + '</ul>' : '') +
        '</details>';
    }).join('') + '</div>';
  }

  /* ---------- Écran Semaine ---------- */

  function ecranSemaine() {
    var j = aujourdhui();
    var sel = E.jourSel || j;
    var lundi = lundiDe(sel);
    var jours = [0, 1, 2, 3, 4, 5, 6].map(function (i) { return ajouter(lundi, i); });
    var idx = jours.indexOf(sel);
    var visibles = idx === 6 ? [5, 6] : [idx, idx + 1];

    var h = htmlRappels(j);
    h += htmlNavigation('sem', majuscule(nomMois(sel)), 'Semaine précédente', 'Semaine suivante', lundi !== lundiDe(j) || sel !== j);

    h += '<div class="panneau" data-glisser="semaine">';
    // Bande des 7 jours
    h += '<div class="bande">' + jours.map(function (d, i) {
      return '<button type="button" class="bande-jour' + (d === sel ? ' choisi' : '') + (d === j ? ' aujourdhui' : '') + (d < j ? ' passe' : '') + '" data-sel="' + d + '">' +
        '<span class="lettre">' + LETTRES[i] + '</span><span class="num">' + versDate(d).getUTCDate() + '</span>' +
        '<span class="marques">' + marquesDu(d) + '</span></button>';
    }).join('') + '</div>';

    function classeCol(i) { return 'col' + (visibles.indexOf(i) >= 0 ? ' vis' : '') + (jours[i] === j ? ' auj' : ''); }

    // En-têtes des colonnes
    h += '<div class="ag ag-entetes"><div></div>' + jours.map(function (d, i) {
      return '<div class="' + classeCol(i) + '">' + esc(dateCourte(d)) + '</div>';
    }).join('') + '</div>';

    // Sur téléphone, une ligne vide pour les 2 jours affichés est masquée (classe « vide-mobile »)
    function classeLigne(contenus) {
      return visibles.some(function (i) { return contenus[i]; }) ? '' : ' vide-mobile';
    }
    var rienSurMobile = true;

    // Ligne « jour entier » (seulement s'il y a quelque chose dans la semaine)
    var puces = jours.map(pucesDu);
    if (puces.some(Boolean)) {
      var cl = classeLigne(puces);
      if (!cl) rienSurMobile = false;
      h += '<div class="ag ag-journee' + cl + '"><div class="gouttiere">Jour<br>entier</div>' + jours.map(function (d, i) {
        return '<div class="' + classeCol(i) + '">' + puces[i] + '</div>';
      }).join('') + '</div>';
    }

    // Seulement les heures où il se passe quelque chose cette semaine, empilées
    var parJour = jours.map(horairesDu);
    var heures = [];
    parJour.forEach(function (l) { l.forEach(function (x) { var hh = Math.floor(x.debut / 60); if (heures.indexOf(hh) < 0) heures.push(hh); }); });
    heures.sort(function (a, b) { return a - b; });
    heures.forEach(function (hh) {
      var cases = parJour.map(function (l) { return l.filter(function (x) { return Math.floor(x.debut / 60) === hh; }).map(htmlBloc).join(''); });
      var cl = classeLigne(cases);
      if (!cl) rienSurMobile = false;
      h += '<div class="ag ag-ligne' + cl + '"><div class="gouttiere-h">' + (hh < 10 ? '0' : '') + hh + ':00</div>' + jours.map(function (d, i) {
        return '<div class="' + classeCol(i) + '">' + cases[i] + '</div>';
      }).join('') + '</div>';
    });
    if (!heures.length && !puces.some(Boolean)) h += '<div class="agenda-vide">Rien de prévu cette semaine.</div>';
    else if (rienSurMobile) h += '<div class="agenda-vide seul-mobile">Rien de prévu ces deux jours.</div>';
    h += '</div><p class="astuce seul-tactile">Glisse vers la gauche ou la droite pour changer de jour.</p>';
    return h;
  }

  function htmlNavigation(cle, titre, avant, apres, retour) {
    return '<div class="navigation">' +
      '<button type="button" class="fleche" data-' + cle + '="-1" aria-label="' + esc(avant) + '" title="' + esc(avant) + '">‹</button>' +
      '<div class="centre">' + esc(titre) + '</div>' +
      '<button type="button" class="fleche" data-' + cle + '="1" aria-label="' + esc(apres) + '" title="' + esc(apres) + '">›</button></div>' +
      '<div class="retour">' + (retour ? '<button type="button" class="pilule" data-' + cle + '="0">Aujourd\'hui</button>' : '') + '</div>';
  }

  function horairesDu(jour) {
    var l = [];
    publications().forEach(function (p) {
      if (p.date === jour && p.heure) l.push({ genre: 'pub', d: p, debut: minutes(p.heure), fin: minutes(p.heure) + 60 });
    });
    evenementsDu(jour).forEach(function (e) {
      if (!e.heureDebut) return;
      var deb = minutes(e.heureDebut);
      var fin = e.heureFin ? minutes(e.heureFin) : deb + 60;
      l.push({ genre: 'evt', d: e, debut: deb, fin: Math.max(fin, deb + 30) });
    });
    return l.sort(function (a, b) { return a.debut - b.debut; });
  }

  function htmlBloc(x) {
    if (x.genre === 'pub') {
      var p = x.d;
      return '<button type="button" class="bloc ' + famille(p.type) + (p.statut === 'publiee' ? ' publiee' : '') + '" data-detail="pub:' + esc(p.id) + '">' +
        '<span class="bloc-haut">' + icone(p.type) + esc(heure(p.heure)) + '</span>' +
        '<span class="bloc-titre">' + esc(p.titre) + '</span>' +
        '<span class="bloc-statut">' + surligne(p.statut) + '</span></button>';
    }
    var e = x.d;
    return '<button type="button" class="bloc ' + familleEvenement(e) + '" data-detail="evt:' + esc(e.id) + '">' +
      '<span class="bloc-haut">' + esc(heure(e.heureDebut) + (e.heureFin ? ' – ' + heure(e.heureFin) : '')) + '</span>' +
      '<span class="bloc-titre">' + esc(e.titre) + (estValide(e) ? '' : ' ?') + '</span>' +
      (e.lieu ? '<span class="bloc-statut">' + esc(e.lieu) + '</span>' : '') +
      '<span class="bloc-statut">' + surligneDecision(decisionDe(e)) + '</span></button>';
  }

  function pucesDu(jour) {
    var h = '';
    evenementsDu(jour).forEach(function (e) {
      if (e.heureDebut) return;
      h += '<button type="button" class="puce ' + familleEvenement(e) + '" data-detail="evt:' + esc(e.id) + '"><span class="txt">' + esc(e.titre) + (estValide(e) ? '' : ' ?') + '</span></button>';
    });
    publications().forEach(function (p) {
      if (p.date !== jour || p.heure) return;
      h += '<button type="button" class="puce ' + famille(p.type) + '" data-detail="pub:' + esc(p.id) + '">' + icone(p.type) + '<span class="txt">' + esc(p.titre) + '</span></button>';
    });
    var coms = commentairesDu(jour);
    if (coms.length) {
      h += '<button type="button" class="puce f-commentaire" data-detail="com:' + jour + '"><span class="txt">' + coms.length + ' commentaire' + (coms.length > 1 ? 's' : '') + '</span></button>';
    }
    if (estJourDeVeille(jour)) h += '<button type="button" class="puce f-veille" data-detail="veille:' + jour + '"><span class="txt">Veille Instagram</span></button>';
    return h;
  }

  /* ---------- Écran Mois ---------- */
  function ecranMois() {
    var j = aujourdhui();
    var debut = E.moisVue || premier(j);
    var fin = ajouter(moisSuivant(debut), -1);
    var choisi = E.jourMois && E.jourMois >= debut && E.jourMois <= fin ? E.jourMois : (j >= debut && j <= fin ? j : debut);
    var h = htmlNavigation('mois', majuscule(nomMois(debut)), 'Mois précédent', 'Mois suivant', debut !== premier(j));
    h += '<div class="mois-disposition"><div class="mois-calendrier"><div class="panneau" data-glisser="mois"><div class="grille">' +
      JOURS_COURTS.map(function (n) { return '<div class="entete-jour">' + n + '</div>'; }).join('');
    var d = lundiDe(debut);
    var dernier = ajouter(lundiDe(fin), 6);
    while (d <= dernier) {
      if (d < debut || d > fin) h += '<div class="case hors-mois"></div>';
      else h += '<button type="button" class="case' + (d === j ? ' aujourdhui' : '') + (d === choisi ? ' choisi' : '') + (d < j ? ' passe' : '') + '" data-jour="' + d + '">' +
        '<span class="num">' + versDate(d).getUTCDate() + '</span><span class="marques">' + marquesDu(d) + '</span>' + minisDu(d) + '</button>';
      d = ajouter(d, 1);
    }
    h += '</div><div class="legende">' + LEGENDE.map(function (l) { return '<span>' + marque(l[0]) + l[1] + '</span>'; }).join('') + '</div></div>' + htmlAPlacer() + htmlCalendrier(debut) + '</div>';
    h += '<div class="mois-detail"><h3>' + esc(majuscule(dateLongue(choisi))) + '</h3>' + htmlListe(choisi) + '</div></div>';
    return h;
  }

  /* ---------- Ce qui attend un jour ---------- */
  function htmlAPlacer() {
    var l = (E.planning && E.planning.aPlacer) || [];
    if (!l.length) return '';
    return '<div class="bloc-calendrier"><div class="etiquette">À placer, sans jour pour l\'instant</div><ul class="a-placer">' + l.map(function (p) {
      return '<li>' + icone(p.type) + '<span>' + esc(p.titre) + '</span></li>';
    }).join('') + '</ul></div>';
  }

  /* ---------- Fichier pour le calendrier iCloud « Instagram » ---------- */
  // Période couverte par le fichier d'un mois : le mois entier, élargi au cycle qui le touche
  // (lancement : 30/11 au 4/01), jamais avant aujourd'hui. Réajouter un fichier ne crée pas de doublon.
  function plageCalendrier(debutMois) {
    var debut = debutMois;
    var fin = ajouter(moisSuivant(debutMois), -1);
    ((E.planning && E.planning.cycles) || []).forEach(function (c) {
      if (c.fin < debutMois || c.debut > ajouter(moisSuivant(debutMois), -1)) return;
      if (c.debut < debut) debut = c.debut;
      if (c.fin > fin) fin = c.fin;
    });
    var j = aujourdhui();
    if (debut < j) debut = j;
    return debut <= fin ? [debut, fin] : null;
  }

  function momentsCalendrier(debut, fin) {
    return publications().filter(function (p) { return p.heure && p.type !== 'story_spontanee' && p.date >= debut && p.date <= fin; });
  }

  function htmlCalendrier(debutMois) {
    var h = '<div class="bloc-calendrier"><div class="etiquette">Calendrier iPhone « Instagram »</div>';
    var plage = plageCalendrier(debutMois);
    if (!plage) {
      return h + '<p class="meta">Ce mois est passé : rien à ajouter.</p></div>';
    }
    var n = momentsCalendrier(plage[0], plage[1]).length;
    if (!n) return h + '<p class="meta">Aucun moment de publication à heure fixe du ' + esc(dateCourte(plage[0])) + ' au ' + esc(dateCourte(plage[1])) + '</p></div>';
    var lien = CONFIG.messager + '?cle=' + encodeURIComponent(E.cle) + '&ics=1&debut=' + plage[0] + '&fin=' + plage[1];
    return h + '<p class="meta">' + n + ' moment' + (n > 1 ? 's' : '') + ' de publication du ' + esc(dateCourte(plage[0])) + ' au ' + esc(dateCourte(plage[1])) +
      ', avec une alerte 15 minutes avant.</p>' +
      '<a class="bouton plein" href="' + esc(lien) + '" target="_blank" rel="noopener">Ajouter à mon calendrier</a></div>';
  }

  // Petites étiquettes lisibles dans les cases du mois (tablette et ordinateur)
  function minisDu(jour) {
    var l = [];
    publications().filter(function (p) { return p.date === jour; })
      .sort(function (a, b) { return (a.heure || '99').localeCompare(b.heure || '99'); })
      .forEach(function (p) { l.push('<span class="mini ' + famille(p.type) + '">' + icone(p.type) + '<span>' + esc(p.titre) + '</span></span>'); });
    evenementsDu(jour).forEach(function (e) { l.push('<span class="mini ' + familleEvenement(e) + '"><span>' + esc(e.titre) + (estValide(e) ? '' : ' ?') + '</span></span>'); });
    if (commentairesDu(jour).length) l.push('<span class="mini f-commentaire"><span>' + commentairesDu(jour).length + ' comm.</span></span>');
    if (estJourDeVeille(jour)) l.push('<span class="mini f-veille"><span>Veille</span></span>');
    if (!l.length) return '';
    var reste = l.length > 3 ? '<span class="mini-plus">+ ' + (l.length - 3) + '</span>' : '';
    return '<span class="minis">' + l.slice(0, 3).join('') + reste + '</span>';
  }

  function htmlListe(jour) {
    var els = elementsDu(jour);
    if (!els.length) return '<div class="vide">Rien de prévu.</div>';
    return '<div class="liste">' + els.map(htmlLigne).join('') + '</div>';
  }

  function htmlLigne(el) {
    if (el.genre === 'pub') {
      var p = el.d;
      var dossier = dossierPour(p);
      var lien = dossier ? '<a class="lien-dossier" href="' + esc(dossier.url) + '" target="_blank" rel="noopener">Ouvrir le dossier du jour</a>'
        : (p.type === 'story_spontanee' ? '' : '<span class="sans-dossier">Pas encore de dossier</span>');
      return '<div class="ligne ' + famille(p.type) + '">' +
        '<div class="heure' + (p.heure ? '' : ' journee') + '">' + (p.heure ? esc(heure(p.heure)) : 'Dans la journée') + '</div>' +
        '<div><div class="type">' + icone(p.type) + esc(TYPES[p.type]) + '</div><div class="titre">' + esc(p.titre) + '</div>' +
        (p.note && !noteLongue(p) ? '<div class="note">' + esc(p.note) + '</div>' : '') +
        '<div class="actions"><button type="button" class="statut s-' + esc(p.statut) + '" data-detail="pub:' + esc(p.id) + '"' + (E.enCours[p.id] ? ' disabled' : '') + '>' +
        surligne(p.statut) + '</button>' + lien + '</div></div></div>';
    }
    if (el.genre === 'evt') {
      var e = el.d;
      var h = e.heureDebut ? heure(e.heureDebut) + (e.heureFin ? ' – ' + heure(e.heureFin) : '') : '';
      return '<div class="ligne ' + familleEvenement(e) + '"><div class="heure' + (h ? '' : ' journee') + '">' + (h ? esc(h) : 'Toute la journée') + '</div>' +
        '<div><div class="type">Événement</div><div class="titre">' + esc(e.titre) + (estValide(e) ? '' : ' ?') + '</div>' +
        (e.lieu ? '<div class="note">' + esc(e.lieu) + '</div>' : '') + (e.note ? '<div class="note">' + esc(e.note) + '</div>' : '') + htmlBoutonDecision(e) + '</div></div>';
    }
    if (el.genre === 'com') {
      var faits = el.d.filter(function (c) { return c.fait; }).length;
      return '<div class="ligne f-commentaire"><div class="heure journee">Dans la journée</div><div><div class="type">Commentaires</div>' +
        '<div class="titre">' + el.d.length + ' commentaire' + (el.d.length > 1 ? 's' : '') + ' à faire</div><div class="note">' + faits + ' fait' + (faits > 1 ? 's' : '') + '</div>' +
        '<div class="actions"><button type="button" class="lien-bouton" data-aller="commentaires">Voir les commentaires</button></div></div></div>';
    }
    return '<div class="ligne f-veille"><div class="heure journee">Dans la journée</div><div><div class="type">Veille</div>' +
      '<div class="titre">Veille Instagram</div><div class="note">Idées, événements, commentaires</div></div></div>';
  }

  /* ---------- Écran À commenter ---------- */
  function ecranCommentaires() {
    var j = aujourdhui();
    var tous = commentaires().slice().sort(function (a, b) { return a.date.localeCompare(b.date); });
    var aVenir = tous.filter(function (c) { return c.date >= j && !c.fait; });
    var faits = tous.filter(function (c) { return c.fait || c.date < j; });
    var h = '<h2>À commenter</h2><p class="sous-titre">Les publications d\'autres comptes à commenter.</p>';
    if (!aVenir.length) h += '<div class="vide">Aucun commentaire prévu pour l\'instant. La veille Instagram les ajoutera.</div>';
    h += '<div class="cartes">';
    var jourCourant = null;
    aVenir.forEach(function (c) {
      if (c.date !== jourCourant) { jourCourant = c.date; h += '<h3>' + esc(majuscule(dateLongue(c.date))) + '</h3>'; }
      h += htmlCommentaire(c);
    });
    if (faits.length) h += '<h3>Déjà faits ou passés</h3>' + faits.slice(-15).reverse().map(htmlCommentaire).join('');
    return h + '</div>';
  }

  function htmlCommentaire(c) {
    var langue = c.langue === 'en' ? 'En anglais' : c.langue === 'fr' ? 'En français' : '';
    return '<div class="carte f-commentaire' + (c.fait ? ' fait' : '') + '">' +
      (lienSur(c.miniature) ? '<img class="miniature" src="' + esc(c.miniature) + '" alt="" loading="lazy" referrerpolicy="no-referrer">' : '') +
      '<div class="compte">' + esc(c.compte) + '</div>' +
      '<div class="meta">' + (c.datePublication ? 'Publiée le ' + esc(dateLongue(c.datePublication)) : '') + (langue ? (c.datePublication ? ' · ' : '') + langue : '') + '</div>' +
      (lienSur(c.lien) ? '<div style="margin-top:4px"><a class="lien-dossier" href="' + esc(c.lien) + '" target="_blank" rel="noopener">Voir la publication</a></div>' : '') +
      '<div class="texte-a-copier">' + esc(c.texte) + '</div>' +
      (c.traduction ? '<div class="traduction">Traduction : ' + esc(c.traduction) + '</div>' : '') +
      (c.precisions ? '<div class="precisions">' + esc(c.precisions) + '</div>' : '') +
      '<div class="boutons"><button type="button" class="bouton" data-copier="' + esc(c.id) + '">Copier le commentaire</button>' +
      '<button type="button" class="bouton' + (c.fait ? '' : ' plein') + '" data-fait="' + esc(c.id) + '"' + (E.enCours[c.id] ? ' disabled' : '') + '>' +
      (c.fait ? 'Remettre à faire' : 'Marquer comme fait') + '</button>' +
      (c.fait ? '' : '<button type="button" class="bouton" data-detail="uncom:' + esc(c.id) + '">Déplacer</button>') + '</div></div>';
  }

  /* ---------- Écran Événements ---------- */
  function ecranEvenements() {
    var j = aujourdhui();
    var tous = evenements().slice().sort(function (a, b) { return a.date.localeCompare(b.date); });
    var aVenir = tous.filter(function (e) { return (e.dateFin || e.date) >= j; });
    var passes = tous.filter(function (e) { return (e.dateFin || e.date) < j; });
    var h = '<h2>Événements</h2><p class="sous-titre">Touche le bouton de chaque événement pour dire si tu y vas.</p>';
    if (!aVenir.length) h += '<div class="vide">Aucun événement à venir pour l\'instant.</div>';
    h += '<div class="cartes">' + aVenir.map(htmlEvenement).join('');
    if (passes.length) h += '<h3>Passés</h3>' + passes.reverse().map(htmlEvenement).join('');
    h += '</div>';
    var ecartes = tousEvenements().filter(function (e) { return decisionDe(e) === 'refuse' && (e.dateFin || e.date) >= j; });
    if (ecartes.length) {
      h += '<details class="ecartes"><summary>Je n\'y vais pas (' + ecartes.length + ')</summary><div class="cartes">' + ecartes.map(htmlEvenement).join('') + '</div></details>';
    }
    return h;
  }

  function htmlBoutonDecision(e) {
    return '<div class="actions"><button type="button" class="statut" data-detail="evt:' + esc(e.id) + '"' + (E.enCours[e.id] ? ' disabled' : '') + '>' + surligneDecision(decisionDe(e)) + '</button></div>';
  }

  function quandEvenement(e) {
    var quand = e.dateFin && e.dateFin !== e.date ? 'Du ' + dateLongue(e.date) + ' au ' + dateLongue(e.dateFin) : majuscule(dateLongue(e.date));
    return quand + (e.heureDebut ? ', ' + heure(e.heureDebut) + (e.heureFin ? ' – ' + heure(e.heureFin) : '') : '');
  }
  function limiteEvenement(e) {
    if (e.dateLimiteInscription) return 'Date limite d\'inscription : ' + dateLongue(e.dateLimiteInscription);
    return decisionDe(e) === 'a_valider' ? 'Date limite d\'inscription : non renseignée' : '';
  }

  function htmlEvenement(e) {
    var limite = limiteEvenement(e);
    return '<div class="carte ' + familleEvenement(e) + '">' +
      '<div class="compte">' + esc(e.titre) + (estValide(e) ? '' : ' ?') + '</div><div class="meta">' + esc(quandEvenement(e)) + '</div>' +
      (e.lieu ? '<div class="meta">' + esc(e.lieu) + '</div>' : '') +
      (limite ? '<div class="precisions" style="margin-top:6px">' + esc(limite) + '</div>' : '') +
      (e.note ? '<div class="precisions">' + esc(e.note) + '</div>' : '') + htmlLienEvenement(e) + htmlBoutonDecision(e) + '</div>';
  }

  function htmlLienEvenement(e) {
    return lienSur(e.lien) ? '<div class="precisions"><a class="lien-dossier" href="' + esc(e.lien) + '" target="_blank" rel="noopener">Voir l\'événement</a></div>' : '';
  }

  /* ---------- Notes d'une publication ---------- */
  function noteLongue(p) { return p.note.indexOf(' · ') >= 0 || p.note.length > 90; }
  function htmlALire(dossier) {
    var aLire = (dossier.fichiers || []).some(function (f) { return f.indexOf('00_A-LIRE') === 0; });
    return aLire ? '<div class="meta" style="margin-top:4px">Les consignes sont dans le fichier 00_A-LIRE de ce dossier.</div>' : '';
  }
  function htmlNotePreparation(p, dossier) {
    if (!p.note || !noteLongue(p)) return '';
    return '<details class="preparation"><summary>Idées de préparation</summary>' +
      (dossier ? '<div class="meta">Écrites avant la création. En cas de différence, c\'est le dossier qui compte.</div>' : '') +
      '<ul>' + p.note.split(' · ').map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></details>';
  }

  /* ---------- Déplacer un élément ---------- */
  function htmlDeplacer(genre, id, date, h) {
    var j = aujourdhui(), avecHeure = genre === 'pub';
    var raccourcis = [[j, 'Aujourd\'hui'], [ajouter(j, 1), 'Demain'], [ajouter(date, 7), 'Une semaine plus tard']]
      .filter(function (x, i) { return x[0] !== date && (i < 2 || x[0] > ajouter(j, 1)); });
    return '<details class="deplacer"><summary class="bouton">Déplacer</summary><div class="deplacer-choix" data-genre="' + genre + '" data-id="' + esc(id) + '">' +
      '<div class="boutons">' + raccourcis.map(function (x) {
        return '<button type="button" class="bouton" data-vers="' + x[0] + '">' + x[1] + ' (' + esc(dateCourte(x[0])) + ')</button>';
      }).join('') + '</div>' +
      '<label>Ou un autre jour<input type="date" class="champ-date" value="' + esc(date) + '"></label>' +
      (avecHeure ? '<label>Heure<input type="time" class="champ-heure" value="' + esc(h || '') + '"></label>' : '') +
      '<button type="button" class="bouton plein" data-enregistrer-deplacement>Enregistrer</button>' +
      (genre === 'pub' ? '<div class="meta">Ton calendrier iPhone ne change pas tout seul : réappuie ensuite sur « Ajouter à mon calendrier », dans l\'onglet Mois.</div>' : '') +
      '</div></details>';
  }

  function deplacer(genre, id, date, h) {
    // Copie complète : en cas d'échec, on revient exactement à l'état d'avant
    var avant = JSON.stringify(E.planning);
    var cle = 'deplacement:' + genre + ':' + id;
    if (genre === 'pub') { var p = trouverPublication(id); var d0 = dossierPour(p); if (p.date !== date && !p.dossierId && d0 && d0.id) p.dossierId = d0.id; p.date = date; p.heure = h; }
    if (genre === 'com') commentaires().forEach(function (c) { if (c.id === id) c.date = date; });
    if (genre === 'comsDuJour') commentaires().forEach(function (c) { if (c.date === id && !c.fait) c.date = date; });
    if (genre === 'evt') { var e = trouverEvenement(id); e.dateFin = ajouter(e.dateFin || e.date, ecart(e.date, date)); e.date = date; }
    if (genre === 'veille') { var v = E.planning.veillesDeplacees = E.planning.veillesDeplacees || {}; if (date === id) delete v[id]; else v[id] = date; }
    if (E.onglet === 'semaine') E.jourSel = date;
    if (E.onglet === 'mois') { E.moisVue = premier(date); E.jourMois = date; }
    E.enCours[cle] = true; afficher();
    envoyer({ action: 'deplacer', genre: genre, id: id, date: date, heure: h })
      .catch(function () { E.planning = JSON.parse(avant); alert("Le déplacement n'a pas pu être enregistré. Vérifie ta connexion et réessaie."); })
      .then(function () { delete E.enCours[cle]; afficher(); });
  }

  /* ---------- Feuille de détail ---------- */
  function ouvrirDetail(cle) {
    var genre = cle.split(':')[0];
    var id = cle.slice(genre.length + 1);
    var h = '', fam = '';
    if (genre === 'pub') {
      var p = trouverPublication(id);
      if (!p) return;
      fam = famille(p.type);
      var dossier = dossierPour(p);
      h = '<div class="etiquette">' + icone(p.type) + esc(TYPES[p.type]) + '</div>' +
        '<div class="grand-titre">' + esc(p.titre) + '</div>' +
        '<div class="meta">' + esc(majuscule(dateLongue(p.date))) + ', ' + (p.heure ? esc(heure(p.heure)) : 'dans la journée') + '</div>' +
        (p.note && !noteLongue(p) ? '<div class="meta">' + esc(p.note) + '</div>' : '') +
        (dossier ? '<div style="margin-top:8px"><a class="lien-dossier" href="' + esc(dossier.url) + '" target="_blank" rel="noopener">Ouvrir le dossier du jour</a></div>' + htmlALire(dossier)
          : (p.type === 'story_spontanee' ? '' : '<div class="sans-dossier" style="margin-top:8px">Pas encore de dossier dans « À publier »</div>')) +
        htmlNotePreparation(p, dossier) + htmlDeplacer('pub', p.id, p.date, p.heure) +
        '<div class="etiquette" style="margin-top:14px">Statut</div><div class="choix">' + STATUTS.map(function (s) {
          return '<button type="button" class="statut s-' + s[0] + (s[0] === p.statut ? ' actuel' : '') + '" data-choix="' + s[0] + '" data-id="' + esc(p.id) + '">' + surligne(s[0]) + '</button>';
        }).join('') + '</div>';
    } else if (genre === 'evt') {
      var e = trouverEvenement(id);
      if (!e) return;
      fam = familleEvenement(e);
      var limite = limiteEvenement(e);
      h = '<div class="etiquette">Événement</div>' +
        '<div class="grand-titre">' + esc(e.titre) + (estValide(e) ? '' : ' ?') + '</div>' +
        '<div class="meta">' + esc(quandEvenement(e)) + '</div>' + (e.lieu ? '<div class="meta">' + esc(e.lieu) + '</div>' : '') +
        (limite ? '<div class="precisions" style="margin-top:8px">' + esc(limite) + '</div>' : '') +
        (e.note ? '<div class="precisions">' + esc(e.note) + '</div>' : '') + htmlLienEvenement(e) + htmlDeplacer('evt', e.id, e.date) +
        '<div class="etiquette" style="margin-top:14px">Ma décision</div><div class="choix">' + DECISIONS.map(function (x) {
          return '<button type="button" class="statut' + (x[0] === decisionDe(e) ? ' actuel' : '') + '" data-decision="' + x[0] + '" data-id="' + esc(e.id) + '">' + surligneDecision(x[0]) + '</button>';
        }).join('') + '</div><div class="meta">« Je n\'y vais pas » retire l\'événement de ton planning.</div>';
    } else if (genre === 'com') {
      fam = 'f-commentaire';
      var coms = commentairesDu(id);
      h = '<div class="etiquette">Commentaires</div><div class="grand-titre">' + coms.length + ' commentaire' + (coms.length > 1 ? 's' : '') + ' à faire</div>' +
        '<div class="meta">' + esc(majuscule(dateLongue(id))) + '</div>' +
        '<div style="margin-top:12px"><button type="button" class="bouton plein" data-aller="commentaires">Voir les commentaires</button></div>' + (coms.some(function (c) { return !c.fait; }) ? htmlDeplacer('comsDuJour', id, id) : '');
    } else if (genre === 'uncom') {
      var c = commentaires().filter(function (x) { return x.id === id; })[0];
      if (!c) return;
      fam = 'f-commentaire';
      h = '<div class="etiquette">Commentaire</div><div class="grand-titre">' + esc(c.compte) + '</div>' +
        '<div class="meta">' + esc(majuscule(dateLongue(c.date))) + '</div>' + htmlDeplacer('com', c.id, c.date).replace('<details ', '<details open ');
    } else if (genre === 'veille') {
      fam = 'f-veille';
      h = '<div class="etiquette">Veille</div><div class="grand-titre">Veille Instagram</div>' +
        '<div class="meta">' + esc(majuscule(dateLongue(id))) + '</div><div class="precisions" style="margin-top:8px">Idées, événements, commentaires.</div>' + htmlDeplacer('veille', veilleDu(id) || id, id);
    }
    document.getElementById('feuille-contenu').innerHTML = h;
    var feuille = document.querySelector('.feuille');
    feuille.className = 'feuille ' + fam;
    feuille.scrollTop = 0;
    document.getElementById('voile').hidden = false;
    document.body.classList.add('fige');
    try { document.getElementById('feuille-fermer').focus({ preventScroll: true }); } catch (e) { /* rien */ }
  }
  function fermerDetail() { document.getElementById('voile').hidden = true; document.body.classList.remove('fige'); }

  /* ---------- Écran de la clé ---------- */
  function afficherEcranCle(message) {
    document.getElementById('contenu').innerHTML =
      '<div class="cle"><h2>Bienvenue</h2><p>Pour ouvrir ton planning, colle ta clé secrète. Tu la trouves dans ton Drive, dans le dossier de l\'application, fichier « cle-secrete (ne pas partager) ».</p>' +
      (message ? '<p><strong>' + esc(message) + '</strong></p>' : '') +
      '<input id="champ-cle" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Ta clé secrète">' +
      '<button type="button" class="bouton plein" id="valider-cle">Ouvrir mon planning</button></div>';
    document.getElementById('etat-maj').textContent = '';
  }

  /* ---------- Affichage général ---------- */
  function afficher() {
    if (!E.cle) { afficherEcranCle(); return; }
    var zone = document.getElementById('contenu');
    if (!E.planning) {
      zone.innerHTML = '<div class="vide" style="margin-top:24px">' + (E.horsLigne ? 'Impossible de joindre le planning. Vérifie ta connexion.' : 'Chargement du planning…') + '</div>';
      return;
    }
    var ecrans = { semaine: ecranSemaine, mois: ecranMois, commentaires: ecranCommentaires, evenements: ecranEvenements };
    zone.innerHTML = (ecrans[E.onglet] || ecranSemaine)();
    document.querySelectorAll('#onglets button').forEach(function (b) { b.classList.toggle('actif', b.getAttribute('data-onglet') === E.onglet); });
    if (E.luLe) {
      var hh = E.luLe.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: CONFIG.fuseau }).replace(':', ' h ');
      document.getElementById('etat-maj').textContent = (E.horsLigne ? 'Hors connexion, version de ' : 'Mis à jour à ') + hh;
    }
  }

  /* ---------- Interactions ---------- */
  document.addEventListener('click', function (ev) {
    var t = ev.target.closest('button');
    if (!t) return;
    var a = function (n) { return t.getAttribute(n); };

    if (t.hasAttribute('data-onglet')) { E.onglet = a('data-onglet'); afficher(); window.scrollTo(0, 0); return; }
    if (t.hasAttribute('data-aller')) { fermerDetail(); E.onglet = a('data-aller'); afficher(); window.scrollTo(0, 0); return; }
    if (t.hasAttribute('data-detail')) { ouvrirDetail(a('data-detail')); return; }
    if (t.hasAttribute('data-choix')) { fermerDetail(); changerStatut(a('data-id'), a('data-choix')); return; }
    if (t.hasAttribute('data-decision')) { fermerDetail(); deciderEvenement(a('data-id'), a('data-decision')); return; }
    if (t.hasAttribute('data-vers') || t.hasAttribute('data-enregistrer-deplacement')) {
      var zone = t.closest('.deplacer-choix');
      var champH = zone.querySelector('.champ-heure');
      var date = a('data-vers') || zone.querySelector('.champ-date').value;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { alert('Choisis un jour.'); return; }
      fermerDetail();
      deplacer(zone.getAttribute('data-genre'), zone.getAttribute('data-id'), date, champH ? (champH.value.slice(0, 5) || null) : null);
      return;
    }
    if (t.id === 'feuille-fermer') { fermerDetail(); return; }
    if (t.hasAttribute('data-sel')) { E.jourSel = a('data-sel'); afficher(); return; }
    if (t.hasAttribute('data-sem')) { deplacerSemaine(Number(a('data-sem')) * 7); return; }
    if (t.hasAttribute('data-mois')) { deplacerMois(Number(a('data-mois'))); return; }
    if (t.hasAttribute('data-jour')) { E.jourMois = a('data-jour'); afficher(); return; }
    if (t.hasAttribute('data-copier')) {
      var c = commentaires().filter(function (x) { return x.id === a('data-copier'); })[0];
      if (c && navigator.clipboard) {
        navigator.clipboard.writeText(c.texte).then(function () {
          t.textContent = 'Copié';
          setTimeout(function () { t.textContent = 'Copier le commentaire'; }, 1800);
        });
      }
      return;
    }
    if (t.hasAttribute('data-fait')) {
      var cf = commentaires().filter(function (x) { return x.id === a('data-fait'); })[0];
      if (cf) marquerCommentaire(cf.id, !cf.fait);
      return;
    }
    if (t.id === 'valider-cle') {
      var v = document.getElementById('champ-cle').value.trim();
      if (v) { E.cle = v; ecrireLocal('cle', v); charger(); }
      return;
    }
    if (t.id === 'actualiser') { charger(); return; }
  });

  function deplacerSemaine(jours) {
    E.jourSel = jours === 0 ? null : ajouter(E.jourSel || aujourdhui(), jours);
    afficher();
  }
  function deplacerMois(sens) {
    var base = E.moisVue || premier(aujourdhui());
    E.moisVue = sens === 0 ? null : (sens > 0 ? moisSuivant(base) : moisPrecedent(base));
    E.jourMois = null;
    afficher();
  }

  // Glisser du doigt : jour suivant / précédent (téléphone), semaine (tablette), mois
  var depart = null;
  document.addEventListener('touchstart', function (ev) {
    var zone = ev.target.closest('[data-glisser]');
    depart = zone && ev.touches.length === 1 ? { x: ev.touches[0].clientX, y: ev.touches[0].clientY, zone: zone.getAttribute('data-glisser') } : null;
  }, { passive: true });
  document.addEventListener('touchend', function (ev) {
    if (!depart) return;
    var dx = ev.changedTouches[0].clientX - depart.x;
    var dy = ev.changedTouches[0].clientY - depart.y;
    var zone = depart.zone;
    depart = null;
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    var sens = dx < 0 ? 1 : -1;
    if (zone === 'semaine') deplacerSemaine(sens * (window.matchMedia('(min-width: 760px)').matches ? 7 : 1));
    if (zone === 'mois') deplacerMois(sens);
  }, { passive: true });

  // Clavier (ordinateur) : Échap ferme la fiche, flèches gauche / droite pour naviguer
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' && !document.getElementById('voile').hidden) { fermerDetail(); return; }
    if (!document.getElementById('voile').hidden || /INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
    if (ev.key !== 'ArrowLeft' && ev.key !== 'ArrowRight') return;
    var sens = ev.key === 'ArrowRight' ? 1 : -1;
    if (E.onglet === 'semaine') deplacerSemaine(sens * 7);
    if (E.onglet === 'mois') deplacerMois(sens);
  });

  document.getElementById('voile').addEventListener('click', function (ev) { if (ev.target.id === 'voile') fermerDetail(); });
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') charger(); });
  setInterval(function () { if (document.visibilityState === 'visible' && document.getElementById('voile').hidden) charger(); }, 60000);

  /* ---------- Démarrage ---------- */
  E.cle = lireCle();
  var copie = lireLocal('copie');
  if (copie && E.cle) {
    try { var c0 = JSON.parse(copie); E.planning = c0.planning; E.dossiers = c0.dossiers; E.luLe = new Date(c0.luLe); } catch (e) { /* rien */ }
  }
  afficher();
  charger();
})();
