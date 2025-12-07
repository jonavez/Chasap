import axios from "axios";
import Setting from "../../models/Setting";

interface CaptchaSettings {
    enabled: boolean;
    type: "turnstile" | "recaptcha";
    siteKey: string;
    secretKey: string;
}

interface VerificationResult {
    success: boolean;
    errorCodes?: string[];
}

/**
 * Obtiene la configuración de captcha desde Settings
 * Busca configuración global (companyId = 1) o sin companyId
 * Lee las credenciales específicas según el tipo seleccionado
 */
export const getCaptchaSettings = async (): Promise<CaptchaSettings> => {
    const settings = await Setting.findAll({
        where: {
            key: [
                "captchaEnabled",
                "captchaType",
                "captchaSiteKey",
                "captchaSecretKey",
                "turnstileSiteKey",
                "turnstileSecretKey",
                "recaptchaSiteKey",
                "recaptchaSecretKey"
            ]
        }
    });

    const settingsMap: Record<string, string> = {};
    settings.forEach(s => {
        settingsMap[s.key] = s.value;
    });

    const captchaType = (settingsMap.captchaType as "turnstile" | "recaptcha") || "turnstile";

    // Determinar qué credenciales usar según el tipo
    let siteKey = "";
    let secretKey = "";

    if (captchaType === "turnstile") {
        // Prioridad: credenciales específicas de Turnstile, luego legacy
        siteKey = settingsMap.turnstileSiteKey || settingsMap.captchaSiteKey || "";
        secretKey = settingsMap.turnstileSecretKey || settingsMap.captchaSecretKey || "";
    } else {
        // Prioridad: credenciales específicas de reCAPTCHA, luego legacy
        siteKey = settingsMap.recaptchaSiteKey || settingsMap.captchaSiteKey || "";
        secretKey = settingsMap.recaptchaSecretKey || settingsMap.captchaSecretKey || "";
    }

    return {
        enabled: settingsMap.captchaEnabled === "true",
        type: captchaType,
        siteKey,
        secretKey
    };
};

/**
 * Obtiene solo la configuración pública (sin secret key) para el frontend
 */
export const getPublicCaptchaSettings = async (): Promise<Omit<CaptchaSettings, "secretKey">> => {
    const settings = await getCaptchaSettings();
    return {
        enabled: settings.enabled,
        type: settings.type,
        siteKey: settings.siteKey
    };
};

/**
 * Verifica un token de Cloudflare Turnstile
 */
const verifyTurnstileToken = async (
    token: string,
    secretKey: string,
    remoteIp?: string
): Promise<VerificationResult> => {
    try {
        const response = await axios.post(
            "https://challenges.cloudflare.com/turnstile/v0/siteverify",
            new URLSearchParams({
                secret: secretKey,
                response: token,
                ...(remoteIp && { remoteip: remoteIp })
            }),
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            }
        );

        return {
            success: response.data.success === true,
            errorCodes: response.data["error-codes"]
        };
    } catch (error) {
        console.error("Error verificando Turnstile:", error);
        return { success: false, errorCodes: ["VERIFICATION_ERROR"] };
    }
};

/**
 * Verifica un token de Google reCAPTCHA v3
 */
const verifyRecaptchaToken = async (
    token: string,
    secretKey: string,
    remoteIp?: string
): Promise<VerificationResult> => {
    try {
        const response = await axios.post(
            "https://www.google.com/recaptcha/api/siteverify",
            new URLSearchParams({
                secret: secretKey,
                response: token,
                ...(remoteIp && { remoteip: remoteIp })
            }),
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            }
        );

        // reCAPTCHA v3 devuelve un score de 0.0 a 1.0
        // Score >= 0.5 se considera humano
        const isHuman = response.data.success === true &&
            (response.data.score === undefined || response.data.score >= 0.5);

        return {
            success: isHuman,
            errorCodes: response.data["error-codes"]
        };
    } catch (error) {
        console.error("Error verificando reCAPTCHA:", error);
        return { success: false, errorCodes: ["VERIFICATION_ERROR"] };
    }
};

/**
 * Verifica un token de captcha usando el servicio configurado
 */
export const verifyCaptchaToken = async (
    token: string,
    remoteIp?: string
): Promise<VerificationResult> => {
    const settings = await getCaptchaSettings();

    if (!settings.enabled) {
        return { success: true };
    }

    if (!token) {
        return { success: false, errorCodes: ["MISSING_TOKEN"] };
    }

    if (!settings.secretKey) {
        console.warn("Captcha habilitado pero sin secret key configurada");
        return { success: true }; // Permitir si no está configurado correctamente
    }

    if (settings.type === "turnstile") {
        return verifyTurnstileToken(token, settings.secretKey, remoteIp);
    } else {
        return verifyRecaptchaToken(token, settings.secretKey, remoteIp);
    }
};

export default {
    getCaptchaSettings,
    getPublicCaptchaSettings,
    verifyCaptchaToken
};
