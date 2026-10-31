// Codificación de enlaces compartidos.
//
// Formato: /<tree>/<mode>?shared=1&tree=<id>&mode=<auto|manual>
//          &keyType=<number|string>[&order=<p>]&nodes=<lz-base64url>
//
// `nodes` es el JSON del adaptador comprimido con LZString y convertido a
// base64url. LZString es síncrono: el click de compartir conserva la
// activación de usuario que exige navigator.share.

import { compressToBase64, decompressFromBase64 } from 'lz-string';
import type { Mode } from '@/common/playground';
import type { KeyType } from '@/common/types';
import type { SharedLink } from '@/common/share/types';

export const SHARE_PARAM = 'shared';
export const SHARE_VERSION = '1';
export const TREE_PARAM = 'tree';
export const MODE_PARAM = 'mode';
export const KEY_TYPE_PARAM = 'keyType';
export const ORDER_PARAM = 'order';
export const NODES_PARAM = 'nodes';

/** Aviso de longitud a partir de la cual algunas apps pueden truncar el enlace. */
export const LONG_URL_WARNING = 1800;
/** Límite defensivo del parámetro comprimido. */
export const MAX_COMPRESSED_LENGTH = 24_000;
/** Límite defensivo del JSON descomprimido (evita bombas de descompresión). */
export const MAX_DECOMPRESSED_LENGTH = 2_000_000;

const MODES: Mode[] = ['auto', 'manual'];

function toBase64Url(value: string): string {
  return value.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(value: string): string {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  return base64 + '='.repeat((4 - (base64.length % 4)) % 4);
}

export function encodeNodes(nodes: unknown): string | null {
  try {
    const json = JSON.stringify(nodes);
    if (typeof json !== 'string') return null;
    const compressed = compressToBase64(json);
    if (!compressed) return null;
    const encoded = toBase64Url(compressed);
    return encoded.length > MAX_COMPRESSED_LENGTH ? null : encoded;
  } catch {
    return null;
  }
}

export function decodeNodes(encoded: string): unknown | null {
  if (!encoded || encoded.length > MAX_COMPRESSED_LENGTH) return null;
  try {
    const json = decompressFromBase64(fromBase64Url(encoded));
    if (!json || json.length > MAX_DECOMPRESSED_LENGTH) return null;
    return JSON.parse(json) as unknown;
  } catch {
    return null;
  }
}

function isMode(value: string | null): value is Mode {
  return value === 'auto' || value === 'manual';
}

function isKeyType(value: string | null): value is KeyType {
  return value === 'number' || value === 'string';
}

export function isSharedSearch(search: string): boolean {
  return new URLSearchParams(search).get(SHARE_PARAM) !== null;
}

export function buildShareQuery(link: SharedLink): string | null {
  const nodes = encodeNodes(link.nodes);
  if (!nodes) return null;
  const params = new URLSearchParams();
  params.set(SHARE_PARAM, SHARE_VERSION);
  params.set(TREE_PARAM, link.tree);
  params.set(MODE_PARAM, link.mode);
  params.set(KEY_TYPE_PARAM, link.keyType);
  if (link.order !== undefined) params.set(ORDER_PARAM, String(link.order));
  params.set(NODES_PARAM, nodes);
  return params.toString();
}

export function parseShareSearch(search: string): SharedLink | null {
  const params = new URLSearchParams(search);
  if (params.get(SHARE_PARAM) !== SHARE_VERSION) return null;

  const tree = params.get(TREE_PARAM);
  const mode = params.get(MODE_PARAM);
  const keyType = params.get(KEY_TYPE_PARAM);
  const encoded = params.get(NODES_PARAM);
  if (!tree || !isMode(mode) || !isKeyType(keyType) || !encoded) return null;

  const orderRaw = params.get(ORDER_PARAM);
  let order: number | undefined;
  if (orderRaw !== null) {
    order = Number(orderRaw);
    if (!Number.isInteger(order) || order < 2) return null;
  }

  const nodes = decodeNodes(encoded);
  if (nodes === null) return null;
  return { tree, mode, keyType, order, nodes };
}

export { MODES as SHARED_MODES };
