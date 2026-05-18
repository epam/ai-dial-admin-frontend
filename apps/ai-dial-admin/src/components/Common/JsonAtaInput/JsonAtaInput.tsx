import { FC, KeyboardEvent, useCallback, useMemo, useState } from 'react';

import { DialFormPopup, DialInput, DialInputPopup, DialLabel } from '@epam/ai-dial-ui-kit';
import { JSONSchema7 } from 'json-schema';

import SchemaTree from '@/src/components/Common/SchemaGrid/SchemaTree';
import { schemaToTreeNodes } from '@/src/components/Common/SchemaGrid/utils';
import { ButtonsI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import Suggestions, { SuggestionOption } from './Suggestions';
import { getSchemaSuggestions } from './utils';

interface Props {
  value: string;
  responseSchema: JSONSchema7;
  label?: string;
  elementId?: string;
  disabled?: boolean;
  inputClassName?: string;
  onChangeValue: (expression: string, type?: string) => void;
}

const JsonAtaInput: FC<Props> = ({
  value,
  responseSchema,
  disabled,
  label,
  elementId,
  inputClassName,
  onChangeValue,
}) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const header = `JSONata ${t(EntityFieldsI18nKey.expression)}`;
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [expression, setExpression] = useState(value);
  const [type, setType] = useState<string | undefined>(undefined);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);

  const treeNodes = useMemo(() => {
    if (!responseSchema || responseSchema.type !== 'object') return [];
    return schemaToTreeNodes(responseSchema, '', responseSchema);
  }, [responseSchema]);

  const filteredSuggestions = useMemo(() => getSchemaSuggestions(treeNodes, expression), [treeNodes, expression]);

  const onOpenModal = useCallback(() => {
    setIsModalOpen(true);
  }, [setIsModalOpen]);

  const onCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, [setIsModalOpen]);

  const onApply = useCallback(() => {
    onChangeValue(expression, type);
  }, [expression, type, onChangeValue]);

  const onPickFromSchema = useCallback((result: { expression: string; type: string }) => {
    setExpression(result.expression);
    setType(result.type);
  }, []);

  const onSelectSuggestion = useCallback((suggestion: SuggestionOption) => {
    let newExpression = suggestion.value;

    if (suggestion.type === 'array') {
      newExpression += '[0]';
    } else if (suggestion.type === 'object') {
      newExpression += '.';
    }

    setExpression(newExpression);
    setType(suggestion.type);
    setHighlightIndex(0);
    // Keep suggestions open for container types to allow drill-down
    setShowSuggestions(suggestion.type === 'array' || suggestion.type === 'object');
  }, []);

  const onHighlightSuggestion = useCallback((idx: number) => setHighlightIndex(idx), []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setShowSuggestions(true);
        setHighlightIndex((h) => (h + 1) % Math.max(filteredSuggestions.length, 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setShowSuggestions(true);
        setHighlightIndex((h) => (h - 1 + filteredSuggestions.length) % Math.max(filteredSuggestions.length, 1));
      } else if (e.key === 'Enter' && showSuggestions && filteredSuggestions[highlightIndex]) {
        e.preventDefault();
        onSelectSuggestion(filteredSuggestions[highlightIndex]);
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    },
    [filteredSuggestions, highlightIndex, onSelectSuggestion, showSuggestions],
  );

  return (
    <div className="flex flex-col gap-y-1">
      {label && <DialLabel label={label} htmlFor={elementId} />}
      <DialInputPopup
        disabled={disabled || isReadOnlyAdmin}
        open={isModalOpen}
        selectedValue={value}
        onOpen={onOpenModal}
        inputClassName={inputClassName}
      >
        <DialFormPopup
          onClose={onCloseModal}
          header={header}
          portalId="jsonAtaInputModal"
          open={isModalOpen}
          onSubmit={onApply}
          submitLabel={t(ButtonsI18nKey.Apply)}
          cancelLabel={t(ButtonsI18nKey.Cancel)}
          onCancel={onCloseModal}
          disableSubmitButton={!expression}
        >
          <div className="px-6 py-4 h-[540px] flex flex-col gap-4">
            <SchemaTree responseSchema={responseSchema} onSelect={onPickFromSchema} />
            <div className="relative">
              <DialInput
                id="expression"
                labelProps={{ label: header, required: true }}
                placeholder={t(EntityPlaceholdersI18nKey.Expression)}
                value={expression}
                onChange={(value) => {
                  setExpression(value || '');
                  setType(undefined);
                  setShowSuggestions(true);
                  setHighlightIndex(0);
                }}
                onKeyDown={handleKeyDown}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setShowSuggestions(false)}
              />
              {showSuggestions && filteredSuggestions.length > 0 && (
                <Suggestions
                  suggestions={filteredSuggestions}
                  highlightIndex={highlightIndex}
                  onSelectSuggestion={onSelectSuggestion}
                  onHighlightSuggestion={onHighlightSuggestion}
                />
              )}
            </div>
          </div>
        </DialFormPopup>
      </DialInputPopup>
    </div>
  );
};

export default JsonAtaInput;
