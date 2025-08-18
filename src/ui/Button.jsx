import styled from 'styled-components';

const Button = styled.button.withConfig({
  shouldForwardProp: (prop) => !['variation', 'size'].includes(prop)
})`
  font-size: 1.4rem;
  padding: 1.2rem 1.6rem;
  font-weight: 500;
  border: none;
  border-radius: var(--border-radius-sm);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: all 0.3s;

  background-color: ${({ variation }) =>
    variation === 'primary'
      ? 'var(--color-brand-600)'
      : variation === 'secondary'
        ? 'var(--color-grey-200)'
        : variation === 'danger'
          ? 'var(--color-red-700)'
          : 'var(--color-grey-0)'};

  color: ${({ variation }) =>
    variation === 'primary' || variation === 'danger'
      ? 'var(--color-grey-0)'
      : 'var(--color-grey-700)'};

  ${({ size }) =>
    size === 'small'
      ? `
        font-size: 1.2rem;
        padding: 0.8rem 1.2rem;
      `
      : size === 'large'
        ? `
        font-size: 1.6rem;
        padding: 1.6rem 2.4rem;
      `
        : ''}

  &:hover {
    background-color: ${({ variation }) =>
      variation === 'primary'
        ? 'var(--color-brand-700)'
        : variation === 'secondary'
          ? 'var(--color-grey-300)'
          : variation === 'danger'
            ? 'var(--color-red-800)'
            : 'var(--color-grey-100)'};
  }

  &:disabled {
    background-color: var(--color-grey-400);
    cursor: not-allowed;
  }
`;

export default Button;
