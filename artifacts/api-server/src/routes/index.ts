import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import contactsRouter from "./contacts";
import postsRouter from "./posts";
import settingsRouter from "./settings";
import alertsRouter from "./alerts";
import authRouter from "./auth";
import incidentsRouter from "./incidents";
import feedbackRouter from "./feedback";
import voiceCallbackRouter from "./voice-callback";

import communityUploadRouter from "./community-upload";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(alertsRouter);
router.use(voiceCallbackRouter);
router.use(usersRouter);
router.use(contactsRouter);
router.use(postsRouter);
router.use(communityUploadRouter);
router.use(settingsRouter);
router.use(incidentsRouter);
router.use(feedbackRouter);

export default router;

