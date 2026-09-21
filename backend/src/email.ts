import { Resend } from 'resend';
import { EMAIL_FROM } from './config';
import { escapeHtml } from './htmlEscape';

// La clé API est lue directement via process.env (comme les identifiants
// DB dans db.ts) plutôt que centralisée dans config.ts : c'est un secret,
// pas un paramètre applicatif.
const resend = new Resend(process.env.RESEND_API_KEY);

// Même invitation que le bouton de la FAQ (frontend/src/pages/FaqPage.tsx) :
// si le lien change, il faut le changer aux deux endroits.
const WHATSAPP_GROUP_URL = 'https://chat.whatsapp.com/KwSXNjGhSJ5BkzgSqcHnSP';

export async function sendVerificationCode(to: string, username: string, code: string): Promise<void> {
    const safeUsername = escapeHtml(username);

    // Le code ouvre l'objet : il se lit dans la notification sans ouvrir le
    // message, et les téléphones qui proposent les codes reçus au-dessus du
    // clavier le repèrent. Dans le corps, l'écart entre les chiffres est du
    // letter-spacing et non des espaces, pour qu'un copier-coller donne
    // « 482913 ».
    const { error } = await resend.emails.send({
        from: EMAIL_FROM,
        to,
        subject: `${code} : votre code AURA Catcher`,
        html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #1f2937;">
                <h2>Votre code de confirmation</h2>
                <p>Pour protéger le pseudo <strong>${safeUsername}</strong> sur AURA Catcher, saisissez ce code sur la page où vous l'avez demandé :</p>
                <p style="margin: 32px 0; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #1a56db;">${code}</p>
                <p>Une fois confirmé, plus personne d'autre ne pourra poster sous ce nom.</p>
                <div style="margin: 32px 0; padding: 20px; background: #f0fdf4; border-radius: 12px;">
                    <p style="margin: 0 0 16px;">Envie d'échanger avec d'autres chasseurs de panneaux ? Rejoignez le groupe WhatsApp pour partager vos plus belles trouvailles.</p>
                    <a href="${WHATSAPP_GROUP_URL}" style="display:inline-block;padding:12px 24px;background:#25d366;color:#fff;font-weight:700;text-decoration:none;border-radius:8px;">
                        Rejoindre le groupe WhatsApp
                    </a>
                </div>
                <p style="color:#6b7280;font-size:14px;">Ce code expire dans 15 minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email.</p>
            </div>
        `,
    });

    // Le SDK Resend ne lève pas d'exception sur une erreur API : il renvoie
    // { data, error }. Il faut vérifier `error` explicitement, sinon un envoi
    // qui échoue silencieusement ferait croire à l'utilisateur qu'un email
    // est parti alors que rien n'a été envoyé.
    if (error) {
        throw new Error(`Échec de l'envoi de l'email de vérification : ${error.message}`);
    }
}
