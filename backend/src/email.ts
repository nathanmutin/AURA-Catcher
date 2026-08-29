import { Resend } from 'resend';
import { EMAIL_FROM } from './config';
import { escapeHtml } from './htmlEscape';

// La clé API est lue directement via process.env (comme les identifiants
// DB dans db.ts) plutôt que centralisée dans config.ts : c'est un secret,
// pas un paramètre applicatif.
const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(to: string, username: string, verifyUrl: string): Promise<void> {
    const safeUsername = escapeHtml(username);

    // Le SDK Resend ne lève pas d'exception sur une erreur API : il renvoie
    // { data, error }. Il faut vérifier `error` explicitement, sinon un envoi
    // qui échoue silencieusement ferait croire à l'utilisateur qu'un email
    // est parti alors que rien n'a été envoyé.
    const { error } = await resend.emails.send({
        from: EMAIL_FROM,
        to,
        subject: `Confirmez votre pseudo "${username}" sur AURA Catcher`,
        html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #1f2937;">
                <h2>Confirmez votre pseudo</h2>
                <p>Vous avez demandé à protéger le pseudo <strong>${safeUsername}</strong> sur AURA Catcher : une fois confirmé, plus personne d'autre ne pourra poster sous ce nom.</p>
                <p style="margin: 32px 0;">
                    <a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#1a56db;color:#fff;text-decoration:none;border-radius:8px;">
                        Confirmer mon pseudo
                    </a>
                </p>
                <p style="color:#6b7280;font-size:14px;">Ce lien expire dans 15 minutes et ne fonctionne qu'une seule fois. Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email.</p>
            </div>
        `,
    });

    if (error) {
        throw new Error(`Échec de l'envoi de l'email de vérification : ${error.message}`);
    }
}
