import { Router } from "express";
import { sendMail } from "../controllers/mail.controller";

const router = Router();
const he = "dsfsf";
const check = () => {
  console.log("fsdmfdsf");
};
router.post("/send", sendMail);

export default router;
