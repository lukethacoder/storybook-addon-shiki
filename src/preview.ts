import type { Renderer, ProjectAnnotations } from 'storybook/internal/types';
import { PARAM_KEY } from './constants';

const preview: ProjectAnnotations<Renderer> = {
  initialGlobals: { [PARAM_KEY]: {} },
};

export default preview;
