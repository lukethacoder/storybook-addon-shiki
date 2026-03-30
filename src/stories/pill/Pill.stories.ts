import type { Meta, StoryObj } from '@storybook/react-vite';

import { Pill } from './Pill';
import { fn } from 'storybook/test';

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta: Meta<typeof Pill> = {
  title: 'Example/Pill',
  component: Pill,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {
    backgroundColor: { control: 'color' },
  },
  args: {
    onClick: fn(),
  },
  // tags: ['autodocs'],
  parameters: {
    docs: {
      codePanel: true,
    },
  },
};

export default meta;
type Story = StoryObj<typeof Pill>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
export const Primary: Story = {
  // More on args: https://storybook.js.org/docs/react/writing-stories/args
  args: {
    primary: true,
    label: 'Pill',
  },
};

export const Secondary: Story = {
  args: {
    label: 'Pill',
  },
};

export const Large: Story = {
  args: {
    size: 'large',
    label: 'Pill',
  },
};

export const Small: Story = {
  args: {
    size: 'small',
    label: 'Pill',
  },
};
