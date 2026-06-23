import "reflect-metadata";
import "dotenv/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { EnvelopeInterceptor } from "./common/envelope.interceptor";
import { HttpExceptionFilter } from "./common/http-exception.filter";
import { resolveMode, persistenceKind, authRequired, assertModeConfig, assertPersistenceConfig } from "./common/mode";
import { dbPing } from "./db/db";

async function bootstrap() {
  const mode = resolveMode();
  // Abort a prod/staging boot that's missing required security config (PRD §3.2).
  assertModeConfig(mode);
  // Abort a prod/staging boot that would run on in-memory state (No-Dummy-Data §6.4).
  assertPersistenceConfig(mode);
  if (mode !== "demo") {
    const ping = await dbPing();
    if (!ping.reachable) {
      throw new Error(
        `GEOSEO_MODE=${mode}: DATABASE_URL is set but unreachable (${ping.error ?? "no response"}). ` +
          `Refusing to boot in-memory in production.`,
      );
    }
  }

  // Stripe webhook verification requires the exact bytes Stripe signed.
  const app = await NestFactory.create(AppModule, { cors: false, rawBody: true });

  app.setGlobalPrefix("api/v1");
  app.useGlobalInterceptors(new EnvelopeInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  // CORS allow-list: localhost + dev tunnels, plus an explicit WEB_ORIGIN if set.
  const origin: (string | RegExp)[] = [
    /localhost:\d+$/,
    /\.ngrok-free\.dev$/,
    /\.ngrok-free\.app$/,
    /\.trycloudflare\.com$/,
  ];
  if (process.env.WEB_ORIGIN) origin.push(process.env.WEB_ORIGIN);
  app.enableCors({ origin, credentials: true });

  // OpenAPI / Swagger — /api/docs (UI) + /api/docs-json (spec).
  const config = new DocumentBuilder()
    .setTitle("GEOSEO API")
    .setDescription("Backlinking & Continuous SEO Optimization Engine — v1")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  const doc = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, doc, { jsonDocumentUrl: "api/docs-json" });

  const port = Number.parseInt(process.env.PORT ?? "4000", 10);
  // Bind all interfaces (0.0.0.0) so the container is reachable on hosts like Railway.
  await app.listen(port, "0.0.0.0");
  // eslint-disable-next-line no-console
  console.log(`GEOSEO API on http://localhost:${port}/api/v1  ·  docs: /api/docs`);
}

void bootstrap();
