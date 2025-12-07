import { Request, Response, NextFunction } from "express";
import AppError from "../errors/AppError";
import { verifyCaptchaToken, getCaptchaSettings } from "../services/CaptchaServices/VerifyCaptchaService";

/**
 * Middleware que verifica tokens de captcha (Turnstile o reCAPTCHA)
 * Solo verifica si el captcha está habilitado en Settings
 * El token se espera en req.body.captchaToken
 */
const verifyCaptcha = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const settings = await getCaptchaSettings();

        // Si captcha no está habilitado, continuar sin verificación
        if (!settings.enabled) {
            return next();
        }

        // Si está habilitado pero no hay secret key, advertir y continuar
        if (!settings.secretKey) {
            console.warn("⚠️ Captcha habilitado pero sin secret key configurada");
            return next();
        }

        const captchaToken = req.body.captchaToken;

        // Obtener IP del cliente
        const remoteIp =
            (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
            req.socket.remoteAddress ||
            undefined;

        const result = await verifyCaptchaToken(captchaToken, remoteIp);

        if (!result.success) {
            console.warn(`❌ Verificación de captcha fallida:`, result.errorCodes);
            throw new AppError("ERR_CAPTCHA_VERIFICATION_FAILED", 403);
        }

        return next();
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }
        console.error("Error en middleware de captcha:", error);
        // En caso de error inesperado, permitir el paso para no bloquear usuarios
        return next();
    }
};

export default verifyCaptcha;
