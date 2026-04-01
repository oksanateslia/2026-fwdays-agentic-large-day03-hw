import clsx from "clsx";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  KEYS,
  getHexColorValidationError,
  normalizeInputColor,
  sanitizeHexColorInput,
} from "@excalidraw/common";

import { getShortcutKey } from "../..//shortcut";
import { useAtom } from "../../editor-jotai";
import { t } from "../../i18n";
import { useEditorInterface } from "../App";
import { activeEyeDropperAtom } from "../EyeDropper";
import { eyeDropperIcon } from "../icons";

import { activeColorPickerSectionAtom } from "./colorPickerUtils";

import type { ColorPickerType } from "./colorPickerUtils";
import type { HexColorValidationError } from "@excalidraw/common";

const getHexColorInputErrorMessage = (error: HexColorValidationError) => {
  switch (error) {
    case "invalidLength":
      return t("colorPicker.errorInvalidHexLength");
    case "invalidCharacters":
      return t("colorPicker.errorInvalidHexCharacters");
    case "invalidColor":
      return t("colorPicker.errorInvalidHexColor");
    default:
      return null;
  }
};

export const ColorInput = ({
  color,
  onChange,
  label,
  colorPickerType,
  placeholder,
}: {
  color: string;
  onChange: (color: string) => void;
  label: string;
  colorPickerType: ColorPickerType;
  placeholder?: string;
}) => {
  const editorInterface = useEditorInterface();
  const [innerValue, setInnerValue] = useState(color);
  const [inputError, setInputError] = useState<HexColorValidationError | null>(
    null,
  );
  const [activeSection, setActiveColorPickerSection] = useAtom(
    activeColorPickerSectionAtom,
  );

  useEffect(() => {
    setInnerValue(color);
    setInputError(null);
  }, [color]);

  const changeColor = useCallback(
    (inputValue: string) => {
      const value = sanitizeHexColorInput(inputValue.toLowerCase());
      setInnerValue(value);

      if (!value) {
        setInputError(null);
        return;
      }

      const validationError = getHexColorValidationError(value);
      if (validationError) {
        setInputError(validationError);
        return;
      }

      const normalizedColor = normalizeInputColor(value);
      if (!normalizedColor) {
        setInputError("invalidColor");
        return;
      }

      setInputError(null);
      onChange(normalizedColor);
    },
    [onChange],
  );

  const inputRef = useRef<HTMLInputElement>(null);
  const eyeDropperTriggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [activeSection]);

  const [eyeDropperState, setEyeDropperState] = useAtom(activeEyeDropperAtom);

  useEffect(() => {
    return () => {
      setEyeDropperState(null);
    };
  }, [setEyeDropperState]);

  const inputErrorId = `color-picker-${colorPickerType}-hex-error`;

  return (
    <div
      className={clsx("color-picker__input-label", {
        "color-picker__input-label--error": inputError,
      })}
    >
      <div className="color-picker__input-hash">#</div>
      <input
        ref={activeSection === "hex" ? inputRef : undefined}
        style={{ border: 0, padding: 0 }}
        spellCheck={false}
        className="color-picker-input"
        aria-label={label}
        aria-invalid={!!inputError}
        aria-describedby={inputError ? inputErrorId : undefined}
        onChange={(event) => {
          changeColor(event.target.value);
        }}
        value={(innerValue || "").replace(/^#/, "")}
        onBlur={() => {
          if (!inputError) {
            setInnerValue(color);
          }
        }}
        tabIndex={-1}
        onFocus={() => setActiveColorPickerSection("hex")}
        onKeyDown={(event) => {
          if (event.key === KEYS.TAB) {
            return;
          } else if (event.key === KEYS.ESCAPE) {
            eyeDropperTriggerRef.current?.focus();
          }
          event.stopPropagation();
        }}
        placeholder={placeholder}
      />
      {/* TODO reenable on mobile with a better UX */}
      {editorInterface.formFactor !== "phone" && (
        <>
          <div
            style={{
              width: "1px",
              height: "1.25rem",
              backgroundColor: "var(--default-border-color)",
            }}
          />
          <div
            ref={eyeDropperTriggerRef}
            className={clsx("excalidraw-eye-dropper-trigger", {
              selected: eyeDropperState,
            })}
            onClick={() =>
              setEyeDropperState((s) =>
                s
                  ? null
                  : {
                      keepOpenOnAlt: false,
                      onSelect: (color) => onChange(color),
                      colorPickerType,
                    },
              )
            }
            title={`${t(
              "labels.eyeDropper",
            )} — ${KEYS.I.toLocaleUpperCase()} or ${getShortcutKey("Alt")} `}
          >
            {eyeDropperIcon}
          </div>
        </>
      )}
      {inputError && (
        <div
          id={inputErrorId}
          className="color-picker__input-error"
          role="alert"
          aria-live="polite"
        >
          {getHexColorInputErrorMessage(inputError)}
        </div>
      )}
    </div>
  );
};
