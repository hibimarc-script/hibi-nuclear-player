import { pluginFactory } from '../pluginFactory';

export type AnalyzerProps = {
  fftSize?: number;
};

// Almacén global del AnalyserNode para que la UI lo pueda leer
export const analyzerStore: { node: AnalyserNode | null } = { node: null };

class AnalyzerPlugin {
  createNode(ctx: AudioContext, props: AnalyzerProps): AnalyserNode {
    const node = ctx.createAnalyser();
    node.fftSize = props.fftSize ?? 2048;
    node.smoothingTimeConstant = 0.8;
    analyzerStore.node = node;
    return node;
  }

  updateNode(node: AnalyserNode, props: AnalyzerProps): void {
    if (props.fftSize) {
      node.fftSize = props.fftSize;
    }
    analyzerStore.node = node;
  }
}

export const Analyzer = pluginFactory<AnalyzerProps, AnalyserNode>(
  new AnalyzerPlugin(),
);
