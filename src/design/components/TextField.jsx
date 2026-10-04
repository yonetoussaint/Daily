import { forwardRef, useId } from "react";

/** Filled text field with a floating label and a rounded, expressive container. */
const TextField = forwardRef(function TextField({ label, leading, trailing, className = "", ...rest }, ref) {
  const id = useId();
  return (
    <div className={`field ${leading ? "has-leading" : ""} ${className}`}>
      {leading && <span className="field-leading" aria-hidden="true">{leading}</span>}
      <input id={id} ref={ref} className="field-input" placeholder=" " {...rest} />
      <label htmlFor={id} className="field-label">{label}</label>
      {trailing && <span className="field-trailing">{trailing}</span>}
    </div>
  );
});

export default TextField;
