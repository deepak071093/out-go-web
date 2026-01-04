import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';

test('renders header, textarea and disabled analyze button', () => {
  render(<App />);
  expect(screen.getByText(/OutGo/i)).toBeInTheDocument();
  expect(screen.getByRole('textbox')).toBeInTheDocument();
  const button = screen.getByRole('button', { name: /Analyze/i });
  expect(button).toBeDisabled();
});

test('enables analyze button on input and shows sample results after clicking analyze', async () => {
  render(<App />);
  const textarea = screen.getByRole('textbox');
  fireEvent.change(textarea, { target: { value: 'dummy expenses' } });
  const button = screen.getByRole('button', { name: /Analyze/i });
  expect(button).toBeEnabled();
  fireEvent.click(button);

  // sampleResponse is used in the component; wait for it to be rendered
  expect(await screen.findByText(/Highest Expense/i)).toBeInTheDocument();
  expect(screen.getByText(/INR 2770/)).toBeInTheDocument();
});

test('uploads a text file and loads its content into the textarea', async () => {
  render(<App />);
  const fileInput = document.querySelector('input[type="file"]');

  // Mock FileReader so readAsText triggers onload synchronously in test
  const originalFileReader = window.FileReader;
  function MockFileReader() {
    this.onload = null;
    this.result = 'File content sample';
  }
  MockFileReader.prototype.readAsText = function () {
    if (this.onload) this.onload({ target: { result: this.result } });
  };
  window.FileReader = MockFileReader;

  const file = new File(['File content sample'], 'expenses.txt', { type: 'text/plain' });
  Object.defineProperty(fileInput, 'files', { value: [file] });
  fireEvent.change(fileInput);

  await waitFor(() => {
    expect(screen.getByRole('textbox')).toHaveValue('File content sample');
  });

  window.FileReader = originalFileReader;
});