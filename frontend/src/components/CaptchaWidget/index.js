import React, { useEffect, useState, useRef, forwardRef, useImperativeHandle } from "react";
import api from "../../services/api";

/**
 * Componente CaptchaWidget
 * Carga dinámicamente Cloudflare Turnstile o Google reCAPTCHA v3
 * según la configuración del backend.
 * 
 * Uso:
 * const captchaRef = useRef();
 * <CaptchaWidget ref={captchaRef} />
 * 
 * // Para obtener el token:
 * const token = await captchaRef.current?.getToken();
 */
const CaptchaWidget = forwardRef((props, ref) => {
    const [captchaSettings, setCaptchaSettings] = useState({
        enabled: false,
        type: "turnstile",
        siteKey: ""
    });
    const [scriptLoaded, setScriptLoaded] = useState(false);
    const [token, setToken] = useState(null);
    const widgetRef = useRef(null);
    const turnstileWidgetId = useRef(null);

    // Cargar configuración de captcha desde el backend
    useEffect(() => {
        const fetchCaptchaSettings = async () => {
            try {
                const { data } = await api.get("/settings/captcha/public");
                setCaptchaSettings(data);
            } catch (error) {
                console.error("Error al obtener configuración de captcha:", error);
                // En caso de error, continuar sin captcha
            }
        };
        fetchCaptchaSettings();
    }, []);

    // Cargar script de captcha según el tipo configurado
    useEffect(() => {
        if (!captchaSettings.enabled || !captchaSettings.siteKey) return;

        const loadScript = (src, id) => {
            return new Promise((resolve, reject) => {
                if (document.getElementById(id)) {
                    resolve();
                    return;
                }

                const script = document.createElement("script");
                script.id = id;
                script.src = src;
                script.async = true;
                script.defer = true;
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        };

        if (captchaSettings.type === "turnstile") {
            loadScript(
                "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit",
                "turnstile-script"
            ).then(() => {
                setScriptLoaded(true);
            }).catch(error => {
                console.error("Error cargando script de Turnstile:", error);
            });
        } else if (captchaSettings.type === "recaptcha") {
            loadScript(
                `https://www.google.com/recaptcha/api.js?render=${captchaSettings.siteKey}`,
                "recaptcha-script"
            ).then(() => {
                setScriptLoaded(true);
            }).catch(error => {
                console.error("Error cargando script de reCAPTCHA:", error);
            });
        }
    }, [captchaSettings]);

    // Renderizar widget de Turnstile cuando el script esté listo
    useEffect(() => {
        if (!scriptLoaded || !captchaSettings.enabled || !widgetRef.current) return;

        if (captchaSettings.type === "turnstile" && window.turnstile) {
            // Limpiar widget anterior si existe
            if (turnstileWidgetId.current) {
                try {
                    window.turnstile.remove(turnstileWidgetId.current);
                } catch (e) {
                    // Ignorar errores de limpieza
                }
            }

            turnstileWidgetId.current = window.turnstile.render(widgetRef.current, {
                sitekey: captchaSettings.siteKey,
                callback: (newToken) => {
                    setToken(newToken);
                },
                "error-callback": () => {
                    setToken(null);
                    console.error("Error en verificación Turnstile");
                },
                "expired-callback": () => {
                    setToken(null);
                }
            });
        }

        return () => {
            // Limpiar al desmontar
            if (captchaSettings.type === "turnstile" && turnstileWidgetId.current && window.turnstile) {
                try {
                    window.turnstile.remove(turnstileWidgetId.current);
                } catch (e) {
                    // Ignorar errores de limpieza
                }
            }
        };
    }, [scriptLoaded, captchaSettings]);

    // Exponer método getToken al componente padre usando useImperativeHandle
    useImperativeHandle(ref, () => ({
        getToken: async () => {
            if (!captchaSettings.enabled) {
                return null; // Si captcha no está habilitado, retornar null
            }

            if (captchaSettings.type === "turnstile") {
                // Para Turnstile, el token ya debería estar en el state
                return token;
            } else if (captchaSettings.type === "recaptcha" && window.grecaptcha) {
                // Para reCAPTCHA v3, ejecutar verificación
                try {
                    const recaptchaToken = await window.grecaptcha.execute(
                        captchaSettings.siteKey,
                        { action: "login" }
                    );
                    return recaptchaToken;
                } catch (error) {
                    console.error("Error obteniendo token de reCAPTCHA:", error);
                    return null;
                }
            }
            return null;
        },
        reset: () => {
            setToken(null);
            if (captchaSettings.type === "turnstile" && turnstileWidgetId.current && window.turnstile) {
                try {
                    window.turnstile.reset(turnstileWidgetId.current);
                } catch (e) {
                    // Ignorar errores
                }
            }
        },
        isEnabled: () => captchaSettings.enabled
    }));

    // Si captcha no está habilitado, no renderizar nada
    if (!captchaSettings.enabled || !captchaSettings.siteKey) {
        return null;
    }

    // Solo Turnstile necesita contenedor visible (reCAPTCHA v3 es invisible)
    if (captchaSettings.type === "turnstile") {
        return (
            <div
                ref={widgetRef}
                style={{
                    display: "flex",
                    justifyContent: "center",
                    marginTop: 16,
                    marginBottom: 8
                }}
            />
        );
    }

    // reCAPTCHA v3 es invisible, no necesita renderizar nada
    return null;
});

CaptchaWidget.displayName = "CaptchaWidget";

export default CaptchaWidget;
