const CHAR_TABLE: Record<string, number> = {
  "0": 0, "1": 1, "2": 2, "3": 3, "4": 4,
  "5": 5, "6": 6, "7": 7, "8": 8, "9": 9,
  "A": 10, "B": 11, "C": 12, "D": 13, "E": 14,
  "F": 15, "G": 16, "H": 17, "I": 18, "J": 19,
  "K": 20, "L": 21, "M": 22, "N": 23, "Ñ": 24,
  "O": 25, "P": 26, "Q": 27, "R": 28, "S": 29,
  "T": 30, "U": 31, "V": 32, "W": 33, "X": 34,
  "Y": 35, "Z": 36, "&": 37, " ": 38
};

const OFFENSIVE_WORDS = new Set([
  "BUEI","BUEY","CACA","CACO","CAGA","CAGO","CAKA","CAKO",
  "COGE","COGI","COJA","COJE","COJI","COJO",
  "CULO","FETO","GUEI","GUEY","JOTO","KACA","KACO","KAGA",
  "KAGO","KOGE","KOGI","KOJA","KOJE","KOJI","KOJO",
  "KULO","MAME","MAMO","MEAR","MEAS","MEON",
  "MION","MOCO","MULA","PEDO","PENE","PUTA","PUTO",
  "QULO","RATA","RUIN"
]);


const HOMO_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/* ========= Helpers de normalización ========= */

function stripAccents(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalizeName(str: string): string {
  const cleaned = stripAccents(str.toUpperCase().trim());
  return cleaned.replace(/[^A-ZÑ\s]/g, "");
}

function firstInternalVowel(word: string): string {
  const sub = word.slice(1);
  const m = sub.match(/[AEIOU]/);
  return m ? m[0] : "X";
}

function avoidOffensive(code: string): string {
  if (OFFENSIVE_WORDS.has(code)) {
    return code[0] + "X" + code.slice(2);
  }
  return code;
}

function normalizeDateYyMmDd(fecha: string): string {
  // espera "YYYY-MM-DD"
  const [y, m, d] = fecha.split("-");
  if (!y || !m || !d) throw new Error("Fecha inválida, usa YYYY-MM-DD");
  return y.slice(-2) + m.padStart(2, "0") + d.padStart(2, "0");
}

/* ========= 1) VALIDACIÓN DE FORMATO ========= */

export function isValidRfcFormat(rfc: string): boolean {
  const re = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/;
  return re.test(rfc.toUpperCase());
}

/* ========= 2) DÍGITO VERIFICADOR (mod 11) ========= */

function computeCheckDigit(rfc12: string): string {
  let sum = 0;
  const FACTOR = [13,12,11,10,9,8,7,6,5,4,3,2];

  for (let i = 0; i < 12; i++) {
    const char = rfc12[i];
    const value = CHAR_TABLE[char] ?? 0;
    sum += value * FACTOR[i];
  }

  const mod = sum % 11;
  const digit = 11 - mod;

  if (digit === 10) return "A";
  if (digit === 11) return "0";
  return String(digit);
}

/* ========= 3) VALIDAR RFC COMPLETO ========= */

export function validateRfc(rfc: string) {
  const cleaned = rfc.trim().toUpperCase();

  if (!isValidRfcFormat(cleaned)) {
    return { valid: false, reason: "Formato no válido" };
  }

  const rfc12 = cleaned.slice(0, 12);
  const expectedDigit = computeCheckDigit(rfc12);
  const providedDigit = cleaned[12];

  if (expectedDigit !== providedDigit) {
    return { valid: false, reason: "Dígito verificador incorrecto" };
  }

  return { valid: true };
}

/* ========= 4) PRIMERAS 10 POSICIONES (LETRAS + FECHA) ========= */

export function buildRfcBase(
  apellidoP: string,
  apellidoM: string,
  nombre: string,
  fechaNacimiento: string  // "YYYY-MM-DD"
): string {
  const pat = normalizeName(apellidoP).split(" ").filter(Boolean)[0] ?? "";
  const mat = normalizeName(apellidoM).split(" ").filter(Boolean)[0] ?? "";
  const nombres = normalizeName(nombre).split(" ").filter(Boolean);

  let nom = nombres[0] ?? "";
  if (nombres.length > 1 && (nom === "JOSE" || nom === "MARIA")) {
    nom = nombres[1];
  }

  let letras = "";

  if (pat.length >= 2) {
    letras = pat[0] + firstInternalVowel(pat);
  } else if (pat.length === 1) {
    letras = pat[0] + "X";
  } else {
    letras = "XX";
  }

  letras += mat[0] ?? "X";
  letras += nom[0] ?? "X";

  letras = letras.padEnd(4, "X");
  letras = avoidOffensive(letras);

  const fecha = normalizeDateYyMmDd(fechaNacimiento);

  return letras + fecha; // 4 letras + 6 fecha = 10
}

/* ========= 5) HOMOCLAVE =========

 */

function computeHomoclave(fullName: string): string {
  const normalized = normalizeName(fullName).replace(/\s+/g, " ").trim();
  if (!normalized) return "XX";

  // 1) convertir a cadena numérica con padding
  let numeric = "";
  for (const ch of normalized) {
    const val = CHAR_TABLE[ch] ?? 0;
    numeric += val.toString().padStart(2, "0");
  }

  // 2) recorrer pares y ponderar
  let sum = 0;
  let factor = 1;
  for (let i = 0; i < numeric.length - 1; i++) {
    const pair = parseInt(numeric.substring(i, i + 2), 10);
    sum += pair * factor;
    factor++;
  }

  // 3) reducir mod 1000
  const mod1000 = sum % 1000;
  const q = Math.floor(mod1000 / HOMO_ALPHABET.length);
  const r = mod1000 % HOMO_ALPHABET.length;

  const c1 = HOMO_ALPHABET[q % HOMO_ALPHABET.length];
  const c2 = HOMO_ALPHABET[r];

  return `${c1}${c2}`;
}

/* ========= 6) GENERAR RFC COMPLETO PARA PRUEBAS ========= */

export function generateRfc(params: {
  nombre: string;
  apellidoP: string;
  apellidoM?: string;
  fechaNacimiento: string; // "YYYY-MM-DD"
}) {
  const { nombre, apellidoP, apellidoM = "", fechaNacimiento } = params;

  const base10 = buildRfcBase(apellidoP, apellidoM, nombre, fechaNacimiento);
  const homoclave = computeHomoclave(
    `${nombre} ${apellidoP} ${apellidoM}`.trim()
  );

  const rfc12 = base10 + homoclave;
  const checkDigit = computeCheckDigit(rfc12);
  const rfc = rfc12 + checkDigit;

  return {
    rfc,
    base10,
    homoclave,
    checkDigit
  };
}
