import { Resend } from "resend";
import { env } from "@/lib/env";

export const resend = new Resend(env.AUTH_RESEND_KEY);
