import { PARAM_KEY } from './constants';
import './runtime-patcher';

const preview = {
  initialGlobals: { [PARAM_KEY]: {} },
};

export default preview;
