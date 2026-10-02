import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/supabase/vite";

const APP_VERSION = `${Date.now()}`;

// Gera /version.json a cada build para o app detectar novas publicações
function versionPlugin(): Plugin {
  return {
    name: "app-version",
    generateBundle() {
      this.emitFile({ type: "asset", fileName: "version.json", source: JSON.stringify({ version: APP_VERSION }) });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  define: {
    __APP_VERSION__: JSON.stringify(APP_VERSION),
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('https://mxoflglqsxupkzrbodkm.supabase.co'),
    'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14b2ZsZ2xxc3h1cGt6cmJvZGttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5NjM1MzgsImV4cCI6MjA3MDUzOTUzOH0.zToDlCEsT7TCAnQslnFVRRiygRveOCXf33TAuG_tdF8'),
    'import.meta.env.VITE_SUPABASE_PROJECT_ID': JSON.stringify('mxoflglqsxupkzrbodkm'),
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
    mcpPlugin(),
    versionPlugin(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
