import { Router } from "express";

const router = Router();


router.post("/webhook", (req, res) => {
  const { body } = req;
  console.log("Received webhook:", body);
 
  res.status(200).json({ message: "Webhook received successfully" });
});

export default router
