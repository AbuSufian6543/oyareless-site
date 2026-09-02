-- Additive: vendor HTML players (Mist / VideoStreamCanada) as a stream type.
-- `source` already stores text, so existing rows are unchanged.

ALTER TYPE "StreamType" ADD VALUE 'HTML';
