import fs from "fs";
import { ChaosSignal } from "../agents/detectionAgent";
 export const logChaosSignal =(signal:ChaosSignal)=>
 {
  const log = `[${new Date().toISOString()}] ${signal.type}: ${signal.summary}\n`;
  fs.appendFileSync("chaos.log", log);
 }




export const logResolution = (summary: string) => {
  const log = `[${new Date().toISOString()}] ${summary}\n`;
  fs.appendFileSync("resolver.log", log);
};
