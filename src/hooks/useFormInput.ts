'use client';

import { useState, useCallback, ChangeEvent } from 'react';
import { validateInput, type ValidationResult } from '@/utils/validators';

/**
 * 폼 입력 상태 타입
 */
export interface FormInputState<T extends Record<string, unknown>> {
  /** 폼 데이터 */
  values: T;
  /** 필드별 에러 메시지 */
  errors: Partial<Record<keyof T | 'submit', string>>;
}

/**
 * useFormInput 훅 반환 타입
 */
export interface UseFormInputResult<T extends Record<string, unknown>> {
  /** 폼 데이터 */
  values: T;
  /** 필드별 에러 메시지 */
  errors: Partial<Record<keyof T | 'submit', string>>;
  /** 입력 필드 변경 핸들러 */
  handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
  /** 특정 필드 값 설정 */
  setValue: <K extends keyof T>(field: K, value: T[K]) => void;
  /** 여러 필드 값 설정 */
  setValues: (values: Partial<T>) => void;
  /** 특정 필드 에러 설정 */
  setError: (field: keyof T | 'submit', error: string) => void;
  /** 여러 필드 에러 설정 */
  setErrors: (errors: Partial<Record<keyof T | 'submit', string>>) => void;
  /** 특정 필드 에러 제거 */
  clearError: (field: keyof T | 'submit') => void;
  /** 모든 에러 제거 */
  clearAllErrors: () => void;
  /** 특정 필드 유효성 검사 */
  validateField: (
    field: keyof T,
    validator: (value: T[keyof T]) => ValidationResult
  ) => boolean;
  /** 폼 데이터 초기화 */
  reset: () => void;
  /** 필드에 에러가 있는지 확인 */
  hasError: (field: keyof T | 'submit') => boolean;
  /** 폼에 에러가 있는지 확인 */
  hasAnyError: () => boolean;
}

/**
 * useFormInput 옵션
 */
export interface UseFormInputOptions {
  /** 입력 시 기본 유효성 검사 수행 여부 (길이 제한, 의심스러운 패턴 검사) */
  validateOnChange?: boolean;
  /** 입력 시 자동으로 trim 적용 여부 */
  trimOnChange?: boolean;
}

/**
 * 폼 입력 관리 훅
 * 폼 데이터와 에러 상태를 관리하고, 입력 변경 핸들러를 제공
 *
 * @param initialValues - 초기 폼 데이터
 * @param options - 옵션
 * @returns 폼 입력 관리 객체
 *
 * @example
 * ```tsx
 * const { values, errors, handleChange, setError, clearAllErrors } = useFormInput({
 *   email: '',
 *   password: '',
 * });
 *
 * return (
 *   <form>
 *     <input name="email" value={values.email} onChange={handleChange} />
 *     {errors.email && <p>{errors.email}</p>}
 *   </form>
 * );
 * ```
 */
export function useFormInput<T extends Record<string, unknown>>(
  initialValues: T,
  options: UseFormInputOptions = {}
): UseFormInputResult<T> {
  const { validateOnChange = true, trimOnChange = false } = options;

  const [values, setValuesState] = useState<T>(initialValues);
  const [errors, setErrorsState] = useState<
    Partial<Record<keyof T | 'submit', string>>
  >({});

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>): void => {
      const { name, value, type, checked } = e.target;

      // 체크박스인 경우
      if (type === 'checkbox') {
        setValuesState((prev) => ({
          ...prev,
          [name]: checked as T[keyof T],
        }));
      } else {
        // 기본 입력 유효성 검사 (옵션에 따라)
        if (validateOnChange) {
          const inputValidation = validateInput(value);
          if (!inputValidation.isValid) {
            setErrorsState((prev) => ({
              ...prev,
              [name]: inputValidation.error || '',
            }));
            return;
          }
        }

        const processedValue = trimOnChange ? value.trim() : value;

        setValuesState((prev) => ({
          ...prev,
          [name]: processedValue as T[keyof T],
        }));
      }

      // 입력 시 해당 필드 에러 제거
      setErrorsState((prev) => {
        if (prev[name as keyof T]) {
          const newErrors = { ...prev };
          delete newErrors[name as keyof T];
          return newErrors;
        }
        return prev;
      });
    },
    [validateOnChange, trimOnChange]
  );

  const setValue = useCallback(
    <K extends keyof T>(field: K, value: T[K]): void => {
      setValuesState((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    []
  );

  const setValues = useCallback((newValues: Partial<T>): void => {
    setValuesState((prev) => ({
      ...prev,
      ...newValues,
    }));
  }, []);

  const setError = useCallback(
    (field: keyof T | 'submit', error: string): void => {
      setErrorsState((prev) => ({
        ...prev,
        [field]: error,
      }));
    },
    []
  );

  const setErrors = useCallback(
    (newErrors: Partial<Record<keyof T | 'submit', string>>): void => {
      setErrorsState((prev) => ({
        ...prev,
        ...newErrors,
      }));
    },
    []
  );

  const clearError = useCallback((field: keyof T | 'submit'): void => {
    setErrorsState((prev) => {
      if (prev[field]) {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      }
      return prev;
    });
  }, []);

  const clearAllErrors = useCallback((): void => {
    setErrorsState({});
  }, []);

  const validateField = useCallback(
    (
      field: keyof T,
      validator: (value: T[keyof T]) => ValidationResult
    ): boolean => {
      const result = validator(values[field]);
      if (!result.isValid && result.error) {
        setErrorsState((prev) => ({
          ...prev,
          [field]: result.error,
        }));
        return false;
      }
      return true;
    },
    [values]
  );

  const reset = useCallback((): void => {
    setValuesState(initialValues);
    setErrorsState({});
  }, [initialValues]);

  const hasError = useCallback(
    (field: keyof T | 'submit'): boolean => {
      return Boolean(errors[field]);
    },
    [errors]
  );

  const hasAnyError = useCallback((): boolean => {
    return Object.keys(errors).length > 0;
  }, [errors]);

  return {
    values,
    errors,
    handleChange,
    setValue,
    setValues,
    setError,
    setErrors,
    clearError,
    clearAllErrors,
    validateField,
    reset,
    hasError,
    hasAnyError,
  };
}
