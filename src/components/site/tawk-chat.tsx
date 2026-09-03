import Script from "next/script";

import { TAWK_EMBED_URL } from "@/lib/tawk";

/**
 * Official Tawk.to loader, run after the page is interactive so it cannot
 * block first paint. Public pages only — do not import this from admin,
 * portal, or login layouts.
 */
export function TawkChat() {
  return (
    <Script id="tawk-to-widget" strategy="afterInteractive">
      {`var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
(function(){
var s1=document.createElement("script");
s1.async=true;
s1.src=${JSON.stringify(TAWK_EMBED_URL)};
s1.charset="UTF-8";
s1.setAttribute("crossorigin","*");
var s0=document.getElementsByTagName("script")[0];
if (s0 && s0.parentNode) { s0.parentNode.insertBefore(s1,s0); }
else { document.head.appendChild(s1); }
})();`}
    </Script>
  );
}
