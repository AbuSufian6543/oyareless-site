#!/bin/sh
# Place the historic Weebly stream poster into the uploads volume so the old
# URL exists as a real file. Next also rewrites this path onto the committed
# brand JPEG; this copy is a fallback if that rewrite is skipped.
#
# Must not fail container start: partner poster URLs are important, but the
# rest of the public site has to come up even if the volume is read-only.

SRC="/app/public/brand/legacy-stream-logo.jpg"
DEST_DIR="/app/public/uploads/4/6/3/6/46366157"

if [ -f "$SRC" ]; then
  mkdir -p "$DEST_DIR" && cp -f "$SRC" "$DEST_DIR/416823.jpg" ||
    echo "wirelesscom: could not copy legacy stream poster into uploads" >&2
fi

exec "$@"
