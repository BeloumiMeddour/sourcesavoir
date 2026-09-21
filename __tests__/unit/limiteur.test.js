/**
 * Tests du limiteur de tentatives (middleware/limiteur.js) : fenêtre glissante
 * en mémoire, mémoire bornée, clés par IP et par courriel, réglages par variables
 * d'environnement. Le temps est simulé (jest.useFakeTimers).
 */
import { jest } from "@jest/globals";
import {
    creerLimiteur,
    cleIp,
    cleCourriel,
    normaliserIp,
    lireReglages,
    MESSAGE_TROP_DE_TENTATIVES,
} from "../../middleware/limiteur.js";

const creerReponse = () => {
    const res = {
        status: jest.fn(() => res),
        set: jest.fn(() => res),
        json: jest.fn(() => res),
    };
    return res;
};

/** Appelle le limiteur et retourne { res, next } pour inspection. */
const appeler = (limiteur, req = { ip: "1.2.3.4" }) => {
    const res = creerReponse();
    const next = jest.fn();
    limiteur(req, res, next);
    return { res, next };
};

const attendrePasse = ({ res, next }) => {
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
    expect(res.status).not.toHaveBeenCalled();
};

const attendreBloque = ({ res, next }) => {
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith({ error: MESSAGE_TROP_DE_TENTATIVES });
};

const retryAfter = ({ res }) => Number(res.set.mock.calls.find(([nom]) => nom === "Retry-After")[1]);

describe("creerLimiteur", () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(0);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    const creer = (options = {}) =>
        creerLimiteur({ max: 3, fenetreMs: 100_000, cle: (req) => req.ip, ...options });

    test("laisse passer jusqu'à max tentatives puis répond 429", () => {
        const limiteur = creer();

        for (let i = 0; i < 3; i++) {
            attendrePasse(appeler(limiteur));
        }
        attendreBloque(appeler(limiteur));
    });

    test("le message est générique : aucune clé, aucun compteur, aucune trace", () => {
        const limiteur = creer();
        for (let i = 0; i < 3; i++) appeler(limiteur, { ip: "9.9.9.9" });

        const { res } = appeler(limiteur, { ip: "9.9.9.9" });

        const corps = JSON.stringify(res.json.mock.calls[0][0]);
        expect(corps).toBe(JSON.stringify({ error: MESSAGE_TROP_DE_TENTATIVES }));
        expect(corps).not.toContain("9.9.9.9");
        expect(MESSAGE_TROP_DE_TENTATIVES).toMatch(/tentatives/i);
    });

    test("Retry-After (secondes entières) indique quand la plus ancienne tentative sort de la fenêtre", () => {
        const limiteur = creer();
        appeler(limiteur); // t = 0
        jest.setSystemTime(10_000);
        appeler(limiteur);
        jest.setSystemTime(20_000);
        appeler(limiteur);

        jest.setSystemTime(30_000);
        const refuse = appeler(limiteur);

        attendreBloque(refuse);
        // La tentative de t = 0 expire à t = 100 s : il reste 70 s
        expect(retryAfter(refuse)).toBe(70);
    });

    test("Retry-After est arrondi à la seconde supérieure et vaut au moins 1", () => {
        const limiteur = creer();
        for (let i = 0; i < 3; i++) appeler(limiteur);

        jest.setSystemTime(99_999); // 1 ms avant l'expiration
        expect(retryAfter(appeler(limiteur))).toBe(1);

        jest.setSystemTime(50_500); // 49,5 s restantes
        expect(retryAfter(appeler(limiteur))).toBe(50);
    });

    test("fenêtre glissante : chaque tentative expire à son propre rythme", () => {
        const limiteur = creer();
        appeler(limiteur); // t = 0
        jest.setSystemTime(10_000);
        appeler(limiteur); // t = 10 s
        jest.setSystemTime(20_000);
        appeler(limiteur); // t = 20 s
        attendreBloque(appeler(limiteur));

        // t = 100 s : seule la tentative de t = 0 a expiré
        jest.setSystemTime(100_000);
        attendrePasse(appeler(limiteur));
        attendreBloque(appeler(limiteur));

        // t = 110 s : celle de t = 10 s expire à son tour
        jest.setSystemTime(110_000);
        attendrePasse(appeler(limiteur));
        attendreBloque(appeler(limiteur));
    });

    test("les tentatives refusées ne prolongent pas le blocage", () => {
        const limiteur = creer();
        for (let i = 0; i < 3; i++) appeler(limiteur);

        for (let t = 1000; t < 100_000; t += 1000) {
            jest.setSystemTime(t);
            attendreBloque(appeler(limiteur));
        }

        jest.setSystemTime(100_000);
        attendrePasse(appeler(limiteur));
    });

    test("les clés sont indépendantes", () => {
        const limiteur = creer();
        for (let i = 0; i < 3; i++) appeler(limiteur, { ip: "1.1.1.1" });

        attendreBloque(appeler(limiteur, { ip: "1.1.1.1" }));
        attendrePasse(appeler(limiteur, { ip: "2.2.2.2" }));
    });

    test("une clé absente (null) ne compte pas et laisse passer", () => {
        const limiteur = creer({ cle: () => null });

        for (let i = 0; i < 10; i++) {
            attendrePasse(appeler(limiteur));
        }
        expect(limiteur.taille()).toBe(0);
    });

    describe("mémoire bornée", () => {
        test("ne retient jamais plus de maxCles clés (la plus ancienne est évincée)", () => {
            const limiteur = creer({ maxCles: 3 });

            for (let i = 0; i < 50; i++) {
                jest.setSystemTime(i * 10);
                appeler(limiteur, { ip: `10.0.0.${i}` });
                expect(limiteur.taille()).toBeLessThanOrEqual(3);
            }
            expect(limiteur.taille()).toBe(3);
        });

        test("purge d'abord les clés dont toutes les tentatives ont expiré", () => {
            const limiteur = creer({ maxCles: 3 });
            appeler(limiteur, { ip: "a" });
            appeler(limiteur, { ip: "b" });
            appeler(limiteur, { ip: "c" });
            expect(limiteur.taille()).toBe(3);

            jest.setSystemTime(150_000); // tout a expiré
            appeler(limiteur, { ip: "d" });

            expect(limiteur.taille()).toBe(1);
        });

        test("nettoie périodiquement les clés expirées, même sans atteindre maxCles", () => {
            const limiteur = creer({ maxCles: 1000 });
            for (let i = 0; i < 20; i++) appeler(limiteur, { ip: `10.1.0.${i}` });
            expect(limiteur.taille()).toBe(20);

            jest.setSystemTime(250_000);
            appeler(limiteur, { ip: "nouveau" });

            expect(limiteur.taille()).toBe(1);
        });

        test("ne garde pas plus de max horodatages par clé, même sous une rafale", () => {
            const limiteur = creer();

            for (let i = 0; i < 1000; i++) appeler(limiteur);

            // Après la fenêtre, exactement max tentatives repassent : rien n'a été accumulé en trop
            jest.setSystemTime(100_000);
            for (let i = 0; i < 3; i++) attendrePasse(appeler(limiteur));
            attendreBloque(appeler(limiteur));
        });
    });
});

describe("normaliserIp", () => {
    test.each([
        ["1.2.3.4", "1.2.3.4"],
        // Azure App Service ajoute le port du client dans X-Forwarded-For : sans normalisation,
        // chaque connexion aurait une « IP » différente et le limiteur serait contourné
        ["1.2.3.4:51234", "1.2.3.4"],
        ["[2001:db8::1]:443", "2001:db8::1"],
        ["2001:db8::1", "2001:db8::1"],
        ["::ffff:1.2.3.4", "1.2.3.4"],
        ["::ffff:1.2.3.4:5000", "1.2.3.4"],
        ["::1", "::1"],
    ])("%s devient %s", (brute, attendu) => {
        expect(normaliserIp(brute)).toBe(attendu);
    });

    test.each([undefined, null, "", 42, {}])("valeur inutilisable (%p) : clé partagée « inconnue »", (valeur) => {
        expect(normaliserIp(valeur)).toBe("inconnue");
    });
});

describe("clés de limitation", () => {
    test("cleIp lit req.ip normalisée", () => {
        expect(cleIp({ ip: "1.2.3.4:999" })).toBe("1.2.3.4");
    });

    test("cleIp ne lit jamais l'en-tête X-Forwarded-For directement (c'est Express qui décide de le croire)", () => {
        expect(cleIp({ ip: "1.2.3.4", headers: { "x-forwarded-for": "6.6.6.6" } })).toBe("1.2.3.4");
    });

    test("cleCourriel normalise : espaces retirés et minuscules", () => {
        expect(cleCourriel({ body: { email: "  Jean.Tremblay@LaCite.CA " } })).toBe("jean.tremblay@lacite.ca");
    });

    test("les variantes de casse d'un même courriel partagent la même clé", () => {
        expect(cleCourriel({ body: { email: "A@B.ca" } })).toBe(cleCourriel({ body: { email: "a@b.CA " } }));
    });

    test("comme passport-local, lit la query string si le corps ne fournit pas de courriel", () => {
        expect(cleCourriel({ body: {}, query: { email: "Q@B.ca" } })).toBe("q@b.ca");
        expect(cleCourriel({ body: undefined, query: { email: "Q@B.ca" } })).toBe("q@b.ca");
    });

    test.each([
        [{ body: { email: { $ne: "" } } }],
        [{ body: { email: ["a@b.ca"] } }],
        [{ body: { email: 42 } }],
        [{ body: { email: "" } }],
        [{ body: { email: "   " } }],
        [{ body: {} }],
        [{}],
    ])("courriel absent ou de type inattendu : pas de clé (%j)", (req) => {
        expect(cleCourriel(req)).toBeNull();
    });

    test("borne la longueur de la clé (mémoire) tout en gardant les courriels normaux intacts", () => {
        const enorme = `${"x".repeat(5000)}@b.ca`;

        expect(cleCourriel({ body: { email: enorme } }).length).toBeLessThanOrEqual(200);
    });
});

describe("lireReglages (variables d'environnement)", () => {
    test("défauts : 30 tentatives par IP, 10 par courriel, 10 inscriptions par IP, 15 minutes", () => {
        expect(lireReglages({})).toEqual({
            fenetreMs: 15 * 60 * 1000,
            connexionIpMax: 30,
            connexionCourrielMax: 10,
            inscriptionIpMax: 10,
            maxCles: 10000,
        });
    });

    test("lit les variables LIMITE_*", () => {
        expect(
            lireReglages({
                LIMITE_FENETRE_SECONDES: "60",
                LIMITE_CONNEXION_IP_MAX: "5",
                LIMITE_CONNEXION_COURRIEL_MAX: "3",
                LIMITE_INSCRIPTION_IP_MAX: "2",
                LIMITE_MAX_CLES: "500",
            })
        ).toEqual({
            fenetreMs: 60_000,
            connexionIpMax: 5,
            connexionCourrielMax: 3,
            inscriptionIpMax: 2,
            maxCles: 500,
        });
    });

    test.each(["", "abc", "0", "-5", "1.5", "NaN", "Infinity", " "])(
        "valeur invalide %p : retombe sur le défaut (jamais de limite désactivée par accident)",
        (valeur) => {
            const reglages = lireReglages({
                LIMITE_FENETRE_SECONDES: valeur,
                LIMITE_CONNEXION_IP_MAX: valeur,
                LIMITE_CONNEXION_COURRIEL_MAX: valeur,
                LIMITE_INSCRIPTION_IP_MAX: valeur,
                LIMITE_MAX_CLES: valeur,
            });

            expect(reglages).toEqual(lireReglages({}));
        }
    );
});
