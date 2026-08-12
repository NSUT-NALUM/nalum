// Position of the text caret inside a <textarea>, in pixels relative to the
// element's top-left. A textarea gives no way to ask this directly, so the
// standard trick is to render the text into an off-screen div that copies the
// textarea's box and typography, then measure where a marker span lands.
const MIRRORED_PROPERTIES = [
  "boxSizing",
  "width",
  "borderTopWidth",
  "borderRightWidth",
  "borderBottomWidth",
  "borderLeftWidth",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "fontStyle",
  "fontVariant",
  "fontWeight",
  "fontStretch",
  "fontSize",
  "fontFamily",
  "lineHeight",
  "letterSpacing",
  "textIndent",
  "textTransform",
  "wordSpacing",
] as const;

export interface CaretPosition {
  top: number;
  left: number;
  lineHeight: number;
}

export function getCaretPosition(
  textarea: HTMLTextAreaElement,
  position = textarea.selectionStart
): CaretPosition {
  const computed = window.getComputedStyle(textarea);
  const mirror = document.createElement("div");

  mirror.style.position = "absolute";
  mirror.style.visibility = "hidden";
  mirror.style.whiteSpace = "pre-wrap";
  mirror.style.wordWrap = "break-word";
  mirror.style.overflowWrap = "break-word";
  MIRRORED_PROPERTIES.forEach((property) => {
    mirror.style[property] = computed[property];
  });

  mirror.textContent = textarea.value.slice(0, position);

  // A zero-width marker at the caret: its offset is what we're after.
  const marker = document.createElement("span");
  marker.textContent = textarea.value.slice(position) || ".";
  mirror.appendChild(marker);

  document.body.appendChild(mirror);
  const top = marker.offsetTop - textarea.scrollTop;
  const left = marker.offsetLeft - textarea.scrollLeft;
  document.body.removeChild(mirror);

  return {
    top,
    left,
    lineHeight: parseFloat(computed.lineHeight) || parseFloat(computed.fontSize) * 1.4,
  };
}
