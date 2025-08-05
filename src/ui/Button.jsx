// import styled, { css } from 'styled-components';

// const sizes = {
//   small: css`
//     font-size: 1.2rem;
//     padding: 0.4rem 0.8rem;
//     text-transform: uppercase;
//     font-weight: 600;
//     text-align: center;
//   `,
//   medium: css`
//     font-size: 1.4rem;
//     padding: 1.2rem 1.6rem;
//     font-weight: 500;
//   `,
//   large: css`
//     font-size: 1.6rem;
//     padding: 1.2rem 2.4rem;
//     font-weight: 500;
//   `
// };

// const variations = {
//   primary: css`
//     color: var(--color-brand-50);
//     background-color: var(--color-brand-600);

//     &:hover {
//       background-color: var(--color-brand-700);
//     }
//   `,
//   secondary: css`
//     color: var(--color-grey-600);
//     background: var(--color-grey-0);
//     border: 1px solid var(--color-grey-200);

//     &:hover {
//       background-color: var(--color-grey-50);
//     }
//   `,
//   danger: css`
//     color: var(--color-red-100);
//     background-color: var(--color-red-700);

//     &:hover {
//       background-color: var(--color-red-800);
//     }
//   `
// };

// const Button = styled.button`
//   border: none;
//   border-radius: var(--border-radius-sm);
//   box-shadow: var(--shadow-sm);

//   ${(props) => sizes[props.size || 'medium']}
//   ${(props) => variations[props.variation || 'primary']}
// `;

// export default Button;
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
