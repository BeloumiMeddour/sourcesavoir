/**
 * Données de test réutilisables pour tous les tests
 */

export const testUsers = {
    admin: {
        email: 'admin@test.com',
        password: 'SecurePass123!',
        role: 'admin',
        nom: 'Admin',
        prenom: 'Test',
    },
    user: {
        email: 'user@test.com',
        password: 'UserPass123!',
        role: 'user',
        nom: 'User',
        prenom: 'Test',
    },
    responsable: {
        email: 'responsable@test.com',
        password: 'RespPass123!',
        role: 'responsable',
        nom: 'Responsable',
        prenom: 'Test',
    },
};

export const testCours = {
    cours1: {
        code: 'INF101',
        nom: 'Introduction à l\'Informatique',
        duree: 30,
        programme: 'Informatique',
        etapeEtude: 'L1',
        typeSalle: 'Labo',
    },
    cours2: {
        code: 'INF202',
        nom: 'Programmation Avancée',
        duree: 45,
        programme: 'Informatique',
        etapeEtude: 'L2',
        typeSalle: 'Labo',
    },
    cours3: {
        code: 'MATH101',
        nom: 'Calcul Différentiel',
        duree: 30,
        programme: 'Mathématiques',
        etapeEtude: 'L1',
        typeSalle: 'Classe',
    },
};

export const testProfesseurs = {
    prof1: {
        matricule: 'PROF001',
        nom: 'Dupont',
        prenom: 'Jean',
        specialite: 'Informatique',
        chargeMax: 30,
    },
    prof2: {
        matricule: 'PROF002',
        nom: 'Martin',
        prenom: 'Marie',
        specialite: 'Mathématiques',
        chargeMax: 25,
    },
};

export const testSalles = {
    salle1: {
        code: 'A101',
        type: 'Labo',
        capacite: 30,
    },
    salle2: {
        code: 'A102',
        type: 'Classe',
        capacite: 50,
    },
    salle3: {
        code: 'B201',
        type: 'Amphithéâtre',
        capacite: 100,
    },
};

export const testSemestres = {
    semestre1: {
        nom: 'Hiver 2026',
        dateDebut: new Date('2026-01-15'),
        dateFin: new Date('2026-04-30'),
    },
    semestre2: {
        nom: 'Été 2026',
        dateDebut: new Date('2026-05-01'),
        dateFin: new Date('2026-08-31'),
    },
};

export const testJoursFeries = {
    noel: {
        date: new Date('2026-12-25'),
        description: 'Noël',
    },
    paques: {
        date: new Date('2026-04-05'),
        description: 'Pâques',
    },
};
