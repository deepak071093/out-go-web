import { render, screen } from '@testing-library/react';
import Card from './Card';

test('renders label and value', () => {
  render(<Card label="Total Spent" value="INR 100" />);
  expect(screen.getByText('Total Spent')).toBeInTheDocument();
  expect(screen.getByText('INR 100')).toBeInTheDocument();
});