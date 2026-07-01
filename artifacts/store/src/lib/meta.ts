export function setMetaTag(name: string, content: string) {
  const el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!content) {
    el?.remove();
    return;
  }
  const tag = el ?? document.createElement("meta");
  if (!el) {
    tag.setAttribute("name", name);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

export function setOgTag(property: string, content: string) {
  const el = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!content) {
    el?.remove();
    return;
  }
  const tag = el ?? document.createElement("meta");
  if (!el) {
    tag.setAttribute("property", property);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}
