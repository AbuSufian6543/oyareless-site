"use client";

import { useState } from "react";
import { Info } from "lucide-react";

import {
  Card,
  CardTitle,
  CheckboxField,
  SelectField,
  TextAreaField,
  TextField,
  inputClass,
  Label,
} from "@/components/admin/ui";
import { ImageUrlField } from "@/components/admin/branding-fields";
import { cn } from "@/lib/utils";

export type StreamFormValues = {
  id?: string;
  title: string;
  slug: string;
  description: string;
  type: string;
  source: string;
  posterUrl: string;
  location: string;
  status: string;
  aspectRatio: string;
  order: number;
  isLive: boolean;
  featured: boolean;
  isPublic: boolean;
  autoplay: boolean;
  muted: boolean;
  showControls: boolean;
  hasPassword: boolean;
};

const TYPE_OPTIONS = [
  { value: "HLS", label: "HLS (.m3u8) — IP camera / encoder" },
  { value: "DASH", label: "MPEG-DASH (.mpd)" },
  { value: "MJPEG", label: "MJPEG snapshot stream" },
  { value: "YOUTUBE", label: "YouTube Live" },
  { value: "VIMEO", label: "Vimeo" },
  { value: "TWITCH", label: "Twitch" },
  { value: "FACEBOOK", label: "Facebook Live" },
  { value: "IFRAME", label: "Custom iframe URL" },
  { value: "WEBRTC", label: "WebRTC / WHEP" },
  { value: "HTML", label: "HTML embed (Mist / VideoStreamCanada)" },
];

/** Per-type guidance so admins know exactly what to paste into "source". */
const SOURCE_HINTS: Record<string, string> = {
  HLS: "Full playlist URL, e.g. https://stream.example.com/live/lobby/index.m3u8",
  DASH: "Full manifest URL ending in .mpd",
  MJPEG: "Snapshot or MJPEG URL from the camera, e.g. http://10.0.0.20/video.cgi",
  YOUTUBE: "Video ID or the full watch/live URL — either works.",
  VIMEO: "Video ID or the full vimeo.com URL.",
  TWITCH: "Channel name, e.g. wirelesscom",
  FACEBOOK: "Full URL of the Facebook video or live post.",
  IFRAME: "The exact URL to load in the iframe. Must be https and allow embedding.",
  WEBRTC: "WHEP endpoint URL from your media server.",
  HTML: "Paste the vendor player snippet (div + script). It runs on the public site, not in this form. Edit this field whenever the camera or player code changes.",
};

export function StreamForm({
  action,
  values,
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  values: StreamFormValues;
  submitLabel: string;
}) {
  const [type, setType] = useState(values.type);
  const [isPublic, setIsPublic] = useState(values.isPublic);
  const [changePassword, setChangePassword] = useState(!values.hasPassword);

  return (
    <form action={action} className="space-y-5">
      {values.id && <input type="hidden" name="id" value={values.id} />}

      <Card>
        <CardTitle description="Where the video comes from and how it is labeled on the site.">
          Stream source
        </CardTitle>

        <div className="space-y-4">
          <TextField
            label="Title"
            name="title"
            required
            defaultValue={values.title}
            placeholder="Downtown Camera — Queen Street"
          />

          <TextField
            label="URL slug"
            name="slug"
            hint="Leave blank to generate from the title."
            defaultValue={values.slug}
            placeholder="downtown-camera"
          />

          <SelectField
            label="Stream type"
            name="type"
            value={type}
            onChange={(event) => setType(event.target.value)}
            options={TYPE_OPTIONS}
          />

          {type === "HTML" ? (
            <div key="html-source">
              <Label htmlFor="source" required hint={SOURCE_HINTS.HTML}>
                Embed code
              </Label>
              <textarea
                id="source"
                name="source"
                required
                rows={16}
                defaultValue={values.source}
                placeholder='<div class="mistvideo" id="camera-name">…</div>'
                className={cn(inputClass, "min-h-64 resize-y font-mono text-xs")}
              />
            </div>
          ) : (
            <div key="url-source">
              <Label htmlFor="source" required hint={SOURCE_HINTS[type]}>
                Source
              </Label>
              <input
                id="source"
                name="source"
                required
                defaultValue={values.source}
                className={cn(inputClass, "font-mono text-xs")}
              />
            </div>
          )}

          <TextAreaField
            label="Description"
            name="description"
            rows={3}
            defaultValue={values.description}
            hint="Shown under the player."
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Location label"
              name="location"
              defaultValue={values.location}
              placeholder="Sault Ste. Marie, ON"
            />
          </div>

          <ImageUrlField
            label="Poster image"
            name="posterUrl"
            defaultValue={values.posterUrl}
            hint="Shown before playback starts. Upload a new photo or pick one from the library."
            placeholder="/uploads/poster.jpg"
          />
        </div>
      </Card>

      <Card>
        <CardTitle description="Control who can watch and where the stream appears.">
          Publishing & access
        </CardTitle>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <SelectField
              label="Status"
              name="status"
              defaultValue={values.status}
              options={[
                { value: "DRAFT", label: "Draft" },
                { value: "PUBLISHED", label: "Published" },
                { value: "ARCHIVED", label: "Archived" },
              ]}
            />
            <SelectField
              label="Aspect ratio"
              name="aspectRatio"
              defaultValue={values.aspectRatio}
              options={[
                { value: "16/9", label: "16:9 widescreen" },
                { value: "4/3", label: "4:3 standard" },
                { value: "1/1", label: "1:1 square" },
                { value: "21/9", label: "21:9 ultrawide" },
                { value: "9/16", label: "9:16 vertical" },
              ]}
            />
            <TextField
              label="Sort order"
              name="order"
              type="number"
              min={0}
              max={999}
              defaultValue={values.order}
            />
          </div>

          <div className="space-y-2.5">
            <CheckboxField
              label="Currently live"
              name="isLive"
              defaultChecked={values.isLive}
              description="Shows a red LIVE badge on cards and the player."
            />
            <CheckboxField
              label="Feature on the live page"
              name="featured"
              defaultChecked={values.featured}
            />
            <CheckboxField
              label="Publicly listed"
              name="isPublic"
              checked={isPublic}
              onChange={(event) => setIsPublic(event.target.checked)}
              description="Unlisted streams stay reachable by direct link but are hidden from the live page and sitemap."
            />
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
            <p className="text-sm font-semibold text-navy-800">
              Password protection
            </p>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              With a password set, the source URL is never sent to the browser
              until the correct password is entered.
            </p>

            {values.hasPassword && !changePassword ? (
              <div className="mt-3 space-y-2.5">
                <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent-700">
                  <Info className="size-3.5" aria-hidden="true" />
                  A password is currently set.
                </p>
                <button
                  type="button"
                  onClick={() => setChangePassword(true)}
                  className="block rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-navy-800 hover:bg-slate-50"
                >
                  Change password
                </button>
                <CheckboxField
                  label="Remove the password"
                  name="clearPassword"
                  description="Anyone with the link will be able to watch."
                />
              </div>
            ) : (
              <div className="mt-3">
                <TextField
                  label="Access password"
                  name="accessPassword"
                  type="text"
                  autoComplete="off"
                  hint={
                    values.hasPassword
                      ? "Leave blank to keep the existing password."
                      : "Leave blank for no password."
                  }
                />
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <CardTitle>Player behavior</CardTitle>
        <div className="space-y-2.5">
          {type === "HTML" ? (
            <>
              <p className="text-sm leading-relaxed text-slate-600">
                Playback (loop, poster, autoplay) is controlled by the embed
                code above. Change those options in the snippet, then save.
              </p>
              {values.autoplay ? (
                <input type="hidden" name="autoplay" value="on" />
              ) : null}
              {values.muted ? <input type="hidden" name="muted" value="on" /> : null}
              {values.showControls ? (
                <input type="hidden" name="showControls" value="on" />
              ) : null}
            </>
          ) : (
            <>
              <CheckboxField
                label="Start playing automatically"
                name="autoplay"
                defaultChecked={values.autoplay}
              />
              <CheckboxField
                label="Start muted"
                name="muted"
                defaultChecked={values.muted}
                description="Browsers block autoplay with sound, so keep this on when autoplay is enabled."
              />
              <CheckboxField
                label="Show player controls"
                name="showControls"
                defaultChecked={values.showControls}
              />
            </>
          )}
        </div>
      </Card>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
