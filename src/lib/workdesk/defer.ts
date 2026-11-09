import { after } from "next/server";

/**
 * Run work after the staff response is on its way.
 * Mail must not sit on the click: SMTP can take many seconds, and the
 * person who pressed the button only needs to know the save itself finished.
 */
export function deferWork(work: () => Promise<void>): void {
  after(() => {
    void work().catch((error) => {
      console.error("[workdesk] background work failed:", error);
    });
  });
}
