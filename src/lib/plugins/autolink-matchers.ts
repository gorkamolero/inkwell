/**
 * AutoLink URL Matchers for Lexical
 *
 * These matchers automatically convert URLs and emails into clickable links
 * as the user types. Uses Lexical's official createLinkMatcherWithRegExp helper.
 */

import { createLinkMatcherWithRegExp } from "@lexical/react/LexicalAutoLinkPlugin";

// URL regex - matches http://, https://, and www. URLs
// Based on Lexical playground implementation
const URL_REGEX =
  /((https?:\/\/(www\.)?)|(www\.))[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;

// Email regex
const EMAIL_REGEX =
  /(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/;

/**
 * All autolink matchers using Lexical's helper
 */
export const AUTOLINK_MATCHERS = [
  createLinkMatcherWithRegExp(URL_REGEX, (text) => {
    return text.startsWith("http") ? text : `https://${text}`;
  }),
  createLinkMatcherWithRegExp(EMAIL_REGEX, (text) => {
    return `mailto:${text}`;
  }),
];
