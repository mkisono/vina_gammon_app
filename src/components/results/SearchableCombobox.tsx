import { useEffect, useId, useMemo, useRef, useState } from "react";

type SearchableComboboxProps = {
  value: string;
  options: string[];
  placeholder: string;
  disabled?: boolean;
  ariaLabel?: string;
  inputClassName?: string;
  onChange: (value: string) => void;
};

const normalize = (value: string): string => value.trim().toLocaleLowerCase("ja");

export function SearchableCombobox({
  value,
  options,
  placeholder,
  disabled = false,
  ariaLabel,
  inputClassName,
  onChange,
}: SearchableComboboxProps) {
  const listboxId = useId();
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [query, setQuery] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const filteredOptions = useMemo(() => {
    const normalizedQuery = normalize(query);
    if (!normalizedQuery) {
      return options;
    }
    return options.filter((option) => normalize(option).includes(normalizedQuery));
  }, [options, query]);

  useEffect(() => {
    if (!isOpen) {
      setHighlightedIndex(-1);
      return;
    }
    setHighlightedIndex(filteredOptions.length > 0 ? 0 : -1);
  }, [filteredOptions, isOpen]);

  const closeAndRestore = () => {
    setQuery(value);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const commitSelection = (nextValue: string) => {
    setQuery(nextValue);
    onChange(nextValue);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const findExactMatch = (): string | null => {
    const matched = options.find((option) => normalize(option) === normalize(query));
    return matched ?? null;
  };

  const handleBlur = () => {
    window.setTimeout(() => {
      if (wrapperRef.current?.contains(document.activeElement)) {
        return;
      }
      const exactMatch = findExactMatch();
      if (exactMatch) {
        commitSelection(exactMatch);
        return;
      }
      closeAndRestore();
    }, 0);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsOpen(true);
      if (filteredOptions.length === 0) {
        return;
      }
      setHighlightedIndex((currentIndex) =>
        currentIndex < 0 ? 0 : (currentIndex + 1) % filteredOptions.length
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setIsOpen(true);
      if (filteredOptions.length === 0) {
        return;
      }
      setHighlightedIndex((currentIndex) =>
        currentIndex < 0 ? filteredOptions.length - 1 : (currentIndex - 1 + filteredOptions.length) % filteredOptions.length
      );
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      if (isOpen && highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
        commitSelection(filteredOptions[highlightedIndex]);
        return;
      }
      const exactMatch = findExactMatch();
      if (exactMatch) {
        commitSelection(exactMatch);
        return;
      }
      closeAndRestore();
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeAndRestore();
    }
  };

  return (
    <div className="result-combobox" ref={wrapperRef}>
      <input
        type="text"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-autocomplete="list"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-activedescendant={highlightedIndex >= 0 ? `${listboxId}-${highlightedIndex}` : undefined}
        className={inputClassName}
      />
      {isOpen && (
        <div className="result-combobox-list" role="listbox" id={listboxId}>
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <button
                key={option}
                type="button"
                id={`${listboxId}-${index}`}
                role="option"
                aria-selected={highlightedIndex === index}
                className={`result-combobox-option${highlightedIndex === index ? " is-active" : ""}`}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => commitSelection(option)}
              >
                {option}
              </button>
            ))
          ) : (
            <div className="result-combobox-empty">該当するニックネームがありません</div>
          )}
        </div>
      )}
    </div>
  );
}