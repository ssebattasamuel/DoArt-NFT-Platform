import styled from 'styled-components';

const Input = styled.input`
  padding: 10px;
  border: 2px solid #3498db;
  width: 100%;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  font-size: 1.2rem;

  font-weight: 500;

  &:focus {
    border-color: #2980b9; /* Darker border on focus */
    outline: none; /* Remove default outline */
    box-shadow: 0 0 5px rgba(41, 128, 185, 0.5); /* Highlight effect */
  }

  &::placeholder {
    color: #7f8c8d; /* Placeholder color */
    font-style: italic; /* Italic style */
  }
  &:hover {
    border-color: #2980b9; /* Change border color on hover */
  }
  &:disabled {
    background-color: #ecf0f1; /* Light grey background */
    color: #bdc3c7; /* Grey text */
    cursor: not-allowed; /* Change cursor */
  }
`;
export default Input;
