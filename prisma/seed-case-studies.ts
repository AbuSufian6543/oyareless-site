/**
 * Sample published case studies. Create-only by slug so an admin rewrite is
 * never overwritten. Client names stay blank; outcomes stay qualitative.
 */

export type SeedCaseStudy = {
  slug: string;
  title: string;
  sector: string;
  problem: string;
  solution: string;
  implementation: string;
  result: string;
  imageUrl: string;
  imageAlt: string;
  featured: boolean;
  order: number;
  metaDescription: string;
};

export const SEED_CASE_STUDIES: SeedCaseStudy[] = [
  {
    slug: "office-lan-refresh",
    title: "An Office LAN That Could No Longer Be Patched",
    sector: "IT",
    featured: true,
    order: 0,
    imageUrl: "/images/networking-1400.webp",
    imageAlt:
      "Enterprise switching and structured cabling in a dark equipment rack",
    metaDescription:
      "How WirelessCom.Ca Inc. replaced aging office switching and Wi-Fi for a professional firm in Sault Ste. Marie.",
    problem:
      "A professional office in Sault Ste. Marie was still running a mix of consumer Wi-Fi and unmanaged switches. Staff could not get a reliable connection in the back rooms, guest devices sat on the same network as the file server, and the previous installer was no longer answering.",
    solution:
      "We inventoried what was actually in the rack, then designed a small business LAN: a supported switch, separate staff and guest Wi-Fi, and a documented path to the firewall they already had. Nothing was ripped out until we knew what still had to talk to what.",
    implementation:
      "Work happened after hours so the office could open the next morning. We labeled every drop, stood up the new wireless, moved the file server and printers onto the staff VLAN, and left a one-page diagram with the login set we issued.",
    result:
      "The office now has a network a technician can support. Guest traffic stays off the file server. When something fails, the next visit starts from the diagram instead of guessing which unlabeled switch is in the closet.",
  },
  {
    slug: "clinic-cabling-and-wifi",
    title: "Structured Cabling And Wi-Fi For A Growing Clinic",
    sector: "IT",
    featured: false,
    order: 1,
    imageUrl: "/images/cabling-1400.webp",
    imageAlt:
      "Bundles of network patch cables terminated into a commercial switch",
    metaDescription:
      "Cat6 drops, a certified rack, and clinic Wi-Fi installed by WirelessCom.Ca Inc. in Northern Ontario.",
    problem:
      "A clinic that had added exam rooms over several years was still feeding those rooms from a single wireless access point in the reception area. Charting terminals dropped during busy hours, and a new copier had been plugged into a leftover residential switch in a cupboard.",
    solution:
      "We pulled Cat6 to the rooms that needed a wire, certified the runs, and put a proper patch panel in a wall cabinet. Wi-Fi was specified for coverage of the waiting area and staff rooms — not as a substitute for the wired drops at the desks.",
    implementation:
      "Cabling was scheduled around clinic hours. Each drop was tested before we handed the cabinet over. Access points were mounted where the survey said they belonged, not where a previous contractor had found a spare outlet.",
    result:
      "Desks that need a wire have one. The waiting-area Wi-Fi no longer carries the charting terminals. The cupboard switch is gone. When they add another room, there is a panel to punch into instead of another daisy chain.",
  },
  {
    slug: "firewall-and-remote-access",
    title: "Replacing An Unsupported Firewall And Closing Remote Access",
    sector: "Cybersecurity",
    featured: true,
    order: 2,
    imageUrl: "/images/firewall-1400.webp",
    imageAlt:
      "Rack-mounted next-generation firewall appliances with dressed ethernet",
    metaDescription:
      "A next-generation firewall and tighter remote access for a Northern Ontario office, installed and supported by WirelessCom.Ca Inc.",
    problem:
      "An office was still exposing remote desktop through an appliance the vendor no longer patched. Staff who worked from home used a shared password that had not been rotated. Nobody on site could say which inbound rules were still required.",
    solution:
      "We replaced the appliance with a next-generation firewall we size, install, and support — Fortinet, Barracuda, Juniper, or a similar platform we are trained on, chosen for the circuit and the applications. Remote access moved behind a VPN with named users. Unused inbound rules were removed after we confirmed what the office actually needed.",
    implementation:
      "The cutover was planned for an evening. We documented the old rule base first, stood up the new appliance in parallel, then switched the WAN and watched the applications the office named. VPN accounts were issued per person, not as a shared login.",
    result:
      "Remote desktop is no longer on the open internet. The firewall has a current image, a rule base someone here can explain, and a support path that does not end when the original installer retires. Listing a brand here means we support the technology; it is not a partnership claim.",
  },
  {
    slug: "email-and-endpoint-hardening",
    title: "Hardening Email And Endpoints After A Phishing Scare",
    sector: "Cybersecurity",
    featured: false,
    order: 3,
    imageUrl: "/images/cybersecurity-1400.webp",
    imageAlt:
      "Abstract shield formed from connected cyan nodes over a dark navy grid",
    metaDescription:
      "Practical email and endpoint hardening for a Northern Ontario business after a phishing incident.",
    problem:
      "A small firm forwarded a convincing invoice to accounting. The message was caught before a payment went out, but nobody could say whether mail filtering, MFA, or the workstations themselves were configured to stop the next one.",
    solution:
      "We reviewed Microsoft 365 sign-in and mail flow, turned on the controls the tenant already licensed, and put endpoint protection on the PCs that still had none. The work was a checklist against what they already owned — not a new product pitch.",
    implementation:
      "MFA was rolled out with a short staff briefing. Mail filtering and outbound spoofing controls were set from the admin center we already manage. Workstations that were missing current protection were enrolled the same week.",
    result:
      "Staff now sign in with MFA. Mail that used to land unfiltered is scored before it reaches the inbox. We did not invent a detection rate. What changed is that the obvious gaps that let the last message through are no longer open.",
  },
  {
    slug: "commercial-intrusion-alarm",
    title: "An Intrusion Alarm The Same Technicians Stay On",
    sector: "Alarm security",
    featured: true,
    order: 4,
    imageUrl: "/images/alarm-system-1400.webp",
    imageAlt:
      "Commercial alarm keypad and control panel on a dark corridor wall",
    metaDescription:
      "A commercial intrusion alarm specified, installed, and serviced by WirelessCom.Ca Inc. in Sault Ste. Marie.",
    problem:
      "A shop in Sault Ste. Marie had an aging keypad, a siren that no longer sounded on every zone, and a monitoring contract whose installer had left town. Staff were arming a system they did not trust, and the last service ticket had gone unanswered.",
    solution:
      "We specified a Paradox panel we are trained on — sensors, sirens, and the keypad the staff actually use — then connected monitoring when they contracted it. The same local team that hung the devices is the team that answers when a zone fails.",
    implementation:
      "Existing devices that still tested clean were reused where the panel allowed it. Failed contacts were replaced. Zones were labeled in English the staff recognized, not as numbered loops. A walk-test was done with the people who open and close the shop.",
    result:
      "The shop arms a panel that reports. When a door contact fails, the call comes here instead of an 800 number that cannot dispatch locally. We did not publish a false-alarm rate we did not measure; we left a system the same technicians can stay on.",
  },
  {
    slug: "cameras-and-alarm-on-one-network",
    title: "Cameras And An Alarm Panel On One Network",
    sector: "Alarm security",
    featured: false,
    order: 5,
    imageUrl: "/images/surveillance-1400.webp",
    imageAlt:
      "Dome and bullet security cameras on a commercial building at dusk",
    metaDescription:
      "IP cameras and an intrusion panel sharing a documented network, installed by WirelessCom.Ca Inc.",
    problem:
      "A warehouse had cameras on a leftover consumer router and an alarm panel on a separate analog line. Recordings stopped when someone unplugged the router to plug in a printer. Nobody could review video after an after-hours alarm.",
    solution:
      "We put the cameras and the alarm communicator on a small, documented network of our own — a switch, a recorder, and a path through the firewall we already support at the site. The alarm still reports as contracted; the video is no longer a guest on the office Wi-Fi.",
    implementation:
      "Cameras were placed for the doors and the yard, not for decorative coverage. The recorder and the panel share a cabinet with labeled cables. Staff were shown how to pull a clip from the time an alarm opened, without logging into the office Wi-Fi.",
    result:
      "After-hours events can be reviewed against the alarm time. Unplugging a printer no longer takes the cameras down. The warehouse still has one team for the panel, the recorders, and the network they sit on.",
  },
];
