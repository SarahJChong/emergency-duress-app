export interface FormFieldProps {
  label: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  errors: (undefined | false | null | string)[];
}
