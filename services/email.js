import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

/**
 * Envoie un email de confirmation de validation de compte
 * @param {string} destinataire - Email de l'utilisateur
 * @param {string} prenom - Prénom de l'utilisateur
 * @param {string} nom - Nom de l'utilisateur
 */
const envoyerEmailValidation = async (destinataire, prenom, nom) => {
    const nomComplet = ((prenom || "") + " " + (nom || "")).trim() || "Utilisateur";

    const mailOptions = {
        from: `"Planify" <${process.env.EMAIL_USER}>`,
        to: destinataire,
        subject: "✅ Votre compte Planify a été validé",
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #2563eb, #7c3aed); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">Planify</h1>
                    <p style="color: rgba(255,255,255,0.85); margin: 5px 0 0;">Gestion des horaires</p>
                </div>
                <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
                    <h2 style="color: #1e293b; margin-top: 0;">Bonjour ${nomComplet},</h2>
                    <p style="color: #475569; line-height: 1.6;">
                        Bonne nouvelle ! Votre compte Planify a été <strong style="color: #059669;">validé par un administrateur</strong>.
                    </p>
                    <p style="color: #475569; line-height: 1.6;">
                        Vous pouvez maintenant vous connecter et accéder à toutes les fonctionnalités de la plateforme.
                    </p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.APP_URL || 'https://eplanify-app-c5gkbthecufehya3.eastus-01.azurewebsites.net'}/connexion" 
                           style="background: #2563eb; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
                            Se connecter
                        </a>
                    </div>
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;" />
                    <p style="color: #94a3b8; font-size: 13px; text-align: center;">
                        Cet email a été envoyé automatiquement par Planify. Merci de ne pas y répondre.
                    </p>
                </div>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email de validation envoyé à ${destinataire}`);
        return true;
    } catch (error) {
        console.error(`Erreur envoi email à ${destinataire}:`, error.message);
        return false;
    }
};

export { envoyerEmailValidation };
