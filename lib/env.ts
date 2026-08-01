import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.url(),
  DIRECT_URL: z.url(),

  AUTH_SECRET: z.string().min(1),
  AUTH_URL: z.url().optional(),

  AUTH_GOOGLE_ID: z.string().min(1),
  AUTH_GOOGLE_SECRET: z.string().min(1),

  AUTH_RESEND_KEY: z.string().min(1),
  EMAIL_FROM: z.email(),

  DEMO_CUSTOMER_EMAIL: z.email(),
  DEMO_CUSTOMER_PASSWORD: z.string().min(1),
  DEMO_ADMIN_EMAIL: z.email(),
  DEMO_ADMIN_PASSWORD: z.string().min(1),

  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1),

  NEXT_PUBLIC_APP_URL: z.url(),

  BLOB_READ_WRITE_TOKEN: z.string().min(1).optional(),
});

export const env = envSchema.parse(process.env);
