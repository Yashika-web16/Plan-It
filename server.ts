import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Stripe from "stripe";
import dotenv from "dotenv";

import { Resend } from "resend";

// Load environment variables from .env file
dotenv.config();

let resendClient: Resend | null = null;

function getResend(): Resend {
  if (!resendClient) {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      throw new Error('RESEND_API_KEY environment variable is required');
    }
    resendClient = new Resend(key);
  }
  return resendClient;
}

if (process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY) {
  console.log("🚀 Server: GEMINI_API_KEY detected in .env file!");
} else {
  console.error("❌ Server: No GEMINI_API_KEY found in .env file. Please check the file name and location.");
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let stripeClient: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Plan-It API is running" });
  });

  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const { eventId, title, price, image } = req.body;
      const stripe = getStripe();
      
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: title,
                images: [image],
              },
              unit_amount: price * 100, // Stripe expects cents
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${process.env.APP_URL}/dashboard?success=true`,
        cancel_url: `${process.env.APP_URL}/discover?cancelled=true`,
      });

      res.json({ id: session.id });
    } catch (error) {
      console.error("Stripe error:", error);
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  });

  app.post("/api/send-invite", async (req, res) => {
    try {
      const { email, name, subject, body } = req.body;
      
      if (!email || !name || !subject || !body) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const resend = getResend();
      
      const { data, error } = await resend.emails.send({
        from: 'Plan-It <onboarding@resend.dev>', // Default Resend test domain
        to: [email],
        subject: subject,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h1 style="color: #6366f1;">You're Invited! ✨</h1>
            <p>Hi ${name},</p>
            <div style="white-space: pre-wrap; line-height: 1.6; color: #333;">
              ${body}
            </div>
            <hr style="margin: 30px 0; border: 0; border-top: 1px solid #eee;" />
            <p style="font-size: 12px; color: #999; text-align: center;">
              This invitation was sent via <a href="https://plan-it.app" style="color: #6366f1; text-decoration: none;">Plan-It</a> - Your AI Event Assistant.
            </p>
          </div>
        `,
      });

      if (error) {
        console.error("Resend error:", error);
        return res.status(500).json({ error: error.message });
      }

      res.json({ success: true, data });
    } catch (error) {
      console.error("Server error sending email:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
