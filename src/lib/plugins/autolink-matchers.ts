/**
 * AutoLink URL Matchers for Lexical
 *
 * These matchers automatically convert URLs and emails into clickable links
 * as the user types. No need to manually create links for common patterns.
 */

import type { LinkMatcher } from "@lexical/react/LexicalAutoLinkPlugin";

// URL regex - matches http://, https://, and www. URLs
const URL_REGEX =
  /((https?:\/\/(www\.)?)|(www\.))[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;

// Email regex
const EMAIL_REGEX =
  /(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/;

/**
 * URL matcher - converts URLs to links
 */
export const URL_MATCHER: LinkMatcher = (text: string) => {
  const match = URL_REGEX.exec(text);
  if (match === null) {
    return null;
  }
  const fullMatch = match[0];
  return {
    index: match.index,
    length: fullMatch.length,
    text: fullMatch,
    url: fullMatch.startsWith("http") ? fullMatch : `https://${fullMatch}`,
  };
};

/**
 * Email matcher - converts emails to mailto: links
 */
export const EMAIL_MATCHER: LinkMatcher = (text: string) => {
  const match = EMAIL_REGEX.exec(text);
  if (match === null) {
    return null;
  }
  const fullMatch = match[0];
  return {
    index: match.index,
    length: fullMatch.length,
    text: fullMatch,
    url: `mailto:${fullMatch}`,
  };
};

/**
 * All autolink matchers
 */
export const AUTOLINK_MATCHERS: LinkMatcher[] = [URL_MATCHER, EMAIL_MATCHER];
