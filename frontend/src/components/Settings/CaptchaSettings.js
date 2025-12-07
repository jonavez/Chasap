import React, { useEffect, useState } from "react";
import {
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Button,
    Typography,
    Paper,
    FormHelperText,
    InputAdornment,
    IconButton,
    Divider,
    Box,
    Chip,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import {
    Visibility,
    VisibilityOff,
    Security,
    CheckCircle,
    CloudQueue,
    Language
} from "@material-ui/icons";
import { toast } from "react-toastify";
import useSettings from "../../hooks/useSettings";

const useStyles = makeStyles((theme) => ({
    paper: {
        padding: theme.spacing(3),
        marginBottom: theme.spacing(2),
    },
    title: {
        display: "flex",
        alignItems: "center",
        marginBottom: theme.spacing(3),
        "& svg": {
            marginRight: theme.spacing(1),
            color: theme.palette.primary.main,
        },
    },
    formControl: {
        width: "100%",
        marginBottom: theme.spacing(2),
    },
    textField: {
        width: "100%",
        marginBottom: theme.spacing(2),
    },
    saveButton: {
        marginTop: theme.spacing(2),
    },
    sectionTitle: {
        display: "flex",
        alignItems: "center",
        marginBottom: theme.spacing(2),
        marginTop: theme.spacing(3),
        "& svg": {
            marginRight: theme.spacing(1),
        },
    },
    serviceCard: {
        padding: theme.spacing(2),
        marginBottom: theme.spacing(2),
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 12,
        transition: "all 0.2s ease",
    },
    serviceCardActive: {
        borderColor: theme.palette.primary.main,
        backgroundColor: theme.palette.action.selected,
    },
    serviceHeader: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: theme.spacing(2),
    },
    serviceTitle: {
        display: "flex",
        alignItems: "center",
        fontWeight: 600,
        "& svg": {
            marginRight: theme.spacing(1),
        },
    },
    helperLink: {
        marginTop: theme.spacing(1),
        fontSize: "0.75rem",
        "& a": {
            color: theme.palette.primary.main,
            textDecoration: "none",
            "&:hover": {
                textDecoration: "underline",
            },
        },
    },
    statusChip: {
        marginLeft: theme.spacing(1),
    },
    divider: {
        margin: theme.spacing(3, 0),
    },
}));

/**
 * Componente de configuración de Captcha para administradores
 * Permite configurar credenciales de Cloudflare Turnstile y Google reCAPTCHA v3
 * y seleccionar cuál usar o desactivar ambos
 */
export default function CaptchaSettings({ settings }) {
    const classes = useStyles();
    const { update } = useSettings();

    // Estado general
    const [captchaEnabled, setCaptchaEnabled] = useState("false");
    const [captchaType, setCaptchaType] = useState("turnstile");

    // Credenciales Turnstile
    const [turnstileSiteKey, setTurnstileSiteKey] = useState("");
    const [turnstileSecretKey, setTurnstileSecretKey] = useState("");
    const [showTurnstileSecret, setShowTurnstileSecret] = useState(false);

    // Credenciales reCAPTCHA
    const [recaptchaSiteKey, setRecaptchaSiteKey] = useState("");
    const [recaptchaSecretKey, setRecaptchaSecretKey] = useState("");
    const [showRecaptchaSecret, setShowRecaptchaSecret] = useState(false);

    const [loading, setLoading] = useState(false);

    // Cargar configuración inicial desde settings
    useEffect(() => {
        if (Array.isArray(settings) && settings.length) {
            const enabled = settings.find((s) => s.key === "captchaEnabled");
            if (enabled) setCaptchaEnabled(enabled.value);

            const type = settings.find((s) => s.key === "captchaType");
            if (type) setCaptchaType(type.value);

            // Turnstile
            const tSiteKey = settings.find((s) => s.key === "turnstileSiteKey");
            if (tSiteKey) setTurnstileSiteKey(tSiteKey.value);

            const tSecretKey = settings.find((s) => s.key === "turnstileSecretKey");
            if (tSecretKey) setTurnstileSecretKey(tSecretKey.value);

            // reCAPTCHA
            const rSiteKey = settings.find((s) => s.key === "recaptchaSiteKey");
            if (rSiteKey) setRecaptchaSiteKey(rSiteKey.value);

            const rSecretKey = settings.find((s) => s.key === "recaptchaSecretKey");
            if (rSecretKey) setRecaptchaSecretKey(rSecretKey.value);

            // Compatibilidad con settings antiguos
            const oldSiteKey = settings.find((s) => s.key === "captchaSiteKey");
            const oldSecretKey = settings.find((s) => s.key === "captchaSecretKey");
            const currentType = type?.value || "turnstile";

            if (oldSiteKey?.value && !tSiteKey?.value && currentType === "turnstile") {
                setTurnstileSiteKey(oldSiteKey.value);
            }
            if (oldSecretKey?.value && !tSecretKey?.value && currentType === "turnstile") {
                setTurnstileSecretKey(oldSecretKey.value);
            }
            if (oldSiteKey?.value && !rSiteKey?.value && currentType === "recaptcha") {
                setRecaptchaSiteKey(oldSiteKey.value);
            }
            if (oldSecretKey?.value && !rSecretKey?.value && currentType === "recaptcha") {
                setRecaptchaSecretKey(oldSecretKey.value);
            }
        }
    }, [settings]);

    const handleSave = async () => {
        setLoading(true);
        try {
            // Guardar estado y tipo
            await update({ key: "captchaEnabled", value: captchaEnabled });
            await update({ key: "captchaType", value: captchaType });

            // Guardar credenciales Turnstile
            await update({ key: "turnstileSiteKey", value: turnstileSiteKey });
            await update({ key: "turnstileSecretKey", value: turnstileSecretKey });

            // Guardar credenciales reCAPTCHA
            await update({ key: "recaptchaSiteKey", value: recaptchaSiteKey });
            await update({ key: "recaptchaSecretKey", value: recaptchaSecretKey });

            // Actualizar campos legacy para compatibilidad
            if (captchaType === "turnstile") {
                await update({ key: "captchaSiteKey", value: turnstileSiteKey });
                await update({ key: "captchaSecretKey", value: turnstileSecretKey });
            } else {
                await update({ key: "captchaSiteKey", value: recaptchaSiteKey });
                await update({ key: "captchaSecretKey", value: recaptchaSecretKey });
            }

            toast.success("Configuración de Captcha guardada exitosamente");
        } catch (error) {
            toast.error("Error al guardar la configuración de Captcha");
            console.error(error);
        }
        setLoading(false);
    };

    const isTurnstileConfigured = turnstileSiteKey && turnstileSecretKey;
    const isRecaptchaConfigured = recaptchaSiteKey && recaptchaSecretKey;

    return (
        <Paper className={classes.paper} elevation={2}>
            <Typography variant="h6" className={classes.title}>
                <Security />
                Protección Anti-Bots (Captcha)
            </Typography>

            <Typography variant="body2" color="textSecondary" gutterBottom>
                Configura las credenciales de ambos servicios y selecciona cuál usar para proteger login y registro.
            </Typography>

            {/* Estado y selección */}
            <Grid container spacing={2} style={{ marginTop: 16 }}>
                <Grid item xs={12} sm={6}>
                    <FormControl className={classes.formControl} variant="outlined">
                        <InputLabel id="captcha-enabled-label">Estado</InputLabel>
                        <Select
                            labelId="captcha-enabled-label"
                            value={captchaEnabled}
                            onChange={(e) => setCaptchaEnabled(e.target.value)}
                            label="Estado"
                        >
                            <MenuItem value="false">Deshabilitado</MenuItem>
                            <MenuItem value="true">Habilitado</MenuItem>
                        </Select>
                        <FormHelperText>
                            {captchaEnabled === "true"
                                ? "La verificación captcha está activa"
                                : "Sin protección captcha"}
                        </FormHelperText>
                    </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                    <FormControl className={classes.formControl} variant="outlined">
                        <InputLabel id="captcha-type-label">Servicio Activo</InputLabel>
                        <Select
                            labelId="captcha-type-label"
                            value={captchaType}
                            onChange={(e) => setCaptchaType(e.target.value)}
                            label="Servicio Activo"
                            disabled={captchaEnabled === "false"}
                        >
                            <MenuItem value="turnstile" disabled={!isTurnstileConfigured}>
                                Cloudflare Turnstile {!isTurnstileConfigured && "(Sin configurar)"}
                            </MenuItem>
                            <MenuItem value="recaptcha" disabled={!isRecaptchaConfigured}>
                                Google reCAPTCHA v3 {!isRecaptchaConfigured && "(Sin configurar)"}
                            </MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
            </Grid>

            <Divider className={classes.divider} />

            {/* Sección Turnstile */}
            <Box
                className={`${classes.serviceCard} ${captchaType === "turnstile" && captchaEnabled === "true" ? classes.serviceCardActive : ""}`}
            >
                <div className={classes.serviceHeader}>
                    <Typography variant="subtitle1" className={classes.serviceTitle}>
                        <CloudQueue style={{ color: "#f38020" }} />
                        Cloudflare Turnstile
                        {isTurnstileConfigured && (
                            <Chip
                                size="small"
                                icon={<CheckCircle style={{ fontSize: 16 }} />}
                                label="Configurado"
                                color="primary"
                                className={classes.statusChip}
                            />
                        )}
                    </Typography>
                    {captchaType === "turnstile" && captchaEnabled === "true" && (
                        <Chip size="small" label="ACTIVO" color="secondary" />
                    )}
                </div>

                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <TextField
                            className={classes.textField}
                            label="Site Key (Turnstile)"
                            variant="outlined"
                            value={turnstileSiteKey}
                            onChange={(e) => setTurnstileSiteKey(e.target.value)}
                            placeholder="ej: 0x4AAAAAAAB..."
                            helperText="Clave pública de Turnstile"
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            className={classes.textField}
                            label="Secret Key (Turnstile)"
                            variant="outlined"
                            type={showTurnstileSecret ? "text" : "password"}
                            value={turnstileSecretKey}
                            onChange={(e) => setTurnstileSecretKey(e.target.value)}
                            placeholder="Clave secreta de Turnstile"
                            helperText="Clave privada de Turnstile"
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowTurnstileSecret(!showTurnstileSecret)}
                                            edge="end"
                                        >
                                            {showTurnstileSecret ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Grid>
                </Grid>
                <Typography className={classes.helperLink}>
                    Obtén tus claves en:{" "}
                    <a
                        href="https://dash.cloudflare.com/?to=/:account/turnstile"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Cloudflare Dashboard → Turnstile
                    </a>
                </Typography>
            </Box>

            {/* Sección reCAPTCHA */}
            <Box
                className={`${classes.serviceCard} ${captchaType === "recaptcha" && captchaEnabled === "true" ? classes.serviceCardActive : ""}`}
            >
                <div className={classes.serviceHeader}>
                    <Typography variant="subtitle1" className={classes.serviceTitle}>
                        <Language style={{ color: "#4285f4" }} />
                        Google reCAPTCHA v3
                        {isRecaptchaConfigured && (
                            <Chip
                                size="small"
                                icon={<CheckCircle style={{ fontSize: 16 }} />}
                                label="Configurado"
                                color="primary"
                                className={classes.statusChip}
                            />
                        )}
                    </Typography>
                    {captchaType === "recaptcha" && captchaEnabled === "true" && (
                        <Chip size="small" label="ACTIVO" color="secondary" />
                    )}
                </div>

                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <TextField
                            className={classes.textField}
                            label="Site Key (reCAPTCHA)"
                            variant="outlined"
                            value={recaptchaSiteKey}
                            onChange={(e) => setRecaptchaSiteKey(e.target.value)}
                            placeholder="ej: 6LcXXXXX..."
                            helperText="Clave pública de reCAPTCHA v3"
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            className={classes.textField}
                            label="Secret Key (reCAPTCHA)"
                            variant="outlined"
                            type={showRecaptchaSecret ? "text" : "password"}
                            value={recaptchaSecretKey}
                            onChange={(e) => setRecaptchaSecretKey(e.target.value)}
                            placeholder="Clave secreta de reCAPTCHA"
                            helperText="Clave privada de reCAPTCHA v3"
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowRecaptchaSecret(!showRecaptchaSecret)}
                                            edge="end"
                                        >
                                            {showRecaptchaSecret ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Grid>
                </Grid>
                <Typography className={classes.helperLink}>
                    Obtén tus claves en:{" "}
                    <a
                        href="https://www.google.com/recaptcha/admin/"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Google reCAPTCHA Admin
                    </a>
                </Typography>
            </Box>

            {/* Botón Guardar */}
            <Button
                variant="contained"
                color="primary"
                onClick={handleSave}
                disabled={loading}
                className={classes.saveButton}
                fullWidth
                size="large"
            >
                {loading ? "Guardando..." : "Guardar Configuración"}
            </Button>
        </Paper>
    );
}
