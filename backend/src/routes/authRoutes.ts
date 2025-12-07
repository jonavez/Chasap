import { Router } from "express";
import * as SessionController from "../controllers/SessionController";
import * as UserController from "../controllers/UserController";
import isAuth from "../middleware/isAuth";
import envTokenAuth from "../middleware/envTokenAuth";
import verifyCaptcha from "../middleware/verifyCaptcha";

const authRoutes = Router();

authRoutes.post("/signup", envTokenAuth, verifyCaptcha, UserController.store);
authRoutes.post("/login", verifyCaptcha, SessionController.store);
authRoutes.post("/refresh_token", SessionController.update);
authRoutes.delete("/logout", isAuth, SessionController.remove);
authRoutes.get("/me", isAuth, SessionController.me);

export default authRoutes;

