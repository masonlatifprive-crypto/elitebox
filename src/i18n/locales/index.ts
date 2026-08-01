/**
 * Dictionary assembly. Each locale is the deep-merge of its namespaced modules
 * (`common`, `marketing`, `app`), flattened to dot-path keys so consumers call
 * `t('common.nav.movies')`. Namespaces are file-owned by different agents —
 * never add another namespace's keys to your own file.
 */
import enCommon from './en/common';
import enMarketing from './en/marketing';
import enApp from './en/app';
import nlCommon from './nl/common';
import nlMarketing from './nl/marketing';
import nlApp from './nl/app';

type MessageTree = Record<string, unknown>;

function isTree(v: unknown): v is MessageTree {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function deepMerge(...sources: MessageTree[]): MessageTree {
  const out: MessageTree = {};
  for (const src of sources) {
    for (const [k, v] of Object.entries(src)) {
      const prev = out[k];
      out[k] = isTree(prev) && isTree(v) ? deepMerge(prev, v) : v;
    }
  }
  return out;
}

function flatten(tree: MessageTree, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'string') out[path] = v;
    else if (isTree(v)) Object.assign(out, flatten(v, path));
  }
  return out;
}

/** Raw per-locale message trees, merged from the namespace modules. */
export const MESSAGES = {
  en: deepMerge({ common: enCommon }, { marketing: enMarketing }, { app: enApp }),
  nl: deepMerge({ common: nlCommon }, { marketing: nlMarketing }, { app: nlApp }),
} as const;

/** Flattened dot-path dictionaries — what the runtime actually looks up. */
export const DICTS: Record<'en' | 'nl', Record<string, string>> = {
  en: flatten(MESSAGES.en),
  nl: flatten(MESSAGES.nl),
};
