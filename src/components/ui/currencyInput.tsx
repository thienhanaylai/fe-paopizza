import React, { useRef, useEffect } from "react";
import AutoNumeric from "autonumeric";

const CurrencyInput = ({ value, onChange, placeholder, className }) => {
  const inputRef = useRef(null);
  const autoNumericRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      autoNumericRef.current = new AutoNumeric(inputRef.current, value, {
        digitGroupSeparator: ",",
        decimalPlaces: 0,
        minimumValue: "0",
        unformatOnSubmit: true,
      });

      inputRef.current.addEventListener("autoNumeric:rawValueModified", e => {
        if (onChange) {
          onChange(e.detail.newRawValue);
        }
      });
    }

    return () => {
      if (autoNumericRef.current) {
        autoNumericRef.current.remove();
      }
    };
  }, []);
  useEffect(() => {
    if (autoNumericRef.current && value !== undefined && value !== null) {
      autoNumericRef.current.set(value);
    }
  }, [value]);

  return <input type="text" ref={inputRef} placeholder={placeholder} className={className} />;
};

export default CurrencyInput;
