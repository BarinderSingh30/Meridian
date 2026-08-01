/** Safe to embed via dangerouslySetInnerHTML — escapes `<` so a stray `</script>` in DB content can't break out of the tag. */
export function jsonLdScriptProps(data: unknown) {
  return { __html: JSON.stringify(data).replace(/</g, "\\u003c") };
}
