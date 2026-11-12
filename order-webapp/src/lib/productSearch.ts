/**
 * Tìm sản phẩm theo NGUYÊN CHỮ, cùng quy tắc với hàm search_products trên máy chủ:
 *   1) có dấu, nguyên chữ      "cá"  → chỉ món có chữ "cá" (không ra "cái", "cánh", "cacao")
 *   2) có dấu, từ cuối khớp đầu chữ (khách đang gõ dở: "cá l" → "cá lóc")
 *   3) không dấu, nguyên chữ   "ca"  → cá, cà, cả, ca...
 *   4) không dấu, từ cuối khớp đầu chữ
 * Dùng bậc đầu tiên có kết quả.
 */

export function tokensWithAccents(value: string): string[] {
  return value
    .normalize('NFC')
    .toLocaleLowerCase('vi-VN')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);
}

export function stripAccents(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .normalize('NFC');
}

interface Indexed<T> {
  item: T;
  accented: string[];
  plain: string[];
  nameAccented: string;
  namePlain: string;
}

function matches(tokens: string[], words: string[], prefixLast: boolean): boolean {
  return words.every((word, index) =>
    prefixLast && index === words.length - 1
      ? tokens.some((token) => token.startsWith(word))
      : tokens.includes(word),
  );
}

export function searchProducts<T>(
  items: T[],
  rawQuery: string,
  keyOf: (item: T) => { text: string; name: string },
  hasImage: (item: T) => boolean = () => false,
  limit = 60,
): T[] {
  const words = tokensWithAccents(rawQuery);
  if (words.length === 0) return items.slice(0, limit);
  const plainWords = words.map(stripAccents);
  const hasAccents = words.join(' ') !== plainWords.join(' ');
  const needle = words.join(' ');
  const plainNeedle = plainWords.join(' ');

  const indexed: Indexed<T>[] = items.map((item) => {
    const { text, name } = keyOf(item);
    const accented = tokensWithAccents(text);
    const nameAccented = tokensWithAccents(name).join(' ');
    return {
      item,
      accented,
      plain: accented.map(stripAccents),
      nameAccented,
      namePlain: stripAccents(nameAccented),
    };
  });

  const steps: Array<{ plain: boolean; prefixLast: boolean }> = [
    { plain: false, prefixLast: false },
    { plain: false, prefixLast: true },
    { plain: true, prefixLast: false },
    { plain: true, prefixLast: true },
  ];

  for (const step of steps) {
    if (!step.plain && !hasAccents) continue;
    const q = step.plain ? plainWords : words;
    const found = indexed.filter((row) => matches(step.plain ? row.plain : row.accented, q, step.prefixLast));
    if (found.length === 0) continue;
    const target = step.plain ? plainNeedle : needle;
    const score = (row: Indexed<T>) => {
      const name = step.plain ? row.namePlain : row.nameAccented;
      if (name === target) return 0;
      if (name.startsWith(`${target} `) || name === target) return 1;
      if (name.startsWith(target)) return 2;
      return 3;
    };
    return found
      .map((row) => ({ row, s: score(row) }))
      .sort(
        (a, b) =>
          a.s - b.s ||
          Number(hasImage(b.row.item)) - Number(hasImage(a.row.item)) ||
          a.row.nameAccented.localeCompare(b.row.nameAccented, 'vi'),
      )
      .slice(0, limit)
      .map(({ row }) => row.item);
  }
  return [];
}
