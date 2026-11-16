import type { EmailBlock } from "../models";

export const serializeEmailBlocks = (blocks: EmailBlock[]) =>
  blocks
    .map((block) => {
      if (block.type === "image")
        return block.content ? `[Image: ${block.content}]` : "";
      if (block.type === "link")
        return block.url
          ? `[Link: ${block.content || block.url} - ${block.url}]`
          : block.content;
      if (block.type === "button")
        return block.url
          ? `[Button: ${block.content || "Learn more"} - ${block.url}]`
          : block.content;
      if (block.type === "divider") return "---";
      return block.content;
    })
    .filter(Boolean)
    .join("\n\n");
export const getSmsEstimate = (message: string) => {
  const gsmBasic = new Set(
    Array.from(
      "@£$¥èéùìòÇØøÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà\n\r",
    ),
  );
  const gsmExtended = new Set(Array.from("^{}\\[~]|€\f"));
  const chars = Array.from(message);
  const usesGsm = chars.every(
    (char) => gsmBasic.has(char) || gsmExtended.has(char),
  );
  const units = usesGsm
    ? chars.reduce((count, char) => count + (gsmExtended.has(char) ? 2 : 1), 0)
    : message.length;
  const singleLimit = usesGsm ? 160 : 70;
  const multipartLimit = usesGsm ? 153 : 67;
  const parts =
    units === 0
      ? 0
      : units <= singleLimit
        ? 1
        : Math.ceil(units / multipartLimit);
  return {
    characters: chars.length,
    units,
    encoding: usesGsm ? "GSM-7" : "UCS-2",
    capacity: units <= singleLimit ? singleLimit : multipartLimit,
    parts,
  };
};
