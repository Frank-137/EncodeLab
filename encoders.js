/**
 * encoders.js — Step-by-step encoding logic for all supported schemes
 * Each encoder returns an array of Step objects:
 *   { title, explanation, data: [{key, value, type}], bits?, charBlocks? }
 */

// ── Utility ──────────────────────────────────────────────────────────────────

function charToBits(ch, pad = 8) {
  return ch.charCodeAt(0).toString(2).padStart(pad, '0');
}

function splitInto(str, n) {
  const parts = [];
  for (let i = 0; i < str.length; i += n) parts.push(str.slice(i, i + n));
  return parts;
}

// ── ASCII ─────────────────────────────────────────────────────────────────────
function encodeASCII(input) {
  const steps = [];

  steps.push({
    title: 'Understanding ASCII',
    explanation: 'ASCII (American Standard Code for Information Interchange) maps characters to numbers 0–127. Each character gets a decimal, hexadecimal, octal, and binary representation.',
    data: [
      { key: 'Input', value: input, type: 'plain' },
      { key: 'Characters', value: input.length.toString(), type: 'plain' },
    ]
  });

  const rows = [];
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    const code = c.charCodeAt(0);
    rows.push({ char: c, dec: code, hex: code.toString(16).toUpperCase().padStart(2, '0'), oct: code.toString(8), bin: code.toString(2).padStart(8, '0') });
  }

  steps.push({
    title: 'Character → ASCII Code',
    explanation: 'Each character is converted to its ASCII decimal value.',
    charBlocks: rows.map(r => ({ top: r.char, bottom: r.dec, type: 'normal' })),
    data: rows.map(r => ({ key: `'${r.char}'`, value: `Dec: ${r.dec}  Hex: ${r.hex}  Bin: ${r.bin}`, type: 'accent' }))
  });

  const output = input.split('').map(c => c.charCodeAt(0)).join(' ');

  steps.push({
    title: 'Final ASCII Representation',
    explanation: 'The decimal ASCII values joined by spaces form the encoded output.',
    data: [
      { key: 'Decimal', value: output, type: 'highlight' },
      { key: 'Hex', value: input.split('').map(c => c.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0')).join(' '), type: 'accent' }
    ]
  });

  return { output, steps };
}

// ── Binary ────────────────────────────────────────────────────────────────────
function encodeBinary(input) {
  const steps = [];

  steps.push({
    title: 'What is Binary Encoding?',
    explanation: 'Binary encoding converts each character into its 8-bit (1 byte) binary representation using ASCII values. Computers store all data as sequences of 0s and 1s.',
    data: [{ key: 'Input', value: input, type: 'plain' }]
  });

  const charData = input.split('').map(c => ({
    char: c, code: c.charCodeAt(0), bits: charToBits(c)
  }));

  steps.push({
    title: 'Character → ASCII Decimal',
    explanation: 'First, get each character\'s ASCII decimal value.',
    charBlocks: charData.map(d => ({ top: d.char, bottom: d.code, type: 'normal' })),
    data: charData.map(d => ({ key: `'${d.char}' (${d.code})`, value: d.bits, type: 'accent' }))
  });

  steps.push({
    title: 'Decimal → 8-bit Binary',
    explanation: 'Convert each decimal number to 8-bit binary. Pad with leading zeros if needed.',
    bits: charData.map(d => d.bits).join(' '),
    data: charData.map(d => ({
      key: d.code.toString(), value: d.bits, type: 'accent'
    }))
  });

  const output = charData.map(d => d.bits).join(' ');

  steps.push({
    title: 'Final Binary Output',
    explanation: 'All 8-bit groups concatenated (space-separated for readability).',
    data: [
      { key: 'Binary', value: output, type: 'highlight' },
      { key: 'Total bits', value: (input.length * 8).toString(), type: 'plain' }
    ]
  });

  return { output, steps };
}

// ── Hex ───────────────────────────────────────────────────────────────────────
function encodeHex(input) {
  const steps = [];

  steps.push({
    title: 'Hexadecimal Encoding',
    explanation: 'Hexadecimal uses base-16: digits 0–9 and A–F. Each byte (8 bits) is represented as two hex digits, making it compact and human-readable for binary data.',
    data: [{ key: 'Input', value: input, type: 'plain' }]
  });

  const charData = input.split('').map(c => ({
    char: c, code: c.charCodeAt(0),
    bits: charToBits(c),
    hex: c.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0')
  }));

  steps.push({
    title: 'Char → Decimal → Binary',
    explanation: 'Convert each character to decimal, then to its 8-bit binary form.',
    charBlocks: charData.map(d => ({ top: d.char, bottom: d.hex, type: 'normal' })),
    data: charData.map(d => ({ key: `'${d.char}'`, value: `${d.code} → ${d.bits}`, type: 'accent' }))
  });

  steps.push({
    title: 'Binary → Hex Nibbles',
    explanation: 'Split each 8-bit byte into two 4-bit nibbles. Each nibble maps to a single hex digit (0–F).',
    data: charData.map(d => ({
      key: d.bits, value: `${d.bits.slice(0, 4)} ${d.bits.slice(4)} → ${d.hex[0]} ${d.hex[1]}`, type: 'accent'
    }))
  });

  const output = charData.map(d => d.hex).join('');

  steps.push({
    title: 'Final Hex Output',
    explanation: 'All hex pairs concatenated.',
    data: [
      { key: 'Hex', value: output, type: 'highlight' },
      { key: 'Spaced', value: charData.map(d => d.hex).join(' '), type: 'accent' }
    ]
  });

  return { output, steps };
}

// ── ROT13 ─────────────────────────────────────────────────────────────────────
function encodeROT13(input) {
  const steps = [];

  steps.push({
    title: 'What is ROT13?',
    explanation: 'ROT13 is a simple letter substitution cipher that rotates each letter by 13 positions in the alphabet. A→N, B→O, … Z→M. Non-letters are unchanged. It is its own inverse.',
    data: [{ key: 'Input', value: input, type: 'plain' }]
  });

  const charData = input.split('').map(c => {
    const code = c.charCodeAt(0);
    let out = c;
    if (code >= 65 && code <= 90) out = String.fromCharCode(((code - 65 + 13) % 26) + 65);
    else if (code >= 97 && code <= 122) out = String.fromCharCode(((code - 97 + 13) % 26) + 97);
    const pos = (code >= 65 && code <= 90) ? code - 64 : (code >= 97 && code <= 122) ? code - 96 : null;
    const newPos = pos !== null ? ((pos - 1 + 13) % 26) + 1 : null;
    return { char: c, out, pos, newPos };
  });

  steps.push({
    title: 'Alphabet Position Mapping',
    explanation: 'For each letter, find its position (A=1, Z=26), add 13, wrap at 26 using modulo.',
    charBlocks: charData.map(d => ({ top: d.char, bottom: d.out, type: d.char !== d.out ? 'rot' : 'normal' })),
    data: charData.filter(d => d.pos !== null).map(d => ({
      key: `'${d.char}' pos ${d.pos}`, value: `(${d.pos} + 13) mod 26 = ${d.newPos} → '${d.out}'`, type: 'accent'
    }))
  });

  const output = charData.map(d => d.out).join('');

  steps.push({
    title: 'Final ROT13 Output',
    explanation: 'All transformed characters joined.',
    data: [{ key: 'ROT13', value: output, type: 'highlight' }]
  });

  return { output, steps };
}

// ── ROT47 ─────────────────────────────────────────────────────────────────────
function encodeROT47(input) {
  const steps = [];

  steps.push({
    title: 'What is ROT47?',
    explanation: 'ROT47 is like ROT13 but covers all printable ASCII characters (! to ~, codes 33–126). Each character is shifted by 47 positions in this range, wrapping around.',
    data: [{ key: 'Input', value: input, type: 'plain' }, { key: 'Range', value: '! (33) to ~ (126) = 94 characters', type: 'plain' }]
  });

  const charData = input.split('').map(c => {
    const code = c.charCodeAt(0);
    let out = c;
    if (code >= 33 && code <= 126) {
      out = String.fromCharCode(((code - 33 + 47) % 94) + 33);
    }
    return { char: c, code, outCode: out.charCodeAt(0), out };
  });

  steps.push({
    title: 'Character Rotation',
    explanation: 'Formula: new_code = ((code − 33 + 47) mod 94) + 33',
    charBlocks: charData.map(d => ({ top: d.char, bottom: d.out, type: d.char !== d.out ? 'rot' : 'normal' })),
    data: charData.map(d => ({
      key: `'${d.char}' (${d.code})`, value: `((${d.code}-33+47) mod 94)+33 = ${d.outCode} → '${d.out}'`, type: 'accent'
    }))
  });

  const output = charData.map(d => d.out).join('');

  steps.push({
    title: 'Final ROT47 Output',
    explanation: 'All rotated characters joined.',
    data: [{ key: 'ROT47', value: output, type: 'highlight' }]
  });

  return { output, steps };
}

// ── Base64 ────────────────────────────────────────────────────────────────────
const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function encodeBase64(input) {
  const steps = [];

  steps.push({
    title: 'What is Base64?',
    explanation: 'Base64 encodes binary data using 64 printable ASCII characters (A-Z, a-z, 0-9, +, /). Every 3 bytes (24 bits) of input become 4 Base64 characters. Padding (=) is added if needed.',
    data: [
      { key: 'Input', value: input, type: 'plain' },
      { key: 'Alphabet', value: B64_CHARS, type: 'accent' },
    ]
  });

  const bytes = input.split('').map(c => c.charCodeAt(0));
  const bitStr = bytes.map(b => b.toString(2).padStart(8, '0')).join('');

  steps.push({
    title: 'Step 1 — Convert to Binary',
    explanation: 'Convert each character to its 8-bit ASCII binary representation.',
    bits: bitStr,
    data: bytes.map((b, i) => ({
      key: `'${input[i]}'`, value: `${b} → ${b.toString(2).padStart(8, '0')}`, type: 'accent'
    }))
  });

  steps.push({
    title: 'Step 2 — Concatenate All Bits',
    explanation: 'Join all bits into one continuous stream.',
    data: [
      { key: 'Bit stream', value: bitStr, type: 'accent' },
      { key: 'Total bits', value: bitStr.length.toString(), type: 'plain' }
    ]
  });

  // Group into 6-bit chunks
  const padded = bitStr.padEnd(Math.ceil(bitStr.length / 6) * 6, '0');
  const sixBitGroups = splitInto(padded, 6);

  steps.push({
    title: 'Step 3 — Split into 6-bit Groups',
    explanation: 'Group the bit stream into 6-bit chunks (pad with zeros if necessary). Each 6-bit group represents a number 0–63.',
    data: sixBitGroups.map((g, i) => ({
      key: `Group ${i + 1}`, value: `${g} = ${parseInt(g, 2)}`, type: 'accent'
    }))
  });

  // Map to characters
  const b64chars = sixBitGroups.map(g => B64_CHARS[parseInt(g, 2)]);

  steps.push({
    title: 'Step 4 — Map to Base64 Alphabet',
    explanation: `Look up each 6-bit value in the Base64 alphabet table: "${B64_CHARS}"`,
    data: sixBitGroups.map((g, i) => ({
      key: `${parseInt(g, 2).toString().padStart(2, ' ')} (${g})`, value: `→ '${b64chars[i]}'`, type: 'highlight'
    }))
  });

  // Padding
  const remainder = input.length % 3;
  const padCount = remainder === 0 ? 0 : 3 - remainder;
  const output = btoa(input);

  steps.push({
    title: 'Step 5 — Add Padding (=)',
    explanation: `Base64 output must be a multiple of 4 characters. Add ${padCount} padding '=' character(s) if needed.`,
    data: [
      { key: 'Before pad', value: b64chars.join(''), type: 'accent' },
      { key: 'Pad count', value: padCount.toString(), type: 'plain' },
      { key: 'Final Output', value: output, type: 'highlight' }
    ]
  });

  return { output, steps };
}

// ── Base32 ────────────────────────────────────────────────────────────────────
const B32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function encodeBase32(input) {
  const steps = [];

  steps.push({
    title: 'What is Base32?',
    explanation: 'Base32 uses 32 characters (A-Z, 2-7). Every 5 bytes (40 bits) of input become 8 Base32 characters. It is case-insensitive and avoids confusing look-alike chars.',
    data: [
      { key: 'Input', value: input, type: 'plain' },
      { key: 'Alphabet', value: B32_CHARS, type: 'accent' },
    ]
  });

  const bytes = input.split('').map(c => c.charCodeAt(0));
  const bitStr = bytes.map(b => b.toString(2).padStart(8, '0')).join('');

  steps.push({
    title: 'Step 1 — Convert to Binary',
    explanation: 'Convert each character to 8-bit binary.',
    bits: bitStr,
    data: bytes.map((b, i) => ({ key: `'${input[i]}'`, value: `${b} → ${b.toString(2).padStart(8, '0')}`, type: 'accent' }))
  });

  const padded = bitStr.padEnd(Math.ceil(bitStr.length / 5) * 5, '0');
  const fiveBitGroups = splitInto(padded, 5);

  steps.push({
    title: 'Step 2 — Split into 5-bit Groups',
    explanation: 'Group bits into 5-bit chunks. Each maps to a value 0–31.',
    data: fiveBitGroups.map((g, i) => ({
      key: `Group ${i + 1}`, value: `${g} = ${parseInt(g, 2)} → '${B32_CHARS[parseInt(g, 2)]}'`, type: 'accent'
    }))
  });

  // Build output with padding (output must be multiple of 8)
  let raw = fiveBitGroups.map(g => B32_CHARS[parseInt(g, 2)]).join('');
  const rem = raw.length % 8;
  const padded32 = rem === 0 ? raw : raw + '='.repeat(8 - rem);

  steps.push({
    title: 'Step 3 — Map & Pad to Multiple of 8',
    explanation: 'Append "=" padding until length is a multiple of 8.',
    data: [
      { key: 'Mapped chars', value: raw, type: 'accent' },
      { key: 'Final Output', value: padded32, type: 'highlight' }
    ]
  });

  return { output: padded32, steps };
}

// ── Base58 ────────────────────────────────────────────────────────────────────
const B58_CHARS = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function encodeBase58(input) {
  const steps = [];

  steps.push({
    title: 'What is Base58?',
    explanation: 'Base58 is used in Bitcoin addresses. It removes confusing chars: 0 (zero), O (capital o), I (capital i), l (lowercase L). Making it human-friendly and safe for hand-copying.',
    data: [
      { key: 'Input', value: input, type: 'plain' },
      { key: 'Alphabet', value: B58_CHARS, type: 'accent' },
      { key: 'Excluded', value: '0, O, I, l', type: 'plain' }
    ]
  });

  // Count leading zeros
  let leadingZeros = 0;
  for (const c of input) { if (c === '\0') leadingZeros++; else break; }

  // Encode
  const bytes = input.split('').map(c => c.charCodeAt(0));

  steps.push({
    title: 'Step 1 — Convert to Integer',
    explanation: 'Treat the entire byte sequence as a big-endian integer.',
    data: bytes.map((b, i) => ({ key: `byte[${i}] '${input[i]}'`, value: `0x${b.toString(16).toUpperCase().padStart(2, '0')} = ${b}`, type: 'accent' }))
  });

  // Big number arithmetic
  let digits = [0];
  for (const byte of bytes) {
    let carry = byte;
    for (let i = 0; i < digits.length; i++) {
      carry += digits[i] * 256;
      digits[i] = carry % 58;
      carry = Math.floor(carry / 58);
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = Math.floor(carry / 58);
    }
  }

  steps.push({
    title: 'Step 2 — Repeated Division by 58',
    explanation: 'Divide the integer by 58 repeatedly, collecting remainders. Each remainder maps to a Base58 char.',
    data: digits.slice().reverse().map((d, i) => ({ key: `remainder[${i}]`, value: `${d} → '${B58_CHARS[d]}'`, type: 'accent' }))
  });

  const result = '1'.repeat(leadingZeros) + digits.reverse().map(d => B58_CHARS[d]).join('');

  steps.push({
    title: 'Step 3 — Add Leading 1s & Assemble',
    explanation: 'Prepend "1" for each leading zero byte, then join all Base58 characters.',
    data: [{ key: 'Output', value: result, type: 'highlight' }]
  });

  return { output: result, steps };
}

// ── Base62 ────────────────────────────────────────────────────────────────────
const B62_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

function encodeBase62(input) {
  const steps = [];

  steps.push({
    title: 'What is Base62?',
    explanation: 'Base62 uses digits 0-9, uppercase A-Z, and lowercase a-z (62 chars). It produces URL-safe, compact identifiers. Commonly used for URL shorteners and unique IDs.',
    data: [
      { key: 'Input', value: input, type: 'plain' },
      { key: 'Alphabet', value: B62_CHARS, type: 'accent' }
    ]
  });

  const bytes = input.split('').map(c => c.charCodeAt(0));

  steps.push({
    title: 'Step 1 — Bytes to Big Integer',
    explanation: 'Convert the byte array to a large integer (big-endian).',
    data: bytes.map((b, i) => ({ key: `byte[${i}] '${input[i]}'`, value: `${b}`, type: 'accent' }))
  });

  let digits = [0];
  for (const byte of bytes) {
    let carry = byte;
    for (let i = 0; i < digits.length; i++) {
      carry += digits[i] * 256;
      digits[i] = carry % 62;
      carry = Math.floor(carry / 62);
    }
    while (carry > 0) {
      digits.push(carry % 62);
      carry = Math.floor(carry / 62);
    }
  }

  steps.push({
    title: 'Step 2 — Divide by 62 Repeatedly',
    explanation: 'Divide the integer by 62, collect remainders (in reverse order = result).',
    data: digits.slice().reverse().map((d, i) => ({ key: `quotient[${i}]`, value: `${d} → '${B62_CHARS[d]}'`, type: 'accent' }))
  });

  const result = digits.reverse().map(d => B62_CHARS[d]).join('');

  steps.push({
    title: 'Final Base62 Output',
    explanation: 'Remainders in reverse order give the Base62 string.',
    data: [{ key: 'Base62', value: result, type: 'highlight' }]
  });

  return { output: result, steps };
}

// ── Base45 ────────────────────────────────────────────────────────────────────
const B45_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';

function encodeBase45(input) {
  const steps = [];

  steps.push({
    title: 'What is Base45?',
    explanation: 'Base45 is used in QR codes (EU Digital COVID Certificate). It encodes 2 bytes into 3 Base45 characters. The alphabet has 45 chars: digits, uppercase letters, and symbols.',
    data: [
      { key: 'Input', value: input, type: 'plain' },
      { key: 'Alphabet', value: B45_CHARS, type: 'accent' },
      { key: 'Rule', value: '2 bytes → 3 chars, 1 byte → 2 chars', type: 'plain' }
    ]
  });

  const bytes = input.split('').map(c => c.charCodeAt(0));
  let encoded = '';
  const groupDetails = [];

  for (let i = 0; i < bytes.length; i += 2) {
    if (i + 1 < bytes.length) {
      const n = bytes[i] * 256 + bytes[i + 1];
      const c = n % 45;
      const b = Math.floor(n / 45) % 45;
      const a = Math.floor(n / 2025);
      groupDetails.push({ bytes: [bytes[i], bytes[i + 1]], chars: [input[i], input[i + 1]], n, triple: [c, b, a], enc: [B45_CHARS[c], B45_CHARS[b], B45_CHARS[a]] });
      encoded += B45_CHARS[c] + B45_CHARS[b] + B45_CHARS[a];
    } else {
      const n = bytes[i];
      const d = n % 45;
      const e = Math.floor(n / 45);
      groupDetails.push({ bytes: [bytes[i]], chars: [input[i]], n, triple: [d, e], enc: [B45_CHARS[d], B45_CHARS[e]] });
      encoded += B45_CHARS[d] + B45_CHARS[e];
    }
  }

  steps.push({
    title: 'Step 1 — Pair Bytes',
    explanation: 'Group bytes in pairs. Two bytes = one 16-bit number (value = byte1×256 + byte2).',
    data: groupDetails.map((g, i) => ({
      key: `Pair ${i + 1}`,
      value: g.bytes.length === 2
        ? `'${g.chars[0]}'(${g.bytes[0]}) + '${g.chars[1]}'(${g.bytes[1]}) × 256 = ${g.n}`
        : `'${g.chars[0]}'(${g.bytes[0]}) = ${g.n}`,
      type: 'accent'
    }))
  });

  steps.push({
    title: 'Step 2 — Divide by 45',
    explanation: 'For each number n: c = n mod 45, b = (n÷45) mod 45, a = n÷2025',
    data: groupDetails.map((g, i) => ({
      key: `Group ${i + 1} (${g.n})`,
      value: g.triple.map((v, j) => `div${j}: ${v}→'${g.enc[j]}'`).join('  '),
      type: 'highlight'
    }))
  });

  steps.push({
    title: 'Final Base45 Output',
    explanation: 'Concatenate all encoded characters.',
    data: [{ key: 'Base45', value: encoded, type: 'highlight' }]
  });

  return { output: encoded, steps };
}

// ── Base85 ────────────────────────────────────────────────────────────────────
function encodeBase85(input) {
  const steps = [];

  steps.push({
    title: 'What is Base85?',
    explanation: 'Base85 (Ascii85) encodes 4 bytes into 5 characters using printable ASCII chars (33–117, "!" to "u"). More efficient than Base64 — produces ~25% overhead vs Base64\'s ~33%.',
    data: [
      { key: 'Input', value: input, type: 'plain' },
      { key: 'Range', value: '! (33) to u (117) = 85 chars', type: 'plain' },
      { key: 'Rule', value: '4 bytes → 5 chars', type: 'plain' }
    ]
  });

  const bytes = input.split('').map(c => c.charCodeAt(0));

  // Pad to multiple of 4
  while (bytes.length % 4 !== 0) bytes.push(0);

  const groups = [];
  for (let i = 0; i < bytes.length; i += 4) {
    const g = bytes.slice(i, i + 4);
    groups.push(g);
  }

  steps.push({
    title: 'Step 1 — Group into 4-byte Chunks',
    explanation: 'Pad input to multiple of 4 bytes (with null bytes), then split into groups of 4.',
    data: groups.map((g, i) => ({
      key: `Group ${i + 1}`,
      value: g.map((b, j) => `b${j}:${b}(0x${b.toString(16).toUpperCase().padStart(2, '0')})`).join(' '),
      type: 'accent'
    }))
  });

  let encoded = '';
  const groupEncoded = groups.map(g => {
    const n = (g[0] * 16777216) + (g[1] * 65536) + (g[2] * 256) + g[3];
    const chars = [];
    let v = n;
    for (let j = 4; j >= 0; j--) {
      chars[j] = String.fromCharCode((v % 85) + 33);
      v = Math.floor(v / 85);
    }
    return { n, chars: chars.join('') };
  });

  steps.push({
    title: 'Step 2 — Convert 4 Bytes to 32-bit Integer',
    explanation: 'Combine 4 bytes into one 32-bit unsigned integer: n = b0×85³ ... etc.',
    data: groupEncoded.map((g, i) => ({
      key: `Group ${i + 1}`,
      value: `n = ${g.n} (0x${g.n.toString(16).toUpperCase().padStart(8, '0')})`,
      type: 'accent'
    }))
  });

  steps.push({
    title: 'Step 3 — Divide by Powers of 85',
    explanation: 'For each group: divide n by 85⁴, 85³, 85², 85, 1 to get 5 digits. Add 33 (ASCII "!") to each.',
    data: groupEncoded.map((g, i) => ({
      key: `Group ${i + 1} (${g.n})`, value: `→ "${g.chars}"`, type: 'highlight'
    }))
  });

  const rawOutput = groupEncoded.map(g => g.chars).join('');
  // Trim trailing chars for actual input length
  const expectedLen = Math.ceil(input.length / 4) * 5;
  const output = rawOutput.slice(0, expectedLen);

  steps.push({
    title: 'Final Base85 Output',
    explanation: 'Concatenate all 5-char groups and trim padding.',
    data: [{ key: 'Base85', value: output, type: 'highlight' }]
  });

  return { output, steps };
}

// ── Decoders ──────────────────────────────────────────────────────────────────
function decodeASCII(input) {
  const steps = [];
  steps.push({ title: 'ASCII Decoding', explanation: 'Convert each space-separated decimal number back to its ASCII character.', data: [{ key: 'Input', value: input, type: 'plain' }] });
  const parts = input.trim().split(/\s+/).filter(Boolean);
  const chars = parts.map(p => String.fromCharCode(parseInt(p, 10) || 0));
  const output = chars.join('');
  steps.push({ title: 'Decimal → Character', explanation: 'Each decimal number maps to an ASCII character.', charBlocks: parts.map((p, i) => ({ top: p, bottom: chars[i], type: 'normal' })) });
  return { output, steps };
}

function decodeBinary(input) {
  const steps = [];
  steps.push({ title: 'Binary Decoding', explanation: 'Group the binary sequence into 8-bit bytes and convert each byte to its ASCII character.', data: [{ key: 'Input', value: input, type: 'plain' }] });
  const clean = input.replace(/\s+/g, '');
  const bytes = splitInto(clean, 8);
  const chars = bytes.map(b => String.fromCharCode(parseInt(b, 2) || 0));
  const output = chars.join('');
  steps.push({ title: '8-bit Binary → Character', explanation: 'Parse each 8-bit group into a decimal number, then to a character.', charBlocks: bytes.map((b, i) => ({ top: b, bottom: chars[i], type: 'normal' })) });
  return { output, steps };
}

function decodeHex(input) {
  const steps = [];
  const clean = input.replace(/\s+/g, '');
  steps.push({ title: 'Hex Decoding', explanation: 'Every 2 hexadecimal digits represent 1 byte (8 bits). Convert each pair to an ASCII character.', data: [{ key: 'Input', value: input, type: 'plain' }] });
  const pairs = splitInto(clean, 2);
  const chars = pairs.map(p => String.fromCharCode(parseInt(p, 16) || 0));
  const output = chars.join('');
  steps.push({ title: 'Hex Pair → Character', explanation: 'Parse each hex pair into a decimal number, then to a character.', charBlocks: pairs.map((p, i) => ({ top: p, bottom: chars[i], type: 'normal' })) });
  return { output, steps };
}

function decodeROT13(input) {
  const { output, steps } = encodeROT13(input);
  steps[0].title = 'ROT13 Decoding';
  steps[0].explanation = 'ROT13 is symmetric. Rotating by 13 again restores the original text.';
  steps[steps.length - 1].title = 'Final ROT13 Decoded Output';
  return { output, steps };
}

function decodeROT47(input) {
  const { output, steps } = encodeROT47(input);
  steps[0].title = 'ROT47 Decoding';
  steps[0].explanation = 'ROT47 is symmetric. Rotating by 47 again restores the original text.';
  steps[steps.length - 1].title = 'Final ROT47 Decoded Output';
  return { output, steps };
}

function decodeBase64(input) {
  const steps = [];
  steps.push({ title: 'Base64 Decoding', explanation: 'Base64 characters are mapped back to their 6-bit values, grouped into 8-bit bytes, and converted to text.', data: [{ key: 'Input', value: input, type: 'plain' }] });
  let output = '';
  try { output = atob(input.replace(/\s+/g, '')); } catch(e) { output = '[Invalid Base64]'; }
  steps.push({ title: 'Decode Result', explanation: 'Converted Base64 chars into bytes.', data: [{ key: 'Output', value: output, type: 'highlight' }] });
  return { output, steps };
}

function decodeBase32(input) {
  const steps = [];
  steps.push({ title: 'Base32 Decoding', explanation: 'Map characters back to 5-bit groups, combine into 8-bit bytes.', data: [{ key: 'Input', value: input, type: 'plain' }] });
  let clean = input.replace(/=+$/, '').toUpperCase();
  let bits = '';
  for (let i = 0; i < clean.length; i++) {
    const val = B32_CHARS.indexOf(clean[i]);
    if (val !== -1) bits += val.toString(2).padStart(5, '0');
  }
  let out = '';
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    out += String.fromCharCode(parseInt(bits.slice(i, i+8), 2));
  }
  steps.push({ title: 'Decoded Result', data: [{ key: 'Output', value: out, type: 'highlight' }] });
  return { output: out, steps };
}

function decodeBase58(input) {
  const steps = [];
  steps.push({ title: 'Base58 Decoding', explanation: 'Reverse the Base58 mapping and big integer math.', data: [{ key: 'Input', value: input, type: 'plain' }] });
  let leadingZeros = 0;
  for (let i = 0; i < input.length && input[i] === '1'; i++) leadingZeros++;
  let digits = [0];
  for (let i = leadingZeros; i < input.length; i++) {
    const val = B58_CHARS.indexOf(input[i]);
    if (val === -1) continue;
    let carry = val;
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] * 58;
      digits[j] = carry % 256;
      carry = Math.floor(carry / 256);
    }
    while (carry > 0) { digits.push(carry % 256); carry = Math.floor(carry / 256); }
  }
  let out = '\0'.repeat(leadingZeros) + digits.reverse().map(b => String.fromCharCode(b)).join('');
  steps.push({ title: 'Decoded Result', data: [{ key: 'Output', value: out, type: 'highlight' }] });
  return { output: out, steps };
}

function decodeBase62(input) {
  const steps = [];
  steps.push({ title: 'Base62 Decoding', explanation: 'Reverse Base62 division.', data: [{ key: 'Input', value: input, type: 'plain' }] });
  let digits = [0];
  for (let i = 0; i < input.length; i++) {
    const val = B62_CHARS.indexOf(input[i]);
    if (val === -1) continue;
    let carry = val;
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] * 62;
      digits[j] = carry % 256;
      carry = Math.floor(carry / 256);
    }
    while (carry > 0) { digits.push(carry % 256); carry = Math.floor(carry / 256); }
  }
  let out = digits.reverse().map(b => String.fromCharCode(b)).join('');
  steps.push({ title: 'Decoded Result', data: [{ key: 'Output', value: out, type: 'highlight' }] });
  return { output: out, steps };
}

function decodeBase45(input) {
  const steps = [];
  steps.push({ title: 'Base45 Decoding', explanation: '3 chars -> 2 bytes, 2 chars -> 1 byte.', data: [{ key: 'Input', value: input, type: 'plain' }] });
  let out = '';
  for (let i = 0; i < input.length; i += 3) {
    if (i + 2 < input.length) {
      const c = B45_CHARS.indexOf(input[i]);
      const b = B45_CHARS.indexOf(input[i+1]);
      const a = B45_CHARS.indexOf(input[i+2]);
      const n = c + b * 45 + a * 2025;
      out += String.fromCharCode(Math.floor(n / 256)) + String.fromCharCode(n % 256);
    } else if (i + 1 < input.length) {
      const d = B45_CHARS.indexOf(input[i]);
      const e = B45_CHARS.indexOf(input[i+1]);
      const n = d + e * 45;
      out += String.fromCharCode(n);
    }
  }
  steps.push({ title: 'Decoded Result', data: [{ key: 'Output', value: out, type: 'highlight' }] });
  return { output: out, steps };
}

function decodeBase85(input) {
  const steps = [];
  steps.push({ title: 'Base85 Decoding', explanation: '5 chars -> 4 bytes.', data: [{ key: 'Input', value: input, type: 'plain' }] });
  let clean = input.replace(/\s+/g, '');
  let out = '';
  for (let i = 0; i < clean.length; i += 5) {
    const chunk = clean.slice(i, i + 5);
    const padLen = 5 - chunk.length;
    const padded = chunk + 'u'.repeat(padLen);
    let n = 0;
    for (let j = 0; j < 5; j++) {
      n = n * 85 + (padded.charCodeAt(j) - 33);
    }
    out += String.fromCharCode(Math.floor(n / 16777216) % 256);
    if (padLen < 3) out += String.fromCharCode(Math.floor(n / 65536) % 256);
    if (padLen < 2) out += String.fromCharCode(Math.floor(n / 256) % 256);
    if (padLen < 1) out += String.fromCharCode(n % 256);
  }
  steps.push({ title: 'Decoded Result', data: [{ key: 'Output', value: out, type: 'highlight' }] });
  return { output: out, steps };
}

// ── Registry ──────────────────────────────────────────────────────────────────
const ENCODERS = {
  ascii: { label: 'ASCII', desc: 'Chars → decimal codes 0–127', fn: encodeASCII, decodeFn: decodeASCII },
  binary: { label: 'Binary', desc: 'Chars → 8-bit 0/1 representation', fn: encodeBinary, decodeFn: decodeBinary },
  hex: { label: 'Hex', desc: 'Bytes → 2-digit hex pairs', fn: encodeHex, decodeFn: decodeHex },
  rot13: { label: 'ROT13', desc: 'A–Z rotated by 13 positions', fn: encodeROT13, decodeFn: decodeROT13 },
  rot47: { label: 'ROT47', desc: '!–~ all printable chars rotated 47', fn: encodeROT47, decodeFn: decodeROT47 },
  base32: { label: 'Base32', desc: '5-bit groups → A–Z 2–7 alphabet', fn: encodeBase32, decodeFn: decodeBase32 },
  base45: { label: 'Base45', desc: '2 bytes → 3 chars (QR codes)', fn: encodeBase45, decodeFn: decodeBase45 },
  base58: { label: 'Base58', desc: 'Bitcoin-safe, no 0/O/I/l chars', fn: encodeBase58, decodeFn: decodeBase58 },
  base62: { label: 'Base62', desc: '0–9 A–Z a–z, URL-safe compact IDs', fn: encodeBase62, decodeFn: decodeBase62 },
  base64: { label: 'Base64', desc: '3 bytes → 4 chars, A–Z a–z 0–9+/', fn: encodeBase64, decodeFn: decodeBase64 },
  base85: { label: 'Base85', desc: '4 bytes → 5 chars, ~25% overhead', fn: encodeBase85, decodeFn: decodeBase85 },
};
