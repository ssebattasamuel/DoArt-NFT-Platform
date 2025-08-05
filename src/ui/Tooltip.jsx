import styled from 'styled-components';

const TooltipContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const TooltipText = styled.span`
  visibility: hidden;
  width: 200px;
  background-color: var(--color-grey-700);
  color: var(--color-grey-0);
  text-align: center;
  border-radius: var(--border-radius-sm);
  padding: 0.8rem;
  position: absolute;
  z-index: 1;
  bottom: 125%;
  left: 50%;
  transform: translateX(-50%);
  opacity: 0;
  transition: opacity 0.3s;
  font-size: 1.2rem;

  ${TooltipContainer}:hover & {
    visibility: visible;
    opacity: 1;
  }
`;

function Tooltip({ children, text }) {
  return (
    <TooltipContainer>
      {children}
      <TooltipText>{text}</TooltipText>
    </TooltipContainer>
  );
}

export default Tooltip;
