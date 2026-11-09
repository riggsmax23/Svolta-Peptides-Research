/// <reference types="@cloudflare/workers-types" />
declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    CONNECTORS?: import('./lib/connector-contract.mjs').ConnectorBinding;
    ORDER_OWNER_USER_ID?: string;
    ORDER_OWNER_EMAIL?: string;
    ORDER_ADMIN_KEY?: string;
    RESEND_API_KEY?: string;
  }
}
