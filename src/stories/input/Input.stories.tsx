import type { Meta, StoryObj } from '@storybook/react-vite';

import { Input } from './Input';
import { fn } from 'storybook/test';

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta: Meta<typeof Input> = {
  title: 'Example/Input',
  component: Input,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {
    backgroundColor: { control: 'color' },
  },
  args: {
    onInput: fn(),
  },
  tags: ['autodocs'],
  parameters: {
    docs: {
      codePanel: true,
    },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Primary: Story = {
  args: {
    type: 'text',
    label: 'Text',
  },
};

export const Email: Story = {
  args: {
    type: 'email',
    label: 'Email',
  },
};

export const Number: Story = {
  args: {
    type: 'number',
    label: 'Number',
  },
};

export const Tel: Story = {
  args: {
    type: 'tel',
    label: 'Tel',
  },
};
