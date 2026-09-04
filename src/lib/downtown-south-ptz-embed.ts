import { DOWNTOWN_SOUTH_PTZ_SLUG } from "./html-stream-embed";

/**
 * Seed-only vendor snippet. Do not import this from client components —
 * a literal `</script>` in a JS string can break Next.js RSC HTML.
 */
function script(inner: string): string {
  return `<script>${inner}</` + `script>`;
}

export const DOWNTOWN_SOUTH_PTZ_EMBED = `<div class="mistvideo" id="downtown-south-ptz_cOcXMwrFexSI">
  <noscript>
    <a href="https://videostreamcanada.ca/${DOWNTOWN_SOUTH_PTZ_SLUG}.html" target="_blank" rel="noopener noreferrer">
      Click here to play this video
    </a>
  </noscript>
  ${script(`
    var a = function(){
      mistPlay("${DOWNTOWN_SOUTH_PTZ_SLUG}",{
        target: document.getElementById("downtown-south-ptz_cOcXMwrFexSI"),
        loop: true,
        muted: true,
        poster: "https://www.wirelesscom.org/uploads/4/6/3/6/46366157/416823.jpg",
        monitor: {
          action: function(){
            this.MistVideo.log(
              "Switching to nextCombo because of poor playback in " +
              this.MistVideo.source.type +
              " (" +
              Math.round(this.vars.score * 1000) / 10 +
              "%)"
            );
            this.MistVideo.nextCombo();
          }
        }
      });
    };
    if (!window.mistplayers) {
      var p = document.createElement("script");
      if (location.protocol == "https:") { p.src = "https://videostreamcanada.ca/player.js" }
      else { p.src = "http://videostreamcanada.ca/player.js" }
      document.head.appendChild(p);
      p.onload = a;
    }
    else { a(); }
  `)}
</div>`;
