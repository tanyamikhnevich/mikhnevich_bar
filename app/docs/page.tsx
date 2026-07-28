"use client";

import { useEffect } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";

/**
 * Страница со Swagger UI. Отдаёт интерактивную документацию по openapi.yaml.
 * Ассеты Swagger UI грузятся с CDN (unpkg), спецификация — из /openapi.yaml.
 * Страница публичная (см. proxy.ts) — открыть можно без входа.
 */

const SWAGGER_VERSION = "5.17.14";
const CSS_URL = `https://unpkg.com/swagger-ui-dist@${SWAGGER_VERSION}/swagger-ui.css`;
const JS_URL = `https://unpkg.com/swagger-ui-dist@${SWAGGER_VERSION}/swagger-ui-bundle.js`;

declare global {
  interface Window {
    SwaggerUIBundle?: (options: Record<string, unknown>) => void;
  }
}

export default function DocsPage() {
  const { t } = useI18n();
  useEffect(() => {
    let cancelled = false;

    // CSS
    if (!document.querySelector(`link[data-swagger]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = CSS_URL;
      link.dataset.swagger = "true";
      document.head.appendChild(link);
    }

    function render() {
      if (cancelled || !window.SwaggerUIBundle) return;
      window.SwaggerUIBundle({
        url: "/openapi.yaml",
        dom_id: "#swagger-ui",
        deepLinking: true,
        tryItOutEnabled: true,
      });
    }

    // JS
    const existing = document.querySelector<HTMLScriptElement>(
      "script[data-swagger]",
    );
    if (window.SwaggerUIBundle) {
      render();
    } else if (existing) {
      existing.addEventListener("load", render);
    } else {
      const script = document.createElement("script");
      script.src = JS_URL;
      script.dataset.swagger = "true";
      script.crossOrigin = "anonymous";
      script.addEventListener("load", render);
      document.body.appendChild(script);
    }

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div style={{ minHeight: "100%", background: "#fafafa" }}>
      <div id="swagger-ui" />
      <noscript>{t.docs.noscript}</noscript>
    </div>
  );
}
