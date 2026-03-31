-- TEST DATA ULTRA MASSIVE FOR EPLANIFY
DELETE FROM AffectationCours;
DELETE FROM Disponibilite;
DELETE FROM JourFerie;
DELETE FROM Professeur;
DELETE FROM Cours;
DELETE FROM Salle;
DELETE FROM Semestre;
DELETE FROM [User];

-- SEMESTRES (8)
INSERT INTO Semestre (nom, dateDebut, dateFin, createdAt, updatedAt) VALUES 
('Automne 2024', '2024-09-01', '2024-12-31', GETDATE(), GETDATE()),
('Hiver 2025', '2025-01-13', '2025-04-30', GETDATE(), GETDATE()),
('Printemps 2025', '2025-05-01', '2025-08-31', GETDATE(), GETDATE()),
('Automne 2025', '2025-09-01', '2025-12-31', GETDATE(), GETDATE()),
('Hiver 2026', '2026-01-13', '2026-04-30', GETDATE(), GETDATE()),
('Printemps 2026', '2026-05-01', '2026-08-31', GETDATE(), GETDATE()),
('Automne 2026', '2026-09-01', '2026-12-31', GETDATE(), GETDATE()),
('Hiver 2027', '2027-01-13', '2027-04-30', GETDATE(), GETDATE());
 
 

-- COURS GÉNIE INFORMATIQUE (50)
INSERT INTO Cours (code, nom, duree, programme, etapeEtude, typeSalle, createdAt, updatedAt) VALUES
('INF101', 'Introduction à l''informatique', 3, 'Génie Informatique', '1ère année', 'Laboratoire', GETDATE(), GETDATE()),
('INF102', 'Programmation en Python', 3, 'Génie Informatique', '1ère année', 'Laboratoire', GETDATE(), GETDATE()),
('INF103', 'Programmation en Java', 3, 'Génie Informatique', '1ère année', 'Laboratoire', GETDATE(), GETDATE()),
('INF104', 'Programmation en C++', 3, 'Génie Informatique', '1ère année', 'Laboratoire', GETDATE(), GETDATE()),
('INF105', 'Programmation Web Frontend', 3, 'Génie Informatique', '1ère année', 'Laboratoire', GETDATE(), GETDATE()),
('INF106', 'JavaScript Avancé', 3, 'Génie Informatique', '1ère année', 'Laboratoire', GETDATE(), GETDATE()),
('INF107', 'HTML et CSS', 3, 'Génie Informatique', '1ère année', 'Laboratoire', GETDATE(), GETDATE()),
('INF108', 'Algorithmes et structures de données', 3, 'Génie Informatique', '1ère année', 'Classe', GETDATE(), GETDATE()),
('INF109', 'Logique booléenne et circuits numériques', 3, 'Génie Informatique', '1ère année', 'Laboratoire', GETDATE(), GETDATE()),
('INF110', 'Introduction à Unix/Linux', 3, 'Génie Informatique', '1ère année', 'Laboratoire', GETDATE(), GETDATE()),
('INF201', 'Bases de données relationnelles', 3, 'Génie Informatique', '2ème année', 'Laboratoire', GETDATE(), GETDATE()),
('INF202', 'SQL avancé', 3, 'Génie Informatique', '2ème année', 'Laboratoire', GETDATE(), GETDATE()),
('INF203', 'Développement Web Backend', 3, 'Génie Informatique', '2ème année', 'Laboratoire', GETDATE(), GETDATE()),
('INF204', 'Framework web (Django/Flask)', 3, 'Génie Informatique', '2ème année', 'Laboratoire', GETDATE(), GETDATE()),
('INF205', 'Architecture logicielle', 3, 'Génie Informatique', '2ème année', 'Classe', GETDATE(), GETDATE()),
('INF206', 'Design Patterns', 3, 'Génie Informatique', '2ème année', 'Classe', GETDATE(), GETDATE()),
('INF207', 'Systèmes d''exploitation', 3, 'Génie Informatique', '2ème année', 'Laboratoire', GETDATE(), GETDATE()),
('INF208', 'Administration de bases de données', 3, 'Génie Informatique', '2ème année', 'Laboratoire', GETDATE(), GETDATE()),
('INF209', 'Programmation orientée objet', 3, 'Génie Informatique', '2ème année', 'Laboratoire', GETDATE(), GETDATE()),
('INF210', 'Paradigmes de programmation', 3, 'Génie Informatique', '2ème année', 'Classe', GETDATE(), GETDATE()),
('INF301', 'Intelligence Artificielle', 3, 'Génie Informatique', '3ème année', 'Laboratoire', GETDATE(), GETDATE()),
('INF302', 'Machine Learning', 3, 'Génie Informatique', '3ème année', 'Laboratoire', GETDATE(), GETDATE()),
('INF303', 'Deep Learning', 3, 'Génie Informatique', '3ème année', 'Laboratoire', GETDATE(), GETDATE()),
('INF304', 'Big Data et Spark', 3, 'Génie Informatique', '3ème année', 'Laboratoire', GETDATE(), GETDATE()),
('INF305', 'Data Science', 3, 'Génie Informatique', '3ème année', 'Laboratoire', GETDATE(), GETDATE()),
('INF306', 'Cloud Computing (AWS)', 3, 'Génie Informatique', '3ème année', 'Laboratoire', GETDATE(), GETDATE()),
('INF307', 'Cloud Computing (Azure)', 3, 'Génie Informatique', '3ème année', 'Laboratoire', GETDATE(), GETDATE()),
('INF308', 'Cloud Computing (GCP)', 3, 'Génie Informatique', '3ème année', 'Laboratoire', GETDATE(), GETDATE()),
('INF309', 'DevOps et Conteneurisation', 3, 'Génie Informatique', '3ème année', 'Laboratoire', GETDATE(), GETDATE()),
('INF310', 'Docker et Kubernetes', 3, 'Génie Informatique', '3ème année', 'Laboratoire', GETDATE(), GETDATE()),
('INF311', 'Intégration Continue', 3, 'Génie Informatique', '3ème année', 'Laboratoire', GETDATE(), GETDATE()),
('INF312', 'Sécurité Informatique', 3, 'Génie Informatique', '3ème année', 'Laboratoire', GETDATE(), GETDATE()),
('INF313', 'Cryptographie', 3, 'Génie Informatique', '3ème année', 'Classe', GETDATE(), GETDATE()),
('INF314', 'Hacking éthique', 3, 'Génie Informatique', '3ème année', 'Laboratoire', GETDATE(), GETDATE()),
('INF315', 'Blockchain et Bitcoin', 3, 'Génie Informatique', '3ème année', 'Classe', GETDATE(), GETDATE()),
('INF316', 'Réalité Virtuelle', 3, 'Génie Informatique', '3ème année', 'Laboratoire', GETDATE(), GETDATE()),
('INF317', 'Réalité Augmentée', 3, 'Génie Informatique', '3ème année', 'Laboratoire', GETDATE(), GETDATE()),
('INF318', 'Développement mobile iOS', 3, 'Génie Informatique', '3ème année', 'Laboratoire', GETDATE(), GETDATE()),
('INF319', 'Développement mobile Android', 3, 'Génie Informatique', '3ème année', 'Laboratoire', GETDATE(), GETDATE()),
('INF320', 'React et Vue.js', 3, 'Génie Informatique', '3ème année', 'Laboratoire', GETDATE(), GETDATE()),
('INF321', 'Angular avancé', 3, 'Génie Informatique', '3ème année', 'Laboratoire', GETDATE(), GETDATE()),
('INF322', 'Microservices', 3, 'Génie Informatique', '3ème année', 'Classe', GETDATE(), GETDATE()),
('INF323', 'API REST et GraphQL', 3, 'Génie Informatique', '3ème année', 'Laboratoire', GETDATE(), GETDATE()),
('INF324', 'Testing et Quality Assurance', 3, 'Génie Informatique', '3ème année', 'Laboratoire', GETDATE(), GETDATE()),
('INF325', 'Agile et Scrum', 3, 'Génie Informatique', '3ème année', 'Classe', GETDATE(), GETDATE()),
('INF326', 'Gestion de projet IT', 3, 'Génie Informatique', '3ème année', 'Classe', GETDATE(), GETDATE()),
('INF327', 'Entrepreneurship IT', 3, 'Génie Informatique', '3ème année', 'Classe', GETDATE(), GETDATE()),
('INF328', 'Essai en Informatique', 6, 'Génie Informatique', '3ème année', 'Laboratoire', GETDATE(), GETDATE()),
('INF329', 'Stage en Informatique', 12, 'Génie Informatique', '3ème année', 'Laboratoire', GETDATE(), GETDATE());

-- COURS GÉNIE RÉSEAUX (35)
INSERT INTO Cours (code, nom, duree, programme, etapeEtude, typeSalle, createdAt, updatedAt) VALUES
('RES101', 'Principes des réseaux', 3, 'Génie Réseau', '1ère année', 'Laboratoire', GETDATE(), GETDATE()),
('RES102', 'Protocoles TCP/IP', 3, 'Génie Réseau', '1ère année', 'Laboratoire', GETDATE(), GETDATE()),
('RES103', 'Configuration de routeurs Cisco', 3, 'Génie Réseau', '1ère année', 'Laboratoire', GETDATE(), GETDATE()),
('RES104', 'Commutation de données', 3, 'Génie Réseau', '1ère année', 'Laboratoire', GETDATE(), GETDATE()),
('RES105', 'OSI et modèles de communication', 3, 'Génie Réseau', '1ère année', 'Classe', GETDATE(), GETDATE()),
('RES106', 'Adressage IP et subnetting', 3, 'Génie Réseau', '1ère année', 'Laboratoire', GETDATE(), GETDATE()),
('RES107', 'VLANs et Trunking', 3, 'Génie Réseau', '1ère année', 'Laboratoire', GETDATE(), GETDATE()),
('RES108', 'Spanning Tree Protocol', 3, 'Génie Réseau', '1ère année', 'Laboratoire', GETDATE(), GETDATE()),
('RES201', 'Sécurité des réseaux fondamentale', 3, 'Génie Réseau', '2ème année', 'Laboratoire', GETDATE(), GETDATE()),
('RES202', 'Firewalls et IDS/IPS', 3, 'Génie Réseau', '2ème année', 'Laboratoire', GETDATE(), GETDATE()),
('RES203', 'VPN et tunneling', 3, 'Génie Réseau', '2ème année', 'Laboratoire', GETDATE(), GETDATE()),
('RES204', 'Protocoles de routage dynamique', 3, 'Génie Réseau', '2ème année', 'Laboratoire', GETDATE(), GETDATE()),
('RES205', 'OSPF avancé', 3, 'Génie Réseau', '2ème année', 'Laboratoire', GETDATE(), GETDATE()),
('RES206', 'BGP et routage externe', 3, 'Génie Réseau', '2ème année', 'Classe', GETDATE(), GETDATE()),
('RES207', 'Administration de réseau', 3, 'Génie Réseau', '2ème année', 'Classe', GETDATE(), GETDATE()),
('RES208', 'SNMP et monitoring réseau', 3, 'Génie Réseau', '2ème année', 'Laboratoire', GETDATE(), GETDATE()),
('RES209', 'Réseaux sans fil 802.11', 3, 'Génie Réseau', '2ème année', 'Laboratoire', GETDATE(), GETDATE()),
('RES210', 'Téléphonie IP et VoIP', 3, 'Génie Réseau', '2ème année', 'Laboratoire', GETDATE(), GETDATE()),
('RES301', 'Architectures réseaux d''entreprise', 3, 'Génie Réseau', '3ème année', 'Classe', GETDATE(), GETDATE()),
('RES302', 'Data Center Networking', 3, 'Génie Réseau', '3ème année', 'Classe', GETDATE(), GETDATE()),
('RES303', 'Software Defined Networking', 3, 'Génie Réseau', '3ème année', 'Laboratoire', GETDATE(), GETDATE()),
('RES304', 'Network Function Virtualization', 3, 'Génie Réseau', '3ème année', 'Laboratoire', GETDATE(), GETDATE()),
('RES305', 'Cloud Networking AWS', 3, 'Génie Réseau', '3ème année', 'Laboratoire', GETDATE(), GETDATE()),
('RES306', 'Cloud Networking Azure', 3, 'Génie Réseau', '3ème année', 'Laboratoire', GETDATE(), GETDATE()),
('RES307', 'Cloud Networking GCP', 3, 'Génie Réseau', '3ème année', 'Laboratoire', GETDATE(), GETDATE()),
('RES308', 'Internet des Objets (IoT)', 3, 'Génie Réseau', '3ème année', 'Laboratoire', GETDATE(), GETDATE()),
('RES309', 'Réseaux 5G', 3, 'Génie Réseau', '3ème année', 'Classe', GETDATE(), GETDATE()),
('RES310', 'Cybersécurité avancée', 3, 'Génie Réseau', '3ème année', 'Laboratoire', GETDATE(), GETDATE()),
('RES311', 'Gestion des incidents réseau', 3, 'Génie Réseau', '3ème année', 'Classe', GETDATE(), GETDATE()),
('RES312', 'Quality of Service (QoS)', 3, 'Génie Réseau', '3ème année', 'Laboratoire', GETDATE(), GETDATE()),
('RES313', 'Optimisation réseau', 3, 'Génie Réseau', '3ème année', 'Laboratoire', GETDATE(), GETDATE()),
('RES314', 'Gestion de projet réseau', 3, 'Génie Réseau', '3ème année', 'Classe', GETDATE(), GETDATE()),
('RES315', 'Essai en réseaux', 6, 'Génie Réseau', '3ème année', 'Laboratoire', GETDATE(), GETDATE()),
('RES316', 'Stage en réseaux', 12, 'Génie Réseau', '3ème année', 'Laboratoire', GETDATE(), GETDATE());

-- COURS GÉNIE GÉNÉRAL (40)
INSERT INTO Cours (code, nom, duree, programme, etapeEtude, typeSalle, createdAt, updatedAt) VALUES
('GEN101', 'Mathématiques I - Calcul différentiel', 4, 'Génie Général', '1ère année', 'Classe', GETDATE(), GETDATE()),
('GEN102', 'Mathématiques II - Calcul intégral', 4, 'Génie Général', '1ère année', 'Classe', GETDATE(), GETDATE()),
('GEN103', 'Mathématiques III - Algèbre linéaire', 3, 'Génie Général', '1ère année', 'Classe', GETDATE(), GETDATE()),
('GEN104', 'Mathématiques IV - Équations différentielles', 3, 'Génie Général', '1ère année', 'Classe', GETDATE(), GETDATE()),
('GEN105', 'Physique I - Mécanique classique', 4, 'Génie Général', '1ère année', 'Laboratoire', GETDATE(), GETDATE()),
('GEN106', 'Physique II - Électricité', 4, 'Génie Général', '1ère année', 'Laboratoire', GETDATE(), GETDATE()),
('GEN107', 'Physique III - Magnétisme', 3, 'Génie Général', '1ère année', 'Laboratoire', GETDATE(), GETDATE()),
('GEN108', 'Physique IV - Ondes et optique', 3, 'Génie Général', '1ère année', 'Laboratoire', GETDATE(), GETDATE()),
('GEN109', 'Chimie générale', 4, 'Génie Général', '1ère année', 'Laboratoire', GETDATE(), GETDATE()),
('GEN110', 'Chimie organique', 3, 'Génie Général', '1ère année', 'Laboratoire', GETDATE(), GETDATE()),
('GEN201', 'Statistiques et Probabilités I', 3, 'Génie Général', '2ème année', 'Classe', GETDATE(), GETDATE()),
('GEN202', 'Statistiques et Probabilités II', 3, 'Génie Général', '2ème année', 'Classe', GETDATE(), GETDATE()),
('GEN203', 'Méthodes numériques', 3, 'Génie Général', '2ème année', 'Laboratoire', GETDATE(), GETDATE()),
('GEN204', 'Thermodynamique I', 3, 'Génie Général', '2ème année', 'Classe', GETDATE(), GETDATE()),
('GEN205', 'Thermodynamique II', 3, 'Génie Général', '2ème année', 'Laboratoire', GETDATE(), GETDATE()),
('GEN206', 'Mécanique des fluides', 3, 'Génie Général', '2ème année', 'Laboratoire', GETDATE(), GETDATE()),
('GEN207', 'Mécanique avancée', 3, 'Génie Général', '2ème année', 'Laboratoire', GETDATE(), GETDATE()),
('GEN208', 'Électronique numérique', 3, 'Génie Général', '2ème année', 'Laboratoire', GETDATE(), GETDATE()),
('GEN209', 'Électronique analogique', 3, 'Génie Général', '2ème année', 'Laboratoire', GETDATE(), GETDATE()),
('GEN210', 'Circuits électriques', 3, 'Génie Général', '2ème année', 'Laboratoire', GETDATE(), GETDATE()),
('GEN301', 'Matériaux industriels', 3, 'Génie Général', '3ème année', 'Classe', GETDATE(), GETDATE()),
('GEN302', 'Métallurgie et alliages', 3, 'Génie Général', '3ème année', 'Laboratoire', GETDATE(), GETDATE()),
('GEN303', 'Polymères et matériaux composites', 3, 'Génie Général', '3ème année', 'Laboratoire', GETDATE(), GETDATE()),
('GEN304', 'Transfert de chaleur', 3, 'Génie Général', '3ème année', 'Classe', GETDATE(), GETDATE()),
('GEN305', 'Dynamique des fluides computationnelle', 3, 'Génie Général', '3ème année', 'Laboratoire', GETDATE(), GETDATE()),
('GEN306', 'Vibrations et acoustique', 3, 'Génie Général', '3ème année', 'Laboratoire', GETDATE(), GETDATE()),
('GEN307', 'Traitement du signal', 3, 'Génie Général', '3ème année', 'Laboratoire', GETDATE(), GETDATE()),
('GEN308', 'Commande automatique', 3, 'Génie Général', '3ème année', 'Classe', GETDATE(), GETDATE()),
('GEN309', 'Robotique', 3, 'Génie Général', '3ème année', 'Laboratoire', GETDATE(), GETDATE()),
('GEN310', 'Asservissements numériques', 3, 'Génie Général', '3ème année', 'Laboratoire', GETDATE(), GETDATE()),
('GEN311', 'Sustainability et énergie renouvelable', 3, 'Génie Général', '3ème année', 'Classe', GETDATE(), GETDATE()),
('GEN312', 'Génie civil avancé', 3, 'Génie Général', '3ème année', 'Classe', GETDATE(), GETDATE()),
('GEN313', 'Fabrication additive', 3, 'Génie Général', '3ème année', 'Laboratoire', GETDATE(), GETDATE()),
('GEN314', 'Innovation et entrepreneurship', 3, 'Génie Général', '3ème année', 'Classe', GETDATE(), GETDATE()),
('GEN315', 'Essai en Génie général', 6, 'Génie Général', '3ème année', 'Classe', GETDATE(), GETDATE()),
('GEN316', 'Stage en Génie général', 12, 'Génie Général', '3ème année', 'Classe', GETDATE(), GETDATE());

-- SALLES: LABORATOIRES (20)
INSERT INTO Salle (code, type, capacite, createdAt) VALUES
('LAB-01', 'Laboratoire', 30, GETDATE()),('LAB-02', 'Laboratoire', 30, GETDATE()),('LAB-03', 'Laboratoire', 25, GETDATE()),
('LAB-04', 'Laboratoire', 28, GETDATE()),('LAB-05', 'Laboratoire', 32, GETDATE()),('LAB-06', 'Laboratoire', 24, GETDATE()),
('LAB-07', 'Laboratoire', 20, GETDATE()),('LAB-08', 'Laboratoire', 35, GETDATE()),('LAB-09', 'Laboratoire', 28, GETDATE()),
('LAB-10', 'Laboratoire', 30, GETDATE()),('LAB-11', 'Laboratoire', 26, GETDATE()),('LAB-12', 'Laboratoire', 22, GETDATE()),
('LAB-13', 'Laboratoire', 29, GETDATE()),('LAB-14', 'Laboratoire', 31, GETDATE()),('LAB-15', 'Laboratoire', 27, GETDATE()),
('LAB-16', 'Laboratoire', 25, GETDATE()),('LAB-17', 'Laboratoire', 28, GETDATE()),('LAB-18', 'Laboratoire', 32, GETDATE()),
('LAB-19', 'Laboratoire', 24, GETDATE()),('LAB-20', 'Laboratoire', 30, GETDATE());

-- SALLES: CLASSES (20)
INSERT INTO Salle (code, type, capacite, createdAt) VALUES
('CLASS-A1', 'Classe', 50, GETDATE()),('CLASS-A2', 'Classe', 50, GETDATE()),('CLASS-B1', 'Classe', 40, GETDATE()),
('CLASS-B2', 'Classe', 40, GETDATE()),('CLASS-C1', 'Classe', 45, GETDATE()),('CLASS-C2', 'Classe', 45, GETDATE()),
('CLASS-D1', 'Classe', 55, GETDATE()),('CLASS-D2', 'Classe', 55, GETDATE()),('CLASS-E1', 'Classe', 35, GETDATE()),
('CLASS-E2', 'Classe', 35, GETDATE()),('CLASS-F1', 'Classe', 48, GETDATE()),('CLASS-F2', 'Classe', 48, GETDATE()),
('CLASS-G1', 'Classe', 52, GETDATE()),('CLASS-G2', 'Classe', 52, GETDATE()),('CLASS-H1', 'Classe', 42, GETDATE()),
('CLASS-H2', 'Classe', 42, GETDATE()),('CLASS-I1', 'Classe', 38, GETDATE()),('CLASS-I2', 'Classe', 38, GETDATE()),
('CLASS-J1', 'Classe', 44, GETDATE()),('CLASS-J2', 'Classe', 44, GETDATE());

-- SALLES: AMPHITHÉÂTRES (5)
INSERT INTO Salle (code, type, capacite, createdAt) VALUES
('AMP-01', 'Amphithéâtre', 100, GETDATE()),('AMP-02', 'Amphithéâtre', 120, GETDATE()),
('AMP-03', 'Amphithéâtre', 150, GETDATE()),('AMP-04', 'Amphithéâtre', 200, GETDATE()),
('AMP-05', 'Amphithéâtre', 180, GETDATE());

-- PROFESSEURS GÉNIE INFORMATIQUE (25)
INSERT INTO Professeur (matricule, nom, prenom, specialite, programme, chargeMax, createdAt, updatedAt) VALUES
('P001', 'Dupont', 'Jean', 'Informatique', 'Génie Informatique', 30, GETDATE(), GETDATE()),
('P002', 'Martin', 'Marie', 'Informatique', 'Génie Informatique', 30, GETDATE(), GETDATE()),
('P003', 'Blanc', 'Marc', 'Informatique', 'Génie Informatique', 30, GETDATE(), GETDATE()),
('P004', 'Rousseau', 'Sophie', 'Bases de données', 'Génie Informatique', 28, GETDATE(), GETDATE()),
('P005', 'Leclerc', 'Paul', 'Architecture logicielle', 'Génie Informatique', 28, GETDATE(), GETDATE()),
('P006', 'Gérard', 'Anne', 'Sécurité Informatique', 'Génie Informatique', 26, GETDATE(), GETDATE()),
('P007', 'Lefevre', 'Michel', 'Programmation', 'Génie Informatique', 30, GETDATE(), GETDATE()),
('P008', 'Laurent', 'Isabelle', 'Intelligence Artificielle', 'Génie Informatique', 24, GETDATE(), GETDATE()),
('P009', 'Petit', 'Claude', 'Cloud Computing', 'Génie Informatique', 26, GETDATE(), GETDATE()),
('P010', 'Fournier', 'Luc', 'DevOps', 'Génie Informatique', 28, GETDATE(), GETDATE()),
('P011', 'Renaud', 'Valérie', 'Web Development', 'Génie Informatique', 28, GETDATE(), GETDATE()),
('P012', 'Chevalier', 'Stéphane', 'Data Science', 'Génie Informatique', 26, GETDATE(), GETDATE()),
('P013', 'Mercier', 'Fabienne', 'Mobile Development', 'Génie Informatique', 28, GETDATE(), GETDATE()),
('P014', 'Faure', 'Patrick', 'Big Data', 'Génie Informatique', 24, GETDATE(), GETDATE()),
('P015', 'Durand', 'Chantal', 'Testing', 'Génie Informatique', 30, GETDATE(), GETDATE()),
('P016', 'Gautier', 'Frédéric', 'Système', 'Génie Informatique', 26, GETDATE(), GETDATE()),
('P017', 'Lefebvre', 'Christine', 'Qualité logicielle', 'Génie Informatique', 28, GETDATE(), GETDATE()),
('P018', 'Morel', 'Olivier', 'DevSecOps', 'Génie Informatique', 26, GETDATE(), GETDATE()),
('P019', 'Normand', 'Sylvain', 'Blockchain', 'Génie Informatique', 22, GETDATE(), GETDATE()),
('P020', 'Samson', 'Sandrine', 'VR/AR', 'Génie Informatique', 26, GETDATE(), GETDATE()),
('P021', 'Valentin', 'Theodor', 'IoT', 'Génie Informatique', 28, GETDATE(), GETDATE()),
('P022', 'Waxman', 'Yvonne', 'API Development', 'Génie Informatique', 30, GETDATE(), GETDATE()),
('P023', 'Xander', 'Xavier', 'Performance Tuning', 'Génie Informatique', 26, GETDATE(), GETDATE()),
('P024', 'Young', 'Yves', 'Microservices', 'Génie Informatique', 28, GETDATE(), GETDATE()),
('P025', 'Zeller', 'Zina', 'Enterprise Architecture', 'Génie Informatique', 24, GETDATE(), GETDATE());

-- PROFESSEURS GÉNIE RÉSEAUX (20)
INSERT INTO Professeur (matricule, nom, prenom, specialite, programme, chargeMax, createdAt, updatedAt) VALUES
('P026', 'Bernard', 'Pierre', 'Réseaux', 'Génie Réseau', 30, GETDATE(), GETDATE()),
('P027', 'Thomas', 'Luc', 'Réseaux', 'Génie Réseau', 28, GETDATE(), GETDATE()),
('P028', 'Richard', 'Franck', 'Sécurité réseaux', 'Génie Réseau', 26, GETDATE(), GETDATE()),
('P029', 'Renault', 'Guy', 'Routage', 'Génie Réseau', 30, GETDATE(), GETDATE()),
('P030', 'Moreau', 'Virginie', 'Configuration réseau', 'Génie Réseau', 28, GETDATE(), GETDATE()),
('P031', 'Chauvin', 'Didier', 'Télécommunications', 'Génie Réseau', 28, GETDATE(), GETDATE()),
('P032', 'Roche', 'Stéphane', 'Monitoring', 'Génie Réseau', 26, GETDATE(), GETDATE()),
('P033', 'Gauthier', 'Jennifer', 'Cloud Networking', 'Génie Réseau', 24, GETDATE(), GETDATE()),
('P034', 'Arnaud', 'Antoine', 'SDN', 'Génie Réseau', 26, GETDATE(), GETDATE()),
('P035', 'Benoit', 'Boris', 'Data Center', 'Génie Réseau', 28, GETDATE(), GETDATE()),
('P036', 'Cordier', 'Charles', 'Wireless', 'Génie Réseau', 30, GETDATE(), GETDATE()),
('P037', 'Delorme', 'Denis', 'VoIP', 'Génie Réseau', 26, GETDATE(), GETDATE()),
('P038', 'Etienne', 'Éric', 'IoT Networks', 'Génie Réseau', 28, GETDATE(), GETDATE()),
('P039', 'Fortier', 'Fabien', '5G', 'Génie Réseau', 24, GETDATE(), GETDATE()),
('P040', 'Girard', 'Gilles', 'Network Security', 'Génie Réseau', 26, GETDATE(), GETDATE()),
('P041', 'Henry', 'Henri', 'QoS', 'Génie Réseau', 30, GETDATE(), GETDATE()),
('P042', 'Ivanoff', 'Igor', 'Network Admin', 'Génie Réseau', 28, GETDATE(), GETDATE()),
('P043', 'Jacques', 'Jean', 'Cisco Routing', 'Génie Réseau', 26, GETDATE(), GETDATE()),
('P044', 'Kolbe', 'Klaus', 'Network Design', 'Génie Réseau', 28, GETDATE(), GETDATE()),
('P045', 'Laurent', 'Louis', 'Troubleshooting', 'Génie Réseau', 30, GETDATE(), GETDATE());

-- PROFESSEURS GÉNIE GÉNÉRAL (30)
INSERT INTO Professeur (matricule, nom, prenom, specialite, programme, chargeMax, createdAt, updatedAt) VALUES
('P046', 'Rose', 'Anne', 'Physique', 'Génie Général', 28, GETDATE(), GETDATE()),
('P047', 'Laurent', 'Sophie', 'Mathématiques', 'Génie Général', 32, GETDATE(), GETDATE()),
('P048', 'Moreau', 'Jacques', 'Mathématiques', 'Génie Général', 32, GETDATE(), GETDATE()),
('P049', 'Lebrun', 'Robert', 'Physique', 'Génie Général', 28, GETDATE(), GETDATE()),
('P050', 'Dubois', 'Valérie', 'Chimie', 'Génie Général', 28, GETDATE(), GETDATE()),
('P051', 'Henry', 'Fabrice', 'Statistiques', 'Génie Général', 30, GETDATE(), GETDATE()),
('P052', 'Bonnet', 'Muriel', 'Algèbre', 'Génie Général', 32, GETDATE(), GETDATE()),
('P053', 'Chevalier', 'Éric', 'Thermodynamique', 'Génie Général', 26, GETDATE(), GETDATE()),
('P054', 'Deschamps', 'Danielle', 'Mécanique', 'Génie Général', 28, GETDATE(), GETDATE()),
('P055', 'Emond', 'Émile', 'Électronique', 'Génie Général', 26, GETDATE(), GETDATE()),
('P056', 'Faucher', 'Félix', 'Électricité', 'Génie Général', 28, GETDATE(), GETDATE()),
('P057', 'Gagnon', 'Gaston', 'Fluides', 'Génie Général', 30, GETDATE(), GETDATE()),
('P058', 'Hardy', 'Hermès', 'Transfert chaleur', 'Génie Général', 26, GETDATE(), GETDATE()),
('P059', 'Insan', 'Ira', 'Vibrations', 'Génie Général', 28, GETDATE(), GETDATE()),
('P060', 'Jobin', 'Julien', 'Signal', 'Génie Général', 26, GETDATE(), GETDATE()),
('P061', 'Karpoff', 'Kevin', 'Automatique', 'Génie Général', 30, GETDATE(), GETDATE()),
('P062', 'Laflamme', 'Lucien', 'Robotique', 'Génie Général', 26, GETDATE(), GETDATE()),
('P063', 'Mailloux', 'Mathieu', 'Matériaux', 'Génie Général', 28, GETDATE(), GETDATE()),
('P064', 'Noël', 'Noël', 'Métallurgie', 'Génie Général', 26, GETDATE(), GETDATE()),
('P065', 'Otis', 'Osman', 'Composites', 'Génie Général', 24, GETDATE(), GETDATE()),
('P066', 'Pageau', 'Pascal', 'Énergie renouvelable', 'Génie Général', 28, GETDATE(), GETDATE()),
('P067', 'Quintal', 'Quentin', 'Génie civil', 'Génie Général', 30, GETDATE(), GETDATE()),
('P068', 'Rancourt', 'Régis', 'Fabrication additive', 'Génie Général', 26, GETDATE(), GETDATE()),
('P069', 'Senécal', 'Serge', 'Innovation', 'Génie Général', 28, GETDATE(), GETDATE()),
('P070', 'Thériault', 'Thierry', 'Entrepreneurship', 'Génie Général', 24, GETDATE(), GETDATE()),
('P071', 'Ulysse', 'Ulrich', 'Sécurité', 'Génie Général', 26, GETDATE(), GETDATE()),
('P072', 'Vaillant', 'Victor', 'Environnement', 'Génie Général', 28, GETDATE(), GETDATE()),
('P073', 'Wainwright', 'Walter', 'Durabilité', 'Génie Général', 30, GETDATE(), GETDATE()),
('P074', 'Xavier', 'Xérophile', 'Gestion projet', 'Génie Général', 26, GETDATE(), GETDATE()),
('P075', 'Yezzi', 'Yannick', 'Communication', 'Génie Général', 28, GETDATE(), GETDATE());

-- DISPONIBILITÉS - TOUS LES PROFS
DECLARE @pid INT, @pmax INT;
SELECT @pmax = MAX(id) FROM Professeur;
SET @pid = (SELECT MIN(id) FROM Professeur);

WHILE @pid <= @pmax
BEGIN
    IF EXISTS (SELECT 1 FROM Professeur WHERE id = @pid)
    BEGIN
        INSERT INTO Disponibilite (jour, plageHoraire, typeConflit, id_professeur, id_salle, createdAt) VALUES 
            ('Lundi', '08:00-12:00', 'Professeur', @pid, NULL, GETDATE()),
            ('Lundi', '13:00-17:00', 'Professeur', @pid, NULL, GETDATE()),
            ('Mardi', '08:00-12:00', 'Professeur', @pid, NULL, GETDATE()),
            ('Mardi', '13:00-17:00', 'Professeur', @pid, NULL, GETDATE()),
            ('Mercredi', '08:00-12:00', 'Professeur', @pid, NULL, GETDATE()),
            ('Mercredi', '13:00-17:00', 'Professeur', @pid, NULL, GETDATE()),
            ('Jeudi', '08:00-12:00', 'Professeur', @pid, NULL, GETDATE()),
            ('Jeudi', '13:00-17:00', 'Professeur', @pid, NULL, GETDATE()),
            ('Vendredi', '08:00-12:00', 'Professeur', @pid, NULL, GETDATE()),
            ('Vendredi', '13:00-17:00', 'Professeur', @pid, NULL, GETDATE());
    END
    SET @pid = @pid + 1;
END;

-- AFFECTATIONS MASSIVES - 1500+ pour chaque semestre
DECLARE @sid INT, @cid_aff INT, @pid_aff INT, @salid_aff INT, @jour_aff NVARCHAR(20), @heure_aff NVARCHAR(20);
DECLARE semestre_loop CURSOR FOR SELECT id FROM Semestre;
OPEN semestre_loop;

FETCH NEXT FROM semestre_loop INTO @sid;
WHILE @@FETCH_STATUS = 0
BEGIN
	DECLARE cours_loop CURSOR FOR SELECT id FROM Cours WHERE code NOT IN ('INF328', 'INF329', 'RES315', 'RES316', 'GEN315', 'GEN316');
	OPEN cours_loop;
	
	FETCH NEXT FROM cours_loop INTO @cid_aff;
	WHILE @@FETCH_STATUS = 0
	BEGIN
		-- 2-3 affectations par cours
		DECLARE @j INT = 0;
		WHILE @j < 2 + (ABS(CHECKSUM(NEWID())) % 2)
		BEGIN
			SELECT @pid_aff = (SELECT TOP 1 id FROM Professeur ORDER BY NEWID());
			SELECT @salid_aff = (SELECT TOP 1 id FROM Salle ORDER BY NEWID());
			SELECT @jour_aff = CASE (ABS(CHECKSUM(NEWID())) % 5) WHEN 0 THEN 'Lundi' WHEN 1 THEN 'Mardi' WHEN 2 THEN 'Mercredi' WHEN 3 THEN 'Jeudi' ELSE 'Vendredi' END;
			SELECT @heure_aff = CASE (ABS(CHECKSUM(NEWID())) % 6) WHEN 0 THEN '08:00-11:00' WHEN 1 THEN '09:00-12:00' WHEN 2 THEN '11:00-14:00' WHEN 3 THEN '13:00-16:00' WHEN 4 THEN '14:00-17:00' ELSE '10:00-13:00' END;
			
			INSERT INTO AffectationCours (id_cours, id_salle, id_semestre, jour, plageHoraire, id_professeur, createdAt, updatedAt)
			VALUES (@cid_aff, @salid_aff, @sid, @jour_aff, @heure_aff, @pid_aff, GETDATE(), GETDATE());
			
			SET @j = @j + 1;
		END
		
		FETCH NEXT FROM cours_loop INTO @cid_aff;
	END
	
	CLOSE cours_loop;
	DEALLOCATE cours_loop;
	
	FETCH NEXT FROM semestre_loop INTO @sid;
END

CLOSE semestre_loop;
DEALLOCATE semestre_loop;

-- JOURS FÉRIÉS
INSERT INTO JourFerie (id_semestre, date, description, createdAt) VALUES
((SELECT id FROM Semestre WHERE nom = 'Automne 2024'), '2024-09-02', 'Fête du Travail', GETDATE()),
((SELECT id FROM Semestre WHERE nom = 'Automne 2024'), '2024-12-25', 'Noël', GETDATE()),
((SELECT id FROM Semestre WHERE nom = 'Hiver 2025'), '2025-02-17', 'Journée relâche', GETDATE()),
((SELECT id FROM Semestre WHERE nom = 'Hiver 2025'), '2025-04-18', 'Vendredi saint', GETDATE()),
((SELECT id FROM Semestre WHERE nom = 'Printemps 2025'), '2025-07-01', 'Fête du Canada', GETDATE()),
((SELECT id FROM Semestre WHERE nom = 'Automne 2025'), '2025-09-01', 'Fête du Travail', GETDATE()),
((SELECT id FROM Semestre WHERE nom = 'Automne 2025'), '2025-12-25', 'Noël', GETDATE()),
((SELECT id FROM Semestre WHERE nom = 'Hiver 2026'), '2026-02-16', 'Journée relâche', GETDATE()),
((SELECT id FROM Semestre WHERE nom = 'Hiver 2026'), '2026-04-10', 'Vendredi saint', GETDATE()),
((SELECT id FROM Semestre WHERE nom = 'Printemps 2026'), '2026-07-01', 'Fête du Canada', GETDATE()),
((SELECT id FROM Semestre WHERE nom = 'Automne 2026'), '2026-09-07', 'Fête du Travail', GETDATE()),
((SELECT id FROM Semestre WHERE nom = 'Automne 2026'), '2026-12-25', 'Noël', GETDATE()),
((SELECT id FROM Semestre WHERE nom = 'Hiver 2027'), '2027-02-15', 'Journée relâche', GETDATE()),
((SELECT id FROM Semestre WHERE nom = 'Hiver 2027'), '2027-04-02', 'Vendredi saint', GETDATE());

-- UTILISATEURS
INSERT INTO [User] (email, password, role, nom, prenom, createdAt) VALUES
('admin@eplanify.com', '$2b$10$qp1OGnMXuBTgn46oXBHGeOJMvgciDsEKHTPMe.EHoti8oSX9HLskC', 'admin', 'Admin', 'System', GETDATE()),
('coordinateur@eplanify.com', '$2b$10$qp1OGnMXuBTgn46oXBHGeOJMvgciDsEKHTPMe.EHoti8oSX9HLskC', 'coordinateur', 'Coordinateur', 'Académique', GETDATE()),
('directeur@eplanify.com', '$2b$10$qp1OGnMXuBTgn46oXBHGeOJMvgciDsEKHTPMe.EHoti8oSX9HLskC', 'directeur', 'Directeur', 'Général', GETDATE());

-- STATISTIQUES FINALES
SELECT 'Semestres' AS "Type", COUNT(*) AS "Nombre" FROM Semestre
UNION ALL SELECT 'Cours', COUNT(*) FROM Cours
UNION ALL SELECT 'Salles', COUNT(*) FROM Salle
UNION ALL SELECT 'Professeurs', COUNT(*) FROM Professeur
UNION ALL SELECT 'Disponibilités', COUNT(*) FROM Disponibilite
UNION ALL SELECT 'Affectations', COUNT(*) FROM AffectationCours
UNION ALL SELECT 'Jours fériés', COUNT(*) FROM JourFerie
UNION ALL SELECT 'Utilisateurs', COUNT(*) FROM [User]
ORDER BY 2 DESC;
