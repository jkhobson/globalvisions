#!/bin/sh
# Copies only what a student's browser needs into site/. Used by the website host (Cloudflare Pages: build command
# "sh tools/build-site.sh", output directory "site") and by .github/workflows/pages.yml.
# In school mode (Supabase filled in, in js/config.js) it leaves out the full content with the answer key
# (js/content/fizz.js, js/content/signal.js), so students can't read the answers. The server holds the key.
set -e
rm -rf site && mkdir site
cp -r index.html teacher.html manifest.webmanifest assets js site/
if grep -q 'SUPABASE_URL = "";' js/config.js; then
  echo "Demo mode: no server, so the demo keeps its own content."
else
  for f in js/content/*-public.js; do rm -f "site/js/content/$(basename "$f" -public.js).js"; done
  echo "School mode: answer key left out."
fi
