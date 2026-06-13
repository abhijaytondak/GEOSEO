import "reflect-metadata";
import "dotenv/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { EnvelopeInterceptor } from "./common/envelope.interceptor";
import { HttpExceptionFilter } from "./common/http-exception.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: false });

  app.setGlobalPrefix("api/v1");
  app.useGlobalInterceptors(new EnvelopeInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  // Allow the web app (and its tunnel) to call the API from the browser.
  app.enableCors({
    origin: [/localhost:\d+$/, /\.ngrok-free\.dev$/, /\.ngrok-free\.app$/, /\.trycloudflare\.com$/],
    credentials: true,
  });

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
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`GEOSEO API on http://localhost:${port}/api/v1  ·  docs: /api/docs`);
}

void bootstrap();
