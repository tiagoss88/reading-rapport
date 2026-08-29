import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/supabase/vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('https://mxoflglqsxupkzrbodkm.supabase.co'),
    'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14b2ZsZ2xxc3h1cGt6cmJvZGttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5NjM1MzgsImV4cCI6MjA3MDUzOTUzOH0.zToDlCEsT7TCAnQslnFVRRiygRveOCXf33TAuG_tdF8'),
    'import.meta.env.VITE_SUPABASE_PROJECT_ID': JSON.stringify('mxoflglqsxupkzrbodkm'),
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
    mcpPlugin(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
