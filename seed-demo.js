import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Insertion des données de démonstration...');

    // ── SALLES ──────────────────────────────────────────────
    const salles = await Promise.all([
        prisma.salle.upsert({ where: { code: 'L-101' }, update: {}, create: { code: 'L-101', type: 'Labo', capacite: 30 } }),
        prisma.salle.upsert({ where: { code: 'L-102' }, update: {}, create: { code: 'L-102', type: 'Labo', capacite: 30 } }),
        prisma.salle.upsert({ where: { code: 'L-103' }, update: {}, create: { code: 'L-103', type: 'Labo', capacite: 24 } }),
        prisma.salle.upsert({ where: { code: 'L-104' }, update: {}, create: { code: 'L-104', type: 'Labo', capacite: 24 } }),
        prisma.salle.upsert({ where: { code: 'C-201' }, update: {}, create: { code: 'C-201', type: 'Classe', capacite: 35 } }),
        prisma.salle.upsert({ where: { code: 'C-202' }, update: {}, create: { code: 'C-202', type: 'Classe', capacite: 35 } }),
        prisma.salle.upsert({ where: { code: 'C-203' }, update: {}, create: { code: 'C-203', type: 'Classe', capacite: 40 } }),
        prisma.salle.upsert({ where: { code: 'C-301' }, update: {}, create: { code: 'C-301', type: 'Classe', capacite: 30 } }),
    ]);
    console.log(`✅ ${salles.length} salles créées`);

    // ── PROFESSEURS ─────────────────────────────────────────
    const profs = await Promise.all([
        prisma.professeur.upsert({ where: { matricule: 'P001' }, update: {}, create: { matricule: 'P001', nom: 'Tremblay', prenom: 'Marc', specialite: 'Programmation Web', programme: 'Techniques de l\'informatique', chargeMax: 30 } }),
        prisma.professeur.upsert({ where: { matricule: 'P002' }, update: {}, create: { matricule: 'P002', nom: 'Gagnon', prenom: 'Sophie', specialite: 'Bases de données', programme: 'Techniques de l\'informatique', chargeMax: 30 } }),
        prisma.professeur.upsert({ where: { matricule: 'P003' }, update: {}, create: { matricule: 'P003', nom: 'Bouchard', prenom: 'Luc', specialite: 'Réseaux et sécurité', programme: 'Techniques de l\'informatique', chargeMax: 25 } }),
        prisma.professeur.upsert({ where: { matricule: 'P004' }, update: {}, create: { matricule: 'P004', nom: 'Lavoie', prenom: 'Julie', specialite: 'Développement mobile', programme: 'Techniques de l\'informatique', chargeMax: 30 } }),
        prisma.professeur.upsert({ where: { matricule: 'P005' }, update: {}, create: { matricule: 'P005', nom: 'Côté', prenom: 'Patrick', specialite: 'Intelligence artificielle', programme: 'Techniques de l\'informatique', chargeMax: 20 } }),
        prisma.professeur.upsert({ where: { matricule: 'P006' }, update: {}, create: { matricule: 'P006', nom: 'Roy', prenom: 'Émilie', specialite: 'Systèmes d\'exploitation', programme: 'Techniques de l\'informatique', chargeMax: 30 } }),
    ]);
    console.log(`✅ ${profs.length} professeurs créés`);

    // ── COURS ────────────────────────────────────────────────
    const cours = await Promise.all([
        // Étape 1
        prisma.cours.upsert({ where: { code: '420-1A1-LA' }, update: {}, create: { code: '420-1A1-LA', nom: 'Introduction à la programmation', duree: 60, programme: 'Techniques de l\'informatique', etapeEtude: '1', typeSalle: 'Labo' } }),
        prisma.cours.upsert({ where: { code: '420-1B1-LA' }, update: {}, create: { code: '420-1B1-LA', nom: 'Environnement informatique', duree: 45, programme: 'Techniques de l\'informatique', etapeEtude: '1', typeSalle: 'Labo' } }),
        prisma.cours.upsert({ where: { code: '420-1C1-LA' }, update: {}, create: { code: '420-1C1-LA', nom: 'Mathématiques pour l\'informatique', duree: 45, programme: 'Techniques de l\'informatique', etapeEtude: '1', typeSalle: 'Classe' } }),

        // Étape 2
        prisma.cours.upsert({ where: { code: '420-2A2-LA' }, update: {}, create: { code: '420-2A2-LA', nom: 'Programmation orientée objet', duree: 60, programme: 'Techniques de l\'informatique', etapeEtude: '2', typeSalle: 'Labo' } }),
        prisma.cours.upsert({ where: { code: '420-2B2-LA' }, update: {}, create: { code: '420-2B2-LA', nom: 'Bases de données relationnelles', duree: 60, programme: 'Techniques de l\'informatique', etapeEtude: '2', typeSalle: 'Labo' } }),
        prisma.cours.upsert({ where: { code: '420-2C2-LA' }, update: {}, create: { code: '420-2C2-LA', nom: 'Systèmes d\'exploitation Linux', duree: 45, programme: 'Techniques de l\'informatique', etapeEtude: '2', typeSalle: 'Labo' } }),

        // Étape 3
        prisma.cours.upsert({ where: { code: '420-3A3-LA' }, update: {}, create: { code: '420-3A3-LA', nom: 'Développement Web Front-end', duree: 60, programme: 'Techniques de l\'informatique', etapeEtude: '3', typeSalle: 'Labo' } }),
        prisma.cours.upsert({ where: { code: '420-3B3-LA' }, update: {}, create: { code: '420-3B3-LA', nom: 'Développement Web Back-end', duree: 60, programme: 'Techniques de l\'informatique', etapeEtude: '3', typeSalle: 'Labo' } }),
        prisma.cours.upsert({ where: { code: '420-3C3-LA' }, update: {}, create: { code: '420-3C3-LA', nom: 'Réseaux informatiques', duree: 45, programme: 'Techniques de l\'informatique', etapeEtude: '3', typeSalle: 'Labo' } }),

        // Étape 4
        prisma.cours.upsert({ where: { code: '420-4A4-LA' }, update: {}, create: { code: '420-4A4-LA', nom: 'Développement d\'applications mobiles', duree: 60, programme: 'Techniques de l\'informatique', etapeEtude: '4', typeSalle: 'Labo' } }),
        prisma.cours.upsert({ where: { code: '420-4B4-LA' }, update: {}, create: { code: '420-4B4-LA', nom: 'Sécurité informatique', duree: 45, programme: 'Techniques de l\'informatique', etapeEtude: '4', typeSalle: 'Classe' } }),
        prisma.cours.upsert({ where: { code: '420-4C4-LA' }, update: {}, create: { code: '420-4C4-LA', nom: 'Gestion de projets informatiques', duree: 45, programme: 'Techniques de l\'informatique', etapeEtude: '4', typeSalle: 'Classe' } }),

        // Étape 5
        prisma.cours.upsert({ where: { code: '420-5A5-LA' }, update: {}, create: { code: '420-5A5-LA', nom: 'Intelligence artificielle et ML', duree: 60, programme: 'Techniques de l\'informatique', etapeEtude: '5', typeSalle: 'Labo' } }),
        prisma.cours.upsert({ where: { code: '420-5B5-LA' }, update: {}, create: { code: '420-5B5-LA', nom: 'Architecture des systèmes cloud', duree: 45, programme: 'Techniques de l\'informatique', etapeEtude: '5', typeSalle: 'Classe' } }),

        // Étape 6
        prisma.cours.upsert({ where: { code: '420-6A6-LA' }, update: {}, create: { code: '420-6A6-LA', nom: 'Projet intégrateur', duree: 90, programme: 'Techniques de l\'informatique', etapeEtude: '6', typeSalle: 'Labo' } }),
    ]);
    console.log(`✅ ${cours.length} cours créés`);

    // ── SEMESTRES ────────────────────────────────────────────
    const semestres = await Promise.all([
        prisma.semestre.upsert({ where: { nom: 'Automne 2025' }, update: {}, create: { nom: 'Automne 2025', dateDebut: new Date('2025-08-25'), dateFin: new Date('2025-12-19') } }),
        prisma.semestre.upsert({ where: { nom: 'Hiver 2026' }, update: {}, create: { nom: 'Hiver 2026', dateDebut: new Date('2026-01-12'), dateFin: new Date('2026-05-15') } }),
        prisma.semestre.upsert({ where: { nom: 'Été 2026' }, update: {}, create: { nom: 'Été 2026', dateDebut: new Date('2026-05-25'), dateFin: new Date('2026-08-14') } }),
    ]);
    console.log(`✅ ${semestres.length} semestres créés`);

    console.log('\n🎉 Données de démonstration insérées avec succès !');
    console.log('   - 8 salles (4 labos + 4 classes)');
    console.log('   - 6 professeurs');
    console.log('   - 15 cours en informatique (étapes 1 à 6)');
    console.log('   - 3 semestres');
}

main()
    .catch(e => { console.error('❌ Erreur:', e.message); process.exit(1); })
    .finally(() => prisma.$disconnect());
