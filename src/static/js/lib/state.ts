import { deflate, inflate } from 'pako';
import { fromUint8Array, toUint8Array } from 'js-base64';

const CACHE_KEY_STATE = "STATE";

class State {
  code: string;

  constructor(code: string = "") {
    this.code = code;
  }

  save_state() {
    localStorage.setItem(CACHE_KEY_STATE, JSON.stringify(this));
  }

  serialize() {
    return JSON.stringify(this);
  }

  static from_raw_json(json_str: string) : State | null {
    const json = JSON.parse(json_str) as unknown;
    const obj =  new State();
    if (typeof json == 'object' && json != null
      && 'code' in json) {
        Object.assign(obj, json);
        return obj;
      }
    
    return null;
  }
  

  static retrieve_state(): State | null {
    const raw_state = localStorage.getItem(CACHE_KEY_STATE);
    if (raw_state) {
      return State.from_raw_json(raw_state);
    }
    return null;
  }

  encode_pako(): string {
    const json = this.serialize();
    const data = new TextEncoder().encode(json);
    const compressed = deflate(data, { level: 9 }); // zlib level 9
    return fromUint8Array(compressed, true); // url safe base64 encoding
  }

  static decode_pako(en_str: string): State {
    const base_64_decoded = toUint8Array(en_str);
    const decompressed = inflate(base_64_decoded);
    const origin = new TextDecoder().decode(decompressed);
    const res_state = State.from_raw_json(origin);
    return res_state ?? new State();
  }
}

export default State;
