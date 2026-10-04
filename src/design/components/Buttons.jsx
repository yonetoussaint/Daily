/** Pill button that squares off while pressed (shape morph). */
export function Button({ variant = "filled", icon, children, className = "", type = "button", ...rest }) {
  return (
    <button type={type} className={`btn btn-${variant} state ${className}`} {...rest}>
      {icon}
      {children}
    </button>
  );
}

export function IconButton({ label, children, className = "", tone, ...rest }) {
  return (
    <button type="button" className={`icon-btn state ${tone ? `icon-btn-${tone}` : ""} ${className}`} aria-label={label} title={label} {...rest}>
      {children}
    </button>
  );
}

/** Floating action button. `extended` shows the label; it collapses to an icon when scrolling down. */
export function Fab({ icon, label, extended = true, className = "", ...rest }) {
  return (
    <button type="button" className={`fab state ${extended ? "is-extended" : ""} ${className}`} aria-label={label} {...rest}>
      {icon}
      <span className="fab-label">{label}</span>
    </button>
  );
}

/** Connected button group with single selection — the selected button becomes a full pill. */
export function ButtonGroup({ options, value, onChange, label, className = "" }) {
  return (
    <div className={`btn-group ${className}`} role="group" aria-label={label}>
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            className={`btn-group-item state acc`}
            style={o.hue != null ? { "--hue": o.hue } : undefined}
            aria-pressed={selected}
            onClick={() => onChange(o.value)}
          >
            {o.icon}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Filter chip. Pass `hue` for an accent colour. */
export function Chip({ selected, icon, children, hue, className = "", ...rest }) {
  return (
    <button
      type="button"
      className={`chip state acc ${className}`}
      style={hue != null ? { "--hue": hue } : undefined}
      aria-pressed={!!selected}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}
