export function Avatar({
  name,
  src,
  size = 32,
}: {
  name: string;
  src?: string | null;
  size?: number;
}) {
  const style = { width: size, height: size, fontSize: size * 0.42 };
  return src ? (
    <img src={src} alt={name} style={style} className="rounded-full object-cover shrink-0" />
  ) : (
    <span
      style={style}
      className="rounded-full bg-moss-light text-moss font-medium inline-flex items-center justify-center shrink-0"
    >
      {name.charAt(0).toUpperCase() || "?"}
    </span>
  );
}
