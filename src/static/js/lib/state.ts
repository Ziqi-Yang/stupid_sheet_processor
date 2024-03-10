import { deflate, inflate } from 'pako';
import { fromUint8Array, toUint8Array } from 'js-base64';

const CACHE_KEY_STATE = "STATE";

class State {
  code: string;

  constructor(code: string) {
    this.code = code;
  }

  save_state() {
    localStorage.setItem(CACHE_KEY_STATE, JSON.stringify(this));
  }

  static retrieve_state(): State | null {
    const raw_state = localStorage.getItem(CACHE_KEY_STATE);
    if (raw_state) {
      const json = JSON.parse(raw_state);
      if (json.code) {
        return new State(json.code);
      } else {
        return null;
      }
    }
    return null;
  }

  encode_pako() {
    const json = JSON.stringify(this);
    const data = new TextEncoder().encode(json);
    const compressed = deflate(data, { level: 9 }); // zlib level 9
    return fromUint8Array(compressed, true); // url safe base64 encoding
  }

  static decode_pako(en_str: string): State {
    const base_64_decoded = toUint8Array(en_str);
    const decompressed = inflate(base_64_decoded);
    const origin = new TextDecoder().decode(decompressed);
    const json = JSON.parse(origin);
    if (json.code) {
      return new State(json.code);
    } else {
      return new State("");
    }
  }
}

export default State;
